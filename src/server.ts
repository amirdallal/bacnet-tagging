import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { config } from './config.js';
import { basicAuth } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { DiscoveryReportParser } from './services/DiscoveryReportParser.js';
import { SemanticEnricher } from './services/SemanticEnricher.js';
import { PatternCacheService } from './services/PatternCacheService.js';
import { AIEnhancementService, type AIContext } from './services/AIEnhancementService.js';
import { LearningService } from './services/LearningService.js';
import { ThingDescriptionGenerator } from './services/ThingDescriptionGenerator.js';
import { getPatternCount, getPatternsByCategory } from './patterns/index.js';
import type { DiscoveryReport } from './types/bacnet.js';
import type { ParsedPoint, ParsedReport } from './types/bacnet.js';
import type { EnrichedPoint, EnrichmentResult, EnrichmentSummary } from './types/enrichment.js';

// --- Services ---
const parser = new DiscoveryReportParser();
const enricher = new SemanticEnricher();
const cache = new PatternCacheService();
const ai = new AIEnhancementService();
const learning = new LearningService(cache);
const tdGen = new ThingDescriptionGenerator();

// --- In-memory stores ---
const parsedReports = new Map<string, ParsedReport>();
const enrichedResults = new Map<string, EnrichedPoint[]>();

// --- Express App ---
const app = express();
app.use(cors());
app.use(express.json({ limit: '100mb' }));

// Serve static UI — resolve path robustly for tsx + built ESM
let __dirname: string;
try {
  __dirname = path.dirname(fileURLToPath(import.meta.url));
} catch {
  __dirname = path.resolve('src');
}
const candidates = [
  path.join(__dirname, 'public'),
  path.join(process.cwd(), 'src', 'public'),
  path.join(process.cwd(), 'public'),
];
const publicDir = candidates.find(p => fs.existsSync(path.join(p, 'index.html'))) ?? candidates[0];
console.log(`  Static UI served from: ${publicDir}`);
app.use(express.static(publicDir));

app.use(basicAuth);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

// ============================================================
// GET /health
// ============================================================
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================
// GET /api/stats
// ============================================================
app.get('/api/stats', (_req, res) => {
  const categories = getPatternsByCategory();
  const categoryStats: Record<string, number> = {};
  for (const [cat, pats] of Object.entries(categories)) {
    categoryStats[cat] = pats.length;
  }

  res.json({
    patterns: {
      total: getPatternCount(),
      byCategory: categoryStats,
    },
    cache: cache.getStats(),
    ai: ai.getStats(),
    learning: learning.getStats(),
    reports: {
      parsed: parsedReports.size,
      enriched: enrichedResults.size,
    },
  });
});

// ============================================================
// POST /api/parse — Upload and parse a discovery report
// ============================================================
app.post('/api/parse', upload.single('file'), (req, res) => {
  let reportData: DiscoveryReport;
  const siteName = (req.body?.siteName as string) ?? 'Unknown Site';
  const siteId = (req.body?.siteId as string) ?? undefined;

  if (req.file) {
    try {
      reportData = JSON.parse(req.file.buffer.toString('utf-8')) as DiscoveryReport;
    } catch {
      res.status(400).json({ error: 'Invalid JSON file' });
      return;
    }
  } else if (req.body?.report) {
    reportData = req.body.report as DiscoveryReport;
  } else {
    res.status(400).json({ error: 'No file or report body provided' });
    return;
  }

  const parsed = parser.parse(reportData, siteId, siteName);
  parsedReports.set(parsed.siteId, parsed);

  res.json({
    siteId: parsed.siteId,
    siteName: parsed.siteName,
    stats: parsed.stats,
    samplePoints: parsed.points.slice(0, 10).map(p => ({
      id: p.id,
      objectName: p.objectName,
      objectType: p.objectType,
      units: p.units,
      supported: p.supported,
      equipmentRef: p.equipmentRef,
    })),
  });
});

// ============================================================
// POST /api/enrich — Pattern-only enrichment (instant, <1s)
// ============================================================
app.post('/api/enrich', (req, res) => {
  const { siteId } = req.body as { siteId?: string };
  if (!siteId) { res.status(400).json({ error: 'siteId required' }); return; }

  const report = parsedReports.get(siteId);
  if (!report) { res.status(404).json({ error: 'Report not found. Parse first.' }); return; }

  const start = performance.now();
  const results: EnrichedPoint[] = [];
  const summary: EnrichmentSummary = { high: 0, medium: 0, low: 0, noMatch: 0, flaggedForReview: 0, bySource: {}, processingTimeMs: 0 };

  // Enrichment priority: learned corrections → cache → pattern matching
  for (const point of report.points) {
    let enrichment: EnrichmentResult;

    // 1. Check learned corrections first (persisted from previous sessions)
    const learned = learning.findCorrection(point.objectName, point.objectType, point.units);
    if (learned) {
      enrichment = { ...learned, pointId: point.id };
    } else {
      // 2. Check in-memory cache
      const cacheKey = cache.buildKey(point.objectName, point.objectType, point.units);
      const cached = cache.get(cacheKey);
      if (cached) {
        enrichment = { ...cached, pointId: point.id };
      } else {
        // 3. Pattern matching
        enrichment = enricher.enrich(point);
        if (enrichment.confidence > 0) {
          cache.set(cacheKey, enrichment);
        }
      }
    }

    results.push({ parsed: point, enrichment });
  }

  // Tally summary
  for (const r of results) {
    switch (r.enrichment.confidenceLevel) {
      case 'HIGH': summary.high++; break;
      case 'MEDIUM': summary.medium++; break;
      case 'LOW': summary.low++; break;
      case 'NO_MATCH': summary.noMatch++; break;
    }
    if (r.enrichment.flaggedForReview) summary.flaggedForReview++;
    summary.bySource[r.enrichment.enrichmentSource] = (summary.bySource[r.enrichment.enrichmentSource] ?? 0) + 1;
  }

  summary.processingTimeMs = performance.now() - start;
  enrichedResults.set(siteId, results);

  // Count how many could benefit from Ollama
  const ollamaCandidates = results.filter(r =>
    r.parsed.supported && !r.parsed.isVendorProprietary &&
    r.enrichment.confidence < config.confidence.high
  ).length;

  res.json({ siteId, totalPoints: results.length, ollamaCandidates, summary });
});

// ============================================================
// GET /api/enrich-stream — SSE: progressive Ollama enhancement
// ============================================================
const activeStreams = new Map<string, AbortController>();

app.get('/api/enrich-stream', async (req, res) => {
  const siteId = req.query.siteId as string;
  const maxPoints = parseInt(req.query.maxPoints as string) || 99999; // Process all candidates
  if (!siteId) { res.status(400).json({ error: 'siteId required' }); return; }

  const results = enrichedResults.get(siteId);
  if (!results) { res.status(404).json({ error: 'Enriched results not found' }); return; }

  // Check Ollama
  const ollamaAvailable = await ai.isOllamaAvailable();
  if (!ollamaAvailable) {
    res.status(503).json({ error: 'Ollama is not available' });
    return;
  }

  // SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Abort controller for cancellation
  const abortController = new AbortController();
  const streamId = `${siteId}-${Date.now()}`;
  activeStreams.set(streamId, abortController);

  // Cancel on client disconnect
  req.on('close', () => {
    abortController.abort();
    activeStreams.delete(streamId);
  });

  // Find points that need Ollama (below HIGH, sorted worst-first)
  const candidates = results
    .filter(r => r.parsed.supported && !r.parsed.isVendorProprietary && r.enrichment.confidence < config.confidence.high)
    .sort((a, b) => a.enrichment.confidence - b.enrichment.confidence)
    .slice(0, maxPoints);

  const total = candidates.length;
  let processed = 0;
  let enhanced = 0;

  // Send initial event
  const streamStart = performance.now();
  const send = (event: string, data: unknown) => {
    if (!abortController.signal.aborted) {
      const enriched = typeof data === 'object' && data !== null ? { ...data as Record<string, unknown>, elapsedMs: Math.round(performance.now() - streamStart) } : data;
      res.write(`event: ${event}\ndata: ${JSON.stringify(enriched)}\n\n`);
    }
  };

  send('start', { total, streamId });

  // Process in parallel batches of 5 (balances speed vs Ollama load)
  const BATCH_SIZE = 5;
  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    if (abortController.signal.aborted) break;

    const batch = candidates.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (point) => {
      if (abortController.signal.aborted) return;
      try {
        const ctx = buildAIContext(point, results);
        const aiResult = await ai.enhanceWithOllama(point.parsed, ctx);
        processed++;

        if (aiResult && aiResult.confidence > point.enrichment.confidence) {
          point.enrichment = aiResult;
          const cacheKey = cache.buildKey(point.parsed.objectName, point.parsed.objectType, point.parsed.units);
          cache.set(cacheKey, aiResult);
          // Persist to SQLite for future re-uploads
          if (aiResult.brickClass) {
            learning.recordAIResult(
              point.parsed.objectName, point.parsed.objectType, point.parsed.units,
              aiResult.brickClass, aiResult.haystackTags, aiResult.confidence,
              'ai-ollama', point.parsed.vendorName, point.parsed.modelName,
            );
          }
          enhanced++;

          // Send per-point update
          send('point', {
            pointId: point.parsed.id,
            objectName: point.parsed.objectName,
            brickClass: aiResult.brickClass?.label ?? null,
            brickUri: aiResult.brickClass?.uri ?? null,
            haystackTags: aiResult.haystackTags.marker,
            confidence: aiResult.confidence,
            confidenceLevel: aiResult.confidenceLevel,
            source: aiResult.enrichmentSource,
            processed,
            enhanced,
            total,
          });
        } else {
          // Point processed but not improved
          send('skip', { pointId: point.parsed.id, processed, total });
        }
      } catch {
        processed++;
        send('skip', { pointId: point.parsed.id, processed, total });
      }
    });

    await Promise.all(promises);

    // Send progress heartbeat after each batch
    if (!abortController.signal.aborted) {
      send('progress', { processed, enhanced, total, pct: Math.round(processed * 100 / total) });
    }
  }

  // Done
  send('done', { processed, enhanced, total });
  activeStreams.delete(streamId);
  res.end();
});

// Cancel an active stream
app.post('/api/enrich-stream/cancel', (req, res) => {
  const { streamId } = req.body as { streamId?: string };
  if (!streamId) { res.status(400).json({ error: 'streamId required' }); return; }
  const controller = activeStreams.get(streamId);
  if (controller) {
    controller.abort();
    activeStreams.delete(streamId);
    res.json({ success: true, cancelled: true });
  } else {
    res.json({ success: true, cancelled: false, reason: 'Stream not found or already finished' });
  }
});

/** Build AI context for a point: sibling points, device metadata, corrections */
function buildAIContext(point: EnrichedPoint, allResults: EnrichedPoint[]): AIContext {
  // Get sibling points from the same device (up to 20, most diverse)
  const siblings = allResults
    .filter(r => r.parsed.deviceId === point.parsed.deviceId && r.parsed.id !== point.parsed.id && r.parsed.supported)
    .slice(0, 20)
    .map(r => ({
      name: r.parsed.objectName,
      type: r.parsed.objectType,
      units: r.parsed.units,
      brickLabel: r.enrichment.brickClass?.label,
    }));

  // Device metadata
  const device = {
    vendorName: point.parsed.vendorName,
    modelName: point.parsed.modelName,
    deviceId: point.parsed.deviceId,
  };

  // Recent corrections as few-shot examples
  const corrections = learning.getCorrectionsForPrompt(8);

  return { siblingPoints: siblings, device, corrections };
}

/** Serialize an enriched point for API responses */
// ============================================================
// Shared sort/filter/paginate helper
// ============================================================
type SortField = 'name' | 'type' | 'units' | 'brick' | 'confidence' | 'tags' | 'source' | 'device';
type SortDir = 'asc' | 'desc';

function sortPoints(points: EnrichedPoint[], sortBy: SortField, sortDir: SortDir): EnrichedPoint[] {
  const dir = sortDir === 'desc' ? -1 : 1;
  return [...points].sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case 'name':
        cmp = a.parsed.objectName.localeCompare(b.parsed.objectName);
        break;
      case 'type':
        cmp = a.parsed.objectType.localeCompare(b.parsed.objectType);
        break;
      case 'units':
        cmp = (a.parsed.units || '').localeCompare(b.parsed.units || '');
        break;
      case 'brick':
        cmp = (a.enrichment.brickClass?.label ?? '').localeCompare(b.enrichment.brickClass?.label ?? '');
        break;
      case 'confidence':
        cmp = a.enrichment.confidence - b.enrichment.confidence;
        break;
      case 'tags': {
        const aCount = a.enrichment.haystackTags.marker.length + Object.keys(a.enrichment.haystackTags.value).length + (a.enrichment.brickClass ? 1 : 0);
        const bCount = b.enrichment.haystackTags.marker.length + Object.keys(b.enrichment.haystackTags.value).length + (b.enrichment.brickClass ? 1 : 0);
        cmp = aCount - bCount;
        break;
      }
      case 'source':
        cmp = (a.enrichment.enrichmentSource ?? '').localeCompare(b.enrichment.enrichmentSource ?? '');
        break;
      case 'device':
        cmp = a.parsed.deviceId.localeCompare(b.parsed.deviceId);
        break;
    }
    return cmp * dir;
  });
}

function filterPoints(
  results: EnrichedPoint[],
  opts: { search?: string; confidence?: string; source?: string; units?: string; objectType?: string }
): EnrichedPoint[] {
  let filtered = results.filter(r => r.parsed.supported && !r.parsed.isVendorProprietary);

  if (opts.confidence) {
    filtered = filtered.filter(r => r.enrichment.confidenceLevel === opts.confidence);
  }
  if (opts.source) {
    filtered = filtered.filter(r => r.enrichment.enrichmentSource === opts.source);
  }
  if (opts.units) {
    const u = opts.units.toLowerCase();
    filtered = filtered.filter(r => (r.parsed.units || '').toLowerCase().includes(u));
  }
  if (opts.objectType) {
    const t = opts.objectType.toLowerCase();
    filtered = filtered.filter(r => r.parsed.objectType.toLowerCase().includes(t));
  }
  if (opts.search) {
    const s = opts.search.toLowerCase();
    filtered = filtered.filter(r =>
      r.parsed.objectName.toLowerCase().includes(s) ||
      (r.enrichment.brickClass?.label ?? '').toLowerCase().includes(s) ||
      r.parsed.deviceId.toLowerCase().includes(s) ||
      (r.parsed.equipmentRef ?? '').toLowerCase().includes(s) ||
      r.enrichment.haystackTags.marker.some(t => t.toLowerCase().includes(s))
    );
  }

  return filtered;
}

function buildSummary(points: EnrichedPoint[]) {
  return {
    high: points.filter(r => r.enrichment.confidenceLevel === 'HIGH').length,
    medium: points.filter(r => r.enrichment.confidenceLevel === 'MEDIUM').length,
    low: points.filter(r => r.enrichment.confidenceLevel === 'LOW').length,
    noMatch: points.filter(r => r.enrichment.confidenceLevel === 'NO_MATCH').length,
  };
}

function serializePoint(r: EnrichedPoint) {
  return {
    pointId: r.parsed.id,
    deviceId: r.parsed.deviceId,
    objectId: r.parsed.objectId,
    objectName: r.parsed.objectName,
    objectType: r.parsed.objectType,
    units: r.parsed.units,
    equipmentRef: r.parsed.equipmentRef,
    description: r.parsed.description,
    supported: r.parsed.supported,
    isVendorProprietary: r.parsed.isVendorProprietary,
    brickClass: r.enrichment.brickClass?.label ?? null,
    brickUri: r.enrichment.brickClass?.uri ?? null,
    brickCategory: r.enrichment.brickClass?.category ?? null,
    haystackTags: r.enrichment.haystackTags.marker,
    haystackValues: r.enrichment.haystackTags.value,
    tagCount: r.enrichment.haystackTags.marker.length + Object.keys(r.enrichment.haystackTags.value).length + (r.enrichment.brickClass ? 1 : 0),
    confidence: r.enrichment.confidence,
    confidenceLevel: r.enrichment.confidenceLevel,
    matchedPattern: r.enrichment.matchedPattern,
    flaggedForReview: r.enrichment.flaggedForReview,
    reviewReason: r.enrichment.reviewReason,
    source: r.enrichment.enrichmentSource,
  };
}

// ============================================================
// GET /api/devices — List devices for a parsed report
// ============================================================
app.get('/api/devices', (req, res) => {
  const siteId = req.query.siteId as string;
  if (!siteId) { res.status(400).json({ error: 'siteId query param required' }); return; }

  const report = parsedReports.get(siteId);
  if (!report) { res.status(404).json({ error: 'Report not found' }); return; }

  // Group points by device
  const deviceMap = new Map<string, { vendorName: string; modelName: string; points: number; supported: number }>();
  for (const p of report.points) {
    const existing = deviceMap.get(p.deviceId);
    if (existing) {
      existing.points++;
      if (p.supported) existing.supported++;
    } else {
      deviceMap.set(p.deviceId, { vendorName: p.vendorName, modelName: p.modelName, points: 1, supported: p.supported ? 1 : 0 });
    }
  }

  const devices = Array.from(deviceMap.entries()).map(([id, info]) => ({
    deviceId: id,
    vendorName: info.vendorName,
    modelName: info.modelName,
    totalPoints: info.points,
    supportedPoints: info.supported,
  }));

  res.json({ siteId, devices });
});

// ============================================================
// GET /api/device-points — Get enriched points for a single device
// ============================================================
app.get('/api/device-points', (req, res) => {
  const siteId = req.query.siteId as string;
  const deviceId = req.query.deviceId as string;
  const sortBy = (req.query.sortBy as SortField) || 'confidence';
  const sortDir = (req.query.sortDir as SortDir) || 'asc';
  const limit = Math.min(parseInt(req.query.limit as string) || 100, 5000);
  const offset = parseInt(req.query.offset as string) || 0;

  if (!siteId || !deviceId) { res.status(400).json({ error: 'siteId and deviceId required' }); return; }

  const results = enrichedResults.get(siteId);
  if (!results) { res.status(404).json({ error: 'Enriched results not found. Run /api/enrich first.' }); return; }

  const deviceResults = results.filter(r => r.parsed.deviceId === deviceId);

  const filtered = filterPoints(deviceResults, {
    search: (req.query.search as string) || '',
    confidence: (req.query.confidence as string) || '',
    source: (req.query.source as string) || '',
    units: (req.query.units as string) || '',
    objectType: (req.query.objectType as string) || '',
  });

  // Summary is based on ALL device points (before filter)
  const allSupported = deviceResults.filter(r => r.parsed.supported && !r.parsed.isVendorProprietary);
  const summary = { total: allSupported.length, ...buildSummary(allSupported), needsReview: allSupported.filter(r => r.enrichment.flaggedForReview).length };

  const sorted = sortPoints(filtered, sortBy, sortDir);
  const page = sorted.slice(offset, offset + limit);

  res.json({
    deviceId,
    total: sorted.length,
    offset,
    limit,
    sortBy,
    sortDir,
    hasMore: offset + limit < sorted.length,
    summary,
    points: page.map(serializePoint),
  });
});

// ============================================================
// GET /api/all-points — Global view across all devices
// ============================================================
app.get('/api/all-points', (req, res) => {
  const siteId = req.query.siteId as string;
  const sortBy = (req.query.sortBy as SortField) || 'confidence';
  const sortDir = (req.query.sortDir as SortDir) || 'asc';
  const limit = Math.min(parseInt(req.query.limit as string) || 100, 5000);
  const offset = parseInt(req.query.offset as string) || 0;

  if (!siteId) { res.status(400).json({ error: 'siteId required' }); return; }

  const results = enrichedResults.get(siteId);
  if (!results) { res.status(404).json({ error: 'Enriched results not found' }); return; }

  const filtered = filterPoints(results, {
    search: (req.query.search as string) || '',
    confidence: (req.query.confidence as string) || '',
    source: (req.query.source as string) || '',
    units: (req.query.units as string) || '',
    objectType: (req.query.objectType as string) || '',
  });

  const sorted = sortPoints(filtered, sortBy, sortDir);
  const total = sorted.length;
  const summary = buildSummary(sorted);
  const page = sorted.slice(offset, offset + limit);

  res.json({
    total,
    offset,
    limit,
    sortBy,
    sortDir,
    hasMore: offset + limit < total,
    summary,
    points: page.map(serializePoint),
  });
});

// ============================================================
// POST /api/enhance-point — AI-enhance a single point
// ============================================================
app.post('/api/enhance-point', async (req, res) => {
  const { siteId, pointId } = req.body as { siteId?: string; pointId?: string };
  if (!siteId || !pointId) { res.status(400).json({ error: 'siteId and pointId required' }); return; }

  const results = enrichedResults.get(siteId);
  if (!results) { res.status(404).json({ error: 'Enriched results not found' }); return; }

  const point = results.find(r => r.parsed.id === pointId);
  if (!point) { res.status(404).json({ error: 'Point not found' }); return; }

  // Capture old values for diff
  const oldBrickClass = point.enrichment.brickClass?.label ?? null;
  const oldBrickUri = point.enrichment.brickClass?.uri ?? null;
  const oldBrickCategory = point.enrichment.brickClass?.category ?? null;
  const oldHaystackTags = [...point.enrichment.haystackTags.marker];
  const oldHaystackValues = { ...point.enrichment.haystackTags.value };
  const oldConfidence = point.enrichment.confidence;
  const oldConfidenceLevel = point.enrichment.confidenceLevel;
  const oldSource = point.enrichment.enrichmentSource;
  const oldTagCount = oldHaystackTags.length + Object.keys(oldHaystackValues).length + (oldBrickClass ? 1 : 0);

  const ctx = buildAIContext(point, results);
  const aiResult = await ai.enhance(point.parsed, ctx);
  if (aiResult && aiResult.confidence > point.enrichment.confidence) {
    point.enrichment = aiResult;

    // Persist to cache + SQLite for future use
    const cacheKey = cache.buildKey(point.parsed.objectName, point.parsed.objectType, point.parsed.units);
    cache.set(cacheKey, aiResult);
    if (aiResult.brickClass) {
      learning.recordCorrection(
        pointId, point.parsed.objectName, point.parsed.objectType, point.parsed.units,
        oldBrickClass ? { uri: oldBrickUri!, label: oldBrickClass, category: oldBrickCategory ?? 'Unknown' } : null,
        aiResult.brickClass, aiResult.haystackTags,
        siteId, point.parsed.vendorName, point.parsed.modelName,
      );
    }

    const newTagCount = aiResult.haystackTags.marker.length + Object.keys(aiResult.haystackTags.value).length + (aiResult.brickClass ? 1 : 0);
    const addedTags = aiResult.haystackTags.marker.filter(t => !oldHaystackTags.includes(t));

    res.json({
      success: true,
      enhanced: true,
      pointId,
      // New values
      brickClass: aiResult.brickClass?.label,
      brickUri: aiResult.brickClass?.uri,
      brickCategory: aiResult.brickClass?.category,
      haystackTags: aiResult.haystackTags.marker,
      haystackValues: aiResult.haystackTags.value,
      confidence: aiResult.confidence,
      confidenceLevel: aiResult.confidenceLevel,
      source: aiResult.enrichmentSource,
      tagCount: newTagCount,
      // Diff data
      diff: {
        oldBrickClass,
        oldConfidence,
        oldConfidenceLevel,
        oldTagCount,
        oldHaystackTags,
        addedTags,
        confidenceDelta: +(aiResult.confidence - oldConfidence).toFixed(2),
        tagCountDelta: newTagCount - oldTagCount,
      },
    });
  } else {
    res.json({ success: true, enhanced: false, reason: 'AI could not improve confidence' });
  }
});

// ============================================================
// POST /api/enhance-with-ai — AI-enhance low-confidence points
// ============================================================
app.post('/api/enhance-with-ai', async (req, res) => {
  const { siteId, maxPoints = 50, minConfidence = 0 } = req.body as {
    siteId?: string;
    maxPoints?: number;
    minConfidence?: number;
  };
  if (!siteId) { res.status(400).json({ error: 'siteId required' }); return; }

  const results = enrichedResults.get(siteId);
  if (!results) { res.status(404).json({ error: 'Enriched results not found. Run /api/enrich first.' }); return; }

  // Find points that need AI enhancement
  const needsAI = results
    .filter(r => r.enrichment.confidence <= (minConfidence || 0.5) && r.parsed.supported && !r.parsed.isVendorProprietary)
    .slice(0, maxPoints);

  let enhanced = 0;
  for (const point of needsAI) {
    const ctx = buildAIContext(point, results);
    const aiResult = await ai.enhance(point.parsed, ctx);
    if (aiResult && aiResult.confidence > point.enrichment.confidence) {
      point.enrichment = aiResult;
      const cacheKey = cache.buildKey(point.parsed.objectName, point.parsed.objectType, point.parsed.units);
      cache.set(cacheKey, aiResult);
      enhanced++;
    }
  }

  res.json({
    siteId,
    pointsProcessed: needsAI.length,
    pointsEnhanced: enhanced,
    aiStats: ai.getStats(),
  });
});

// ============================================================
// POST /api/generate-td — Generate W3C Thing Descriptions
// ============================================================
app.post('/api/generate-td', (req, res) => {
  const { siteId, deviceId, pointIds } = req.body as { siteId?: string; deviceId?: string; pointIds?: string[] };
  if (!siteId) { res.status(400).json({ error: 'siteId required' }); return; }

  const results = enrichedResults.get(siteId);
  const report = parsedReports.get(siteId);
  if (!results || !report) {
    res.status(404).json({ error: 'Enriched results not found. Run /api/enrich first.' });
    return;
  }

  // Filter results if deviceId and/or pointIds provided
  let filteredResults = results;
  if (deviceId) {
    filteredResults = filteredResults.filter(r => r.parsed.deviceId === deviceId);
  }
  if (pointIds && pointIds.length > 0) {
    const pointIdSet = new Set(pointIds);
    filteredResults = filteredResults.filter(r => pointIdSet.has(r.parsed.id));
  }

  if (filteredResults.length === 0) {
    res.status(400).json({ error: 'No points matched the selection' });
    return;
  }

  const tds = tdGen.generateAll(siteId, report.siteName, filteredResults);

  res.json({
    siteId,
    siteName: report.siteName,
    deviceId: deviceId ?? null,
    selectedPoints: pointIds ? pointIds.length : null,
    thingDescriptionCount: tds.length,
    thingDescriptions: tds,
  });
});

// ============================================================
// POST /api/update-inference — Submit a user correction
// ============================================================
app.post('/api/update-inference', (req, res) => {
  const { siteId, pointId, correctedBrickUri, correctedBrickLabel, correctedBrickCategory, correctedHaystackMarkers, correctedHaystackValues } = req.body as {
    siteId: string;
    pointId: string;
    correctedBrickUri: string;
    correctedBrickLabel: string;
    correctedBrickCategory: string;
    correctedHaystackMarkers?: string[];
    correctedHaystackValues?: Record<string, string>;
  };

  if (!siteId || !pointId || !correctedBrickUri) {
    res.status(400).json({ error: 'siteId, pointId, and correctedBrickUri required' });
    return;
  }

  const results = enrichedResults.get(siteId);
  if (!results) { res.status(404).json({ error: 'Enriched results not found' }); return; }

  const point = results.find(r => r.parsed.id === pointId);
  if (!point) { res.status(404).json({ error: 'Point not found' }); return; }

  const correctedBrickClass = {
    uri: correctedBrickUri,
    label: correctedBrickLabel || correctedBrickUri.split('#').pop() || '',
    category: correctedBrickCategory || 'Unknown',
  };
  const correctedTags = {
    marker: correctedHaystackMarkers ?? [],
    value: correctedHaystackValues ?? {},
  };

  learning.recordCorrection(
    pointId,
    point.parsed.objectName,
    point.parsed.objectType,
    point.parsed.units,
    point.enrichment.brickClass,
    correctedBrickClass,
    correctedTags,
    siteId,
    point.parsed.vendorName,
    point.parsed.modelName,
  );

  // Update the in-memory result
  point.enrichment = {
    ...point.enrichment,
    brickClass: correctedBrickClass,
    haystackTags: correctedTags,
    confidence: 1.0,
    confidenceLevel: 'HIGH',
    enrichmentSource: 'manual',
    flaggedForReview: false,
    reviewReason: null,
  };

  res.json({
    success: true,
    pointId,
    updatedEnrichment: point.enrichment,
    learningSuggestions: learning.getSuggestedPatterns(),
  });
});

// ============================================================
// GET /api/review/flagged — Get points flagged for review
// ============================================================
app.get('/api/review/flagged', (req, res) => {
  const siteId = req.query.siteId as string;
  if (!siteId) { res.status(400).json({ error: 'siteId query param required' }); return; }

  const results = enrichedResults.get(siteId);
  if (!results) { res.status(404).json({ error: 'Enriched results not found' }); return; }

  const flagged = results
    .filter(r => r.enrichment.flaggedForReview)
    .map(r => ({
      pointId: r.parsed.id,
      objectName: r.parsed.objectName,
      objectType: r.parsed.objectType,
      units: r.parsed.units,
      equipmentRef: r.parsed.equipmentRef,
      currentBrickClass: r.enrichment.brickClass?.label ?? null,
      confidence: r.enrichment.confidence,
      confidenceLevel: r.enrichment.confidenceLevel,
      reviewReason: r.enrichment.reviewReason,
      alternativeMatches: r.enrichment.alternativeMatches.map(a => ({
        brickClass: a.brickClass.label,
        confidence: a.confidence,
      })),
    }));

  res.json({
    siteId,
    totalFlagged: flagged.length,
    flaggedPoints: flagged,
  });
});

// --- Error handler ---
app.use(errorHandler);

// --- Start server ---
app.listen(config.port, () => {
  console.log(`BACnet Semantic Intelligence Service running on port ${config.port}`);
  console.log(`  Patterns loaded: ${getPatternCount()}`);
  console.log(`  Environment: ${config.nodeEnv}`);
  console.log(`  AI providers: Ollama (${config.ollama.url}), Claude API (${config.claude.apiKey ? 'configured' : 'not configured'})`);
});

export default app;
