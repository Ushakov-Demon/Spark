import type { Component } from './types.js';

export const BRICK = {
  id: 'brick',
  kind: 'material',
  group: 'material',
  name: { uk: 'Цегла', en: 'Brick' },
  gender: 'f',
  madeOf: [{ part: { uk: 'випалена глина', en: 'fired clay' } }],
  stateAtRoom: 'solid',
  phases: {
    solid: {
      specificHeat: {
        value: 840,
        unit: 'J/(kg·K)',
        conditions: 'building brick',
        verification: 'single-source',
        tolerance: 0.02,
        citations: [{ source: 'wikipedia-specific-heat', locator: 'Brick (building materials)', conditions: 'not stated', value: 840 }],
        note: 'OpenStax 840 is for "concrete, granite", a different material, so it is not counted.',
      },
      conductivity: {
        value: 0.84,
        unit: 'W/(m·K)',
        conditions: 'building brick',
        verification: 'cross-checked',
        tolerance: 0.02,
        citations: [
          { source: 'openstax-cp2e', locator: 'Table 14.3, Concrete brick', conditions: 'near 0 °C', value: 0.84 },
          { source: 'wikipedia-thermal-conductivity', locator: 'Brick, outer leaf (UK 2016, 1700 kg/m³)', conditions: '293–298 K', value: 0.84 },
        ],
        note: 'Real bricks span 0.15–1.31 depending on density and moisture.',
      },
    },
  },
  electrical: { conducts: 'insulator' },
  description: {
    novice: { uk: 'Будівельний матеріал із випаленої глини. Повільно нагрівається й повільно віддає теплоту.', en: "A building material made of fired clay. It warms up slowly and gives its heat back slowly." },
    school: { uk: 'Цегла має невелику теплопровідність, тому з неї кладуть печі: вона довго тримає теплоту.', en: "Brick has a low thermal conductivity, which is why stoves are built of it: it holds heat for a long time." },
  },
  media: [],
} as const satisfies Component;
