import { describe, it, expect } from 'vitest';
import { ThingDescriptionGenerator } from '../src/services/ThingDescriptionGenerator.js';
import type { EnrichedPoint } from '../src/types/enrichment.js';

const gen = new ThingDescriptionGenerator();

function makeEnrichedPoint(overrides: Partial<EnrichedPoint['parsed']> = {}, enrichOverrides: Partial<EnrichedPoint['enrichment']> = {}): EnrichedPoint {
  return {
    parsed: {
      id: '100:AI:1',
      deviceId: '100',
      objectId: 'AI:1',
      objectName: 'Space Temperature',
      objectType: 'analog-input',
      units: 'degrees-fahrenheit',
      description: '',
      supported: true,
      vendorName: 'Trane',
      modelName: 'UC600',
      equipmentRef: 'vav-75',
      rawName: 'Space Temperature|vav-75',
      isVendorProprietary: false,
      ...overrides,
    },
    enrichment: {
      pointId: '100:AI:1',
      brickClass: {
        uri: 'https://brickschema.org/schema/Brick#Zone_Air_Temperature_Sensor',
        label: 'Zone Air Temperature Sensor',
        category: 'Temperature',
      },
      haystackTags: { marker: ['sensor', 'temp', 'zone', 'air', 'point'], value: { unit: 'fahrenheit' } },
      confidence: 0.95,
      confidenceLevel: 'HIGH',
      matchedPattern: 'temp-space',
      alternativeMatches: [],
      flaggedForReview: false,
      reviewReason: null,
      enrichmentSource: 'pattern',
      processingTimeMs: 0.5,
      ...enrichOverrides,
    },
  };
}

describe('ThingDescriptionGenerator', () => {
  it('generates a valid TD structure', () => {
    const points = [makeEnrichedPoint()];
    const tds = gen.generateAll('site-1', 'Test Site', points);

    expect(tds).toHaveLength(1);
    const td = tds[0];

    expect(td['@context']).toContain('https://www.w3.org/2022/wot/td/v1.1');
    expect(td['@context']).toContain('https://brickschema.org/schema/Brick');
    expect(td.id).toContain('site-1');
    expect(td.title).toContain('Trane');
    expect(td.security).toContain('nosec_sc');
  });

  it('includes enrichment metadata in properties', () => {
    const points = [makeEnrichedPoint()];
    const td = gen.generateAll('site-1', 'Test', points)[0];

    const propKeys = Object.keys(td.properties);
    expect(propKeys.length).toBe(1);

    const prop = td.properties[propKeys[0]];
    expect(prop['@type']).toContain('https://brickschema.org/schema/Brick#Zone_Air_Temperature_Sensor');
    expect(prop.enrichment.confidence).toBe(0.95);
    expect(prop.enrichment.confidenceLevel).toBe('HIGH');
    expect(prop.type).toBe('number'); // analog-input → number
    expect(prop.readOnly).toBe(true); // analog-input → readOnly
  });

  it('groups points by device', () => {
    const points = [
      makeEnrichedPoint({ deviceId: '100', objectId: 'AI:1' }),
      makeEnrichedPoint({ deviceId: '100', objectId: 'AI:2', objectName: 'Discharge Temp' }),
      makeEnrichedPoint({ deviceId: '200', objectId: 'AI:1', objectName: 'OSA Temp' }),
    ];
    const tds = gen.generateAll('site-1', 'Test', points);
    expect(tds).toHaveLength(2);
  });

  it('includes enrichment summary counts', () => {
    const points = [
      makeEnrichedPoint({}, { confidenceLevel: 'HIGH' }),
      makeEnrichedPoint({ objectId: 'AI:2' }, { confidenceLevel: 'MEDIUM', confidence: 0.6 }),
      makeEnrichedPoint({ objectId: 'AI:3' }, { confidenceLevel: 'NO_MATCH', confidence: 0 }),
    ];
    const td = gen.generateAll('site-1', 'Test', points)[0];
    expect(td.metadata.enrichmentSummary.high).toBe(1);
    expect(td.metadata.enrichmentSummary.medium).toBe(1);
    expect(td.metadata.enrichmentSummary.noMatch).toBe(1);
  });
});
