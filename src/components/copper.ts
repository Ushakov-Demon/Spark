import type { Component } from './types.js';
import { cite, sv } from './sourced.js';

export const COPPER = {
  id: 'copper',
  kind: 'element',
  group: 'metal',
  name: { uk: 'Мідь', en: 'Copper' },
  gender: 'f',
  formula: 'Cu',
  composition: { Cu: 1 },
  wikidata: 'Q753',
  stateAtRoom: 'solid',
  phases: {
    solid: {
      density: sv(8935, 'kg/m³', 'solid, 20 °C', 'cross-checked', 0.01, [cite('wikipedia-copper', 'Infobox: density at 20 °C', '20 °C', 8935), cite('wikidata', 'Q753 P2054', 'solid, 20 °C', 8940)]),
      specificHeat: {
        value: 385,
        unit: 'J/(kg·K)',
        conditions: 'solid, 25 °C',
        verification: 'cross-checked',
        tolerance: 0.01,
        citations: [
          { source: 'wikidata', locator: 'Q753 P2056', conditions: 'not stated', value: 385 },
          { source: 'wikipedia-specific-heat', locator: 'Copper', conditions: '25 °C', value: 385 },
          { source: 'openstax-cp2e', locator: 'Table 14.1, Copper', conditions: '25 °C', value: 387 },
        ],
      },
      conductivity: {
        value: 401,
        unit: 'W/(m·K)',
        conditions: 'pure, ≈ 293–300 K',
        verification: 'cross-checked',
        tolerance: 0.03,
        citations: [
          { source: 'wikipedia-thermal-conductivity', locator: 'Copper (pure)', conditions: '293 K', value: 401 },
          { source: 'wikidata', locator: 'Q753 P2068', conditions: '20 °C', value: 395 },
          { source: 'openstax-cp2e', locator: 'Table 14.3, Copper', conditions: 'near 0 °C', value: 390 },
        ],
      },
    },
  },
  melting: { point: sv(1084.62, '°C', '1 atm', 'cross-checked', 0.002, [cite('wikipedia-copper', 'Infobox: melting point', '—', 1084.62), cite('wikidata', 'Q753 P2101', '—', 1085)]) },
  boiling: { point: sv(2562, '°C', '1 atm', 'cross-checked', 0.02, [cite('wikipedia-copper', 'Infobox: boiling point', '—', 2562), cite('wikidata', 'Q753 P2102', '—', 2595)]) },
  electrical: { conducts: 'metal', resistivity: sv(16.78e-9, 'Ω·m', 'solid, 20 °C', 'single-source', 0.01, [cite('wikipedia-copper', 'Infobox: electrical resistivity at 20 °C, 16.78 nΩ·m', '20 °C', 16.78e-9)], 'Only the Wikipedia infobox checked so far.') },
  magnetic: 'diamagnetic',
  description: {
    novice: { uk: 'Червонуватий метал, який найкраще (після срібла) проводить електрику й теплоту. З міді роблять дроти й дорогий посуд.', en: "A reddish metal, the best conductor of electricity and heat after silver. Used for wires and good cookware." },
    school: { uk: 'Питомий опір міді лише 0,017 мкОм·м — тому майже всі електричні дроти мідні. Теплопровідність ≈ 400 Вт/(м·K), у 9 разів більша, ніж у сталі.', en: "Copper's resistivity is only 0.017 µΩ·m — that is why almost all electric wires are copper. Its thermal conductivity ≈ 400 W/(m·K) is 9 times that of steel." },
  },
  media: [],
} as const satisfies Component;
