import type { Component } from './types.js';

export const GLASS = {
  id: 'glass',
  kind: 'material',
  group: 'material',
  name: { uk: 'Скло', en: 'Glass' },
  gender: 'n',
  madeOf: [{ part: { uk: 'діоксид кремнію (пісок)', en: 'silicon dioxide (sand)' }, fraction: 0.7 }],
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
    novice: { uk: 'Прозорий твердий матеріал, який погано проводить теплоту. Лабораторний посуд роблять із термостійкого скла.', en: "A transparent solid that conducts heat poorly. Lab glassware is made of heat-resistant glass." },
    school: { uk: 'Скло проводить теплоту в десятки й сотні разів гірше за метали, тому скляний стакан нагрівається повільно. Термостійке (боросилікатне) скло не тріскається від різкого нагрівання.', en: "Glass conducts heat tens to hundreds of times worse than metals, so a glass beaker heats slowly. Heat-resistant (borosilicate) glass does not crack when heated quickly." },
  },
  media: [],
} as const satisfies Component;
