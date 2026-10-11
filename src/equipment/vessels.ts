import type { VesselItem } from './types.js';

/**
 * Vessels. Shapes, wall thickness and typical masses are estimates (marked):
 * real pots and beakers vary a lot, and the experimenter can enter their own mass.
 */
const VESSEL_LIST = {
  pot: {
    id: 'pot',
    kind: 'vessel',
    category: 'vessel.household',
    name: { uk: 'Каструля', en: 'Pot' },
    phraseIn: {
      steel: { uk: 'у сталевій каструлі', en: 'in a steel pot' },
      aluminium: { uk: 'в алюмінієвій каструлі', en: 'in an aluminium pot' },
      iron: { uk: 'у чавунній каструлі', en: 'in a cast-iron pot' },
    },
    description: {
      novice: {
        uk: 'Звичайна кухонна каструля. Метал добре проводить теплоту, тому дно швидко передає її воді. З кришкою вода нагрівається швидше.',
        en: 'An ordinary kitchen pot. Metal conducts heat well, so the bottom quickly passes it to the water. With a lid the water heats faster.',
      },
      school: {
        uk: 'Металеві стінки тонкі й добре проводять теплоту, тож майже не заважають нагріванню; але сама каструля теж забирає частину теплоти — Q = c·m·Δt для її маси. Кришка зменшує тепловіддачу з поверхні води.',
        en: 'Thin metal walls conduct heat well and hardly slow heating down; but the pot itself also takes heat — Q = c·m·Δt for its mass. A lid reduces heat loss from the water surface.',
      },
    },
    media: [],
    spec: {
      sizes: [1, 2, 3, 5, 10, 20],
      defaultSize: 3,
      materials: ['steel', 'aluminium', 'iron'],
      defaultMaterial: 'steel',
      heightToDiameter: {
        value: 1, unit: '', conditions: 'stock pot', verification: 'estimate', tolerance: 0.5,
        citations: [{ source: 'spark', locator: 'estimate', conditions: 'typical pots', range: [0.6, 1.2] }],
        note: 'Estimate; saucepans are lower, stock pots taller.',
      },
      wallThickness: {
        value: 0.001, unit: 'm', conditions: 'sheet metal pot', verification: 'estimate', tolerance: 0.5,
        citations: [{ source: 'spark', locator: 'estimate', conditions: 'not measured', range: [0.0005, 0.003] }],
        note: 'Estimate; for metal walls the thickness barely matters (high conductivity).',
      },
      massModel: {
        base: 0.4,
        perLiter: 0.13,
        data: {
          value: 0.79, unit: 'kg', conditions: '3 L steel pot', verification: 'estimate', tolerance: 0.5,
          citations: [{ source: 'spark', locator: 'estimate', conditions: 'not weighed', range: [0.5, 1.5] }],
          note: 'Estimate: 0.4 kg + 0.13 kg per litre. Weigh your own pot and enter its mass.',
        },
      },
      lid: 'optional',
      lidMassFraction: {
        value: 0.25, unit: '', conditions: 'metal lid', verification: 'estimate', tolerance: 0.5,
        citations: [{ source: 'spark', locator: 'estimate', conditions: 'not weighed', range: [0.15, 0.35] }],
        note: 'Estimate.',
      },
    },
  },
  beaker: {
    id: 'beaker',
    kind: 'vessel',
    category: 'vessel.laboratory',
    name: { uk: 'Хімічний стакан', en: 'Beaker' },
    phraseIn: { glass: { uk: 'у скляному хімічному стакані', en: 'in a glass beaker' } },
    description: {
      novice: {
        uk: 'Скляна посудина з носиком і поділками для вимірювання об’єму. Скло погано проводить теплоту, тому вода в ньому нагрівається повільніше, ніж у металевій каструлі.',
        en: 'A glass vessel with a spout and volume marks. Glass conducts heat poorly, so water in it heats more slowly than in a metal pot.',
      },
      school: {
        uk: 'Скло проводить теплоту в десятки й сотні разів гірше за метали, тому стінка стакана помітно гальмує передачу теплоти воді. Над полум’ям стакан ставлять на триногу; індукційна плита скло не гріє.',
        en: 'Glass conducts heat tens to hundreds of times worse than metals, so the beaker wall noticeably slows heat transfer to the water. Over a flame a beaker stands on a tripod; an induction hob does not heat glass.',
      },
    },
    media: [],
    spec: {
      sizes: [0.1, 0.25, 0.6, 1],
      defaultSize: 0.25,
      materials: ['glass'],
      defaultMaterial: 'glass',
      heightToDiameter: {
        value: 1.4, unit: '', conditions: 'low-form (Griffin) beaker', verification: 'estimate', tolerance: 0.3,
        citations: [{ source: 'spark', locator: 'estimate', conditions: 'typical proportions', range: [1.2, 1.6] }],
        note: 'Estimate of typical low-form proportions.',
      },
      wallThickness: {
        value: 0.0015, unit: 'm', conditions: 'laboratory glass', verification: 'estimate', tolerance: 0.5,
        citations: [{ source: 'spark', locator: 'estimate', conditions: 'not measured', range: [0.001, 0.0025] }],
        note: 'Estimate; for glass the wall thickness matters (low conductivity).',
      },
      massModel: {
        base: 0.02,
        perLiter: 0.25,
        data: {
          value: 0.0825, unit: 'kg', conditions: '250 mL beaker', verification: 'estimate', tolerance: 0.5,
          citations: [{ source: 'spark', locator: 'estimate', conditions: 'not weighed', range: [0.05, 0.12] }],
          note: 'Estimate: 0.02 kg + 0.25 kg per litre.',
        },
      },
      lid: 'none',
    },
  },
} as const satisfies Record<string, VesselItem>;

export type VesselId = keyof typeof VESSEL_LIST;
export const VESSELS: Readonly<Record<VesselId, VesselItem>> = VESSEL_LIST;
