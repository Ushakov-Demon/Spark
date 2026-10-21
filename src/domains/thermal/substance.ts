import { celsius } from '../../core/units.js';
import type { SubstanceItem } from '../../substances/types.js';
import type { EvaporationParams } from './evaporation.js';
import type { PhaseParams } from './phase.js';

/** Thermal view of a catalog substance: liquid heat capacity, density and phase changes (in K). */
export function substanceThermal(s: SubstanceItem): { readonly specificHeat: number; readonly density: number; readonly phase?: PhaseParams; readonly evaporation?: EvaporationParams } {
  // A solid that melts: `liquid` holds the solid's own numbers, the melt comes from `melt`.
  if (s.melt) {
    return {
      specificHeat: s.melt.liquidSpecificHeat.value,
      density: s.liquid.density.value,
      phase: { meltingPoint: celsius(s.melt.point.value), latentFusion: s.melt.latentHeat.value, specificHeatSolid: s.liquid.specificHeat.value },
    };
  }
  const phase: PhaseParams = {
    ...(s.freezing
      ? { meltingPoint: celsius(s.freezing.point.value), latentFusion: s.freezing.latentHeat.value, specificHeatSolid: s.freezing.solidSpecificHeat.value }
      : {}),
    ...(s.boiling ? { boilingPoint: celsius(s.boiling.point.value), latentVaporization: s.boiling.latentHeat.value } : {}),
  };
  const hasPhase = s.freezing !== undefined || s.boiling !== undefined;
  const v = s.vapor;
  const lv = s.boiling?.latentHeat.value;
  const evaporation: EvaporationParams | undefined =
    v && lv !== undefined
      ? {
          molarMass: v.molarMass.value,
          vaporPressure: v.pressure,
          latent: v.latentLow && s.boiling
            ? { t1: celsius(v.latentLow.temperature), l1: v.latentLow.value.value, t2: celsius(s.boiling.point.value), l2: lv }
            : lv,
        }
      : undefined;
  return { specificHeat: s.liquid.specificHeat.value, density: s.liquid.density.value, ...(hasPhase ? { phase } : {}), ...(evaporation ? { evaporation } : {}) };
}
