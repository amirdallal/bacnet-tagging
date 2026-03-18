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
      // Try unit-based fallback before giving up
      return this.unitBasedFallback(point, start);
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

    // Merge equipment context tags into the match
    const equipTags = this.extractEquipmentTags(point.objectName);
    const mergedMarkers = [...best.pattern.haystackTags.marker];
    for (const t of equipTags) {
      if (!mergedMarkers.includes(t)) mergedMarkers.push(t);
    }

    return {
      pointId: point.id,
      brickClass: best.pattern.brickClass,
      haystackTags: { marker: mergedMarkers, value: best.pattern.haystackTags.value },
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

  /** Equipment keywords to extract as Haystack tags even on partial matches */
  private static readonly EQUIP_KEYWORDS: Array<{ regex: RegExp; tags: string[] }> = [
    { regex: /\bVAV\b/i, tags: ['vav', 'hvac', 'equip'] },
    { regex: /\bAHU\b/i, tags: ['ahu', 'hvac', 'equip'] },
    { regex: /\b(Chiller|CH[-_]?\d)/i, tags: ['chiller', 'hvac', 'equip'] },
    { regex: /\bCHWP\b/i, tags: ['chilled', 'water', 'pump', 'equip'] },
    { regex: /\bCWP\b/i, tags: ['condenser', 'water', 'pump', 'equip'] },
    { regex: /\bHWP\b/i, tags: ['hot', 'water', 'pump', 'equip'] },
    { regex: /\bFCU\b/i, tags: ['fcu', 'hvac', 'equip'] },
    { regex: /\bBoiler\b/i, tags: ['boiler', 'hvac', 'equip'] },
    { regex: /\bCooling\s*Tower|CT[-_]?\d/i, tags: ['coolingTower', 'hvac', 'equip'] },
    { regex: /\bCompressor\b/i, tags: ['compressor', 'equip'] },
    { regex: /\bVFD\b/i, tags: ['vfd', 'motor', 'equip'] },
    { regex: /\bPump\b/i, tags: ['pump', 'equip'] },
  ];

  /**
   * Extract equipment-related Haystack tags from point name.
   * Used to add contextual tags even when no full BRICK match is found.
   */
  extractEquipmentTags(name: string): string[] {
    const tags: string[] = [];
    for (const kw of SemanticEnricher.EQUIP_KEYWORDS) {
      if (kw.regex.test(name)) {
        for (const t of kw.tags) {
          if (!tags.includes(t)) tags.push(t);
        }
      }
    }
    return tags;
  }

  private findMatches(point: ParsedPoint): { pattern: SemanticPattern; confidence: number }[] {
    const results: { pattern: SemanticPattern; confidence: number }[] = [];
    const name = point.objectName;
    // Also try camelCase-expanded version: "LeavingEvapTemp" → "Leaving Evap Temp"
    const expanded = this.expandCamelCase(name);
    // Strip trailing _N suffix for Automated Logic style: "zone_temp_1" → "zone_temp"
    const stripped = name.replace(/_\d+$/, '');
    // Expand underscores to spaces for matching: "zone_temp" → "zone temp"
    const spaced = stripped.replace(/_/g, ' ');
    // Strip "BACnet" / "DSP" / "Network" prefixes: "BACnet Chiller-1 State" → "Chiller-1 State"
    const deprefix = name.replace(/^(BACnet|DSP|Network)\s+/i, '');

    const variants = new Set([name, expanded, stripped, spaced, deprefix]);
    // Also deprefix + expand: "BACnet CHWP-1 VFD Output Current" → "CHWP-1 VFD Output Current"
    if (deprefix !== name) {
      variants.add(this.expandCamelCase(deprefix));
    }

    for (const pattern of patterns) {
      let matched = false;
      for (const v of variants) {
        if (pattern.regex.test(v)) { matched = true; break; }
      }
      if (matched) {
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

  /**
   * Expand camelCase and PascalCase into space-separated words.
   * "LeavingEvapTemp" → "Leaving Evap Temp"
   * "ChillerAlarm" → "Chiller Alarm"
   * "CompressorPower_1" → "Compressor Power_1"
   */
  private expandCamelCase(name: string): string {
    return name
      .replace(/([a-z])([A-Z])/g, '$1 $2')  // camelCase boundaries
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');  // ABBVfd → ABB Vfd
  }

  /**
   * Unit-based fallback inference when no pattern matches.
   * Uses units alone to provide at least a generic classification.
   */
  private unitBasedFallback(point: ParsedPoint, start: number): EnrichmentResult {
    const units = (point.units || '').toLowerCase().trim();
    const map: Record<string, { uri: string; label: string; cat: string; markers: string[] }> = {
      'degrees-fahrenheit': { uri: 'Temperature_Sensor', label: 'Temperature Sensor', cat: 'Temperature', markers: ['sensor', 'temp', 'point'] },
      'degrees-celsius': { uri: 'Temperature_Sensor', label: 'Temperature Sensor', cat: 'Temperature', markers: ['sensor', 'temp', 'point'] },
      'delta-degrees-fahrenheit': { uri: 'Temperature_Difference_Sensor', label: 'Temperature Difference', cat: 'Temperature', markers: ['sensor', 'temp', 'delta', 'point'] },
      'percent': { uri: 'Point', label: 'Percent Point', cat: 'General', markers: ['point'] },
      'percent-relative-humidity': { uri: 'Humidity_Sensor', label: 'Humidity Sensor', cat: 'Humidity', markers: ['sensor', 'humidity', 'point'] },
      'cubic-feet-per-minute': { uri: 'Air_Flow_Sensor', label: 'Air Flow Sensor', cat: 'Flow', markers: ['sensor', 'air', 'flow', 'point'] },
      'liters-per-second': { uri: 'Air_Flow_Sensor', label: 'Air Flow Sensor', cat: 'Flow', markers: ['sensor', 'air', 'flow', 'point'] },
      'inches-of-water': { uri: 'Pressure_Sensor', label: 'Pressure Sensor', cat: 'Pressure', markers: ['sensor', 'pressure', 'point'] },
      'pascals': { uri: 'Pressure_Sensor', label: 'Pressure Sensor', cat: 'Pressure', markers: ['sensor', 'pressure', 'point'] },
      'kilopascals': { uri: 'Pressure_Sensor', label: 'Pressure Sensor', cat: 'Pressure', markers: ['sensor', 'pressure', 'point'] },
      'pounds-force-per-square-inch': { uri: 'Pressure_Sensor', label: 'Pressure Sensor', cat: 'Pressure', markers: ['sensor', 'pressure', 'point'] },
      'kilowatts': { uri: 'Electric_Power_Sensor', label: 'Electric Power Sensor', cat: 'Power', markers: ['sensor', 'elec', 'power', 'point'] },
      'watts': { uri: 'Electric_Power_Sensor', label: 'Electric Power Sensor', cat: 'Power', markers: ['sensor', 'elec', 'power', 'point'] },
      'kilowatt-hours': { uri: 'Electric_Energy_Sensor', label: 'Electric Energy Sensor', cat: 'Energy', markers: ['sensor', 'elec', 'energy', 'point'] },
      'megawatt-hours': { uri: 'Electric_Energy_Sensor', label: 'Electric Energy Sensor', cat: 'Energy', markers: ['sensor', 'elec', 'energy', 'point'] },
      'amperes': { uri: 'Current_Sensor', label: 'Current Sensor', cat: 'Power', markers: ['sensor', 'elec', 'current', 'point'] },
      'milliamperes': { uri: 'Current_Sensor', label: 'Current Sensor', cat: 'Power', markers: ['sensor', 'elec', 'current', 'point'] },
      'volts': { uri: 'Voltage_Sensor', label: 'Voltage Sensor', cat: 'Power', markers: ['sensor', 'elec', 'volt', 'point'] },
      'hertz': { uri: 'Frequency_Sensor', label: 'Frequency Sensor', cat: 'Motor', markers: ['sensor', 'motor', 'freq', 'point'] },
      'revolutions-per-minute': { uri: 'Motor_Speed_Sensor', label: 'Motor Speed Sensor', cat: 'Motor', markers: ['sensor', 'motor', 'speed', 'point'] },
      'parts-per-million': { uri: 'CO2_Level_Sensor', label: 'CO2/PPM Sensor', cat: 'AirQuality', markers: ['sensor', 'co2', 'air', 'point'] },
      'us-gallons-per-minute': { uri: 'Water_Flow_Sensor', label: 'Water Flow Sensor', cat: 'Flow', markers: ['sensor', 'water', 'flow', 'point'] },
      'tons': { uri: 'Thermal_Power_Sensor', label: 'Tonnage Sensor', cat: 'Power', markers: ['sensor', 'cooling', 'power', 'point'] },
      'tons-refrigeration': { uri: 'Thermal_Power_Sensor', label: 'Tonnage Sensor', cat: 'Power', markers: ['sensor', 'cooling', 'power', 'point'] },
      'hours': { uri: 'Duration_Sensor', label: 'Duration Sensor', cat: 'Status', markers: ['sensor', 'duration', 'point'] },
    };

    // Always extract equipment tags from name
    const equipTags = this.extractEquipmentTags(point.objectName);

    const match = map[units];
    if (match) {
      const conf = 0.40;
      const mergedMarkers = [...match.markers];
      for (const t of equipTags) { if (!mergedMarkers.includes(t)) mergedMarkers.push(t); }
      return {
        pointId: point.id,
        brickClass: {
          uri: `https://brickschema.org/schema/Brick#${match.uri}`,
          label: match.label,
          category: match.cat,
        },
        haystackTags: { marker: mergedMarkers, value: {} },
        confidence: conf,
        confidenceLevel: this.classifier.classify(conf),
        matchedPattern: 'unit-fallback',
        alternativeMatches: [],
        flaggedForReview: true,
        reviewReason: 'Classified by units only — name pattern not recognized',
        enrichmentSource: 'unit-fallback',
        processingTimeMs: performance.now() - start,
      };
    }

    // Even with no unit match, if we found equipment tags, return a partial match
    if (equipTags.length > 0) {
      return {
        pointId: point.id,
        brickClass: null,
        haystackTags: { marker: ['point', ...equipTags], value: {} },
        confidence: 0.15,
        confidenceLevel: 'NO_MATCH',
        matchedPattern: 'equip-tags-only',
        alternativeMatches: [],
        flaggedForReview: true,
        reviewReason: 'Equipment context tags extracted but no BRICK class matched',
        enrichmentSource: 'unit-fallback',
        processingTimeMs: performance.now() - start,
      };
    }

    return this.noMatch(point.id, start, null);
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
