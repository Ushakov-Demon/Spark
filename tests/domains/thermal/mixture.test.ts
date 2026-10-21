import { describe, expect, it } from 'vitest';
import { celsius } from '../../../src/core/units.js';
import { decodeMixture, equilibriumAt, mixtureBoilingPoint, mixtureEnthalpy } from '../../../src/domains/thermal/mixture.js';

const C = (k: number) => k - 273.15;

describe('water–salt phase diagram', () => {
  it('pure water: melting plateau at 0 °C, round trip in every region', () => {
    for (const [t, ice] of [[-10, 1], [20, 0]] as const) {
      const m = equilibriumAt(1, 0, celsius(t));
      expect(m.ice).toBe(ice);
      const d = decodeMixture(mixtureEnthalpy(m, celsius(t)), 1, 0);
      expect(C(d.temperature)).toBeCloseTo(t, 4);
    }
    // Half melted ice at 0 °C.
    const hSolid = mixtureEnthalpy(equilibriumAt(1, 0, celsius(-1)), celsius(0));
    const d = decodeMixture(hSolid + 167_000, 1, 0);
    expect(C(d.temperature)).toBeCloseTo(0, 3);
    expect(d.amounts.ice).toBeCloseTo(0.5, 3);
  });

  it('10 % brine starts freezing at −6.56 °C, not at 0 °C', () => {
    expect(equilibriumAt(0.9, 0.1, celsius(-6)).ice).toBe(0);
    expect(equilibriumAt(0.9, 0.1, celsius(-7)).ice).toBeGreaterThan(0);
  });

  it('as ice forms the rest gets saltier: freezing is gradual, down to the eutectic', () => {
    const a = equilibriumAt(0.9, 0.1, celsius(-10));
    const b = equilibriumAt(0.9, 0.1, celsius(-20));
    expect(b.ice).toBeGreaterThan(a.ice);
    expect(b.ice).toBeLessThan(0.9);
    expect(equilibriumAt(0.9, 0.1, celsius(-22)).ice).toBe(0.9);
  });

  it('salt beyond solubility crystallises (26.4 % saturated at 20 °C)', () => {
    expect(equilibriumAt(0.7, 0.25, celsius(20)).crystals).toBe(0);
    const m = equilibriumAt(0.7, 0.3, celsius(20));
    expect(m.crystals).toBeGreaterThan(0);
    expect((m.salt - m.crystals) / (0.7 + m.salt - m.crystals)).toBeCloseTo(0.264, 3);
  });

  it('boiling point: pure water 100 °C, brine higher, saturated brine higher still', () => {
    const pure = C(mixtureBoilingPoint(equilibriumAt(1, 0, celsius(100))));
    const sea = C(mixtureBoilingPoint(equilibriumAt(0.965, 0.035, celsius(100))));
    const sat = C(mixtureBoilingPoint(equilibriumAt(0.7, 0.28, celsius(100))));
    expect(pure).toBeCloseTo(100, 1);
    expect(sea).toBeGreaterThan(100.3);
    expect(sea).toBeLessThan(101.5);
    expect(sat).toBeGreaterThan(104);
  });

  it('decode is the inverse of enthalpy for brine across the diagram', () => {
    for (const t of [-30, -21.1, -15, -5, 0, 30, 99]) {
      const m = equilibriumAt(0.8, 0.2, celsius(t));
      const d = decodeMixture(mixtureEnthalpy(m, celsius(t)), 0.8, 0.2);
      expect(C(d.temperature)).toBeCloseTo(t, 3);
    }
  });
});
