/** Raw BACnet object from a discovery report */
export interface BACnetObject {
  'object-name': string;
  'object-type': string;
  units?: string;
  description?: string;
  'present-value'?: number | string;
  supported?: boolean;
  [key: string]: unknown;
}

/** Raw BACnet device from a discovery report */
export interface BACnetDevice {
  'vendor-name'?: string;
  'model-name'?: string;
  'object-name'?: string;
  description?: string;
  objects: Record<string, BACnetObject>;
}

/** Raw discovery report JSON format */
export interface DiscoveryReport {
  devices: Record<string, BACnetDevice>;
}

/** Normalized point after parsing */
export interface ParsedPoint {
  id: string;
  deviceId: string;
  objectId: string;
  objectName: string;
  objectType: string;
  units: string;
  description: string;
  supported: boolean;
  vendorName: string;
  modelName: string;
  equipmentRef: string;
  rawName: string;
  isVendorProprietary: boolean;
}

/** Parsed report summary */
export interface ParsedReport {
  siteId: string;
  siteName: string;
  points: ParsedPoint[];
  stats: ReportStats;
}

export interface ReportStats {
  totalDevices: number;
  totalObjects: number;
  supportedObjects: number;
  unsupportedObjects: number;
  vendorProprietaryObjects: number;
  objectTypeCounts: Record<string, number>;
  vendorCounts: Record<string, number>;
  unitCounts: Record<string, number>;
}
