import { ZERO_CELSIUS_IN_KELVIN } from '../../core/units.js';

/**
 * Phase changes of a lumped body (melting/freezing, boiling).
 *
 * The body stores energy; temperature follows from it. On the melting point the
 * temperature stays put while the solid fraction changes (latent heat of fusion);
 * on the boiling point extra energy turns liquid into vapour, which leaves the
 * body (latent heat of vaporisation) — so a pot left on the stove does boil dry.
 *
 * Specific enthalpy h is measured from the liquid at 0 °C (the same reference
 * as for bodies without phase data):
 *   liquid:         h = c_l·(T − 0 °C)
 *   melting point:  h = c_l·(T_m − 0 °C) − s·L_f        (s — solid fraction)
 *   solid:          h = c_l·(T_m − 0 °C) − L_f + c_s·(T − T_m)
 */
export interface PhaseParams {
  /** Omit for substances whose freezing we have no data for (they stay liquid in the model). */
  readonly meltingPoint?: number; // K
  readonly latentFusion?: number; // J/kg
  readonly specificHeatSolid?: number; // J/(kg·K)
  /** Omit for substances that do not boil (sunflower oil decomposes instead). */
  readonly boilingPoint?: number; // K
  readonly latentVaporization?: number; // J/kg
}

const REF = ZERO_CELSIUS_IN_KELVIN;

export function specificEnthalpy(temperature: number, solidFraction: number, cLiquid: number, phase?: PhaseParams): number {
  if (!phase || !canFreeze(phase)) return cLiquid * (temperature - REF);
  const hMeltLiquid = cLiquid * (phase.meltingPoint - REF);
  if (solidFraction >= 1 && temperature < phase.meltingPoint) return hMeltLiquid - phase.latentFusion + phase.specificHeatSolid * (temperature - phase.meltingPoint);
  if (solidFraction > 0) return hMeltLiquid - solidFraction * phase.latentFusion;
  return cLiquid * (temperature - REF);
}

export interface Decoded {
  readonly temperature: number;
  readonly solidFraction: number;
  /** Energy per kg above "liquid at the boiling point" — to be spent on vaporisation. */
  readonly excess: number;
}

export function decodeEnthalpy(h: number, cLiquid: number, phase?: PhaseParams): Decoded {
  if (!phase) return { temperature: REF + h / cLiquid, solidFraction: 0, excess: 0 };
  if (canFreeze(phase)) {
    const hMeltLiquid = cLiquid * (phase.meltingPoint - REF);
    const hMeltSolid = hMeltLiquid - phase.latentFusion;
    if (h <= hMeltSolid) return { temperature: phase.meltingPoint + (h - hMeltSolid) / phase.specificHeatSolid, solidFraction: 1, excess: 0 };
    if (h < hMeltLiquid) return { temperature: phase.meltingPoint, solidFraction: (hMeltLiquid - h) / phase.latentFusion, excess: 0 };
  }
  if (phase.boilingPoint !== undefined) {
    const hBoil = cLiquid * (phase.boilingPoint - REF);
    if (h > hBoil) return { temperature: phase.boilingPoint, solidFraction: 0, excess: h - hBoil };
  }
  return { temperature: REF + h / cLiquid, solidFraction: 0, excess: 0 };
}

type Freezable = PhaseParams & { readonly meltingPoint: number; readonly latentFusion: number; readonly specificHeatSolid: number };
export const canFreeze = (phase: PhaseParams): phase is Freezable =>
  phase.meltingPoint !== undefined && phase.latentFusion !== undefined && phase.specificHeatSolid !== undefined;

/** Effective heat capacity per kg for the stability limit (the plateau is infinitely "capacious"). */
export const specificHeatAt = (solidFraction: number, cLiquid: number, phase?: PhaseParams): number =>
  phase && canFreeze(phase) && solidFraction >= 1 ? phase.specificHeatSolid : cLiquid;
