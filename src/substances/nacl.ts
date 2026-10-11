import type { SourcedValue } from '../knowledge/types.js';

/**
 * Data for the water–salt (NaCl) system: everything the mixture model needs,
 * each table with its source. Temperatures in °C, mass fractions w = salt / (salt + water).
 */
const sv = (value: number, unit: string, conditions: string, citations: SourcedValue['citations'], verification: SourcedValue['verification'], tolerance: number, note?: string): SourcedValue => ({
  value,
  unit,
  conditions,
  verification,
  tolerance,
  citations,
  ...(note === undefined ? {} : { note }),
});

export const NACL = {
  molarMass: sv(0.05844, 'kg/mol', 'NaCl', [{ source: 'wikipedia-sodium-chloride', locator: 'Infobox: molar mass', conditions: '—', value: 0.05844 }], 'single-source', 0.001),
  density: sv(2170, 'kg/m³', 'solid', [{ source: 'wikipedia-sodium-chloride', locator: 'Infobox: density', conditions: 'solid', value: 2170 }], 'single-source', 0.01),
  /** 50.5 J/(K·mol) ÷ 0.05844 kg/mol. */
  specificHeat: sv(864, 'J/(kg·K)', 'solid, 25 °C', [{ source: 'wikipedia-sodium-chloride', locator: 'Infobox: heat capacity 50.5 J/(K·mol)', conditions: '25 °C', value: 864.1 }], 'single-source', 0.01),
  meltingPoint: sv(800.7, '°C', '1 atm', [{ source: 'wikipedia-sodium-chloride', locator: 'Infobox: melting point', conditions: '—', value: 800.7 }], 'single-source', 0.001),
} as const;

/**
 * Solubility, g of NaCl per 100 g of water, at 0…100 °C (step 10 °C).
 * Cross-check: 35.89 at 20 °C ↔ saturated 26.4 w% (Sodium chloride article).
 */
export const NACL_SOLUBILITY: { readonly t: readonly number[]; readonly gPer100g: readonly number[]; readonly data: SourcedValue } = {
  t: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
  gPer100g: [35.65, 35.72, 35.89, 36.09, 36.37, 36.69, 37.04, 37.46, 37.93, 38.47, 38.99],
  data: sv(35.89, 'g/100 g water', '20 °C', [
    { source: 'wikipedia-solubility-table', locator: 'Sodium chloride row, 20 °C', conditions: '20 °C', value: 35.89 },
    { source: 'wikipedia-sodium-chloride', locator: 'saturated 26.4 w% at 20 °C → 35.87 g/100 g', conditions: '20 °C', value: 35.87 },
  ], 'cross-checked', 0.01),
};

/**
 * Freezing point (ice starts to form) of NaCl solutions, °C, by mass fraction.
 * Texas Brine table (°F converted) plus the eutectic from Wikipedia (Brine).
 */
export const NACL_FREEZING: { readonly w: readonly number[]; readonly t: readonly number[]; readonly data: SourcedValue } = {
  w: [0, 0.05, 0.1, 0.15, 0.2, 0.23, 0.233],
  t: [0, -2.94, -6.56, -10.89, -16.44, -20.67, -21.1],
  data: sv(-6.56, '°C', '10 % NaCl', [
    { source: 'texasbrine-nacl', locator: '5/10/15/20/23 % rows (26.7, 20.2, 12.4, 2.4, −5.2 °F)', conditions: 'freezing point', value: -6.56 },
    { source: 'wikipedia-brine', locator: 'eutectic −21.1 °C at 23.3 %', conditions: 'eutectic', value: -21.1 },
  ], 'single-source', 0.05, 'Points between the table rows are interpolated linearly.'),
};

export const NACL_EUTECTIC = { w: 0.233, t: -21.1 } as const;

/**
 * Density of NaCl solutions, kg/m³, by mass fraction (specific gravity at 60 °F × 999 kg/m³).
 */
export const NACL_DENSITY: { readonly w: readonly number[]; readonly rho: readonly number[]; readonly data: SourcedValue } = {
  w: [0, 0.05, 0.1, 0.15, 0.2, 0.23, 0.26],
  rho: [999, 1035, 1073, 1111, 1150, 1175, 1200],
  data: sv(1073, 'kg/m³', '10 % NaCl, 60 °F', [{ source: 'texasbrine-nacl', locator: 'specific gravity rows 5…26 %', conditions: '60 °F', value: 1073 }], 'single-source', 0.01),
};

/**
 * Van 't Hoff factor for Raoult's law: NaCl gives two ions. Real solutions deviate
 * (activity < ideal): the model's boiling point of saturated brine comes out a few
 * degrees low.
 */
export const VANT_HOFF_NACL = sv(2, '', 'ideal dissociation', [{ source: 'spark', locator: 'estimate', conditions: 'ideal solution', range: [1.8, 2] }], 'estimate', 0.15, 'Ideal value; real concentrated brine behaves as if slightly less.');

/** Average salinity of seawater, used for the "sea water" recipe (as if all salt were NaCl). */
export const SEAWATER_SALINITY = sv(0.035, '', 'ocean average', [{ source: 'wikipedia-seawater', locator: 'Lead: salinity ≈ 3.5 %', conditions: 'average', value: 0.035 }], 'single-source', 0.05, 'About 86 % of sea salt is Na⁺ and Cl⁻; the model treats all of it as NaCl.');

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
