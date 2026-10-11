import type { LocalizedText } from '../knowledge/i18n.js';
import type { HeaterItem, VesselItem } from './types.js';

export type Compatibility = { readonly ok: true } | { readonly ok: false; readonly reason: LocalizedText };

const MATERIAL_NAMES: Readonly<Record<string, LocalizedText>> = {
  steel: { uk: 'сталь', en: 'steel' },
  aluminium: { uk: 'алюміній', en: 'aluminium' },
  iron: { uk: 'чавун', en: 'cast iron' },
  glass: { uk: 'скло', en: 'glass' },
};

/**
 * Can this heater heat this vessel made of this material at all?
 * Only rules backed by a source live here (see HeaterSpec.requiresMaterial).
 */
export function canHeat(heater: HeaterItem, vessel: VesselItem, material: string): Compatibility {
  void vessel;
  const req = heater.spec.requiresMaterial;
  if (req && !req.materials.includes(material)) {
    const m = MATERIAL_NAMES[material] ?? { uk: material, en: material };
    return {
      ok: false,
      reason: {
        uk: `${heater.name.uk} не гріє посуд із матеріалу «${m.uk}»: потрібен магнітний метал (чавун, магнітна сталь). Плита просто не «бачить» посуд.`,
        en: `${heater.name.en} does not heat a ${m.en} vessel: it needs a magnetic metal (cast iron, magnetic steel). The hob simply does not «see» it.`,
      },
    };
  }
  return { ok: true };
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

/**
 * Cylinder geometry of a vessel of capacity `liters`, given height/diameter `k`.
 *   V = π r² h, h = 2kr  →  r = (V / 2πk)^(1/3)
 */
export function vesselGeometry(liters: number, heightToDiameter: number) {
  const v = liters / 1000;
  const r = Math.cbrt(v / (2 * Math.PI * heightToDiameter));
  const h = 2 * heightToDiameter * r;
  return { radius: r, height: h, bottom: Math.PI * r * r, side: 2 * Math.PI * r * h };
}
