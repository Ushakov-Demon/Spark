import { describe, expect, it } from 'vitest';
import { celsius } from '../../../src/core/units.js';
import { decodeMixture, equilibriumAt, mixtureBoilingPoint, mixtureEnthalpy, solubilityAt, solutionFreezingPoint } from '../../../src/domains/thermal/mixture.js';

const C = (k: number) => k - 273.15;
const sugar = (kg: number) => [{ component: 'sucrose', mass: kg }];

describe('the general solution model: any components, from their own data', () => {
  it('sugar: solubility from its table, much more in hot water — warming dissolves the rest', () => {
    expect(solubilityAt('sucrose', 20)).toBeCloseTo(201.9, 1);
    const cold = equilibriumAt(0.1, sugar(0.3), celsius(20));
    expect(cold.crystals * 1000).toBeCloseTo(300 - 201.9, 0);
    expect(equilibriumAt(0.1, sugar(0.3), celsius(70)).crystals).toBe(0);
  });

  it('Blagden’s law: 20 % sugar freezes ≈ 1.4 °C below zero, 30 % glycerol ≈ 8.6 °C (real ≈ 1.5 and 9.5)', () => {
    expect(solutionFreezingPoint(sugar(0.2), 0.8)).toBeCloseTo(-1.36, 1);
    expect(solutionFreezingPoint([{ component: 'glycerol', mass: 0.3 }], 0.7)).toBeCloseTo(-8.65, 0);
    // Ice starts to form below that point and not above.
    expect(equilibriumAt(0.8, sugar(0.2), celsius(-1)).ice).toBe(0);
    expect(equilibriumAt(0.8, sugar(0.2), celsius(-3)).ice).toBeGreaterThan(0);
  });

  it('salt and sugar in the same water: both dissolve, freezing point lowered by both', () => {
    const both = [{ component: 'sodium-chloride', mass: 0.03 }, { component: 'sucrose', mass: 0.1 }];
    const m = equilibriumAt(1, both, celsius(20));
    expect(m.solutes.map((s) => s.crystals)).toEqual([0, 0]);
    expect(solutionFreezingPoint(both, 1)).toBeLessThan(solutionFreezingPoint(sugar(0.1), 1));
  });

  it('a non-volatile solute raises the boiling point (Raoult)', () => {
    const pure = C(mixtureBoilingPoint(equilibriumAt(1, [], celsius(100))));
    const syrup = C(mixtureBoilingPoint(equilibriumAt(0.5, sugar(0.5), celsius(100))));
    expect(syrup).toBeGreaterThan(pure + 0.5);
  });

  it('energy round trip for a mixed solution across freezing and dissolving', () => {
    const both = [{ component: 'sodium-chloride', mass: 0.05 }, { component: 'sucrose', mass: 0.2 }];
    for (const t of [-15, -3, 0, 25, 80]) {
      const m = equilibriumAt(0.8, both, celsius(t));
      expect(C(decodeMixture(mixtureEnthalpy(m, celsius(t)), 0.8, both).temperature)).toBeCloseTo(t, 2);
    }
  });
});

describe('volatile liquids in water: Raoult for every component, measured non-ideality', () => {
  const alcohol = (kg: number) => [{ component: 'ethanol', mass: kg }];
  it('40 % alcohol (by mass) boils near 84 °C, between alcohol (78 °C) and water (100 °C)', () => {
    const tb = C(mixtureBoilingPoint(equilibriumAt(0.6, alcohol(0.4), celsius(80))));
    expect(tb).toBeGreaterThan(81);
    expect(tb).toBeLessThan(86);
  });

  it('the vapour is richer in alcohol than the liquid — distillation works', async () => {
    const { vapourComposition, liquidVolatiles } = await import('../../../src/domains/thermal/mixture.js');
    const m = equilibriumAt(0.9, alcohol(0.1), celsius(90));
    const tb = mixtureBoilingPoint(m);
    const y = vapourComposition(m, tb).find((p) => p.v.key === 'ethanol')!.y;
    const x = liquidVolatiles(m).find((p) => p.v.key === 'ethanol')!;
    expect(y).toBeGreaterThan(0.25); // ≈ 4 % of the molecules in the liquid, ≈ 29 % in the vapour (measured ≈ 27–30 %)
    expect(x.mass).toBeCloseTo(0.1, 6);
  });

  it('less alcohol — higher boiling point (the mixture boils hotter as the alcohol goes)', () => {
    const rich = mixtureBoilingPoint(equilibriumAt(0.8, alcohol(0.2), celsius(80)));
    const poor = mixtureBoilingPoint(equilibriumAt(0.8, alcohol(0.02), celsius(80)));
    expect(poor).toBeGreaterThan(rich + 5);
  });

  it('alcohol lowers the freezing point (Blagden): 30 % freezes ≈ 17 °C below zero', () => {
    expect(solutionFreezingPoint(alcohol(0.3), 0.7)).toBeCloseTo(-17.3, 0);
  });
});
