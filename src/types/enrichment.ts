/** BRICK ontology class assignment */
export interface BrickClass {
  uri: string;
  label: string;
  category: string;
}

/** Haystack tag set */
export interface HaystackTags {
  marker: string[];
  value: Record<string, string>;
}

/** Confidence level stratification */
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'NO_MATCH';

/** Result of enriching a single point */
export interface EnrichmentResult {
  pointId: string;
  brickClass: BrickClass | null;
  haystackTags: HaystackTags;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  matchedPattern: string | null;
  alternativeMatches: AlternativeMatch[];
  flaggedForReview: boolean;
  reviewReason: string | null;
  enrichmentSource: 'pattern' | 'cache' | 'ai-ollama' | 'ai-claude' | 'manual' | 'unit-fallback';
  processingTimeMs: number;
}

export interface AlternativeMatch {
  brickClass: BrickClass;
  haystackTags: HaystackTags;
  confidence: number;
  pattern: string;
}

/** Enriched point = parsed point + enrichment */
export interface EnrichedPoint {
  parsed: import('./bacnet.js').ParsedPoint;
  enrichment: EnrichmentResult;
}

/** Batch enrichment response */
export interface EnrichmentBatchResult {
  siteId: string;
  totalPoints: number;
  enrichedPoints: EnrichedPoint[];
  summary: EnrichmentSummary;
}

export interface EnrichmentSummary {
  high: number;
  medium: number;
  low: number;
  noMatch: number;
  flaggedForReview: number;
  bySource: Record<string, number>;
  processingTimeMs: number;
}

/** User correction for learning */
export interface UserCorrection {
  pointId: string;
  originalBrickClass: BrickClass | null;
  correctedBrickClass: BrickClass;
  correctedHaystackTags: HaystackTags;
  timestamp: string;
}
