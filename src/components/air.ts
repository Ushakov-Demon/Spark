import type { Component } from './types.js';

export const AIR = {
  id: 'air',
  kind: 'material',
  group: 'gas',
  name: { uk: 'Повітря', en: 'Air' },
  gender: 'n',
  madeOf: [{ part: { uk: 'азот', en: 'nitrogen' }, fraction: 0.755 }, { part: { uk: 'кисень', en: 'oxygen' }, fraction: 0.231 }, { part: { uk: 'аргон', en: 'argon' }, fraction: 0.013 }],
  stateAtRoom: 'gas',
  phases: {
    gas: {
      specificHeat: {
        value: 1012,
        unit: 'J/(kg·K)',
        conditions: 'dry, constant pressure, room conditions',
        verification: 'cross-checked',
        tolerance: 0.01,
        citations: [
          { source: 'wikipedia-specific-heat', locator: 'Air (room conditions), cp', conditions: '23 °C, 1 atm', value: 1012 },
          { source: 'openstax-cp2e', locator: 'Table 14.1, Air (dry), cp', conditions: '20 °C, 1 atm', value: 1015 },
        ],
        note: 'cp (constant pressure). OpenStax also lists cv = 721 for closed-volume problems.',
      },
      conductivity: {
        value: 0.026,
        unit: 'W/(m·K)',
        conditions: '≈ 300 K, 1 bar',
        verification: 'cross-checked',
        tolerance: 0.15,
        citations: [
          { source: 'wikipedia-thermal-conductivity', locator: 'Air (CRC)', conditions: '300 K, 1 bar', value: 0.0262 },
          { source: 'openstax-cp2e', locator: 'Table 14.3, Air', conditions: 'near 0 °C', value: 0.023 },
        ],
        note: 'OpenStax value is for ~0 °C, hence the wider tolerance.',
      },
    },
  },
  electrical: { conducts: 'insulator' },
  description: {
    novice: { uk: 'Суміш газів навколо нас: здебільшого азот і кисень. Погано проводить теплоту — тому теплий одяг і подвійні вікна тримають тепло.', en: "The mixture of gases around us: mostly nitrogen and oxygen. It conducts heat poorly — that is why warm clothes and double windows keep heat in." },
    school: { uk: 'Теплопровідність повітря ≈ 0,026 Вт/(м·K) — у 20 разів менша, ніж у води. Нерухоме повітря — один із найкращих теплоізоляторів.', en: "Air conducts heat at ≈ 0.026 W/(m·K) — 20 times less than water. Still air is one of the best heat insulators." },
  },
  media: [],
  modelNotes: [{ uk: 'Склад повітря наведено приблизно, за масою; у моделі повітря — одна речовина зі своїми властивостями.', en: 'The composition of air is approximate, by mass; in the model air is one substance with its own properties.' }],
} as const satisfies Component;
