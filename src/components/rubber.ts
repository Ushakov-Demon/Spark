import { msg } from '../knowledge/messages.js';
import type { ComponentData } from './types.js';

export const RUBBER = {
  id: 'rubber',
  kind: 'material',
  group: 'material',
  name: msg('component-rubber'),
  madeOf: [{ part: msg('component-rubber-made-of-part'), fraction: 1 }],
  stateAtRoom: 'solid',
  phases: {
    solid: {
      density: {
        value: 1100,
        unit: 'kg/m³',
        conditions: 'soft commercial rubber',
        verification: 'single-source',
        tolerance: 0.1,
        citations: [{ source: 'engineeringtoolbox-solids-density', locator: 'Rubber, soft commercial (hard: 1200; pure gum: 910–930)', conditions: 'not stated', value: 1100 }],
        note: 'Pure caoutchouc is lighter than water; the fillers of soft commercial rubber make it a little heavier.',
      },
      specificHeat: {
        value: 2010,
        unit: 'J/(kg·K)',
        conditions: 'not stated',
        verification: 'single-source',
        tolerance: 0.1,
        citations: [{ source: 'engineeringtoolbox-specific-heat-solids', locator: 'Rubber (India rubber: 1.13–4.1 kJ/(kg·K))', conditions: 'not stated', value: 2010 }],
        note: 'One table; rubbers vary widely (India rubber 1130–4100), so a typical value.',
      },
      conductivity: {
        value: 0.13,
        unit: 'W/(m·K)',
        conditions: 'natural rubber, temperature not stated',
        verification: 'single-source',
        tolerance: 0.2,
        citations: [{ source: 'engineeringtoolbox-thermal-conductivity', locator: 'Rubber, natural (hard rubber: 0.16)', conditions: 'not stated', value: 0.13 }],
        note: 'One table; hard rubber 0.16 — rubber is a poor conductor of heat whatever the kind.',
      },
    },
  },
  electrical: { conducts: 'insulator' },
  description: {
    novice: msg('component-rubber-description-novice'),
    school: msg('component-rubber-description-school'),
  },
  media: [],
} as const satisfies ComponentData;
