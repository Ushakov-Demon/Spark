import { MATERIALS } from './materials.js';
import type { SourcedValue } from '../../knowledge/types.js';

/**
 * Evaporation from a free liquid surface (below the boiling point).
 *
 *   ṁ = h_m · A · (ρ_v,sat(T_surface) − ρ_v,air)      — mass per second leaving as vapour
 *   h_m = h / (ρ_air · c_p,air · Le^(2/3))             — Chilton–Colburn analogy
 *   ρ_v = p · M / (R · T)                              — vapour as an ideal gas
 *
 * Each kilogram takes its latent heat along, which is why a hot open pot loses
 * so much heat — and why a lid (vapour condenses on it and returns) helps.
 * Serializable parameters only: the scene stays plain JSON.
 */
export type VaporPressureModel =
  | { readonly kind: 'buck' } // water, kPa, °C
  | { readonly kind: 'antoine'; readonly A: number; readonly B: number; readonly C: number }; // log10 P(mmHg), °C

export interface EvaporationParams {
  readonly molarMass: number; // kg/mol
  readonly vaporPressure: VaporPressureModel;
  /** Latent heat, J/kg: a constant, or linear between two points (T in K). */
  readonly latent: number | { readonly t1: number; readonly l1: number; readonly t2: number; readonly l2: number };
}

const sv = (value: number, unit: string, conditions: string, citations: SourcedValue['citations'], verification: SourcedValue['verification'] = 'single-source', note?: string): SourcedValue => ({
  value,
  unit,
  conditions,
  verification,
  tolerance: verification === 'estimate' ? 0.5 : 0.001,
  citations,
  ...(note === undefined ? {} : { note }),
});

export const GAS_CONSTANT = sv(8.31446261815324, 'J/(K·mol)', 'exact (SI 2019)', [{ source: 'wikipedia-density-of-air', locator: 'Dry air: molar gas constant', conditions: '—', value: 8.31446261815324 }], 'single-source', 'Exact by definition of the SI units.');
export const AIR_DENSITY = sv(1.2041, 'kg/m³', 'dry air, 20 °C, 101.325 kPa', [{ source: 'wikipedia-density-of-air', locator: 'Dry air at 20 °C', conditions: '20 °C, 101.325 kPa', value: 1.2041 }], 'single-source', 'Taken constant; colder air is denser.');
/** Le^(2/3) for water vapour in air; Le ≈ 0.85. */
export const LEWIS_FACTOR = sv(0.9, '', 'water vapour in air', [{ source: 'spark', locator: 'estimate', conditions: 'Le ≈ 0.8–0.9', range: [0.86, 0.93] }], 'estimate', 'Lewis number of water vapour in air is close to 1; the analogy itself is an approximation for a still surface.');

const ZERO_C = 273.15;

/** Saturation vapour pressure, Pa. */
export function saturationPressure(model: VaporPressureModel, temperatureK: number): number {
  const t = temperatureK - ZERO_C;
  if (model.kind === 'buck') return 1000 * 0.61121 * Math.exp((18.678 - t / 234.5) * (t / (257.14 + t)));
  return 133.322 * 10 ** (model.A - model.B / (model.C + t));
}

/** Saturated vapour density, kg/m³. */
export const saturationDensity = (p: EvaporationParams, temperatureK: number): number =>
  (saturationPressure(p.vaporPressure, temperatureK) * p.molarMass) / (GAS_CONSTANT.value * temperatureK);

export function latentAt(p: EvaporationParams, temperatureK: number): number {
  if (typeof p.latent === 'number') return p.latent;
  const { t1, l1, t2, l2 } = p.latent;
  return l1 + ((l2 - l1) * (temperatureK - t1)) / (t2 - t1);
}

/** Mass transfer coefficient from the heat transfer coefficient, m/s. */
export const massTransferCoefficient = (h: number): number => h / (AIR_DENSITY.value * MATERIALS.air.specificHeat.value * LEWIS_FACTOR.value);
