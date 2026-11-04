import { msg } from '../knowledge/messages.js';
import type { ComponentData } from './types.js';

export const WOOD = {
  id: 'wood',
  kind: 'material',
  group: 'material',
  name: msg('component-wood'),
  madeOf: [{ part: msg('component-wood-made-of-part') }, { part: msg('component-wood-made-of-part-2') }],
  stateAtRoom: 'solid',
  phases: {
    solid: {
      density: {
        value: 510,
        unit: 'kg/m³',
        conditions: 'pine (Scots), dry',
        verification: 'cross-checked',
        tolerance: 0.05,
        citations: [
          { source: 'engineeringtoolbox-wood-density', locator: 'Pine, Scots', conditions: 'not stated', value: 510 },
          { source: 'wikipedia-wood', locator: 'Table: pines at 12 % moisture (Eastern white 350 … Longleaf 590)', conditions: '12 % moisture', range: [350, 590] },
        ],
        note: 'Wood varies a lot by species and moisture (balsa ≈ 150, oak ≈ 750); pine is taken here.',
      },
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
    novice: msg('component-wood-description-novice'),
    school: msg('component-wood-description-school'),
  },
  media: [],
} as const satisfies ComponentData;
