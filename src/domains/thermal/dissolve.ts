import { NACL_SOLUTE } from '../../components/index.js';
import type { SubstanceItem } from '../../substances/types.js';
import { bodyEnergy, bodyMass, type ThermalBody } from './entities.js';
import { equilibriumAt, mixtureEnthalpy } from './mixture.js';

/**
 * Dissolving: one rule for every way a soluble substance meets its solvent. Salt poured into
 * water, water poured onto dry salt, a lump of salt dropped in, brine added to water — whatever
 * the order or the form, they become one water + salt body, and the solute model decides how
 * much stays dissolved: the rest lies on the bottom as crystals and dissolves by itself later if
 * the water gets warmer or more water is added (the mixture body keeps the equilibrium every step).
 * Melting needs no rule of its own: the solver melts any body with phase data from its energy.
 */

/** Water, its salt solutions, and salt itself: the substances the water + salt model takes. */
export const inSaltWater = (s: SubstanceItem): boolean => s.id === 'water' || s.mixture !== undefined;

/** Water + salt in the terms of the solution model, with the energy they hold (0 °C liquid water, solid salt reference). */
export interface SolutionPart {
  readonly water: number;
  readonly salt: number;
  readonly energy: number;
}

/** A body of the vessel as part of a solution: water, brine, or dry salt (null — something else, like oil). */
export function bodyAsSolution(body: ThermalBody, sub: SubstanceItem): SolutionPart | null {
  const mix = 'mixture' in body.state ? body.state.mixture : undefined;
  if (mix) return { water: mix.water, salt: mix.salt, energy: bodyEnergy(body) };
  if (sub.id === 'water') return { water: bodyMass(body), salt: 0, energy: bodyEnergy(body) };
  // Dry salt keeps its own enthalpy reference (molten salt); here it is the same state re-expressed.
  if (sub.mixture && sub.category.startsWith('solid.')) {
    const m = bodyMass(body);
    const T = body.state.temperature;
    return { water: 0, salt: m, energy: mixtureEnthalpy(equilibriumAt(0, m, T), T) };
  }
  return null;
}

/** A portion being added (kg at K) as part of a solution, or null if it is not water, brine or salt. */
export function portionAsSolution(sub: SubstanceItem, mass: number, temperature: number): SolutionPart | null {
  if (!inSaltWater(sub)) return null;
  const w = sub.mixture?.saltFraction ?? 0;
  // At its own temperature: frozen water is ice, salt below the eutectic is crystals — the model knows.
  const amounts = equilibriumAt(mass * (1 - w), mass * w, temperature);
  return { water: amounts.water, salt: amounts.salt, energy: mixtureEnthalpy(amounts, temperature) };
}

/** Saturated: grams of salt that 100 g of water dissolves at t, °C (for the hint "heat it" or "add water"). */
export const solubilityPer100 = (t: number): number => {
  const w = NACL_SOLUTE.saturationFraction(t);
  return (100 * w) / (1 - w);
};
