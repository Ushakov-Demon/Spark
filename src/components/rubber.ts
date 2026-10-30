import type { Component } from './types.js';

export const RUBBER = {
  id: 'rubber',
  kind: 'material',
  group: 'material',
  name: { uk: 'Гума', en: 'Rubber' },
  gender: 'f',
  madeOf: [{ part: { uk: 'вулканізований каучук', en: 'vulcanised caoutchouc' }, fraction: 1 }],
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
    novice: { uk: 'Пружний матеріал: розтягується й стискається, а тоді повертає свою форму. З неї роблять ковпачки піпеток, кульки, шланги.', en: 'An elastic material: it stretches and squeezes, then comes back to its shape. Dropper caps, balloons and hoses are made of it.' },
    school: { uk: 'Гуму роблять із каучуку, нагріваючи його із сіркою (вулканізація). Звичайна м’яка гума трохи густіша за воду — 1,1 г/см³ — і тоне; чистий каучук легший за воду.', en: 'Rubber is made of caoutchouc heated with sulphur (vulcanisation). Ordinary soft rubber is a little denser than water — 1.1 g/cm³ — and sinks; pure caoutchouc is lighter than water.' },
  },
  media: [],
} as const satisfies Component;
