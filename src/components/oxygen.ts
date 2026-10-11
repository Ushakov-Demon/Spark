import type { Component } from './types.js';
import { cite, sv } from './sourced.js';

/** Cp 29.378 J/(mol·K), ΔfusH 0.444 kJ/mol, ΔvapH 6.82 kJ/mol ÷ 0.031998 kg/mol. */
export const OXYGEN = {
  id: 'oxygen',
  kind: 'element',
  group: 'gas',
  name: { uk: 'Кисень', en: 'Oxygen' },
  genitive: { uk: 'кисню', en: 'oxygen' },
  gender: 'm',
  formula: 'O₂',
  composition: { O: 2 },
  wikidata: 'Q5203615',
  stateAtRoom: 'gas',
  phases: {
    gas: {
      density: sv(1.429, 'kg/m³', '0 °C, 1 atm', 'cross-checked', 0.002, [cite('wikipedia-oxygen', 'Infobox: density at STP 1.429 g/L', 'STP', 1.429), cite('wikidata', 'Q5203615 P2054', 'not stated', 1.429)]),
      specificHeat: sv(918, 'J/(kg·K)', 'gas, 25 °C, constant pressure', 'cross-checked', 0.01, [cite('wikipedia-oxygen', 'Infobox: molar heat capacity (O₂) 29.378 J/(mol·K) ÷ 0.031998 kg/mol', '—', 918.1), cite('wikidata', 'Q5203615 P2056', '—', 920)]),
      conductivity: sv(0.0266, 'W/(m·K)', 'gas, ≈ 300 K', 'cross-checked', 0.03, [cite('wikipedia-oxygen', 'Infobox: thermal conductivity 26.58 mW/(m·K)', '—', 0.02658), cite('wikidata', 'Q5203615 P2068', '25 °C', 0.026)]),
    },
  },
  melting: {
    point: sv(-218.79, '°C', '1 atm', 'cross-checked', 0.002, [cite('wikipedia-oxygen', 'Infobox: melting point', '—', -218.79), cite('wikidata', 'Q5203615 P2101', '—', -218.79)]),
    latentHeat: sv(13_880, 'J/kg', 'at the melting point', 'single-source', 0.01, [cite('wikipedia-oxygen', 'Infobox: heat of fusion (O₂) 0.444 kJ/mol ÷ 0.031998 kg/mol', '—', 13_876)], 'Only the Wikipedia infobox checked so far.'),
  },
  boiling: {
    point: sv(-182.96, '°C', '1 atm', 'cross-checked', 0.001, [cite('wikipedia-oxygen', 'Infobox: boiling point', '—', -182.962), cite('wikidata', 'Q5203615 P2102', '101.325 kPa', -182.95)]),
    latentHeat: sv(213_100, 'J/kg', 'at the boiling point', 'single-source', 0.01, [cite('wikipedia-oxygen', 'Infobox: heat of vaporization (O₂) 6.82 kJ/mol ÷ 0.031998 kg/mol', '—', 213_140)], 'Only the Wikipedia infobox checked so far.'),
  },
  electrical: { conducts: 'insulator' },
  magnetic: 'paramagnetic',
  hazards: { oxidizer: true },
  description: {
    novice: {
      uk: 'Газ, яким ми дихаємо: його у повітрі приблизно п’ята частина. Без кисню не горить вогонь.',
      en: 'The gas we breathe: about a fifth of the air. Without oxygen there is no fire.',
    },
    school: {
      uk: 'Кисень підтримує горіння — у чистому кисні жевріюча скіпка спалахує. Рідкий кисень блакитний і притягується магнітом.',
      en: 'Oxygen supports burning — a glowing splint bursts into flame in pure oxygen. Liquid oxygen is pale blue and is attracted by a magnet.',
    },
  },
  safety: { school: { uk: 'Чистий кисень робить горіння дуже бурхливим: поруч із ним не можна олії, жиру й відкритого вогню.', en: 'Pure oxygen makes things burn violently: keep oil, grease and open flames away from it.' } },
  media: [],
} as const satisfies Component;
