/** W3C Thing Description types */

export interface ThingDescription {
  '@context': string[];
  '@type': string[];
  id: string;
  title: string;
  description: string;
  securityDefinitions: Record<string, SecurityScheme>;
  security: string[];
  properties: Record<string, TDProperty>;
  metadata: TDMetadata;
}

export interface SecurityScheme {
  scheme: string;
  in?: string;
  name?: string;
}

export interface TDProperty {
  '@type': string[];
  title: string;
  description: string;
  type: string;
  unit?: string;
  readOnly: boolean;
  observable: boolean;
  'brick:hasTag'?: string[];
  'haystack:tags'?: Record<string, string | boolean>;
  forms: TDForm[];
  enrichment: PropertyEnrichment;
}

export interface TDForm {
  href: string;
  contentType: string;
  op: string[];
}

export interface PropertyEnrichment {
  confidence: number;
  confidenceLevel: string;
  source: string;
  matchedPattern: string | null;
  flaggedForReview: boolean;
}

export interface TDMetadata {
  generatedAt: string;
  generatorVersion: string;
  siteId: string;
  siteName: string;
  deviceId: string;
  vendorName: string;
  modelName: string;
  enrichmentSummary: {
    total: number;
    high: number;
    medium: number;
    low: number;
    noMatch: number;
  };
}
