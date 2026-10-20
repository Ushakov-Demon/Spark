import type { LocalizedText } from '../knowledge/i18n.js';
import { hasFlatBottom, vesselGeometry } from './geometry.js';
import type { ElectrodesSpec, HeaterItem, VesselItem } from './types.js';

export type Compatibility = { readonly ok: true } | { readonly ok: false; readonly reason: LocalizedText };

const MATERIAL_NAMES: Readonly<Record<string, LocalizedText>> = {
  steel: { uk: 'сталь', en: 'steel' },
  aluminium: { uk: 'алюміній', en: 'aluminium' },
  iron: { uk: 'чавун', en: 'cast iron' },
  glass: { uk: 'скло', en: 'glass' },
  copper: { uk: 'мідь', en: 'copper' },
  brass: { uk: 'латунь', en: 'brass' },
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
    const m = MATERIAL_NAMES[material] ?? { uk: material, en: material };
    return {
      ok: false,
      reason: {
        uk: `${heater.name.uk} не гріє посуд із матеріалу «${m.uk}»: потрібен магнітний метал (чавун, магнітна сталь). Плита просто не «бачить» посуд.`,
        en: `${heater.name.en} does not heat a ${m.en} vessel: it needs a magnetic metal (cast iron, magnetic steel). The hob simply does not «see» it.`,
      },
    };
  }
  if (vessel.spec.measuringOnly) {
    return {
      ok: false,
      reason: {
        uk: `${vessel.name.uk} не нагрівають: це посудина для вимірювання об’єму, від нагрівання поділки «попливуть», а скло може тріснути.`,
        en: `A ${vessel.name.en.toLowerCase()} is not heated: it is for measuring volume; heat would spoil its marks and may crack the glass.`,
      },
    };
  }
  if (vessel.spec.jacket && spec.method !== 'immersion') {
    return {
      ok: false,
      reason: {
        uk: `${vessel.name.uk} не ставлять на плиту чи над вогнем: повітряний проміжок не пропускає теплоту. Його вміст гріють зсередини — кип’ятильником.`,
        en: `A ${vessel.name.en.toLowerCase()} is not put on a hob or over a flame: its air gap keeps the heat out. Its contents are heated from inside — with an immersion heater.`,
      },
    };
  }
  if ((spec.method === 'contact' || spec.method === 'induction') && !hasFlatBottom(vessel.spec.shape)) {
    return {
      ok: false,
      reason: {
        uk: `${vessel.name.uk} має кругле дно: на плиті вона торкається її лише в одній точці й майже не нагрівається. Такий посуд гріють над полум’ям або в спеціальному нагрівачі.`,
        en: `${vessel.name.en} has a round bottom: on a hob it touches it at a single point and hardly heats up. Such vessels are heated over a flame or in a heating mantle.`,
      },
    };
  }
  if (spec.method === 'immersion' && spec.elementDiameter) {
    const g = vesselGeometry(vessel.spec.shape, capacityL, capacityL);
    if (g.opening < spec.elementDiameter.value) {
      const mm = (x: number) => Math.round(x * 1000);
      return {
        ok: false,
        reason: {
          uk: `Кип’ятильник (діаметр ≈ ${mm(spec.elementDiameter.value)} мм) не проходить в отвір посуду «${vessel.name.uk}» (≈ ${mm(g.opening)} мм).`,
          en: `The immersion heater (≈ ${mm(spec.elementDiameter.value)} mm wide) does not fit through the opening of the ${vessel.name.en.toLowerCase()} (≈ ${mm(g.opening)} mm).`,
        },
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
    reason: {
      uk: `Два електроди (потрібно ≈ ${mm(need)} мм) не вміщаються в отвір посуду «${vessel.name.uk}» (≈ ${mm(g.opening)} мм).`,
      en: `Two electrodes (≈ ${mm(need)} mm needed) do not fit into the opening of the ${vessel.name.en.toLowerCase()} (≈ ${mm(g.opening)} mm).`,
    },
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
