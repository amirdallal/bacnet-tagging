import { describe, it, expect } from 'vitest';
import { SemanticEnricher } from '../src/services/SemanticEnricher.js';
import type { ParsedPoint } from '../src/types/bacnet.js';

const enricher = new SemanticEnricher();

function makePoint(overrides: Partial<ParsedPoint>): ParsedPoint {
  return {
    id: 'test:1',
    deviceId: '100',
    objectId: 'AI:1',
    objectName: '',
    objectType: 'analog-input',
    units: '',
    description: '',
    supported: true,
    vendorName: 'Trane',
    modelName: 'UC600',
    equipmentRef: '',
    rawName: '',
    isVendorProprietary: false,
    ...overrides,
  };
}

describe('SemanticEnricher', () => {
  // --- Temperature ---
  it('classifies "Space Temperature Active" as Zone Air Temp Sensor', () => {
    const result = enricher.enrich(makePoint({ objectName: 'Space Temperature Active', units: 'degrees-fahrenheit' }));
    expect(result.brickClass?.label).toContain('Zone Air Temperature Sensor');
    expect(result.confidence).toBeGreaterThanOrEqual(0.90);
    expect(result.confidenceLevel).toBe('HIGH');
  });

  it('classifies "OSA Temp" as Outside Air Temp Sensor', () => {
    const result = enricher.enrich(makePoint({ objectName: 'OSA Temp', units: 'degrees-fahrenheit' }));
    expect(result.brickClass?.label).toContain('Outside Air Temperature');
    expect(result.confidenceLevel).toBe('HIGH');
  });

  it('classifies camelCase "spaceTemperature" from Trane', () => {
    const result = enricher.enrich(makePoint({ objectName: 'spaceTemperature', units: 'degrees-fahrenheit' }));
    expect(result.brickClass?.label).toContain('Zone Air Temperature');
    expect(result.confidence).toBeGreaterThanOrEqual(0.90);
  });

  it('classifies "PRIM_CHWS_TEMP" as Chilled Water Supply Temp', () => {
    const result = enricher.enrich(makePoint({ objectName: 'PRIM_CHWS_TEMP', units: 'degrees-fahrenheit' }));
    expect(result.brickClass?.label).toContain('Chilled Water Supply');
    expect(result.confidenceLevel).toBe('HIGH');
  });

  it('classifies "HWR_TEMP" as Hot Water Return Temp', () => {
    const result = enricher.enrich(makePoint({ objectName: 'HWR_TEMP', units: 'degrees-fahrenheit' }));
    expect(result.brickClass?.label).toContain('Hot Water Return');
  });

  // --- Flow ---
  it('classifies "Discharge Air Flow" as Discharge Air Flow Sensor', () => {
    const result = enricher.enrich(makePoint({ objectName: 'Discharge Air Flow', units: 'cubic-feet-per-minute' }));
    expect(result.brickClass?.label).toContain('Discharge Air Flow');
    expect(result.confidenceLevel).toBe('HIGH');
  });

  it('classifies "Airflow AI" as Air Flow Sensor', () => {
    const result = enricher.enrich(makePoint({ objectName: 'Airflow AI', units: 'cubic-feet-per-minute' }));
    expect(result.brickClass?.label).toContain('Air Flow');
  });

  // --- Setpoints ---
  it('classifies "Occupied Heating Setpoint AV" correctly', () => {
    const result = enricher.enrich(makePoint({ objectName: 'Occupied Heating Setpoint AV', units: 'degrees-fahrenheit' }));
    expect(result.brickClass?.label).toContain('Occupied Heating');
    expect(result.confidenceLevel).toBe('HIGH');
  });

  it('classifies camelCase "occupiedCoolingSetpoint" correctly', () => {
    const result = enricher.enrich(makePoint({ objectName: 'occupiedCoolingSetpoint', units: 'degrees-fahrenheit' }));
    expect(result.brickClass?.label).toContain('Occupied Cooling');
  });

  // --- Valve / Damper ---
  it('classifies "CHW_VALVE" as Chilled Water Valve', () => {
    const result = enricher.enrich(makePoint({ objectName: 'CHW_VALVE', units: 'percent' }));
    expect(result.brickClass?.label).toContain('Chilled Water Valve');
    expect(result.confidenceLevel).toBe('HIGH');
  });

  it('classifies "ECON_DAMPER" as Economizer Damper', () => {
    const result = enricher.enrich(makePoint({ objectName: 'ECON_DAMPER', units: 'percent' }));
    expect(result.brickClass?.label).toContain('Economizer Damper');
  });

  // --- Power ---
  it('classifies "CT-1 KW" as Electric Power Sensor', () => {
    const result = enricher.enrich(makePoint({ objectName: 'CT-1 KW', units: 'kilowatts' }));
    expect(result.brickClass?.label).toContain('Power');
  });

  it('classifies "CH_1_KWH" as Electric Energy Sensor', () => {
    const result = enricher.enrich(makePoint({ objectName: 'CH_1_KWH', units: 'kilowatt-hours' }));
    expect(result.brickClass?.label).toContain('Energy');
    expect(result.confidenceLevel).toBe('HIGH');
  });

  // --- CO2 ---
  it('classifies "Room CO2" as CO2 Level Sensor', () => {
    const result = enricher.enrich(makePoint({ objectName: 'Room CO2', units: 'parts-per-million' }));
    expect(result.brickClass?.label).toContain('CO2');
    expect(result.confidenceLevel).toBe('HIGH');
  });

  // --- Status / Alarm ---
  it('classifies "CWP-1 Status" as Pump Status', () => {
    const result = enricher.enrich(makePoint({ objectName: 'CWP-1 Status', objectType: 'binary-input' }));
    expect(result.brickClass?.label).toContain('Pump Status');
  });

  it('classifies "CH_1_ALARM" as Chiller Alarm', () => {
    const result = enricher.enrich(makePoint({ objectName: 'CH_1_ALARM', objectType: 'binary-input' }));
    expect(result.brickClass?.label).toContain('Chiller Alarm');
  });

  // --- Fan ---
  it('classifies "AHU-9 SF FAN STATUS" as Supply Fan Status', () => {
    const result = enricher.enrich(makePoint({ objectName: 'AHU-9 SF FAN STATUS', objectType: 'binary-input' }));
    expect(result.brickClass?.label).toContain('Supply Fan Status');
  });

  // --- Edge cases ---
  it('skips vendor proprietary objects', () => {
    const result = enricher.enrich(makePoint({ objectName: 'StRegis', isVendorProprietary: true }));
    expect(result.confidenceLevel).toBe('NO_MATCH');
    expect(result.reviewReason).toContain('Vendor proprietary');
  });

  it('skips unsupported objects', () => {
    const result = enricher.enrich(makePoint({ objectName: 'Some Point', supported: false }));
    expect(result.confidenceLevel).toBe('NO_MATCH');
  });

  it('handles empty name gracefully', () => {
    const result = enricher.enrich(makePoint({ objectName: '' }));
    expect(result.confidenceLevel).toBe('NO_MATCH');
  });

  // --- Unit validation ---
  it('boosts confidence when units match expected', () => {
    const withUnits = enricher.enrich(makePoint({ objectName: 'Space Temperature', units: 'degrees-fahrenheit' }));
    const noUnits = enricher.enrich(makePoint({ objectName: 'Space Temperature', units: '' }));
    expect(withUnits.confidence).toBeGreaterThan(noUnits.confidence);
  });

  it('penalizes confidence when units contradict expected', () => {
    const wrongUnits = enricher.enrich(makePoint({ objectName: 'Room CO2', units: 'degrees-fahrenheit' }));
    const rightUnits = enricher.enrich(makePoint({ objectName: 'Room CO2', units: 'parts-per-million' }));
    expect(rightUnits.confidence).toBeGreaterThan(wrongUnits.confidence);
  });
});
