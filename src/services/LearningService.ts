import type { UserCorrection, BrickClass, HaystackTags, EnrichmentResult } from '../types/enrichment.js';
import type { PatternCacheService } from './PatternCacheService.js';

interface CorrectionRecord extends UserCorrection {
  objectName: string;
  objectType: string;
  units: string;
}

/**
 * Records user corrections and applies them to similar future points.
 * Suggests new patterns when correction trends emerge.
 */
export class LearningService {
  private corrections: CorrectionRecord[] = [];
  private correctionIndex = new Map<string, CorrectionRecord[]>();

  constructor(private cache: PatternCacheService) {}

  /**
   * Record a user correction and update cache for that point.
   */
  recordCorrection(
    pointId: string,
    objectName: string,
    objectType: string,
    units: string,
    originalBrickClass: BrickClass | null,
    correctedBrickClass: BrickClass,
    correctedHaystackTags: HaystackTags,
  ): void {
    const record: CorrectionRecord = {
      pointId,
      objectName,
      objectType,
      units,
      originalBrickClass,
      correctedBrickClass,
      correctedHaystackTags,
      timestamp: new Date().toISOString(),
    };

    this.corrections.push(record);

    // Index by a normalized key for lookup
    const key = objectName.toLowerCase().trim();
    const existing = this.correctionIndex.get(key) ?? [];
    existing.push(record);
    this.correctionIndex.set(key, existing);

    // Update cache so future identical points get the corrected result
    const cacheKey = this.cache.buildKey(objectName, objectType, units);
    this.cache.invalidate(cacheKey);
    const correctedResult: EnrichmentResult = {
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
    };
    this.cache.set(cacheKey, correctedResult);
  }

  /**
   * Check if we have a user correction that applies to a given point name.
   */
  findCorrection(objectName: string): CorrectionRecord | null {
    const key = objectName.toLowerCase().trim();
    const records = this.correctionIndex.get(key);
    if (!records || records.length === 0) return null;
    return records[records.length - 1]; // Most recent correction
  }

  /**
   * Get pattern suggestions based on repeated corrections (3+ of the same).
   */
  getSuggestedPatterns(): Array<{ pattern: string; brickClass: BrickClass; count: number }> {
    const suggestions: Array<{ pattern: string; brickClass: BrickClass; count: number }> = [];
    for (const [key, records] of this.correctionIndex) {
      if (records.length >= 3) {
        const latest = records[records.length - 1];
        suggestions.push({
          pattern: key,
          brickClass: latest.correctedBrickClass,
          count: records.length,
        });
      }
    }
    return suggestions;
  }

  /**
   * Get correction statistics.
   */
  getStats(): { totalCorrections: number; uniquePatterns: number; suggestedPatterns: number } {
    return {
      totalCorrections: this.corrections.length,
      uniquePatterns: this.correctionIndex.size,
      suggestedPatterns: this.getSuggestedPatterns().length,
    };
  }
}
