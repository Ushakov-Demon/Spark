import { msg } from '../knowledge/messages.js';
import type { ComponentData } from './types.js';

export const BRASS = {
  id: 'brass',
  kind: 'material',
  group: 'alloy',
  name: msg('component-brass'),
  madeOf: [{ part: msg('component-brass-made-of-part'), fraction: 0.7 }, { part: msg('component-brass-made-of-part-2'), fraction: 0.3 }],
  stateAtRoom: 'solid',
  phases: {
    solid: {
      density: {
        value: 8530,
        unit: 'kg/m³',
        conditions: 'Cu ≈ 70 %, Zn ≈ 30 % (cartridge brass), room temperature',
        verification: 'cross-checked',
        tolerance: 0.03,
        citations: [
          { source: 'engineeringtoolbox-metal-densities', locator: 'Cartridge brass (70% Cu, 30% Zn)', conditions: '70/30', value: 8530 },
          { source: 'wikipedia-brass', locator: 'Properties: 8.4 to 8.73 g/cm³', conditions: 'depends on the Cu/Zn ratio', range: [8400, 8730] },
        ],
      },
      specificHeat: {
        value: 377,
        unit: 'J/(kg·K)',
        conditions: 'solid, room temperature',
        verification: 'single-source',
        tolerance: 0.01,
        citations: [{ source: 'wikidata', locator: 'Q39782 P2056', conditions: 'not stated', value: 377 }],
        note: 'Only one source found; depends somewhat on the copper/zinc ratio.',
      },
      conductivity: {
        value: 111,
        unit: 'W/(m·K)',
        conditions: 'Cu ≈ 70 %, ≈ 293 K',
        verification: 'cross-checked',
        tolerance: 0.1,
        citations: [
          { source: 'wikidata', locator: 'Q39782 P2068', conditions: '20 °C', value: 111 },
          { source: 'wikipedia-thermal-conductivity', locator: 'Brass Cu70%', conditions: '293–296 K', range: [109, 121] },
        ],
        note: 'Brass Cu63% is listed at 125; composition matters.',
      },
    },
  },
  magnetic: 'diamagnetic',
  description: {
    novice: msg('component-brass-description-novice'),
    school: msg('component-brass-description-school'),
  },
  media: [],
} as const satisfies ComponentData;
