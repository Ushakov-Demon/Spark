import { msg } from '../knowledge/messages.js';
import type { ComponentData } from './types.js';
import { cite, estimate, sv } from './sourced.js';

export const SUNFLOWER_OIL = {
  id: 'sunflower-oil',
  kind: 'material',
  group: 'oil',
  name: msg('component-sunflower-oil'),
  madeOf: [{ part: msg('component-sunflower-oil-made-of-part') }],
  wikidata: 'Q94787',
  stateAtRoom: 'liquid',
  phases: {
    liquid: {
      viscosity: sv(0.04914, 'Pa·s', 'unrefined, 25 °C', 'single-source', 0.05, [cite('wikipedia-sunflower-oil', 'Physical properties: viscosity (25 °C), unrefined, 0.04914 kg/(m·s)', '25 °C', 0.04914)], 'Refined oils and lower temperatures differ by tens of per cent.'),
      density: sv(918.8, 'kg/m³', '25 °C', 'single-source', 0.01, [cite('wikipedia-sunflower-oil', 'Physical properties: density', '25 °C', 918.8)], 'Second source not checked yet.'),
      specificHeat: estimate(2000, 'J/(kg·K)', 'room temperature', 1800, 2300, 'Measured values exist (Rojas et al. 2013) but we could not access the numbers; typical for vegetable oils.'),
      conductivity: sv(0.168, 'W/(m·K)', '25 °C', 'single-source', 0.01, [cite('turgut-2009-oils', 'sunflower oil, hot-wire', '25 °C', 0.168)], 'One measurement study (hot-wire method). Second source not checked yet.'),
    },
  },
  decomposes: {
    point: sv(232, '°C', 'refined oil (unrefined: 107 °C)', 'single-source', 0.01, [cite('wikipedia-sunflower-oil', 'Smoke point, refined', 'refined', 232)], 'Smoke points vary between oils and sources. Second source not checked yet.'),
    into: msg('component-sunflower-oil-decomposes-into'),
  },
  inWater: { solubility: 'immiscible' },
  electrical: { conducts: 'insulator' },
  description: {
    novice: msg('component-sunflower-oil-description-novice'),
    school: msg('component-sunflower-oil-description-school'),
  },
  safety: {
    school: msg('component-sunflower-oil-safety-school'),
  },
  media: [],
  modelNotes: [
    msg('component-sunflower-oil-model-notes'),
  ],
} as const satisfies ComponentData;
