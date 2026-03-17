import type { EnrichedPoint } from '../types/enrichment.js';
import type { ThingDescription, TDProperty } from '../types/td.js';

const VERSION = '1.0.0';

/**
 * Generates W3C-compliant Thing Description documents from enriched BACnet points.
 * Groups points by device, producing one TD per device.
 */
export class ThingDescriptionGenerator {
  /**
   * Generate TDs grouped by device from enriched points.
   */
  generateAll(siteId: string, siteName: string, points: EnrichedPoint[]): ThingDescription[] {
    // Group by deviceId
    const byDevice = new Map<string, EnrichedPoint[]>();
    for (const point of points) {
      const did = point.parsed.deviceId;
      const arr = byDevice.get(did) ?? [];
      arr.push(point);
      byDevice.set(did, arr);
    }

    const tds: ThingDescription[] = [];
    for (const [deviceId, devicePoints] of byDevice) {
      tds.push(this.generateForDevice(siteId, siteName, deviceId, devicePoints));
    }
    return tds;
  }

  /**
   * Generate a single TD for one device.
   */
  generateForDevice(
    siteId: string,
    siteName: string,
    deviceId: string,
    points: EnrichedPoint[],
  ): ThingDescription {
    const first = points[0]?.parsed;
    const vendorName = first?.vendorName ?? 'Unknown';
    const modelName = first?.modelName ?? 'Unknown';

    const properties: Record<string, TDProperty> = {};
    let high = 0, medium = 0, low = 0, noMatch = 0;

    for (const point of points) {
      const propKey = this.sanitizeKey(point.parsed.objectName || point.parsed.objectId);
      const enrichment = point.enrichment;

      switch (enrichment.confidenceLevel) {
        case 'HIGH': high++; break;
        case 'MEDIUM': medium++; break;
        case 'LOW': low++; break;
        case 'NO_MATCH': noMatch++; break;
      }

      const types: string[] = [];
      if (enrichment.brickClass) {
        types.push(enrichment.brickClass.uri);
      }

      properties[propKey] = {
        '@type': types,
        title: point.parsed.objectName,
        description: point.parsed.description || `${point.parsed.objectType} point`,
        type: this.inferJsonType(point.parsed.objectType),
        unit: point.parsed.units || undefined,
        readOnly: this.isReadOnly(point.parsed.objectType),
        observable: true,
        'brick:hasTag': enrichment.haystackTags.marker.length > 0 ? enrichment.haystackTags.marker : undefined,
        'haystack:tags': Object.keys(enrichment.haystackTags.value).length > 0
          ? enrichment.haystackTags.value
          : undefined,
        forms: [{
          href: `bacnet://${deviceId}/${point.parsed.objectId}`,
          contentType: 'application/json',
          op: this.isReadOnly(point.parsed.objectType)
            ? ['readproperty', 'observeproperty']
            : ['readproperty', 'writeproperty', 'observeproperty'],
        }],
        enrichment: {
          confidence: enrichment.confidence,
          confidenceLevel: enrichment.confidenceLevel,
          source: enrichment.enrichmentSource,
          matchedPattern: enrichment.matchedPattern,
          flaggedForReview: enrichment.flaggedForReview,
        },
      };
    }

    return {
      '@context': [
        'https://www.w3.org/2022/wot/td/v1.1',
        'https://brickschema.org/schema/Brick',
        'https://project-haystack.org/tag',
      ],
      '@type': ['Thing', 'bacnet:Device'],
      id: `urn:bacnet:${siteId}:device:${deviceId}`,
      title: `${vendorName} ${modelName} (Device ${deviceId})`,
      description: `BACnet device ${deviceId} at ${siteName}`,
      securityDefinitions: {
        nosec_sc: { scheme: 'nosec' },
      },
      security: ['nosec_sc'],
      properties,
      metadata: {
        generatedAt: new Date().toISOString(),
        generatorVersion: VERSION,
        siteId,
        siteName,
        deviceId,
        vendorName,
        modelName,
        enrichmentSummary: {
          total: points.length,
          high,
          medium,
          low,
          noMatch,
        },
      },
    };
  }

  private sanitizeKey(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9_\-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      || 'unnamed';
  }

  private inferJsonType(objectType: string): string {
    if (objectType.startsWith('binary')) return 'boolean';
    if (objectType.startsWith('multi-state')) return 'integer';
    if (objectType.startsWith('analog')) return 'number';
    return 'string';
  }

  private isReadOnly(objectType: string): boolean {
    return objectType.includes('input') || objectType.includes('value');
  }
}
