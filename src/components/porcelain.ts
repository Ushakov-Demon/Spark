import { msg } from '../knowledge/messages.js';
import type { ComponentData } from './types.js';
import { cite, sv } from './sourced.js';

/** Porcelain: what crucibles are made of — it stands red heat. */
export const PORCELAIN = {
  id: 'porcelain',
  kind: 'material',
  group: 'material',
  name: msg('component-porcelain'),
  madeOf: [{ part: msg('component-porcelain-made-of-part') }],
  stateAtRoom: 'solid',
  phases: {
    solid: {
      density: sv(2400, 'kg/m³', 'not stated', 'single-source', 0.05, [{ source: 'engineeringtoolbox-solids-density', locator: 'Porcelain 2.3–2.5 ×10³ kg/m³', conditions: 'not stated', range: [2300, 2500] }], 'The middle of the range.'),
      specificHeat: sv(1070, 'J/(kg·K)', 'not stated', 'single-source', 0.02, [cite('engineeringtoolbox-specific-heat-solids', 'Porcelain 1.07 kJ/(kg·K)', 'not stated', 1070)], 'Porcelains differ; only one table checked.'),
      conductivity: sv(1.5, 'W/(m·K)', 'not stated', 'single-source', 0.05, [cite('engineeringtoolbox-thermal-conductivity', 'Porcelain 1.5 W/(m·K)', 'not stated', 1.5)], 'Porcelains differ; only one table checked.'),
    },
  },
  description: {
    novice: msg('component-porcelain-description-novice'),
    school: msg('component-porcelain-description-school'),
  },
  media: [],
} as const satisfies ComponentData;
