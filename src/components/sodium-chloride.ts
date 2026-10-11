import type { SourcedValue } from '../knowledge/types.js';
import type { Component, SoluteModel } from './types.js';
import { cite, sv } from './sourced.js';

/**
 * Sodium chloride (table salt) and its solute model: how it behaves dissolved in
 * water. Tables with sources; temperatures in °C, mass fractions w = salt / (salt + water).
 */

/**
 * Solubility, g of NaCl per 100 g of water, at 0…100 °C (step 10 °C).
 * Cross-check: 35.89 at 20 °C ↔ saturated 26.4 w% (Sodium chloride article).
 */
export const NACL_SOLUBILITY: { readonly t: readonly number[]; readonly gPer100g: readonly number[]; readonly data: SourcedValue } = {
  t: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
  gPer100g: [35.65, 35.72, 35.89, 36.09, 36.37, 36.69, 37.04, 37.46, 37.93, 38.47, 38.99],
  data: sv(35.89, 'g/100 g water', '20 °C', 'cross-checked', 0.01, [
    { source: 'wikipedia-solubility-table', locator: 'Sodium chloride row, 20 °C', conditions: '20 °C', value: 35.89 },
    { source: 'wikipedia-sodium-chloride', locator: 'saturated 26.4 w% at 20 °C → 35.87 g/100 g', conditions: '20 °C', value: 35.87 },
  ]),
};

/**
 * Freezing point (ice starts to form) of NaCl solutions, °C, by mass fraction.
 * Texas Brine table (°F converted) plus the eutectic from Wikipedia (Brine).
 */
export const NACL_FREEZING: { readonly w: readonly number[]; readonly t: readonly number[]; readonly data: SourcedValue } = {
  w: [0, 0.05, 0.1, 0.15, 0.2, 0.23, 0.233],
  t: [0, -2.94, -6.56, -10.89, -16.44, -20.67, -21.1],
  data: sv(-6.56, '°C', '10 % NaCl', 'single-source', 0.05, [
    { source: 'texasbrine-nacl', locator: '5/10/15/20/23 % rows (26.7, 20.2, 12.4, 2.4, −5.2 °F)', conditions: 'freezing point', value: -6.56 },
    { source: 'wikipedia-brine', locator: 'eutectic −21.1 °C at 23.3 %', conditions: 'eutectic', value: -21.1 },
  ], 'Points between the table rows are interpolated linearly.'),
};

export const NACL_EUTECTIC = { w: 0.233, t: -21.1 } as const;

/**
 * Density of NaCl solutions, kg/m³, by mass fraction (specific gravity at 60 °F × 999 kg/m³).
 */
export const NACL_DENSITY: { readonly w: readonly number[]; readonly rho: readonly number[]; readonly data: SourcedValue } = {
  w: [0, 0.05, 0.1, 0.15, 0.2, 0.23, 0.26],
  rho: [999, 1035, 1073, 1111, 1150, 1175, 1200],
  data: sv(1073, 'kg/m³', '10 % NaCl, 60 °F', 'single-source', 0.01, [{ source: 'texasbrine-nacl', locator: 'specific gravity rows 5…26 %', conditions: '60 °F', value: 1073 }], 'The only table found that covers 0…26 % in one place.'),
};

/**
 * Van 't Hoff factor for Raoult's law: NaCl gives two ions. Real solutions deviate
 * (activity < ideal): the model's boiling point of saturated brine comes out a few
 * degrees low.
 */
const VANT_HOFF = sv(2, '', 'ideal dissociation', 'estimate', 0.15, [{ source: 'spark', locator: 'estimate', conditions: 'ideal solution', range: [1.8, 2] }], 'Ideal value; real concentrated brine behaves as if slightly less.');

/** Linear interpolation in a table (clamped at the ends). */
export function interpolate(xs: readonly number[], ys: readonly number[], x: number): number {
  if (x <= xs[0]!) return ys[0]!;
  for (let i = 1; i < xs.length; i++) {
    if (x <= xs[i]!) {
      const k = (x - xs[i - 1]!) / (xs[i]! - xs[i - 1]!);
      return ys[i - 1]! + k * (ys[i]! - ys[i - 1]!);
    }
  }
  return ys[ys.length - 1]!;
}

/** Saturated mass fraction at temperature t, °C (below 0 °C the 0 °C value is used). */
export const saturationFraction = (t: number): number => {
  const s = interpolate(NACL_SOLUBILITY.t, NACL_SOLUBILITY.gPer100g, t);
  return s / (100 + s);
};

/** Freezing point of a solution with mass fraction w, °C. */
export const freezingPointOf = (w: number): number => interpolate(NACL_FREEZING.w, NACL_FREEZING.t, w);

/** Mass fraction of the liquid that is in equilibrium with ice at t, °C (inverse of the freezing curve). */
export const fractionFreezingAt = (t: number): number => {
  if (t >= 0) return 0;
  if (t <= NACL_EUTECTIC.t) return NACL_EUTECTIC.w;
  return interpolate([...NACL_FREEZING.t].reverse(), [...NACL_FREEZING.w].reverse(), t);
};

export const solutionDensity = (w: number): number => interpolate(NACL_DENSITY.w, NACL_DENSITY.rho, w);

/**
 * Electrical conductivity of NaCl solutions at 20 °C, S/m, by mass fraction (CRC table in mS/cm ÷ 10).
 * Cross-check: interpolated at 3.5 % (sea water) it gives 5.0 S/m; Wikipedia: sea water ≈ 50 mS/cm.
 */
export const NACL_CONDUCTIVITY: { readonly w: readonly number[]; readonly kappa: readonly number[]; readonly data: SourcedValue; readonly tempCoeff: SourcedValue } = {
  w: [0, 0.005, 0.01, 0.02, 0.05, 0.1, 0.15, 0.2, 0.25],
  kappa: [0, 0.82, 1.6, 3.02, 7.01, 12.6, 17.1, 20.4, 22.2],
  data: sv(5.0, 'S/m', '≈ 3.5 % NaCl (sea water), 20 °C', 'cross-checked', 0.05, [
    cite('crc-electrical-conductivity', 'NaCl row, interpolated between 2 % (30.2 mS/cm) and 5 % (70.1 mS/cm)', '20 °C', 5.015),
    cite('wikipedia-conductivity-electrolytic', 'sea water is about 50 mS/cm', 'not stated', 5.0),
  ], 'Sea water is not pure NaCl, but its salts are mostly NaCl, so the two agree.'),
  tempCoeff: sv(0.0212, '1/K', 'NaCl solutions, 5–45 °C', 'cross-checked', 0.07, [
    cite('ricca-nacl-conductivity', 'conductivity change constant 2.12 %/°C', '5–45 °C', 0.0212),
    cite('wikipedia-conductivity-electrolytic', 'linear increase of typically 2 % per kelvin', 'not stated', 0.02),
  ], 'Linear rule; above 45 °C the model extrapolates it (an approximation).'),
};

export const NACL_SOLUTE: SoluteModel = {
  saturationFraction,
  freezingPointOf,
  fractionFreezingAt,
  eutectic: NACL_EUTECTIC,
  solutionDensity,
  vantHoff: VANT_HOFF,
  data: [NACL_SOLUBILITY.data, NACL_FREEZING.data, NACL_DENSITY.data, NACL_CONDUCTIVITY.data],
  conductivityAt20: (w) => interpolate(NACL_CONDUCTIVITY.w, NACL_CONDUCTIVITY.kappa, w),
  conductivityTempCoeff: NACL_CONDUCTIVITY.tempCoeff,
  electrolysis: {
    voltage: sv(2.19, 'V', 'NaCl solution: chlorine + hydrogen', 'single-source', 0.01, [cite('wikipedia-standard-electrode-potentials', '1.36 V (Cl₂/Cl⁻) − (−0.8277 V) (2H₂O/H₂ + 2OH⁻)', '298.15 K, standard conditions', 2.1877)], 'Thermodynamic minimum from standard potentials; real cells need more because of overpotentials.'),
    cathode: { component: 'hydrogen', electrons: 2 },
    anode: { component: 'chlorine', electrons: 2 },
    note: {
      uk: 'Під струмом солона вода розкладається: на катоді виділяється водень, на аноді — хлор, а в розчині лишається натрієвий луг (NaOH): 2NaCl + 2H₂O → Cl₂ + H₂ + 2NaOH.',
      en: 'Under current salt water decomposes: hydrogen forms at the cathode, chlorine at the anode, and caustic soda (NaOH) stays in the solution: 2NaCl + 2H₂O → Cl₂ + H₂ + 2NaOH.',
    },
  },
};

export const SODIUM_CHLORIDE = {
  id: 'sodium-chloride',
  kind: 'compound',
  group: 'salt',
  name: { uk: 'Хлорид натрію (кухонна сіль)', en: 'Sodium chloride (table salt)' },
  gender: 'm',
  formula: 'NaCl',
  composition: { Na: 1, Cl: 1 },
  wikidata: 'Q2314',
  stateAtRoom: 'solid',
  phases: {
    solid: {
      density: sv(2170, 'kg/m³', 'solid', 'cross-checked', 0.01, [cite('wikipedia-sodium-chloride', 'Infobox: density', 'solid', 2170), cite('wikidata', 'Q2314 P2054', 'not stated', 2165)]),
      /** 50.5 J/(K·mol) ÷ 0.05844 kg/mol. */
      specificHeat: sv(864, 'J/(kg·K)', 'solid, 25 °C', 'single-source', 0.01, [cite('wikipedia-sodium-chloride', 'Infobox: heat capacity 50.5 J/(K·mol)', '25 °C', 864.1)], 'Wikidata has no heat capacity for NaCl; Second source not checked yet.'),
    },
  },
  melting: { point: sv(800.7, '°C', '1 atm', 'cross-checked', 0.001, [cite('wikipedia-sodium-chloride', 'Infobox: melting point', '—', 800.7), cite('wikidata', 'Q2314 P2101', '—', 800.8)]) },
  boiling: { point: sv(1465, '°C', '1 atm', 'single-source', 0.01, [cite('wikidata', 'Q2314 P2102', '101.325 kPa', 1465)], 'Wikidata also lists 1413 °C without conditions.') },
  inWater: { solubility: NACL_SOLUBILITY.data, model: NACL_SOLUTE, ions: ['Na⁺', 'Cl⁻'] },
  electrical: { conducts: 'ions-in-solution' },
  magnetic: 'diamagnetic',
  description: {
    novice: {
      uk: 'Хлорид натрію (NaCl) — звичайна сіль. Добре розчиняється у воді: у 100 г води — до ≈ 36 г. Якщо солі більше, решта лежить на дні кристалами.',
      en: 'Sodium chloride (NaCl) — ordinary salt. It dissolves well in water: up to ≈ 36 g in 100 g of water. Any more stays on the bottom as crystals.',
    },
    school: {
      uk: 'Розчинність NaCl майже не залежить від температури: ≈ 35,7 г на 100 г води при 0 °C і ≈ 39 г при 100 °C. Тому сіль зручно добувати випарюванням, а не охолодженням. У воді сіль розпадається на йони Na⁺ і Cl⁻ — тому солона вода проводить струм.',
      en: 'The solubility of NaCl barely depends on temperature: ≈ 35.7 g per 100 g of water at 0 °C and ≈ 39 g at 100 °C. So salt is obtained by evaporation rather than by cooling. In water salt splits into Na⁺ and Cl⁻ ions — that is why salt water conducts electricity.',
    },
  },
  media: [],
} as const satisfies Component;
