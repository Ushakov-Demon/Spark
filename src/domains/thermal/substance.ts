import { celsius } from '../../core/units.js';
import type { SubstanceItem } from '../../substances/types.js';
import type { PhaseParams } from './phase.js';

/** Thermal view of a catalog substance: liquid heat capacity, density and phase changes (in K). */
export function substanceThermal(s: SubstanceItem): { readonly specificHeat: number; readonly density: number; readonly phase?: PhaseParams } {
  const phase: PhaseParams = {
    ...(s.freezing
      ? { meltingPoint: celsius(s.freezing.point.value), latentFusion: s.freezing.latentHeat.value, specificHeatSolid: s.freezing.solidSpecificHeat.value }
      : {}),
    ...(s.boiling ? { boilingPoint: celsius(s.boiling.point.value), latentVaporization: s.boiling.latentHeat.value } : {}),
  };
  const hasPhase = s.freezing !== undefined || s.boiling !== undefined;
  return { specificHeat: s.liquid.specificHeat.value, density: s.liquid.density.value, ...(hasPhase ? { phase } : {}) };
}
