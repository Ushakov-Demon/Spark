import type { Locale, LocalizedText } from '../knowledge/i18n.js';
import { localized, msg } from '../knowledge/messages.js';
import { hasFlatBottom, vesselGeometry } from './geometry.js';
import type { ElectrodesSpec, HeaterItem, VesselItem } from './types.js';

export type Compatibility = { readonly ok: true } | { readonly ok: false; readonly reason: LocalizedText };

const MATERIAL_NAMES: Readonly<Record<string, LocalizedText>> = {
  steel: msg('compatibility-material-names-steel'),
  aluminium: msg('compatibility-material-names-aluminium'),
  iron: msg('compatibility-material-names-iron'),
  glass: msg('compatibility-material-names-glass'),
  copper: msg('compatibility-material-names-copper'),
  brass: msg('compatibility-material-names-brass'),
};

/**
 * Can this heater heat this vessel (of this material and capacity) at all?
 * Rules come from a source (induction needs a ferromagnetic material) or from
 * plain geometry (a round bottom touches a hob at one point; a 50 mm element
 * does not fit through a narrow neck).
 */
export function canHeat(heater: HeaterItem, vessel: VesselItem, material: string, capacityL: number = vessel.spec.defaultSize): Compatibility {
  const spec = heater.spec;
  const req = spec.requiresMaterial;
  if (req && !req.materials.includes(material)) {
    const m = MATERIAL_NAMES[material] ?? localized((l: Locale) => material);
    return {
      ok: false,
      reason: msg('compatibility-can-heat-reason', { name: (l: Locale) => heater.name[l], m: (l: Locale) => m[l] }),
    };
  }
  if (vessel.spec.measuringOnly) {
    return {
      ok: false,
      reason: msg('compatibility-measuring-only', { name: (l: Locale) => vessel.name[l], lower: (l: Locale) => vessel.name[l].toLowerCase() }),
    };
  }
  if (vessel.spec.flameOnly && !(spec.method === 'flame' && heater.category === 'device.heater.laboratory')) {
    return {
      ok: false,
      reason: msg('compatibility-flame-only', { name: (l: Locale) => vessel.name[l], lower: (l: Locale) => vessel.name[l].toLowerCase() }),
    };
  }
  if (vessel.spec.jacket && spec.method !== 'immersion') {
    return {
      ok: false,
      reason: msg('compatibility-jacket', { name: (l: Locale) => vessel.name[l], lower: (l: Locale) => vessel.name[l].toLowerCase() }),
    };
  }
  if ((spec.method === 'contact' || spec.method === 'induction') && !hasFlatBottom(vessel.spec.shape)) {
    return {
      ok: false,
      reason: msg('compatibility-can-heat-reason-2', { name: (l: Locale) => vessel.name[l] }),
    };
  }
  if (spec.method === 'immersion' && spec.elementDiameter) {
    const g = vesselGeometry(vessel.spec.shape, capacityL, capacityL);
    if (g.opening < spec.elementDiameter.value) {
      const mm = (x: number) => Math.round(x * 1000);
      return {
        ok: false,
        reason: msg('compatibility-heater-too-wide', { name: (l: Locale) => vessel.name[l], lower: (l: Locale) => vessel.name[l].toLowerCase(), heater: String(mm(spec.elementDiameter.value)), opening: String(mm(g.opening)) }),
      };
    }
  }
  return { ok: true };
}

/** Do two electrodes (their gap plus two plates) fit through the opening of this vessel? */
export function canHoldElectrodes(electrodes: ElectrodesSpec, vessel: VesselItem, capacityL: number = vessel.spec.defaultSize): Compatibility {
  const need = electrodes.gap + 0.01; // the gap plus two plates ≈ 5 mm each
  const g = vesselGeometry(vessel.spec.shape, capacityL, capacityL);
  if (g.opening >= need) return { ok: true };
  const mm = (x: number) => Math.round(x * 1000);
  return {
    ok: false,
    reason: msg('compatibility-electrodes-too-wide', { name: (l: Locale) => vessel.name[l], lower: (l: Locale) => vessel.name[l].toLowerCase(), need: String(mm(need)), opening: String(mm(g.opening)) }),
  };
}

/** Knob position (0 … 1) → power, W. 0 is always off; flames have a minimum stable flame. */
export function powerAt(heater: HeaterItem, rating: number, position: number): number {
  const x = Math.min(1, Math.max(0, position));
  if (x === 0) return 0;
  if (heater.spec.control === 'switch') return rating;
  return rating * (heater.spec.minFraction + (1 - heater.spec.minFraction) * x);
}

/** Typical empty mass of a vessel of this capacity, kg. */
export const typicalVesselMass = (vessel: VesselItem, liters: number): number =>
  Math.round((vessel.spec.massModel.base + vessel.spec.massModel.perLiter * liters) * 1000) / 1000;
