import { v4 as uuid } from 'uuid';
import type {
  DiscoveryReport,
  BACnetDevice,
  BACnetObject,
  ParsedPoint,
  ParsedReport,
  ReportStats,
} from '../types/bacnet.js';

/**
 * Parses BACnet discovery report JSON files into normalized ParsedPoint arrays.
 *
 * Handles two known naming conventions:
 * 1. Space/underscore separated (Monarch Beach / Delta Controls): "OSA Temp", "CHW_VALVE"
 * 2. Pipe-separated (Biscayne / Trane): "Space Temperature Active|vav-75"
 */
export class DiscoveryReportParser {
  /**
   * Parse a raw discovery report JSON into normalized points + stats.
   */
  parse(report: DiscoveryReport, siteId?: string, siteName?: string): ParsedReport {
    const resolvedSiteId = siteId ?? uuid();
    const resolvedSiteName = siteName ?? 'Unknown Site';
    const points: ParsedPoint[] = [];
    const stats = this.initStats();

    const devices = report.devices ?? {};
    stats.totalDevices = Object.keys(devices).length;

    for (const [deviceId, device] of Object.entries(devices)) {
      const vendorName = device['vendor-name'] ?? '';
      const modelName = device['model-name'] ?? '';

      this.incrementCount(stats.vendorCounts, vendorName || 'Unknown');

      const objects = device.objects ?? {};
      for (const [objectId, obj] of Object.entries(objects)) {
        stats.totalObjects++;
        const parsed = this.parseObject(deviceId, objectId, obj, vendorName, modelName);
        points.push(parsed);

        // Stats tracking
        this.incrementCount(stats.objectTypeCounts, parsed.objectType);
        if (parsed.units) this.incrementCount(stats.unitCounts, parsed.units);

        if (parsed.supported) {
          stats.supportedObjects++;
        } else {
          stats.unsupportedObjects++;
        }
        if (parsed.isVendorProprietary) {
          stats.vendorProprietaryObjects++;
        }
      }
    }

    return {
      siteId: resolvedSiteId,
      siteName: resolvedSiteName,
      points,
      stats,
    };
  }

  /**
   * Parse a single BACnet object into a normalized ParsedPoint.
   */
  private parseObject(
    deviceId: string,
    objectId: string,
    obj: BACnetObject,
    vendorName: string,
    modelName: string,
  ): ParsedPoint {
    const rawName = obj['object-name'] ?? '';
    const objectType = obj['object-type'] ?? '';
    const units = obj.units ?? '';
    const description = obj.description ?? '';
    const supported = obj.supported !== false; // default true if missing
    const isVendorProprietary = objectType === 'Vendor Proprietary Value';

    // Handle pipe-separated names: "Space Temperature Active|vav-75"
    const { cleanName, equipmentRef } = this.splitPipeName(rawName);

    return {
      id: `${deviceId}:${objectId}`,
      deviceId,
      objectId,
      objectName: cleanName,
      objectType,
      units,
      description,
      supported,
      vendorName,
      modelName,
      equipmentRef,
      rawName,
      isVendorProprietary,
    };
  }

  /**
   * Split pipe-separated names used by Trane systems.
   * "Space Temperature Active|vav-75" → { cleanName: "Space Temperature Active", equipmentRef: "vav-75" }
   * "OSA Temp" → { cleanName: "OSA Temp", equipmentRef: "" }
   */
  private splitPipeName(name: string): { cleanName: string; equipmentRef: string } {
    const pipeIdx = name.indexOf('|');
    if (pipeIdx === -1) {
      return { cleanName: name.trim(), equipmentRef: '' };
    }
    return {
      cleanName: name.substring(0, pipeIdx).trim(),
      equipmentRef: name.substring(pipeIdx + 1).trim(),
    };
  }

  private initStats(): ReportStats {
    return {
      totalDevices: 0,
      totalObjects: 0,
      supportedObjects: 0,
      unsupportedObjects: 0,
      vendorProprietaryObjects: 0,
      objectTypeCounts: {},
      vendorCounts: {},
      unitCounts: {},
    };
  }

  private incrementCount(map: Record<string, number>, key: string): void {
    map[key] = (map[key] ?? 0) + 1;
  }
}
