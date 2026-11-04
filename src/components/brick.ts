import { msg } from '../knowledge/messages.js';
import type { ComponentData } from './types.js';

export const BRICK = {
  id: 'brick',
  kind: 'material',
  group: 'material',
  name: msg('component-brick'),
  madeOf: [{ part: msg('component-brick-made-of-part') }],
  stateAtRoom: 'solid',
  phases: {
    solid: {
      density: { value: 1700, unit: 'kg/m³', conditions: 'building brick, outer leaf', verification: 'single-source', tolerance: 0.15, citations: [{ source: 'wikipedia-thermal-conductivity', locator: 'Brick, outer leaf (UK 2016, 1700 kg/m³)', conditions: '293–298 K', value: 1700 }], note: 'Bricks vary (≈ 1600–2000 kg/m³); the density the conductivity row is given for.' },
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
    novice: msg('component-brick-description-novice'),
    school: msg('component-brick-description-school'),
  },
  media: [],
} as const satisfies ComponentData;
