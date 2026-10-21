import type { SubstanceItem } from '../../substances/types.js';
import { bodyEnergy, bodyMass, type ThermalBody } from './entities.js';
import { equilibriumAt, mixtureEnthalpy, solubilityAt, soluteBehaviour, solutesOf, type SoluteInput } from './mixture.js';

/**
 * Dissolving: one rule for every way a soluble substance meets water. Salt or sugar poured into
 * water, water poured onto dry salt, a lump dropped in, a solution added to another — whatever the
 * order, form or how many substances, they become one body of water with things in it, and each
 * component's own solubility decides how much stays dissolved: the rest lies on the bottom as
 * crystals and dissolves by itself later if the water gets warmer or more water is added (the body
 * keeps its equilibrium every step). What does not dissolve (a metal, chalk, oil) stays a piece.
 * Melting needs no rule of its own: the solver melts any body with phase data from its energy.
 */

/** Can it be part of a water solution: water itself, a solution recipe, or a component with data for dissolving. */
export const inWaterFamily = (s: SubstanceItem): boolean => s.id === 'water' || s.mixture !== undefined || (!!s.component && soluteBehaviour(s.component) !== undefined);

/** Water + what is in it, in the terms of the solution model, with the energy they hold. */
export interface SolutionPart {
  readonly water: number;
  readonly solutes: readonly { readonly component: string; readonly mass: number }[];
  readonly energy: number;
}

/** The solutes of a recipe (water + salt) or of a single dissolving component, per kg of the portion. */
function partsOf(sub: SubstanceItem, mass: number): { water: number; solutes: { component: string; mass: number }[] } | null {
  if (sub.id === 'water') return { water: mass, solutes: [] };
  if (sub.mixture) {
    const w = sub.mixture.saltFraction;
    return { water: mass * (1 - w), solutes: w > 0 ? [{ component: 'sodium-chloride', mass: mass * w }] : [] };
  }
  if (sub.component && soluteBehaviour(sub.component)) return { water: 0, solutes: [{ component: sub.component, mass }] };
  return null;
}

/** A body of the vessel as part of a solution: water, a solution, or a dry soluble substance (null — something else). */
export function bodyAsSolution(body: ThermalBody, sub: SubstanceItem): SolutionPart | null {
  const mix = 'mixture' in body.state ? body.state.mixture : undefined;
  if (mix) return { water: mix.water, solutes: solutesOf(mix) as SolutionPart['solutes'], energy: bodyEnergy(body) };
  if (sub.id === 'water') return { water: bodyMass(body), solutes: [], energy: bodyEnergy(body) };
  const parts = partsOf(sub, bodyMass(body));
  if (!parts || parts.water > 0) return null;
  // A dry substance keeps its own enthalpy reference (its melt); here it is the same state re-expressed.
  const T = body.state.temperature;
  return { ...parts, energy: mixtureEnthalpy(equilibriumAt(0, parts.solutes, T), T) };
}

/** A portion being added (kg at K) as part of a solution, or null if it does not go into water solutions. */
export function portionAsSolution(sub: SubstanceItem, mass: number, temperature: number): SolutionPart | null {
  const parts = partsOf(sub, mass);
  if (!parts) return null;
  // At its own temperature: frozen water is ice, salt below the eutectic is crystals — the model knows.
  const amounts = equilibriumAt(parts.water, parts.solutes, temperature);
  return { ...parts, energy: mixtureEnthalpy(amounts, temperature) };
}

/** Two parts together: water adds up, the same solute adds up. */
export function mergeParts(a: SolutionPart, b: SolutionPart): SolutionPart & { readonly input: SoluteInput } {
  const solutes = [...a.solutes.map((s) => ({ ...s }))];
  for (const s of b.solutes) {
    const same = solutes.find((x) => x.component === s.component);
    if (same) same.mass += s.mass;
    else solutes.push({ ...s });
  }
  return { water: a.water + b.water, solutes, energy: a.energy + b.energy, input: solutes };
}

/** Saturated: grams of a solute that 100 g of water dissolves at t, °C (for the hint "heat it" or "add water"). */
export const solubilityPer100 = (t: number, component = 'sodium-chloride'): number => solubilityAt(component, t);
