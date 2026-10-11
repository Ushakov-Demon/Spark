import type { Component } from './types.js';

export const BRASS = {
  id: 'brass',
  kind: 'material',
  group: 'alloy',
  name: { uk: 'Латунь', en: 'Brass' },
  gender: 'f',
  madeOf: [{ part: { uk: 'мідь', en: 'copper' }, fraction: 0.7 }, { part: { uk: 'цинк', en: 'zinc' }, fraction: 0.3 }],
  stateAtRoom: 'solid',
  phases: {
    solid: {
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
    novice: { uk: 'Жовтий сплав міді з цинком. З латуні роблять турки, крани, музичні інструменти.', en: "A yellow alloy of copper and zinc. Used for cezves, taps, musical instruments." },
    school: { uk: 'Латунь проводить теплоту в 2,5 раза гірше за чисту мідь, але значно краще за сталь.', en: "Brass conducts heat 2.5 times worse than pure copper, but much better than steel." },
  },
  media: [],
} as const satisfies Component;
