import type { Component } from './types.js';
import { cite, sv } from './sourced.js';

/** Cp 33.949 J/(mol·K), ΔfusH 6.406 kJ/mol, ΔvapH 20.41 kJ/mol ÷ 0.0709 kg/mol. */
export const CHLORINE = {
  id: 'chlorine',
  kind: 'element',
  group: 'gas',
  name: { uk: 'Хлор', en: 'Chlorine' },
  genitive: { uk: 'хлору', en: 'chlorine' },
  gender: 'm',
  formula: 'Cl₂',
  composition: { Cl: 2 },
  wikidata: 'Q688',
  stateAtRoom: 'gas',
  phases: {
    gas: {
      density: sv(3.2, 'kg/m³', '0 °C, 1 atm', 'single-source', 0.01, [cite('wikipedia-chlorine', 'Infobox: density at STP 3.2 g/L', 'STP', 3.2)], 'Only the Wikipedia infobox checked so far. About 2.5 times heavier than air.'),
      specificHeat: sv(479, 'J/(kg·K)', 'gas, 25 °C, constant pressure', 'cross-checked', 0.01, [cite('wikipedia-chlorine', 'Infobox: molar heat capacity (Cl₂) 33.949 J/(mol·K) ÷ 0.0709 kg/mol', '—', 478.8), cite('wikidata', 'Q688 P2056', '—', 480)]),
      conductivity: sv(0.0089, 'W/(m·K)', 'gas', 'single-source', 0.01, [cite('wikipedia-chlorine', 'Infobox: thermal conductivity 8.9 mW/(m·K)', '—', 0.0089)], 'Only the Wikipedia infobox checked so far.'),
    },
  },
  melting: {
    point: sv(-101.5, '°C', '1 atm', 'cross-checked', 0.002, [cite('wikipedia-chlorine', 'Infobox: melting point', '—', -101.5), cite('wikidata', 'Q688 P2101: 171.6 K', '—', -101.55)]),
    latentHeat: sv(90_350, 'J/kg', 'at the melting point', 'single-source', 0.01, [cite('wikipedia-chlorine', 'Infobox: heat of fusion (Cl₂) 6.406 kJ/mol ÷ 0.0709 kg/mol', '—', 90_352)], 'Only the Wikipedia infobox checked so far.'),
  },
  boiling: {
    point: sv(-34.04, '°C', '1 atm', 'cross-checked', 0.02, [cite('wikipedia-chlorine', 'Infobox: boiling point', '—', -34.04), cite('wikidata', 'Q688 P2102: 238.5 K', '—', -34.65)]),
    latentHeat: sv(287_900, 'J/kg', 'at the boiling point', 'single-source', 0.01, [cite('wikipedia-chlorine', 'Infobox: heat of vaporization (Cl₂) 20.41 kJ/mol ÷ 0.0709 kg/mol', '—', 287_870)], 'Only the Wikipedia infobox checked so far.'),
  },
  electrical: { conducts: 'insulator' },
  magnetic: 'diamagnetic',
  hazards: { oxidizer: true, irritant: true },
  description: {
    novice: {
      uk: 'Жовто-зелений газ із різким запахом — так пахне хлорка. Отруйний. Виділяється, коли крізь солону воду пропускають струм.',
      en: 'A yellow-green gas with a sharp smell — the smell of bleach. Poisonous. It forms when current passes through salt water.',
    },
    school: {
      uk: 'Хлор у 2,5 раза важчий за повітря і збирається внизу. У малих дозах ним знезаражують воду в басейнах і водогоні.',
      en: 'Chlorine is 2.5 times heavier than air and collects low down. In small doses it disinfects swimming pools and tap water.',
    },
  },
  safety: {
    school: {
      uk: 'Отруйний: подразнює очі й легені. Справжній електроліз солоної води роблять лише з малим струмом, у провітрюваному місці або під витяжкою.',
      en: 'Poisonous: irritates eyes and lungs. Real electrolysis of salt water is done only with a small current, in a ventilated place or under a fume hood.',
    },
  },
  media: [],
} as const satisfies Component;
