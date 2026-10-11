import type { Component } from './types.js';
import { cite, sv } from './sourced.js';

export const ALUMINIUM = {
  id: 'aluminium',
  kind: 'element',
  group: 'metal',
  name: { uk: 'Алюміній', en: 'Aluminium' },
  gender: 'm',
  formula: 'Al',
  composition: { Al: 1 },
  wikidata: 'Q663',
  stateAtRoom: 'solid',
  phases: {
    solid: {
      density: sv(2699, 'kg/m³', 'solid, 20 °C', 'cross-checked', 0.01, [cite('wikipedia-aluminium', 'Infobox: density at 20 °C', '20 °C', 2699), cite('wikidata', 'Q663 P2054', 'solid, 20 °C', 2700)]),
      specificHeat: {
        value: 897,
        unit: 'J/(kg·K)',
        conditions: 'solid, 25 °C',
        verification: 'cross-checked',
        tolerance: 0.01,
        citations: [
          { source: 'wikidata', locator: 'Q663 P2056', conditions: 'not stated', value: 897 },
          { source: 'wikipedia-specific-heat', locator: 'Aluminium', conditions: '25 °C', value: 897 },
          { source: 'openstax-cp2e', locator: 'Table 14.1, Aluminum', conditions: '25 °C', value: 900 },
        ],
      },
      conductivity: {
        value: 237,
        unit: 'W/(m·K)',
        conditions: 'pure, ≈ 293 K',
        verification: 'cross-checked',
        tolerance: 0.08,
        citations: [
          { source: 'wikipedia-thermal-conductivity', locator: 'Aluminium (pure)', conditions: '293 K', value: 237 },
          { source: 'wikidata', locator: 'Q663 P2068', conditions: 'solid', value: 236 },
          { source: 'openstax-cp2e', locator: 'Table 14.3, Aluminum', conditions: 'near 0 °C', value: 220 },
        ],
        note: 'OpenStax rounds down (220); alloys used in cookware are typically lower than pure Al.',
      },
    },
  },
  melting: { point: sv(660.32, '°C', '1 atm', 'cross-checked', 0.002, [cite('wikipedia-aluminium', 'Infobox: melting point', '—', 660.32), cite('wikidata', 'Q663 P2101', '—', 660)]) },
  boiling: { point: sv(2470, '°C', '1 atm', 'single-source', 0.01, [cite('wikipedia-aluminium', 'Infobox: boiling point', '—', 2470)], 'Wikidata gives 2327 °C; sources disagree on very high boiling points.') },
  electrical: { conducts: 'metal', resistivity: sv(26.5e-9, 'Ω·m', 'solid, 20 °C', 'single-source', 0.01, [cite('wikipedia-aluminium', 'Infobox: electrical resistivity at 20 °C, 26.5 nΩ·m', '20 °C', 26.5e-9)], 'Only the Wikipedia infobox checked so far.') },
  magnetic: 'paramagnetic',
  description: {
    novice: { uk: 'Легкий метал (майже втричі легший за сталь), який добре проводить теплоту й електрику. З нього роблять каструлі, фольгу, дроти.', en: "A light metal (almost three times lighter than steel) that conducts heat and electricity well. Used for pots, foil, wires." },
    school: { uk: 'Теплопровідність алюмінію приблизно в 5 разів більша, ніж у сталі, тому дно алюмінієвої каструлі прогрівається рівномірно. Плавиться при 660 °C.', en: "Aluminium conducts heat about 5 times better than steel, so an aluminium pot heats evenly. It melts at 660 °C." },
  },
  media: [],
} as const satisfies Component;
