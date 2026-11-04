import { msg } from '../knowledge/messages.js';
import type { ComponentData } from './types.js';
import { cite, sv } from './sourced.js';

export const CALCIUM_CARBONATE = {
  id: 'calcium-carbonate',
  kind: 'compound',
  group: 'mineral',
  name: msg('component-calcium-carbonate'),
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
    novice: msg('component-calcium-carbonate-description-novice'),
    school: msg('component-calcium-carbonate-description-school'),
  },
  media: [],
  modelNotes: [msg('component-calcium-carbonate-model-notes')],
} as const satisfies ComponentData;
