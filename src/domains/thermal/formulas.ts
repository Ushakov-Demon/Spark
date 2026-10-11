/**
 * Pure physics formulas of heat transfer, as taught in school (7–8 grade).
 * No state, no entities — trivially testable and reusable in hints/tooltips
 * ("Q = m·c·ΔT = 1 kg · 4186 · 80 K = 335 kJ").
 */
import {
  heatCapacity,
  joules,
  kelvin,
  seconds,
  thermalConductance,
  watts,
  type HeatCapacity,
  type HeatTransferCoeff,
  type Joules,
  type Kelvin,
  type Kilograms,
  type Meters,
  type Seconds,
  type SpecificHeat,
  type SquareMeters,
  type ThermalConductance,
  type ThermalConductivity,
  type Watts,
} from '../../core/units.js';

/** C = m·c */
export const heatCapacityOf = (m: Kilograms, c: SpecificHeat): HeatCapacity => heatCapacity(m * c);

/** Q = m·c·ΔT — heat needed to change temperature by ΔT. */
export const heatForTemperatureChange = (m: Kilograms, c: SpecificHeat, dT: number): Joules =>
  joules(m * c * dT);

/** Fourier's law for a slab/rod: G = k·A / L */
export const conductionConductance = (k: ThermalConductivity, area: SquareMeters, length: Meters): ThermalConductance => {
  if (!(length > 0)) throw new RangeError('Conduction length must be > 0');
  return thermalConductance((k * area) / length);
};

/** Newton's law of cooling: G = h·A */
export const convectionConductance = (h: HeatTransferCoeff, area: SquareMeters): ThermalConductance =>
  thermalConductance(h * area);

/** P = G·(Ta − Tb): heat flow from a to b, W. Positive when a is hotter. */
export const heatFlow = (g: ThermalConductance, ta: Kelvin, tb: Kelvin): Watts => watts(g * (ta - tb));

/** τ = C / G — time constant of exponential cooling. */
export const timeConstant = (c: HeatCapacity, g: ThermalConductance): Seconds => seconds(c / g);

/**
 * Analytic Newton cooling: T(t) = T_env + (T0 − T_env)·e^(−t/τ).
 * Used as ground truth in tests and as the "theory" curve in the UI.
 */
export const newtonCooling = (t0: Kelvin, tEnv: Kelvin, tau: Seconds, t: Seconds): Kelvin =>
  kelvin(tEnv + (t0 - tEnv) * Math.exp(-t / tau));

/** Heat balance equation: final temperature of bodies brought into contact (no losses). */
export function equilibriumTemperature(
  bodies: readonly { readonly mass: Kilograms; readonly specificHeat: SpecificHeat; readonly temperature: Kelvin }[],
): Kelvin {
  let sumC = 0;
  let sumCT = 0;
  for (const b of bodies) {
    const c = b.mass * b.specificHeat;
    sumC += c;
    sumCT += c * b.temperature;
  }
  if (sumC <= 0) throw new RangeError('Total heat capacity must be > 0');
  return kelvin(sumCT / sumC);
}
