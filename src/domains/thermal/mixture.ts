import { ZERO_CELSIUS_IN_KELVIN } from '../../core/units.js';
import { molarMassOf } from '../../components/elements.js';
import { COMPONENTS, type Component, type ComponentId, type SoluteModel } from '../../components/index.js';
import { saturationPressure, type VaporPressureModel } from './evaporation.js';

/**
 * Water with anything in it, as one body with a changing composition: a solution is not a model
 * of its own but a list of components with their masses. Everything follows from the components'
 * data and general laws:
 *
 *  - how much of each dissolves — its own solubility in water at that temperature (the rest lies
 *    as crystals); a liquid that mixes with water in any proportion never crystallises;
 *  - where the water starts to freeze — the freezing-point depression by all dissolved particles
 *    (Blagden's law, ΔT = K_f · Σ i·b); as ice forms the rest gets more concentrated and freezes
 *    colder, down to where it is saturated (the eutectic) and everything sets;
 *  - the boiling point — Raoult's law: the dissolved particles lower the vapour pressure of water;
 *  - the heat — the sum of the components' own heat capacities and latent heats.
 *
 * Where a component carries measured data for its solutions with water (salt: the freezing curve,
 * the eutectic, densities, conductivity), those are used instead of the general law — measured pair
 * data only where the general law is not good enough. With several solutes the general law is used.
 *
 * Enthalpy is measured from liquid water and the solutes as they are at room temperature (solid
 * salt, liquid alcohol) at 0 °C; the heat of dissolution is not counted (small for NaCl).
 */

/** One dissolved (or undissolved) component: its total mass and the part lying as crystals, kg. */
export interface SoluteMass {
  readonly component: string;
  readonly mass: number;
  readonly crystals: number;
}

export interface MixtureAmounts {
  /** All H₂O in the body (liquid + ice), kg. */
  readonly water: number;
  readonly ice: number;
  /** What is in the water. */
  readonly solutes: readonly SoluteMass[];
  /** Sum over the solutes: all of them, kg (for readers that only need "how much is in the water"). */
  readonly salt: number;
  /** Sum over the solutes: the part lying as crystals, kg. */
  readonly crystals: number;
}

/** What goes into a solution: a list of components and masses, or — shorthand — kilograms of table salt. */
export type SoluteInput = number | readonly { readonly component: string; readonly mass: number }[];

const NACL = 'sodium-chloride';
const T0 = ZERO_CELSIUS_IN_KELVIN;
const WATER = COMPONENTS.water;
const CW = WATER.phases.liquid!.specificHeat!.value;
const CI = WATER.phases.solid!.specificHeat!.value;
const LF = WATER.melting!.latentHeat!.value;
const M_WATER = molarMassOf(WATER.composition!);
const P_ATM = 101_325;

/** Cryoscopic constant of water, K·kg/mol (Blagden's law). */
export const WATER_KF = WATER.solvent?.cryoscopic.value ?? 1.86;

/** How a component behaves in water: from its own data. */
interface Behaviour {
  readonly component: Component;
  /** Measured solution data (salt), if any. */
  readonly measured?: SoluteModel;
  /** Saturated mass fraction (solute / solution) at t °C; Infinity — mixes in any proportion. */
  saturation(t: number): number;
  /** Particles per formula unit in solution (NaCl → 2). */
  readonly particles: number;
  readonly molarMass: number;
  /** Heat capacity as it is at room temperature (solid salt, liquid alcohol), J/(kg·K). */
  readonly c: number;
  /** Density as it is at room temperature, kg/m³ (for volumes of solutions without measured data). */
  readonly density: number;
  /** Enthalpy of solution per kilogram dissolved, J/kg (0 — not counted). */
  readonly hSolution: number;
}

const behaviours = new Map<string, Behaviour>();

/** The component's behaviour in water, or undefined if it has no data for dissolving. */
export function soluteBehaviour(id: string): Behaviour | undefined {
  const cached = behaviours.get(id);
  if (cached) return cached;
  const c = COMPONENTS[id as ComponentId];
  const w = c?.inWater;
  if (!c || !w || w.solubility === 'immiscible') return undefined;
  const main = c.stateAtRoom === 'liquid' ? c.phases.liquid : c.phases.solid;
  const molarMass = c.composition ? molarMassOf(c.composition) : undefined;
  if (!main?.specificHeat || !main.density || !molarMass) return undefined;
  const table = w.solubilityTable;
  const saturation = w.model
    ? w.model.saturationFraction
    : w.solubility === 'miscible'
      ? () => Infinity
      : table
        ? (t: number) => {
            const g = interpolate(table.t, table.gPer100g, t);
            return g / (100 + g);
          }
        : (() => {
            const g = (w.solubility as { value: number }).value;
            return () => g / (100 + g);
          })();
  const b: Behaviour = {
    component: c,
    ...(w.model ? { measured: w.model } : {}),
    saturation,
    particles: w.model?.vantHoff.value ?? w.particles ?? (w.ions?.length || 1),
    molarMass,
    c: main.specificHeat.value,
    density: main.density.value,
    hSolution: w.enthalpyOfSolution ? (w.enthalpyOfSolution.value * 1000) / molarMass : 0,
  };
  behaviours.set(id, b);
  return b;
}

function interpolate(xs: readonly number[], ys: readonly number[], x: number): number {
  if (x <= xs[0]!) return ys[0]!;
  for (let i = 1; i < xs.length; i++) {
    if (x <= xs[i]!) return ys[i - 1]! + ((ys[i]! - ys[i - 1]!) * (x - xs[i - 1]!)) / (xs[i]! - xs[i - 1]!);
  }
  return ys[ys.length - 1]!;
}

const list = (s: SoluteInput): readonly { component: string; mass: number }[] => (typeof s === 'number' ? (s > 0 ? [{ component: NACL, mass: s }] : []) : s.filter((x) => x.mass > 0));

/** Build amounts with their sums. */
export function amountsOf(water: number, ice: number, solutes: readonly SoluteMass[]): MixtureAmounts {
  let salt = 0;
  let crystals = 0;
  for (const s of solutes) {
    salt += s.mass;
    crystals += s.crystals;
  }
  return { water, ice, solutes, salt, crystals };
}

/** The only solute, if there is exactly one and it has measured data with water (salt). */
const measuredSingle = (solutes: readonly { component: string }[]): SoluteModel | undefined =>
  solutes.length === 1 ? soluteBehaviour(solutes[0]!.component)?.measured : undefined;

export function mixtureEnthalpy(m: MixtureAmounts, temperature: number): number {
  const t = temperature - T0;
  let h = (m.water - m.ice) * CW * t + m.ice * (-LF + CI * t);
  for (const s of m.solutes) {
    const b = soluteBehaviour(s.component);
    // The dissolved part holds its enthalpy of solution as well: dissolving takes it from the solution (or gives it), crystallising gives it back.
    h += s.mass * (b?.c ?? CW) * t + (s.mass - s.crystals) * (b?.hSolution ?? 0);
  }
  return h;
}

/** Heat capacity of the body right now, J/K (for the stability limit). */
export function mixtureHeatCapacity(m: MixtureAmounts): number {
  let c = (m.water - m.ice) * CW + m.ice * CI;
  for (const s of m.solutes) c += s.mass * (soluteBehaviour(s.component)?.c ?? CW);
  return c;
}

/** Dissolved amounts for so much liquid water at t °C (the rest crystallises). */
function dissolvedIn(liquidWater: number, solutes: readonly { component: string; mass: number }[], t: number): number[] {
  return solutes.map((s) => {
    const ws = soluteBehaviour(s.component)?.saturation(Math.max(t, 0)) ?? 0;
    if (!Number.isFinite(ws)) return s.mass;
    return Math.min(s.mass, liquidWater > 0 ? (ws / (1 - ws)) * liquidWater : 0);
  });
}

/** Ice and crystals in equilibrium at temperature T for given totals. */
export function equilibriumAt(water: number, input: SoluteInput, temperature: number): MixtureAmounts {
  const solutes = list(input);
  const t = temperature - T0;
  const done = (ice: number, liquid: number) => {
    const dissolved = dissolvedIn(liquid, solutes, t);
    return amountsOf(water, ice, solutes.map((s, i) => ({ component: s.component, mass: s.mass, crystals: Math.max(0, Math.min(s.mass, s.mass - dissolved[i]!)) })));
  };
  const measured = measuredSingle(solutes);
  if (measured) {
    // Measured curves (salt): the freezing curve and the eutectic, as before.
    const salt = solutes[0]!.mass;
    if (t < measured.eutectic.t) return amountsOf(water, water, [{ component: solutes[0]!.component, mass: salt, crystals: salt }]);
    let ice = 0;
    if (t < 0) {
      const wf = measured.fractionFreezingAt(t);
      const liquidWater = wf > 0 ? (salt * (1 - wf)) / wf : 0;
      if (liquidWater < water) ice = water - liquidWater;
    }
    return done(ice, water - ice);
  }
  if (t >= 0 || water <= 0) return done(0, water);
  // Blagden's law: liquid water m is in equilibrium with ice at t when the dissolved particles
  // lower its freezing point to t: m = K_f · Σ i·n_dissolved(m) / (−t).
  const g = (m: number) => {
    const d = dissolvedIn(m, solutes, t);
    let particles = 0;
    solutes.forEach((s, i) => {
      const b = soluteBehaviour(s.component);
      if (b) particles += (b.particles * d[i]!) / b.molarMass;
    });
    return (WATER_KF * particles) / -t;
  };
  if (g(water) >= water) return done(0, water); // still above its freezing point
  // g(m)/m falls as m grows: find where it is 1 (none — below the eutectic: everything sets).
  let lo = 0;
  let hi = water;
  const ratio = (m: number) => g(m) / m;
  if (!(ratio(water * 1e-9) >= 1)) return amountsOf(water, water, solutes.map((s) => ({ component: s.component, mass: s.mass, crystals: Number.isFinite(soluteBehaviour(s.component)?.saturation(0) ?? 0) ? s.mass : 0 })));
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (ratio(mid) >= 1) lo = mid;
    else hi = mid;
  }
  const liquid = (lo + hi) / 2;
  return done(water - liquid, liquid);
}

const enthalpyAt = (water: number, input: SoluteInput, temperature: number) => mixtureEnthalpy(equilibriumAt(water, input, temperature), temperature);

/** Lowest temperature anything here can still be liquid at, K (the eutectic, or well below for alcohol). */
function lowestLiquid(input: SoluteInput): number {
  const measured = measuredSingle(list(input));
  return T0 + (measured ? measured.eutectic.t : -120);
}

/**
 * Temperature and phases from total enthalpy H. H(T) only grows with T but has jumps (melting of
 * pure ice at 0 °C, the eutectic): inside a jump the temperature stays put and the amounts are
 * interpolated — that is the plateau.
 */
export function decodeMixture(h: number, water: number, input: SoluteInput): { temperature: number; amounts: MixtureAmounts } {
  let lo = lowestLiquid(input) - 200;
  let hi = T0 + 1500;
  if (h <= enthalpyAt(water, input, lo)) return { temperature: lo, amounts: equilibriumAt(water, input, lo) };
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (enthalpyAt(water, input, mid) < h) lo = mid;
    else hi = mid;
  }
  const eps = 1e-6;
  const left = equilibriumAt(water, input, lo - eps);
  const right = equilibriumAt(water, input, hi + eps);
  const hl = mixtureEnthalpy(left, lo);
  const hr = mixtureEnthalpy(right, hi);
  if (hr - hl > 1e-6 && h > hl && h < hr) {
    // On a plateau: part of the substance has changed phase.
    const f = (h - hl) / (hr - hl);
    return {
      temperature: (lo + hi) / 2,
      amounts: amountsOf(water, left.ice + f * (right.ice - left.ice), left.solutes.map((s, i) => ({ ...s, crystals: s.crystals + f * (right.solutes[i]!.crystals - s.crystals) }))),
    };
  }
  const temperature = (lo + hi) / 2;
  return { temperature, amounts: equilibriumAt(water, input, temperature) };
}

/** The solutes of a body as an input for the functions above (their totals). */
export const solutesOf = (m: MixtureAmounts): SoluteInput => m.solutes.map((s) => ({ component: s.component, mass: s.mass }));

/** Mole fraction of water in the liquid (dissolved solutes counted as particles: NaCl → 2). */
export function waterMoleFraction(m: MixtureAmounts): number {
  const nw = (m.water - m.ice) / M_WATER;
  let ns = 0;
  for (const s of m.solutes) {
    const b = soluteBehaviour(s.component);
    if (b) ns += ((s.mass - s.crystals) / b.molarMass) * b.particles;
  }
  return nw <= 0 ? 0 : nw / (nw + ns);
}

/**
 * A component that evaporates (water, alcohol, vinegar): its vapour pressure — its own equation if it
 * has one, else the Clausius–Clapeyron law from its boiling point and latent heat — and latent heat.
 */
export interface Volatile {
  readonly key: string;
  readonly molarMass: number;
  pressure(T: number): number;
  readonly latent: number;
  /** Heat capacity of the liquid, J/(kg·K) (what leaves with the vapour). */
  readonly c: number;
}
const volatiles = new Map<string, Volatile | null>();
const R = 8.314462618;
export function volatileOf(component: string): Volatile | undefined {
  if (volatiles.has(component)) return volatiles.get(component) ?? undefined;
  const c = COMPONENTS[component as ComponentId];
  let v: Volatile | null = null;
  if (c && c.stateAtRoom === 'liquid' && c.boiling?.latentHeat && c.composition) {
    const M = molarMassOf(c.composition);
    const L = c.boiling.latentHeat.value;
    const Tb = T0 + c.boiling.point.value;
    const model: VaporPressureModel | undefined = c.vapour?.pressure;
    v = {
      key: component,
      molarMass: M,
      pressure: model ? (T) => saturationPressure(model, T) : (T) => P_ATM * Math.exp(((-L * M) / R) * (1 / T - 1 / Tb)),
      latent: L,
      c: c.phases.liquid?.specificHeat?.value ?? CW,
    };
  }
  volatiles.set(component, v);
  return v ?? undefined;
}

/** Water as a volatile component. */
const WATER_VOLATILE: Volatile = { key: 'water', molarMass: M_WATER, pressure: (T) => saturationPressure({ kind: 'buck' }, T), latent: WATER.boiling!.latentHeat!.value, c: CW };

/**
 * The liquid's volatile components with their mole fractions (all dissolved particles counted): Raoult's
 * law gives each its partial vapour pressure x·p(T).
 */
export function liquidVolatiles(m: MixtureAmounts): { readonly v: Volatile; readonly x: number; readonly mass: number }[] {
  const nw = Math.max(0, m.water - m.ice) / M_WATER;
  let n = nw;
  const parts: { v: Volatile; moles: number; mass: number }[] = nw > 0 ? [{ v: WATER_VOLATILE, moles: nw, mass: m.water - m.ice }] : [];
  for (const s of m.solutes) {
    const b = soluteBehaviour(s.component);
    if (!b) continue;
    const dissolved = s.mass - s.crystals;
    n += (dissolved / b.molarMass) * b.particles;
    const v = volatileOf(s.component);
    if (v && dissolved > 0) parts.push({ v, moles: dissolved / b.molarMass, mass: dissolved });
  }
  if (!(n > 0)) return [];
  // A measured non-ideal pair with water (alcohol): van Laar activity coefficients for the two of them.
  const gamma = new Map<string, number>();
  for (const p of parts) {
    const a = p.v.key === 'water' ? undefined : COMPONENTS[p.v.key as ComponentId]?.inWater?.activityWithWater;
    if (!a || !(nw > 0)) continue;
    const x1 = p.moles / (p.moles + nw);
    const x2 = 1 - x1;
    const d = a.self * x1 + a.water * x2;
    gamma.set(p.v.key, Math.exp(a.self * ((a.water * x2) / d) ** 2));
    gamma.set('water', Math.exp(a.water * ((a.self * x1) / d) ** 2));
  }
  return parts.map((p) => ({ v: p.v, x: (p.moles / n) * (gamma.get(p.v.key) ?? 1), mass: p.mass }));
}

/** Total vapour pressure over the liquid at T, Pa (Raoult's law, ideal mixing). */
export const vapourPressure = (m: MixtureAmounts, T: number): number => liquidVolatiles(m).reduce((a, p) => a + p.x * p.v.pressure(T), 0);

/** Boiling point of the liquid part, K (where the vapour pressure reaches 1 atm), or Infinity if nothing in it boils. */
export function mixtureBoilingPoint(m: MixtureAmounts): number {
  if (!liquidVolatiles(m).length) return Infinity;
  let lo = T0 - 50;
  let hi = T0 + 400;
  if (vapourPressure(m, hi) < P_ATM) return Infinity;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (vapourPressure(m, mid) < P_ATM) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** What boils off at T: each volatile component's share of the vapour, by moles (y = x·p / Σ x·p). */
export function vapourComposition(m: MixtureAmounts, T: number): { readonly v: Volatile; readonly y: number; readonly mass: number }[] {
  const parts = liquidVolatiles(m);
  const total = parts.reduce((a, p) => a + p.x * p.v.pressure(T), 0);
  return total > 0 ? parts.map((p) => ({ v: p.v, y: (p.x * p.v.pressure(T)) / total, mass: p.mass })) : [];
}

/** Concentration of the liquid part (mass fraction of everything dissolved). */
export function liquidConcentration(m: MixtureAmounts): number {
  const liquid = m.water - m.ice;
  const dissolved = m.salt - m.crystals;
  return liquid + dissolved > 0 ? dissolved / (liquid + dissolved) : 0;
}

/**
 * Density of the liquid part, kg/m³: measured for a single solute that has a table (salt), otherwise
 * by adding up volumes (an approximation: real solutions are a little denser).
 */
export function solutionDensity(m: MixtureAmounts): number {
  const measured = measuredSingle(m.solutes);
  if (measured) return measured.solutionDensity(liquidConcentration(m));
  const liquid = m.water - m.ice;
  const rw = WATER.phases.liquid!.density!.value;
  let mass = liquid;
  let volume = liquid / rw;
  for (const s of m.solutes) {
    const b = soluteBehaviour(s.component);
    const d = s.mass - s.crystals;
    mass += d;
    volume += d / (b?.density ?? rw);
  }
  return volume > 0 ? mass / volume : rw;
}

/** A solution's freezing point (ice starts to form), °C — measured for salt, Blagden's law otherwise. */
export function solutionFreezingPoint(input: SoluteInput, water: number): number {
  const solutes = list(input);
  const measured = measuredSingle(solutes);
  const total = solutes.reduce((a, s) => a + s.mass, 0);
  if (measured) return measured.freezingPointOf(total / (total + water));
  let particles = 0;
  for (const s of solutes) {
    const b = soluteBehaviour(s.component);
    if (b) particles += (b.particles * s.mass) / b.molarMass;
  }
  return water > 0 ? -(WATER_KF * particles) / water : 0;
}

/** The eutectic of a solution: below it everything is solid, °C (measured for salt, else from the curves). */
export function solutionEutectic(input: SoluteInput): number {
  const solutes = list(input);
  const measured = measuredSingle(solutes);
  if (measured) return measured.eutectic.t;
  // Saturated at 0 °C and frozen to it: t_e = −K_f · Σ i·S/M (S per kg of water).
  let t = 0;
  for (const s of solutes) {
    const b = soluteBehaviour(s.component);
    if (!b) continue;
    const ws = b.saturation(0);
    if (!Number.isFinite(ws)) return -120;
    t -= (WATER_KF * b.particles * (ws / (1 - ws))) / b.molarMass;
  }
  return t;
}

export const MIXTURE_CONSTANTS = { CW, CI, LF, T0 } as const;

/** Grams of a component that 100 g of water dissolves at t, °C (Infinity — mixes in any proportion). */
export function solubilityAt(component: string, t: number): number {
  const ws = soluteBehaviour(component)?.saturation(t) ?? 0;
  return Number.isFinite(ws) ? (100 * ws) / (1 - ws) : Infinity;
}
