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
    name: { uk: 'Турка (джезва)', en: 'Cezve (Turkish coffee pot)' },
    phraseIn: {
      copper: { uk: 'у мідній турці', en: 'in a copper cezve' },
      brass: { uk: 'у латунній турці', en: 'in a brass cezve' },
      steel: { uk: 'у сталевій турці', en: 'in a steel cezve' },
      aluminium: { uk: 'в алюмінієвій турці', en: 'in an aluminium cezve' },
    },
    description: {
      novice: {
        uk: 'Невеликий посуд для кави з широким дном і вужчим горлом. Буває мідний, латунний, сталевий, алюмінієвий — і нагрівається по-різному.',
        en: 'A small coffee pot with a wide bottom and a narrower neck. It can be copper, brass, steel or aluminium — and each heats differently.',
      },
      school: {
        uk: 'Мідь проводить теплоту приблизно в 9 разів краще за сталь, латунь — приблизно в 2,5 раза краще; тому стінка мідної турки рівномірніше прогрівається. Але для тонкої стінки важливіше інше — скільки теплоти забирає сам метал: Q = c·m·Δt.',
        en: 'Copper conducts heat about 9 times better than steel, brass about 2.5 times better; so a copper wall warms more evenly. For a thin wall, however, what matters more is how much heat the metal itself takes: Q = c·m·Δt.',
      },
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
    },
  },
  calorimeter: {
    id: 'calorimeter',
    look: 'calorimeter',
    kind: 'vessel',
    category: 'vessel.laboratory',
    name: { uk: 'Калориметр', en: 'Calorimeter' },
    phraseIn: { aluminium: { uk: 'у калориметрі', en: 'in a calorimeter' } },
    description: {
      novice: {
        uk: 'Тонкий алюмінієвий стаканчик, вставлений у більший стакан. Між ними — шар повітря, тож теплота майже не тікає назовні. У ньому змішують воду й опускають нагріті тіла, щоб виміряти, скільки теплоти вони віддали.',
        en: 'A thin aluminium cup set inside a bigger one with a layer of air between them, so heat hardly escapes. Water is mixed in it and heated bodies are dropped in to measure how much heat they gave.',
      },
      school: {
        uk: 'Повітря проводить теплоту в тисячі разів гірше за метал, тому повітряний проміжок між стаканами — добрий теплоізолятор. Втрати є, але менші, ніж у звичайному стакані: тепловий баланс сходиться точніше. Гріють калориметр зсередини — кип’ятильником, а не на плиті.',
        en: 'Air conducts heat thousands of times worse than metal, so the air gap between the cups is a good insulator. There are losses, but smaller than in an ordinary beaker: the heat balance comes out closer. A calorimeter is heated from inside — with an immersion heater, not on a hob.',
      },
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
  'flask-conical': {
    id: 'flask-conical',
    look: 'flask-conical',
    kind: 'vessel',
    category: 'vessel.laboratory',
    name: { uk: 'Конічна колба', en: 'Conical (Erlenmeyer) flask' },
    phraseIn: { glass: { uk: 'у конічній колбі', en: 'in a conical flask' } },
    description: {
      novice: {
        uk: 'Скляна колба з плоским широким дном і вузьким горлом. Її можна ставити на плитку, а рідина в ній менше розхлюпується.',
        en: 'A glass flask with a flat wide bottom and a narrow neck. It can stand on a hot plate, and liquid splashes out less.',
      },
      school: {
        uk: 'Широке дно добре приймає теплоту від плитки, а вузьке горло зменшує відкриту поверхню рідини — менше теплоти йде в повітря.',
        en: 'The wide bottom takes heat from a plate well, and the narrow neck reduces the open liquid surface — less heat escapes into the air.',
      },
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
    name: { uk: 'Круглодонна колба', en: 'Round-bottom flask' },
    phraseIn: { glass: { uk: 'у круглодонній колбі', en: 'in a round-bottom flask' } },
    description: {
      novice: {
        uk: 'Колба-куля з вузьким горлом. Сама вона не стоїть — її закріплюють у штативі.',
        en: 'A ball-shaped flask with a narrow neck. It cannot stand on its own — it is held in a clamp.',
      },
      school: {
        uk: 'Кругле дно торкається плоскої плитки лише в одній точці, тому таку колбу гріють над полум’ям або в спеціальному нагрівачі, що охоплює її знизу.',
        en: 'A round bottom touches a flat plate at a single point, so such a flask is heated over a flame or in a heating mantle that wraps around it.',
      },
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
    name: { uk: 'Пробірка', en: 'Test tube' },
    phraseIn: { glass: { uk: 'у пробірці', en: 'in a test tube' } },
    description: {
      novice: {
        uk: 'Вузька скляна трубка із заокругленим дном для невеликих кількостей речовини. Її тримають тримачем над полум’ям.',
        en: 'A narrow glass tube with a rounded bottom for small amounts of a substance. It is held with a holder over a flame.',
      },
      school: {
        uk: 'Рідини в пробірці мало, тож навіть слабке полум’я спиртівки швидко її нагріває.',
        en: 'A test tube holds little liquid, so even a weak spirit-lamp flame heats it quickly.',
      },
    },
    safety: {
      school: {
        uk: 'Під час нагрівання отвір пробірки не спрямовують на себе чи інших людей.',
        en: 'When heating, never point the open end of a test tube at yourself or others.',
      },
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
} as const satisfies Record<string, VesselItem>;

export type VesselId = keyof typeof VESSEL_LIST;
export const VESSELS: Readonly<Record<VesselId, VesselItem>> = VESSEL_LIST;
