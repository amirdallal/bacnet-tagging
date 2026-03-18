import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { BrickClass, HaystackTags, EnrichmentResult } from '../types/enrichment.js';
import type { PatternCacheService } from './PatternCacheService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', '..', 'data', 'corrections.db');

/**
 * Persistent learning service backed by SQLite.
 * Records user corrections, applies them to future points via exact + fuzzy matching,
 * and provides few-shot examples for AI prompts.
 */
export class LearningService {
  private db: Database.Database;

  constructor(private cache: PatternCacheService) {
    mkdirSync(path.dirname(DB_PATH), { recursive: true });
    this.db = new Database(DB_PATH);
    this.db.pragma('journal_mode = WAL');
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS corrections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        point_id TEXT NOT NULL,
        site_id TEXT,
        object_name TEXT NOT NULL,
        object_name_normalized TEXT NOT NULL,
        object_type TEXT,
        units TEXT,
        vendor_name TEXT,
        model_name TEXT,
        original_brick_uri TEXT,
        original_brick_label TEXT,
        corrected_brick_uri TEXT NOT NULL,
        corrected_brick_label TEXT NOT NULL,
        corrected_brick_category TEXT,
        corrected_haystack_markers TEXT NOT NULL,
        corrected_haystack_values TEXT,
        timestamp TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_corrections_norm ON corrections(object_name_normalized);
      CREATE INDEX IF NOT EXISTS idx_corrections_norm_type ON corrections(object_name_normalized, object_type);
    `);
  }

  /**
   * Normalize a point name for matching.
   * "zone_temp_1" → "zone temp", "BACnet Chiller-1 Alarm" → "chiller alarm"
   */
  normalize(name: string): string {
    return name
      .replace(/^(BACnet|DSP|Network)\s+/i, '')
      .replace(/[-_]\d+$/g, '')
      .replace(/[-_]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  /**
   * Generate fuzzy keys: normalized form + numbers-stripped form.
   */
  private fuzzyKeys(objectName: string): string[] {
    const norm = this.normalize(objectName);
    const keys = [norm];
    const noNums = norm.replace(/\s*\d+\s*/g, ' ').replace(/\s+/g, ' ').trim();
    if (noNums !== norm && noNums.length > 2) keys.push(noNums);
    return keys;
  }

  /**
   * Record a user correction. Persists to SQLite and updates cache.
   */
  recordCorrection(
    pointId: string,
    objectName: string,
    objectType: string,
    units: string,
    originalBrickClass: BrickClass | null,
    correctedBrickClass: BrickClass,
    correctedHaystackTags: HaystackTags,
    siteId?: string,
    vendorName?: string,
    modelName?: string,
  ): void {
    const normalized = this.normalize(objectName);

    // Upsert: if same normalized name+type+units exists, replace
    this.db.prepare(`
      DELETE FROM corrections
      WHERE object_name_normalized = ? AND object_type = ? AND units = ?
    `).run(normalized, objectType, units);

    this.db.prepare(`
      INSERT INTO corrections (
        point_id, site_id, object_name, object_name_normalized,
        object_type, units, vendor_name, model_name,
        original_brick_uri, original_brick_label,
        corrected_brick_uri, corrected_brick_label, corrected_brick_category,
        corrected_haystack_markers, corrected_haystack_values
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      pointId, siteId ?? null, objectName, normalized,
      objectType, units, vendorName ?? null, modelName ?? null,
      originalBrickClass?.uri ?? null, originalBrickClass?.label ?? null,
      correctedBrickClass.uri, correctedBrickClass.label, correctedBrickClass.category ?? null,
      JSON.stringify(correctedHaystackTags.marker),
      JSON.stringify(correctedHaystackTags.value ?? {}),
    );

    // Update cache
    const cacheKey = this.cache.buildKey(objectName, objectType, units);
    this.cache.invalidate(cacheKey);
    this.cache.set(cacheKey, {
      pointId,
      brickClass: correctedBrickClass,
      haystackTags: correctedHaystackTags,
      confidence: 1.0,
      confidenceLevel: 'HIGH',
      matchedPattern: null,
      alternativeMatches: [],
      flaggedForReview: false,
      reviewReason: null,
      enrichmentSource: 'manual',
      processingTimeMs: 0,
    });
  }

  /**
   * Find a correction that applies to a given point.
   * Tries exact normalized match first, then fuzzy (numbers stripped).
   */
  findCorrection(objectName: string, objectType?: string, units?: string): EnrichmentResult | null {
    const keys = this.fuzzyKeys(objectName);

    for (const key of keys) {
      let row: Record<string, unknown> | undefined;

      if (objectType && units) {
        row = this.db.prepare(
          `SELECT * FROM corrections WHERE object_name_normalized = ? AND object_type = ? AND units = ? ORDER BY id DESC LIMIT 1`
        ).get(key, objectType, units) as Record<string, unknown> | undefined;
      }
      if (!row && objectType) {
        row = this.db.prepare(
          `SELECT * FROM corrections WHERE object_name_normalized = ? AND object_type = ? ORDER BY id DESC LIMIT 1`
        ).get(key, objectType) as Record<string, unknown> | undefined;
      }
      if (!row) {
        row = this.db.prepare(
          `SELECT * FROM corrections WHERE object_name_normalized = ? ORDER BY id DESC LIMIT 1`
        ).get(key) as Record<string, unknown> | undefined;
      }

      if (row) {
        return {
          pointId: '',
          brickClass: {
            uri: row.corrected_brick_uri as string,
            label: row.corrected_brick_label as string,
            category: (row.corrected_brick_category as string) ?? 'Unknown',
          },
          haystackTags: {
            marker: JSON.parse(row.corrected_haystack_markers as string) as string[],
            value: JSON.parse((row.corrected_haystack_values as string) || '{}') as Record<string, string>,
          },
          confidence: 0.98,
          confidenceLevel: 'HIGH',
          matchedPattern: null,
          alternativeMatches: [],
          flaggedForReview: false,
          reviewReason: null,
          enrichmentSource: 'manual',
          processingTimeMs: 0,
        };
      }
    }

    return null;
  }

  /**
   * Get recent corrections as few-shot examples for AI prompts.
   */
  getCorrectionsForPrompt(limit = 10): Array<{ name: string; type: string; units: string; brickLabel: string; brickUri: string; markers: string[] }> {
    const rows = this.db.prepare(`
      SELECT object_name, object_type, units, corrected_brick_label, corrected_brick_uri, corrected_haystack_markers
      FROM corrections ORDER BY id DESC LIMIT ?
    `).all(limit) as Array<Record<string, unknown>>;

    return rows.map(r => ({
      name: r.object_name as string,
      type: (r.object_type as string) || '',
      units: (r.units as string) || '',
      brickLabel: r.corrected_brick_label as string,
      brickUri: r.corrected_brick_uri as string,
      markers: JSON.parse(r.corrected_haystack_markers as string) as string[],
    }));
  }

  /**
   * Get pattern suggestions based on repeated corrections.
   */
  getSuggestedPatterns(): Array<{ pattern: string; brickClass: BrickClass; count: number }> {
    const rows = this.db.prepare(`
      SELECT object_name_normalized, corrected_brick_uri, corrected_brick_label, corrected_brick_category, COUNT(*) as cnt
      FROM corrections GROUP BY object_name_normalized HAVING cnt >= 3 ORDER BY cnt DESC
    `).all() as Array<Record<string, unknown>>;

    return rows.map(r => ({
      pattern: r.object_name_normalized as string,
      brickClass: {
        uri: r.corrected_brick_uri as string,
        label: r.corrected_brick_label as string,
        category: (r.corrected_brick_category as string) ?? 'Unknown',
      },
      count: r.cnt as number,
    }));
  }

  getStats(): { totalCorrections: number; uniquePatterns: number; suggestedPatterns: number } {
    const total = (this.db.prepare('SELECT COUNT(*) as c FROM corrections').get() as { c: number }).c;
    const unique = (this.db.prepare('SELECT COUNT(DISTINCT object_name_normalized) as c FROM corrections').get() as { c: number }).c;
    return { totalCorrections: total, uniquePatterns: unique, suggestedPatterns: this.getSuggestedPatterns().length };
  }
}
