import type { Component } from './types.js';
import { cite, sv } from './sourced.js';

export const CALCIUM_CARBONATE = {
  id: 'calcium-carbonate',
  kind: 'compound',
  group: 'mineral',
  name: { uk: 'Крейда (карбонат кальцію)', en: 'Chalk (calcium carbonate)' },
  genitive: { uk: 'крейди', en: 'chalk' },
  gender: 'f',
  formula: 'CaCO₃',
  composition: { Ca: 1, C: 1, O: 3 },
  wikidata: 'Q23767',
  stateAtRoom: 'solid',
  phases: {
    solid: {
      density: sv(2711, 'kg/m³', 'calcite', 'cross-checked', 0.01, [cite('wikipedia-calcium-carbonate', 'Chembox: density 2.711 g/cm³ (calcite)', '—', 2711), cite('wikidata', 'Q23767 P2054', '20 °C', 2700)]),
      specificHeat: sv(880, 'J/(kg·K)', 'marble (calcium carbonate rock)', 'single-source', 0.05, [cite('wikipedia-specific-heat', 'Marble, mica: 0.880 J/(g·K)', 'not stated', 880)], 'Taken for marble, which is calcium carbonate like chalk; a table of CaCO₃ itself is not checked yet.'),
    },
  },
  inWater: {
    solubility: sv(0.0013, 'g/100 mL water', '25 °C', 'single-source', 0.05, [cite('wikipedia-calcium-carbonate', 'Chembox: 0.013 g/L at 25 °C', '25 °C', 0.0013)], 'Practically insoluble. Wikidata gives 0.001 g/100 g at 20 °C — the same order.'),
  },
  electrical: { conducts: 'insulator' },
  hazards: {},
  description: {
    novice: {
      uk: 'З нього складаються крейда, мармур, вапняк, яєчна шкаралупа й черепашки. У воді майже не розчиняється, а в оцті — шипить і поступово зникає.',
      en: 'Chalk, marble, limestone, eggshells and seashells are made of it. It barely dissolves in water, but in vinegar it fizzes and slowly disappears.',
    },
    school: {
      uk: 'Карбонат кальцію реагує з кислотами, виділяючи вуглекислий газ. При сильному нагріванні розкладається на негашене вапно (CaO) і CO₂.',
      en: 'Calcium carbonate reacts with acids, releasing carbon dioxide. Strongly heated, it breaks down into quicklime (CaO) and CO₂.',
    },
  },
  media: [],
  modelNotes: [{ uk: 'Температуру розкладання ще не перевірено за джерелами, тому в моделі крейда не розкладається.', en: 'The decomposition temperature is not checked against sources yet, so chalk does not decompose in the model.' }],
} as const satisfies Component;
