import { msg } from '../knowledge/messages.js';
import type { VesselItem } from './types.js';

/**
 * Vessels. Shapes, wall thickness and typical masses are estimates (marked):
 * real pots and beakers vary a lot, and the experimenter can enter their own mass.
 */
const VESSEL_LIST = {
  pot: {
    id: 'pot',
    look: 'pot',
    kind: 'vessel',
    category: 'vessel.household',
    name: msg('vessel-pot'),
    phraseIn: {
      steel: msg('vessel-pot-phrase-in-steel'),
      aluminium: msg('vessel-pot-phrase-in-aluminium'),
      iron: msg('vessel-pot-phrase-in-iron'),
    },
    description: {
      novice: msg('vessel-pot-description-novice'),
      school: msg('vessel-pot-description-school'),
    },
    media: [],
    spec: {
      sizes: [1, 2, 3, 5, 10, 20],
      defaultSize: 3,
      materials: ['steel', 'aluminium', 'iron'],
      defaultMaterial: 'steel',
      shape: {
        type: 'cylinder',
        heightToDiameter: {
          value: 1, unit: '', conditions: 'stock pot', verification: 'estimate', tolerance: 0.5,
          citations: [{ source: 'spark', locator: 'estimate', conditions: 'typical pots', range: [0.6, 1.2] }],
          note: 'Estimate; saucepans are lower, stock pots taller.',
        },
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
  turka: {
    id: 'turka',
    look: 'turka',
    kind: 'vessel',
    category: 'vessel.household',
    name: msg('vessel-turka'),
    phraseIn: {
      copper: msg('vessel-turka-phrase-in-copper'),
      brass: msg('vessel-turka-phrase-in-brass'),
      steel: msg('vessel-turka-phrase-in-steel'),
      aluminium: msg('vessel-turka-phrase-in-aluminium'),
    },
    description: {
      novice: msg('vessel-turka-description-novice'),
      school: msg('vessel-turka-description-school'),
    },
    media: [],
    spec: {
      sizes: [0.15, 0.25, 0.4, 0.6],
      defaultSize: 0.25,
      materials: ['copper', 'brass', 'steel', 'aluminium'],
      defaultMaterial: 'copper',
      shape: {
        type: 'frustum',
        heightToDiameter: { value: 1.1, unit: '', conditions: 'cezve, height / bottom diameter', verification: 'estimate', tolerance: 0.5, citations: [{ source: 'spark', locator: 'estimate', conditions: 'not measured', range: [0.9, 1.4] }], note: 'Estimate of typical proportions.' },
        topToBottom: { value: 0.75, unit: '', conditions: 'neck narrower than the bottom', verification: 'estimate', tolerance: 0.5, citations: [{ source: 'spark', locator: 'estimate', conditions: 'not measured', range: [0.6, 0.9] }], note: 'Estimate; real cezves narrow at the neck and flare at the rim.' },
      },
      wallThickness: { value: 0.001, unit: 'm', conditions: 'sheet metal', verification: 'estimate', tolerance: 0.5, citations: [{ source: 'spark', locator: 'estimate', conditions: 'not measured', range: [0.0006, 0.002] }], note: 'Estimate.' },
      massModel: { base: 0.1, perLiter: 0.4, data: { value: 0.2, unit: 'kg', conditions: '0.25 L cezve', verification: 'estimate', tolerance: 0.5, citations: [{ source: 'spark', locator: 'estimate', conditions: 'not measured', range: [0.12, 0.35] }], note: 'Estimate: 0.1 kg + 0.4 kg per litre; the long handle is not counted.' } },
      lid: 'none',
    },
  },
  beaker: {
    id: 'beaker',
    look: 'beaker',
    kind: 'vessel',
    category: 'vessel.laboratory',
    name: msg('vessel-beaker'),
    phraseIn: { glass: msg('vessel-beaker-phrase-in-glass') },
    description: {
      novice: msg('vessel-beaker-description-novice'),
      school: msg('vessel-beaker-description-school'),
    },
    media: [],
    spec: {
      sizes: [0.1, 0.25, 0.6, 1],
      defaultSize: 0.25,
      materials: ['glass'],
      defaultMaterial: 'glass',
      shape: {
        type: 'cylinder',
        heightToDiameter: {
          value: 1.4, unit: '', conditions: 'low-form (Griffin) beaker', verification: 'estimate', tolerance: 0.3,
          citations: [{ source: 'spark', locator: 'estimate', conditions: 'typical proportions', range: [1.2, 1.6] }],
          note: 'Estimate of typical low-form proportions.',
        },
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
      graduation: { value: 2.5e-05, unit: 'm³', conditions: 'approximate marks of a 250 mL beaker', verification: 'estimate', tolerance: 0.5, citations: [{ source: 'spark', locator: 'estimate', conditions: 'not measured', range: [0.00001, 0.00005] }], note: 'Estimate: beaker marks are approximate (about ±5 %) and coarse; a measuring cylinder is for measuring.' },
    },
  },
  calorimeter: {
    id: 'calorimeter',
    look: 'calorimeter',
    kind: 'vessel',
    category: 'vessel.laboratory',
    name: msg('vessel-calorimeter'),
    phraseIn: { aluminium: msg('vessel-calorimeter-phrase-in-aluminium') },
    description: {
      novice: msg('vessel-calorimeter-description-novice'),
      school: msg('vessel-calorimeter-description-school'),
    },
    media: [],
    spec: {
      sizes: [0.25],
      defaultSize: 0.25,
      materials: ['aluminium'],
      defaultMaterial: 'aluminium',
      shape: {
        type: 'cylinder',
        heightToDiameter: { value: 1.2, unit: '', conditions: 'inner cup', verification: 'estimate', tolerance: 0.5, citations: [{ source: 'spark', locator: 'estimate', conditions: 'school calorimeters vary', range: [1, 1.5] }], note: 'Estimate of a typical school calorimeter cup.' },
      },
      wallThickness: { value: 0.0005, unit: 'm', conditions: 'thin aluminium cup', verification: 'estimate', tolerance: 0.5, citations: [{ source: 'spark', locator: 'estimate', conditions: 'school calorimeters vary', range: [0.0003, 0.001] }], note: 'Estimate; thin wall, so the cup itself takes little heat.' },
      massModel: {
        base: 0.02,
        perLiter: 0.12,
        data: { value: 0.05, unit: 'kg', conditions: '250 mL inner cup', verification: 'estimate', tolerance: 0.5, citations: [{ source: 'spark', locator: 'estimate', conditions: 'school calorimeters vary', range: [0.03, 0.08] }], note: 'Estimate of the inner cup only (the outer one is insulated from it).' },
      },
      lid: 'optional',
      lidMassFraction: { value: 0.3, unit: '', conditions: 'lid / inner cup', verification: 'estimate', tolerance: 0.5, citations: [{ source: 'spark', locator: 'estimate', conditions: 'school calorimeters vary', range: [0.2, 0.5] }], note: 'Estimate.' },
      jacket: { gap: { value: 0.01, unit: 'm', conditions: 'air gap between the cups', verification: 'estimate', tolerance: 0.5, citations: [{ source: 'spark', locator: 'estimate', conditions: 'school calorimeters vary', range: [0.005, 0.02] }], note: 'Estimate; the outer cup and the insulating ring are not modelled as bodies.' } },
    },
  },
  cylinder: {
    id: 'cylinder',
    look: 'cylinder',
    kind: 'vessel',
    category: 'vessel.laboratory',
    name: msg('vessel-cylinder'),
    phraseIn: { glass: msg('vessel-cylinder-phrase-in-glass') },
    description: {
      novice: msg('vessel-cylinder-description-novice'),
      school: msg('vessel-cylinder-description-school'),
    },
    media: [],
    spec: {
      sizes: [0.1],
      defaultSize: 0.1,
      materials: ['glass'],
      defaultMaterial: 'glass',
      shape: { type: 'cylinder', heightToDiameter: { value: 6.5, unit: '', conditions: '100 mL measuring cylinder (graduated part)', verification: 'estimate', tolerance: 0.5, citations: [{ source: 'spark', locator: 'estimate', conditions: 'not measured', range: [5, 8] }], note: 'Estimate: about 28 mm inside, 175 mm graduated.' } },
      wallThickness: { value: 0.0015, unit: 'm', conditions: 'laboratory glass', verification: 'estimate', tolerance: 0.5, citations: [{ source: 'spark', locator: 'estimate', conditions: 'not measured', range: [0.001, 0.0025] }], note: 'Estimate.' },
      massModel: { base: 0.07, perLiter: 0.6, data: { value: 0.13, unit: 'kg', conditions: '100 mL cylinder with its foot', verification: 'estimate', tolerance: 0.5, citations: [{ source: 'spark', locator: 'estimate', conditions: 'not measured', range: [0.09, 0.18] }], note: 'Estimate.' } },
      lid: 'none',
      graduation: { value: 0.000001, unit: 'm³', conditions: '100 mL, class B (ISO 4788)', verification: 'cross-checked', tolerance: 0.01, citations: [
        { source: 'dwk-mbl-cylinder-100', locator: 'graduation interval 1 mL', conditions: 'class B, 100 mL', value: 0.000001 },
        { source: 'jangar-cylinder-100', locator: 'subdivision 1 mL', conditions: '100 mL', value: 0.000001 },
      ] },
      measuringOnly: true,
    },
  },
  'flask-conical': {
    id: 'flask-conical',
    look: 'flask-conical',
    kind: 'vessel',
    category: 'vessel.laboratory',
    name: msg('vessel-flask-conical'),
    phraseIn: { glass: msg('vessel-flask-conical-phrase-in-glass') },
    description: {
      novice: msg('vessel-flask-conical-description-novice'),
      school: msg('vessel-flask-conical-description-school'),
    },
    media: [],
    spec: {
      sizes: [0.1, 0.25, 0.5, 1],
      defaultSize: 0.25,
      materials: ['glass'],
      defaultMaterial: 'glass',
      shape: {
        type: 'frustum',
        heightToDiameter: { value: 1.2, unit: '', conditions: 'height / bottom diameter', verification: 'estimate', tolerance: 0.5, citations: [{ source: 'spark', locator: 'estimate', conditions: 'not measured', range: [1, 1.5] }], note: 'Estimate of typical proportions.' },
        topToBottom: { value: 0.3, unit: '', conditions: 'neck / bottom diameter', verification: 'estimate', tolerance: 0.5, citations: [{ source: 'spark', locator: 'estimate', conditions: 'not measured', range: [0.2, 0.4] }], note: 'Estimate; the cone is approximated up to the neck.' },
      },
      wallThickness: { value: 0.0015, unit: 'm', conditions: 'laboratory glass', verification: 'estimate', tolerance: 0.5, citations: [{ source: 'spark', locator: 'estimate', conditions: 'not measured', range: [0.001, 0.0025] }], note: 'Estimate.' },
      massModel: { base: 0.03, perLiter: 0.3, data: { value: 0.105, unit: 'kg', conditions: '250 mL flask', verification: 'estimate', tolerance: 0.5, citations: [{ source: 'spark', locator: 'estimate', conditions: 'not measured', range: [0.07, 0.15] }], note: 'Estimate: 0.03 kg + 0.3 kg per litre.' } },
      lid: 'none',
    },
  },
  'flask-round': {
    id: 'flask-round',
    look: 'flask-round',
    kind: 'vessel',
    category: 'vessel.laboratory',
    name: msg('vessel-flask-round'),
    phraseIn: { glass: msg('vessel-flask-round-phrase-in-glass') },
    description: {
      novice: msg('vessel-flask-round-description-novice'),
      school: msg('vessel-flask-round-description-school'),
    },
    media: [],
    spec: {
      sizes: [0.1, 0.25, 0.5, 1],
      defaultSize: 0.25,
      materials: ['glass'],
      defaultMaterial: 'glass',
      shape: { type: 'sphere', neckToDiameter: { value: 0.3, unit: '', conditions: 'neck / ball diameter', verification: 'estimate', tolerance: 0.5, citations: [{ source: 'spark', locator: 'estimate', conditions: 'not measured', range: [0.2, 0.4] }], note: 'Estimate.' } },
      wallThickness: { value: 0.0015, unit: 'm', conditions: 'laboratory glass', verification: 'estimate', tolerance: 0.5, citations: [{ source: 'spark', locator: 'estimate', conditions: 'not measured', range: [0.001, 0.0025] }], note: 'Estimate.' },
      massModel: { base: 0.03, perLiter: 0.3, data: { value: 0.105, unit: 'kg', conditions: '250 mL flask', verification: 'estimate', tolerance: 0.5, citations: [{ source: 'spark', locator: 'estimate', conditions: 'not measured', range: [0.07, 0.15] }], note: 'Estimate: 0.03 kg + 0.3 kg per litre.' } },
      lid: 'none',
    },
  },
  'test-tube': {
    id: 'test-tube',
    look: 'test-tube',
    kind: 'vessel',
    category: 'vessel.laboratory',
    name: msg('vessel-test-tube'),
    phraseIn: { glass: msg('vessel-test-tube-phrase-in-glass') },
    description: {
      novice: msg('vessel-test-tube-description-novice'),
      school: msg('vessel-test-tube-description-school'),
    },
    safety: {
      school: msg('vessel-test-tube-safety-school'),
    },
    media: [],
    spec: {
      sizes: [0.02, 0.03],
      defaultSize: 0.02,
      materials: ['glass'],
      defaultMaterial: 'glass',
      shape: { type: 'tube', heightToDiameter: { value: 9.4, unit: '', conditions: 'length / diameter (≈ 16 × 150 mm)', verification: 'estimate', tolerance: 0.5, citations: [{ source: 'spark', locator: 'estimate', conditions: 'not measured', range: [7, 11] }], note: 'Estimate of a typical 16 × 150 mm tube.' } },
      wallThickness: { value: 0.001, unit: 'm', conditions: 'laboratory glass', verification: 'estimate', tolerance: 0.5, citations: [{ source: 'spark', locator: 'estimate', conditions: 'not measured', range: [0.0008, 0.0015] }], note: 'Estimate.' },
      massModel: { base: 0.01, perLiter: 0.5, data: { value: 0.02, unit: 'kg', conditions: '20 mL tube', verification: 'estimate', tolerance: 0.5, citations: [{ source: 'spark', locator: 'estimate', conditions: 'not measured', range: [0.012, 0.03] }], note: 'Estimate: 0.01 kg + 0.5 kg per litre.' } },
      lid: 'none',
    },
  },
  crucible: {
    id: 'crucible',
    look: 'crucible',
    kind: 'vessel',
    category: 'vessel.laboratory',
    name: msg('vessel-crucible'),
    phraseIn: { porcelain: msg('vessel-crucible-phrase-in-porcelain') },
    description: {
      novice: msg('vessel-crucible-description-novice'),
      school: msg('vessel-crucible-description-school'),
    },
    safety: {
      school: msg('vessel-crucible-safety-school'),
    },
    media: [],
    spec: {
      sizes: [0.015, 0.03, 0.05],
      defaultSize: 0.03,
      materials: ['porcelain'],
      defaultMaterial: 'porcelain',
      shape: {
        type: 'frustum',
        heightToDiameter: { value: 0.86, unit: '', conditions: '30 mL high-form crucible, outside', verification: 'single-source', tolerance: 0.1, citations: [{ source: 'fishersci-porcelain-crucible-30', locator: 'Ø 43 mm × 37 mm', conditions: '30 mL high form', value: 0.86 }], note: 'Outer size of one catalogue crucible; inside it is a little smaller.' },
        topToBottom: { value: 1.6, unit: '', conditions: 'top / bottom diameter', verification: 'estimate', tolerance: 0.3, citations: [{ source: 'spark', locator: 'estimate', conditions: 'not measured', range: [1.3, 2] }], note: 'Estimate: a crucible narrows strongly towards its bottom.' },
      },
      wallThickness: { value: 0.002, unit: 'm', conditions: '30 mL high-form crucible', verification: 'single-source', tolerance: 0.2, citations: [{ source: 'fishersci-porcelain-crucible-30', locator: 'wall thickness 2 mm', conditions: '30 mL high form', value: 0.002 }], note: 'One catalogue listing.' },
      massModel: {
        base: 0.006,
        perLiter: 0.67,
        data: { value: 0.026, unit: 'kg', conditions: '30 mL crucible', verification: 'single-source', tolerance: 0.1, citations: [{ source: 'fishersci-porcelain-crucible-30', locator: 'weight 26 g', conditions: '30 mL high form', value: 0.026 }], note: 'One catalogue crucible; other sizes scaled: 6 g + 0.67 kg per litre (an estimate).' },
      },
      lid: 'optional',
      flameOnly: true,
    },
  },
} as const satisfies Record<string, VesselItem>;

export type VesselId = keyof typeof VESSEL_LIST;
export const VESSELS: Readonly<Record<VesselId, VesselItem>> = VESSEL_LIST;
