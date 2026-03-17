import { patterns, type SemanticPattern } from '../patterns/index.js';
import { ConfidenceClassifier } from './ConfidenceClassifier.js';
import type { ParsedPoint } from '../types/bacnet.js';
import type { EnrichmentResult, AlternativeMatch } from '../types/enrichment.js';

export class SemanticEnricher {
  private classifier = new ConfidenceClassifier();

  /**
   * Enrich a single parsed point using pattern matching.
   * Returns the best match plus alternatives.
   */
  enrich(point: ParsedPoint): EnrichmentResult {
    const start = performance.now();

    // Skip vendor proprietary or unsupported
    if (point.isVendorProprietary) {
      return this.noMatch(point.id, start, 'Vendor proprietary object type');
    }
    if (!point.supported) {
      return this.noMatch(point.id, start, 'Unsupported object');
    }
    if (!point.objectName || point.objectName.trim() === '') {
      return this.noMatch(point.id, start, 'Empty object name');
    }

    // Run all patterns against the point name
    const matches = this.findMatches(point);

    if (matches.length === 0) {
      return this.noMatch(point.id, start, null);
    }

    // Sort by confidence descending — best match first
    matches.sort((a, b) => b.confidence - a.confidence);

    const best = matches[0];
    const alternatives: AlternativeMatch[] = matches.slice(1, 4).map(m => ({
      brickClass: m.pattern.brickClass,
      haystackTags: m.pattern.haystackTags,
      confidence: m.confidence,
      pattern: m.pattern.id,
    }));

    const level = this.classifier.classify(best.confidence);
    const { flagged, reason } = this.classifier.shouldFlag(best.confidence, alternatives.length);

    return {
      pointId: point.id,
      brickClass: best.pattern.brickClass,
      haystackTags: best.pattern.haystackTags,
      confidence: best.confidence,
      confidenceLevel: level,
      matchedPattern: best.pattern.id,
      alternativeMatches: alternatives,
      flaggedForReview: flagged,
      reviewReason: reason,
      enrichmentSource: 'pattern',
      processingTimeMs: performance.now() - start,
    };
  }

  /**
   * Enrich a batch of points.
   */
  enrichBatch(points: ParsedPoint[]): EnrichmentResult[] {
    return points.map(p => this.enrich(p));
  }

  private findMatches(point: ParsedPoint): { pattern: SemanticPattern; confidence: number }[] {
    const results: { pattern: SemanticPattern; confidence: number }[] = [];
    const name = point.objectName;

    for (const pattern of patterns) {
      if (pattern.regex.test(name)) {
        const adjusted = this.classifier.adjustForUnits(
          pattern.baseConfidence,
          point.units,
          pattern.expectedUnits,
        );
        results.push({ pattern, confidence: adjusted });
      }
    }

    return results;
  }

  private noMatch(pointId: string, start: number, reason: string | null): EnrichmentResult {
    return {
      pointId,
      brickClass: null,
      haystackTags: { marker: [], value: {} },
      confidence: 0,
      confidenceLevel: 'NO_MATCH',
      matchedPattern: null,
      alternativeMatches: [],
      flaggedForReview: reason !== 'Vendor proprietary object type' && reason !== 'Unsupported object',
      reviewReason: reason,
      enrichmentSource: 'pattern',
      processingTimeMs: performance.now() - start,
    };
  }
}
