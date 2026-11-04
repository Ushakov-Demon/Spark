import { msg } from '../knowledge/messages.js';
import type { ComponentData } from './types.js';

export const GLASS = {
  id: 'glass',
  kind: 'material',
  group: 'material',
  name: msg('component-glass'),
  madeOf: [{ part: msg('component-glass-made-of-part'), fraction: 0.7 }],
  stateAtRoom: 'solid',
  phases: {
    solid: {
      density: {
        value: 2520,
        unit: 'kg/m³',
        conditions: 'soda-lime glass, 20 °C',
        verification: 'cross-checked',
        tolerance: 0.03,
        citations: [
          { source: 'wikipedia-soda-lime-glass', locator: 'Typical compositions and properties: density at 20 °C (container glass)', conditions: '20 °C', value: 2520 },
          { source: 'engineeringtoolbox-solids-density', locator: 'Glass, common', conditions: 'not stated', range: [2400, 2800] },
        ],
      },
      specificHeat: {
        value: 840,
        unit: 'J/(kg·K)',
        conditions: 'solid, 25 °C',
        verification: 'cross-checked',
        tolerance: 0.01,
        citations: [
          { source: 'wikipedia-specific-heat', locator: 'Glass (silica)', conditions: '25 °C', value: 840 },
          { source: 'openstax-cp2e', locator: 'Table 14.1, Glass', conditions: '25 °C', value: 840 },
        ],
        note: 'Depends on type: crown ≈ 670, flint ≈ 503, borosilicate ≈ 753 (Wikipedia).',
      },
      conductivity: {
        value: 0.84,
        unit: 'W/(m·K)',
        conditions: 'average, ≈ 293 K',
        verification: 'cross-checked',
        tolerance: 0.02,
        citations: [
          { source: 'openstax-cp2e', locator: 'Table 14.3, Glass (average)', conditions: 'near 0 °C', value: 0.84 },
          { source: 'wikipedia-thermal-conductivity', locator: 'Glass (general)', conditions: '293 K', range: [0.8, 0.93] },
        ],
      },
    },
  },
  electrical: { conducts: 'insulator' },
  magnetic: 'diamagnetic',
  description: {
    novice: msg('component-glass-description-novice'),
    school: msg('component-glass-description-school'),
  },
  media: [],
} as const satisfies ComponentData;
