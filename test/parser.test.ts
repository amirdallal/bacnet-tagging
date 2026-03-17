import { describe, it, expect } from 'vitest';
import { DiscoveryReportParser } from '../src/services/DiscoveryReportParser.js';
import type { DiscoveryReport } from '../src/types/bacnet.js';

const parser = new DiscoveryReportParser();

describe('DiscoveryReportParser', () => {
  it('parses a minimal report', () => {
    const report: DiscoveryReport = {
      devices: {
        '100': {
          'vendor-name': 'Trane',
          'model-name': 'UC600',
          objects: {
            'AI:1': {
              'object-name': 'Space Temperature Active|vav-75',
              'object-type': 'analog-input',
              units: 'degrees-fahrenheit',
              supported: true,
            },
            'AV:2': {
              'object-name': 'OSA Temp',
              'object-type': 'analog-value',
              units: 'degrees-fahrenheit',
              supported: true,
            },
          },
        },
      },
    };

    const result = parser.parse(report, 'test-site', 'Test Site');

    expect(result.siteId).toBe('test-site');
    expect(result.siteName).toBe('Test Site');
    expect(result.stats.totalDevices).toBe(1);
    expect(result.stats.totalObjects).toBe(2);
    expect(result.stats.supportedObjects).toBe(2);
    expect(result.points).toHaveLength(2);
  });

  it('splits pipe-separated names correctly', () => {
    const report: DiscoveryReport = {
      devices: {
        '200': {
          'vendor-name': 'Trane',
          'model-name': 'UC210',
          objects: {
            'AI:1': {
              'object-name': 'Discharge Air Flow|vav-76',
              'object-type': 'analog-input',
              units: 'cubic-feet-per-minute',
              supported: true,
            },
          },
        },
      },
    };

    const result = parser.parse(report);
    const point = result.points[0];

    expect(point.objectName).toBe('Discharge Air Flow');
    expect(point.equipmentRef).toBe('vav-76');
    expect(point.rawName).toBe('Discharge Air Flow|vav-76');
  });

  it('flags vendor proprietary objects', () => {
    const report: DiscoveryReport = {
      devices: {
        '300': {
          'vendor-name': 'Delta Controls',
          'model-name': 'DVC_304',
          objects: {
            'VP:1': {
              'object-name': 'StRegis',
              'object-type': 'Vendor Proprietary Value',
              supported: false,
            },
          },
        },
      },
    };

    const result = parser.parse(report);
    expect(result.points[0].isVendorProprietary).toBe(true);
    expect(result.stats.vendorProprietaryObjects).toBe(1);
  });

  it('handles empty/missing names gracefully', () => {
    const report: DiscoveryReport = {
      devices: {
        '400': {
          objects: {
            'AV:1': {
              'object-name': '',
              'object-type': 'analog-value',
            },
          },
        },
      },
    };

    const result = parser.parse(report);
    expect(result.points[0].objectName).toBe('');
    expect(result.points[0].vendorName).toBe('');
  });
});
