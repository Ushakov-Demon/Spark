import { describe, expect, it } from 'vitest';
import { earthField } from '../../src/domains/electrical/wmm.js';

// Reference values from pygeomag 1.x (MIT) with the same WMM-2025 coefficients, nT: x, y, z, h.
const REF: readonly (readonly [string, number, number, number, number, number, number, number])[] = [
  ['Kyiv', 50.45, 30.52, 2026.8, 19232.5, 2887.6, 47203.5, 19448.1],
  ['New York', 40.7128, -74.006, 2026.8, 20535.1, -4538.4, 46189.3, 21030.6],
  ['Sydney', -33.87, 151.21, 2026.0, 24018.0, 5461.5, -51391.8, 24631.1],
  ['Quito', -0.18, -78.47, 2028.5, 26311.5, -2497.9, 9474.5, 26429.8],
  ['Reykjavík', 64.15, -21.94, 2025.0, 12943.6, -2652.8, 50877.1, 13212.7],
  ['Svalbard', 78.22, 15.65, 2029.9, 6979.5, 1777.8, 54899.5, 7202.3],
];

describe('the World Magnetic Model 2025', () => {
  it.each(REF)('%s: the field’s parts to a nanotesla', (_name, lat, lon, year, x, y, z, h) => {
    const e = earthField(lat, lon, year);
    expect(Math.abs(e.x * 1e9 - x)).toBeLessThan(1);
    expect(Math.abs(e.y * 1e9 - y)).toBeLessThan(1);
    expect(Math.abs(e.z * 1e9 - z)).toBeLessThan(1);
    expect(Math.abs(e.h * 1e9 - h)).toBeLessThan(1);
  });
});
