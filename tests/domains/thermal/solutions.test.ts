import { describe, expect, it } from 'vitest';
import { celsius } from '../../../src/core/units.js';
import { decodeMixture, equilibriumAt, heldIn, mixtureBoilingPoint, mixtureEnthalpy, solubilityAt, solutionFreezingPoint } from '../../../src/domains/thermal/mixture.js';

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

describe('the enthalpy of solution', () => {
  // Water at 20 °C and a dry portion at 20 °C, together: the energy each brings, then the temperature of the mix.
  const dissolve = (component: string, kg: number) => {
    const T = celsius(20);
    const h = mixtureEnthalpy(equilibriumAt(0.1, [], T), T) + mixtureEnthalpy(equilibriumAt(0, [{ component, mass: kg }], T), T);
    return decodeMixture(h, 0.1, [{ component, mass: kg }]);
  };

  it('ammonium chloride cools the water, sodium hydroxide heats it — by Q = n·ΔH over the heat capacity', () => {
    // 20 g NH4Cl = 0.374 mol × 14.78 kJ/mol = 5.5 kJ out of ≈ 450 J/K: ≈ −12 °C.
    expect(C(dissolve('ammonium-chloride', 0.02).temperature)).toBeCloseTo(7.7, 0);
    // 10 g NaOH = 0.25 mol × 44.51 kJ/mol = 11.1 kJ out of ≈ 433 J/K: ≈ +26 °C.
    expect(C(dissolve('sodium-hydroxide', 0.01).temperature)).toBeCloseTo(45.7, 0);
    // Salt barely: 3.88 kJ/mol.
    expect(C(dissolve('sodium-chloride', 0.02).temperature)).toBeCloseTo(17, 0);
  });

  it('crystallising gives the heat back: cooling a saturated solution releases ΔH for every crystal that forms', () => {
    const solute = [{ component: 'ammonium-chloride', mass: 0.05 }];
    const hot = equilibriumAt(0.1, solute, celsius(60));
    const cold = equilibriumAt(0.1, solute, celsius(10));
    // At 60 °C all 50 g dissolve (55.3 g/100 g), at 10 °C only ≈ 33 g (33.2 g/100 g).
    expect(hot.crystals).toBe(0);
    expect(cold.crystals * 1000).toBeCloseTo(50 - 33.2, 0);
    // Heat given off between them = heat capacity × 50 K + the enthalpy of solution of the crystals that formed.
    const capacity = 0.1 * 4181 + 0.05 * 1572;
    const hSol = (14.78 * 1000) / 0.05349;
    const given = mixtureEnthalpy(hot, celsius(60)) - mixtureEnthalpy(cold, celsius(10));
    expect(given / 1000).toBeCloseTo((capacity * 50 + cold.crystals * hSol) / 1000, 0);
  });
});

describe('supersaturated solutions', () => {
  const acetate = [{ component: 'sodium-acetate', mass: 0.02 }];
  it('without a seed sodium acetate stays dissolved below saturation; with crystals it is in equilibrium', () => {
    const T = celsius(22);
    // 4 g of water hold ≈ 4.6 g of the trihydrate at 22 °C — not 20 g.
    expect(equilibriumAt(0.004, acetate, T).crystals * 1000).toBeGreaterThan(15);
    const held = heldIn({ solutes: [{ component: 'sodium-acetate', crystals: 0 }] });
    expect(held.has('sodium-acetate')).toBe(true);
    expect(equilibriumAt(0.004, acetate, T, held).crystals).toBe(0);
    // A solute that does not supersaturate is never held (copper sulfate crystallises at once).
    expect(heldIn({ solutes: [{ component: 'copper-sulfate', crystals: 0 }] }).size).toBe(0);
  });

  it('a seed releases the heat of crystallisation: the same energy, crystals allowed — it warms up', () => {
    const T = celsius(22);
    const h = mixtureEnthalpy(equilibriumAt(0.004, acetate, T, heldIn({ solutes: [{ component: 'sodium-acetate', crystals: 0 }] })), T);
    const seeded = decodeMixture(h, 0.004, acetate);
    expect(seeded.amounts.crystals).toBeGreaterThan(0.005);
    expect(C(seeded.temperature)).toBeGreaterThan(40);
  });
});
