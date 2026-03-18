import path from 'path';
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
import { AIEnhancementService } from './services/AIEnhancementService.js';
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

// Serve static UI
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, 'public')));

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
// POST /api/enrich — Enrich with patterns + auto-Ollama for low confidence
// ============================================================
app.post('/api/enrich', async (req, res) => {
  const { siteId } = req.body as { siteId?: string };
  if (!siteId) { res.status(400).json({ error: 'siteId required' }); return; }

  const report = parsedReports.get(siteId);
  if (!report) { res.status(404).json({ error: 'Report not found. Parse first.' }); return; }

  const start = performance.now();
  const results: EnrichedPoint[] = [];
  const summary: EnrichmentSummary = { high: 0, medium: 0, low: 0, noMatch: 0, flaggedForReview: 0, bySource: {}, processingTimeMs: 0 };

  // Phase 1: Pattern matching for all points
  for (const point of report.points) {
    const cacheKey = cache.buildKey(point.objectName, point.objectType, point.units);
    const cached = cache.get(cacheKey);

    let enrichment: EnrichmentResult;
    if (cached) {
      enrichment = { ...cached, pointId: point.id };
    } else {
      enrichment = enricher.enrich(point);
      if (enrichment.confidence > 0) {
        cache.set(cacheKey, enrichment);
      }
    }

    results.push({ parsed: point, enrichment });
  }

  // Phase 2: Auto-apply Ollama for supported points below MEDIUM confidence
  // This is free + local, so we run it automatically
  const needsOllama = results.filter(r =>
    r.parsed.supported && !r.parsed.isVendorProprietary &&
    r.enrichment.confidence < config.confidence.high
  );

  // Batch limit to avoid blocking too long — prioritize lowest confidence first
  const ollamaBatch = needsOllama
    .sort((a, b) => a.enrichment.confidence - b.enrichment.confidence)
    .slice(0, 200);

  let ollamaEnhanced = 0;
  if (ollamaBatch.length > 0) {
    // Check if Ollama is available before batching
    const ollamaAvailable = await ai.isOllamaAvailable();
    if (ollamaAvailable) {
      // Process in parallel batches of 10
      for (let i = 0; i < ollamaBatch.length; i += 10) {
        const batch = ollamaBatch.slice(i, i + 10);
        const promises = batch.map(async (point) => {
          try {
            const aiResult = await ai.enhanceWithOllama(point.parsed);
            if (aiResult && aiResult.confidence > point.enrichment.confidence) {
              point.enrichment = aiResult;
              const cacheKey = cache.buildKey(point.parsed.objectName, point.parsed.objectType, point.parsed.units);
              cache.set(cacheKey, aiResult);
              ollamaEnhanced++;
            }
          } catch { /* skip failed points */ }
        });
        await Promise.all(promises);
      }
    }
  }

  // Tally final summary
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

  res.json({
    siteId,
    totalPoints: results.length,
    ollamaEnhanced,
    summary,
    sampleResults: results.map(r => ({
      pointId: r.parsed.id,
      objectName: r.parsed.objectName,
      objectType: r.parsed.objectType,
      units: r.parsed.units,
      brickClass: r.enrichment.brickClass?.label ?? null,
      brickUri: r.enrichment.brickClass?.uri ?? null,
      haystackTags: r.enrichment.haystackTags.marker,
      confidence: r.enrichment.confidence,
      confidenceLevel: r.enrichment.confidenceLevel,
      matchedPattern: r.enrichment.matchedPattern,
      flaggedForReview: r.enrichment.flaggedForReview,
      source: r.enrichment.enrichmentSource,
    })),
  });
});

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
  if (!siteId || !deviceId) { res.status(400).json({ error: 'siteId and deviceId required' }); return; }

  const results = enrichedResults.get(siteId);
  if (!results) { res.status(404).json({ error: 'Enriched results not found. Run /api/enrich first.' }); return; }

  const devicePoints = results.filter(r => r.parsed.deviceId === deviceId);
  const high = devicePoints.filter(r => r.enrichment.confidenceLevel === 'HIGH').length;
  const medium = devicePoints.filter(r => r.enrichment.confidenceLevel === 'MEDIUM').length;
  const low = devicePoints.filter(r => r.enrichment.confidenceLevel === 'LOW').length;
  const noMatch = devicePoints.filter(r => r.enrichment.confidenceLevel === 'NO_MATCH').length;
  const needsReview = devicePoints.filter(r => r.enrichment.flaggedForReview).length;

  res.json({
    deviceId,
    summary: { total: devicePoints.length, high, medium, low, noMatch, needsReview },
    points: devicePoints.map(r => ({
      pointId: r.parsed.id,
      objectName: r.parsed.objectName,
      objectType: r.parsed.objectType,
      units: r.parsed.units,
      equipmentRef: r.parsed.equipmentRef,
      description: r.parsed.description,
      supported: r.parsed.supported,
      isVendorProprietary: r.parsed.isVendorProprietary,
      brickClass: r.enrichment.brickClass?.label ?? null,
      brickUri: r.enrichment.brickClass?.uri ?? null,
      haystackTags: r.enrichment.haystackTags.marker,
      confidence: r.enrichment.confidence,
      confidenceLevel: r.enrichment.confidenceLevel,
      matchedPattern: r.enrichment.matchedPattern,
      flaggedForReview: r.enrichment.flaggedForReview,
      reviewReason: r.enrichment.reviewReason,
      source: r.enrichment.enrichmentSource,
    })),
  });
});

// ============================================================
// GET /api/all-points — Global view across all devices
// ============================================================
app.get('/api/all-points', (req, res) => {
  const siteId = req.query.siteId as string;
  const search = ((req.query.search as string) || '').toLowerCase();
  const confLevel = (req.query.confidence as string) || '';
  const limit = Math.min(parseInt(req.query.limit as string) || 500, 5000);
  const offset = parseInt(req.query.offset as string) || 0;

  if (!siteId) { res.status(400).json({ error: 'siteId required' }); return; }

  const results = enrichedResults.get(siteId);
  if (!results) { res.status(404).json({ error: 'Enriched results not found' }); return; }

  let filtered = results.filter(r => r.parsed.supported && !r.parsed.isVendorProprietary);

  if (confLevel) {
    filtered = filtered.filter(r => r.enrichment.confidenceLevel === confLevel);
  }
  if (search) {
    filtered = filtered.filter(r =>
      r.parsed.objectName.toLowerCase().includes(search) ||
      (r.enrichment.brickClass?.label ?? '').toLowerCase().includes(search) ||
      r.parsed.deviceId.toLowerCase().includes(search) ||
      (r.parsed.equipmentRef ?? '').toLowerCase().includes(search)
    );
  }

  const total = filtered.length;
  const high = filtered.filter(r => r.enrichment.confidenceLevel === 'HIGH').length;
  const medium = filtered.filter(r => r.enrichment.confidenceLevel === 'MEDIUM').length;
  const low = filtered.filter(r => r.enrichment.confidenceLevel === 'LOW').length;
  const noMatch = filtered.filter(r => r.enrichment.confidenceLevel === 'NO_MATCH').length;

  const page = filtered.slice(offset, offset + limit);

  res.json({
    total,
    offset,
    limit,
    summary: { high, medium, low, noMatch },
    points: page.map(r => ({
      pointId: r.parsed.id,
      deviceId: r.parsed.deviceId,
      objectName: r.parsed.objectName,
      objectType: r.parsed.objectType,
      units: r.parsed.units,
      equipmentRef: r.parsed.equipmentRef,
      brickClass: r.enrichment.brickClass?.label ?? null,
      brickUri: r.enrichment.brickClass?.uri ?? null,
      haystackTags: r.enrichment.haystackTags.marker,
      confidence: r.enrichment.confidence,
      confidenceLevel: r.enrichment.confidenceLevel,
      matchedPattern: r.enrichment.matchedPattern,
      flaggedForReview: r.enrichment.flaggedForReview,
      source: r.enrichment.enrichmentSource,
    })),
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

  const aiResult = await ai.enhance(point.parsed);
  if (aiResult && aiResult.confidence > point.enrichment.confidence) {
    point.enrichment = aiResult;
    const cacheKey = cache.buildKey(point.parsed.objectName, point.parsed.objectType, point.parsed.units);
    cache.set(cacheKey, aiResult);
    res.json({
      success: true,
      enhanced: true,
      pointId,
      brickClass: aiResult.brickClass?.label,
      brickUri: aiResult.brickClass?.uri,
      haystackTags: aiResult.haystackTags.marker,
      confidence: aiResult.confidence,
      confidenceLevel: aiResult.confidenceLevel,
      source: aiResult.enrichmentSource,
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
    const aiResult = await ai.enhance(point.parsed);
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
  const { siteId } = req.body as { siteId?: string };
  if (!siteId) { res.status(400).json({ error: 'siteId required' }); return; }

  const results = enrichedResults.get(siteId);
  const report = parsedReports.get(siteId);
  if (!results || !report) {
    res.status(404).json({ error: 'Enriched results not found. Run /api/enrich first.' });
    return;
  }

  const tds = tdGen.generateAll(siteId, report.siteName, results);

  res.json({
    siteId,
    siteName: report.siteName,
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
