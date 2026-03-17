import { config } from '../config.js';
import type { ConfidenceLevel } from '../types/enrichment.js';

export class ConfidenceClassifier {
  /**
   * Adjust confidence based on unit validation.
   * If the point's units match the expected units for the pattern, boost confidence.
   * If units contradict, penalize.
   */
  adjustForUnits(baseConfidence: number, pointUnits: string, expectedUnits?: string[]): number {
    if (!expectedUnits || expectedUnits.length === 0 || !pointUnits) {
      return baseConfidence;
    }

    const normalized = pointUnits.toLowerCase().trim();
    if (normalized === '' || normalized === 'no-units' || normalized === 'n/a') {
      return baseConfidence; // no info, no change
    }

    if (expectedUnits.some(u => normalized === u.toLowerCase())) {
      // Units match — boost confidence
      return Math.min(1.0, baseConfidence + 0.05);
    }

    // Units present but don't match expected — penalize
    return Math.max(0.0, baseConfidence - 0.15);
  }

  /**
   * Classify a confidence score into a level.
   */
  classify(confidence: number): ConfidenceLevel {
    if (confidence >= config.confidence.high) return 'HIGH';
    if (confidence >= config.confidence.medium) return 'MEDIUM';
    if (confidence >= config.confidence.low) return 'LOW';
    return 'NO_MATCH';
  }

  /**
   * Determine if a point should be flagged for human review.
   */
  shouldFlag(confidence: number, alternativeCount: number): { flagged: boolean; reason: string | null } {
    if (confidence < config.confidence.low) {
      return { flagged: true, reason: 'Below minimum confidence threshold' };
    }
    if (confidence < config.confidence.medium) {
      return { flagged: true, reason: 'Low confidence — may need manual classification' };
    }
    if (alternativeCount > 2 && confidence < config.confidence.high) {
      return { flagged: true, reason: 'Multiple competing pattern matches' };
    }
    return { flagged: false, reason: null };
  }
}
