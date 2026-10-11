import type { Component } from './types.js';
import { cite, sv } from './sourced.js';

export const IRON = {
  id: 'iron',
  kind: 'element',
  group: 'metal',
  name: { uk: 'Залізо', en: 'Iron' },
  gender: 'n',
  formula: 'Fe',
  composition: { Fe: 1 },
  wikidata: 'Q677',
  stateAtRoom: 'solid',
  phases: {
    solid: {
      density: sv(7874, 'kg/m³', 'solid, 20 °C', 'cross-checked', 0.001, [cite('wikipedia-iron', 'Infobox: density at 20 °C', '20 °C', 7874), cite('wikidata', 'Q677 P2054', 'solid, 20 °C', 7874)]),
      specificHeat: {
        value: 449,
        unit: 'J/(kg·K)',
        conditions: 'pure, 25 °C',
        verification: 'cross-checked',
        tolerance: 0.01,
        citations: [
          { source: 'wikidata', locator: 'Q677 P2056', conditions: 'not stated', value: 449 },
          { source: 'wikipedia-specific-heat', locator: 'Iron', conditions: '25 °C', value: 449 },
          { source: 'openstax-cp2e', locator: 'Table 14.1, Iron, steel', conditions: '25 °C', value: 452 },
        ],
      },
      conductivity: {
        value: 80,
        unit: 'W/(m·K)',
        conditions: 'pure, ≈ 293–300 K',
        verification: 'cross-checked',
        tolerance: 0.06,
        citations: [
          { source: 'wikipedia-thermal-conductivity', locator: 'Iron (pure, CRC)', conditions: '≈ 300 K', value: 80.2 },
          { source: 'openstax-cp2e', locator: 'Table 14.3, Steel iron', conditions: 'near 0 °C', value: 80 },
          { source: 'wikidata', locator: 'Q677 P2068', conditions: 'not stated', value: 84 },
        ],
      },
    },
  },
  melting: { point: sv(1538, '°C', '1 atm', 'cross-checked', 0.001, [cite('wikipedia-iron', 'Infobox: melting point', '—', 1538), cite('wikidata', 'Q677 P2101', '—', 1538)]) },
  boiling: { point: sv(2861, '°C', '1 atm', 'cross-checked', 0.001, [cite('wikipedia-iron', 'Infobox: boiling point', '—', 2861), cite('wikidata', 'Q677 P2102', '—', 2861)]) },
  electrical: { conducts: 'metal', resistivity: sv(96.1e-9, 'Ω·m', 'solid, 20 °C', 'single-source', 0.01, [cite('wikipedia-iron', 'Infobox: electrical resistivity at 20 °C, 96.1 nΩ·m', '20 °C', 96.1e-9)], 'Only the Wikipedia infobox checked so far.') },
  magnetic: 'ferromagnetic',
  description: {
    novice: { uk: 'Метал, який притягується магнітом. Чисте залізо м’яке; майже все «залізо» навколо нас — це сталь і чавун, сплави заліза з вуглецем.', en: "A metal attracted by magnets. Pure iron is soft; almost all the “iron” around us is steel or cast iron — alloys of iron and carbon." },
    school: { uk: 'Залізо — феромагнетик: саме тому індукційна плита гріє чавунний посуд. Плавиться при 1538 °C.', en: "Iron is ferromagnetic — that is why an induction hob heats cast-iron cookware. It melts at 1538 °C." },
  },
  media: [],
} as const satisfies Component;
