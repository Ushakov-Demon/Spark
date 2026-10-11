import type { Component } from './types.js';

export const WOOD = {
  id: 'wood',
  kind: 'material',
  group: 'material',
  name: { uk: 'Деревина', en: 'Wood' },
  gender: 'f',
  madeOf: [{ part: { uk: 'целюлоза', en: 'cellulose' } }, { part: { uk: 'лігнін', en: 'lignin' } }],
  stateAtRoom: 'solid',
  phases: {
    solid: {
      specificHeat: {
        value: 1700,
        unit: 'J/(kg·K)',
        conditions: 'dry, typical',
        verification: 'cross-checked',
        tolerance: 0.01,
        citations: [
          { source: 'wikipedia-specific-heat', locator: 'Wood (range 1200–2900)', conditions: 'not stated', value: 1700 },
          { source: 'openstax-cp2e', locator: 'Table 14.1, Wood', conditions: '25 °C', value: 1700 },
        ],
      },
      conductivity: {
        value: 0.13,
        unit: 'W/(m·K)',
        conditions: 'across the grain, typical (pine…oak)',
        verification: 'cross-checked',
        tolerance: 0.2,
        citations: [
          { source: 'openstax-cp2e', locator: 'Table 14.3, Wood', conditions: 'near 0 °C', range: [0.08, 0.16] },
          { source: 'wikipedia-thermal-conductivity', locator: 'White pine, across grain', conditions: 'not stated', value: 0.112 },
          { source: 'wikipedia-thermal-conductivity', locator: 'Oak, across grain', conditions: 'not stated', value: 0.147 },
        ],
        note: 'Depends on species and moisture; ±20 % is the honest uncertainty.',
      },
    },
  },
  electrical: { conducts: 'insulator' },
  hazards: { flammable: true },
  description: {
    novice: { uk: 'Природний матеріал із дерев. Погано проводить теплоту, тому дерев’яні ручки посуду не обпікають.', en: "A natural material from trees. It conducts heat poorly, so wooden handles do not burn your hand." },
    school: { uk: 'Теплопровідність деревини в сотні разів менша, ніж у металів. Вона горить, тому тримай її подалі від вогню.', en: "Wood conducts heat hundreds of times worse than metals. It burns, so keep it away from flames." },
  },
  media: [],
} as const satisfies Component;
