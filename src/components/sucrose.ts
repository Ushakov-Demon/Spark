import type { Component } from './types.js';
import { cite, sv } from './sourced.js';

/** Cp 424.30 J/(mol·K) ÷ 0.342297 kg/mol (molar mass from the formula). */
export const SUCROSE = {
  id: 'sucrose',
  kind: 'compound',
  group: 'sugar',
  name: { uk: 'Цукор (сахароза)', en: 'Sugar (sucrose)' },
  gender: 'm',
  formula: 'C₁₂H₂₂O₁₁',
  composition: { C: 12, H: 22, O: 11 },
  wikidata: 'Q4027534',
  stateAtRoom: 'solid',
  phases: {
    solid: {
      density: sv(1587, 'kg/m³', 'solid, 20 °C', 'cross-checked', 0.01, [cite('wikipedia-sucrose', 'Chembox: density 1.587 g/cm³', 'solid', 1587), cite('wikidata', 'Q4027534 P2054', 'solid, 20 °C', 1590)]),
      specificHeat: sv(1240, 'J/(kg·K)', 'solid, 25 °C', 'single-source', 0.01, [cite('nist-sucrose', 'Cp,solid 424.30 J/(mol·K) at 298.15 K ÷ 0.342297 kg/mol', '298.15 K', 1239.6)], 'Wikipedia gives no heat capacity; NIST lists four measurements, 422.5–430 J/(mol·K), within 2 % of each other.'),
    },
  },
  decomposes: {
    point: sv(189, '°C', 'melts and decomposes (caramelises)', 'cross-checked', 0.02, [cite('wikipedia-sucrose', 'Chembox: melting point 189 °C', '—', 189), cite('wikidata', 'Q4027534 P2101', '—', 188)], 'Wikidata also lists 183 °C: the "melting" of sucrose depends on the heating rate because it decomposes at the same time.'),
    into: { uk: 'карамель, воду, а далі вуглець (обвуглюється)', en: 'caramel, water and then carbon (it chars)' },
  },
  inWater: {
    solubility: sv(200, 'g/100 g water', '20 °C', 'cross-checked', 0.01, [cite('wikidata', 'Q4027534 P2177', '68 °F, water', 200), cite('wikipedia-sucrose', 'Chembox: solubility 2.01 g/mL at 20 °C', '20 °C', 201)]),
  },
  electrical: { conducts: 'insulator' },
  hazards: {},
  description: {
    novice: {
      uk: 'Звичайний цукор. Дуже добре розчиняється у воді — у склянці води можна розчинити вдвічі більше цукру за масою, ніж самої води. При нагріванні не плавиться спокійно, а карамелізується й обвуглюється.',
      en: 'Ordinary sugar. It dissolves extremely well in water — a glass of water can dissolve twice its own mass of sugar. Heated, it does not simply melt but caramelises and chars.',
    },
    school: {
      uk: 'На відміну від солі, цукор у воді не розпадається на йони, тому розчин цукру не проводить електричний струм. Його розчинність сильно зростає з температурою — так виготовляють сиропи й вирощують цукрові кристали.',
      en: 'Unlike salt, sugar does not split into ions in water, so a sugar solution does not conduct electricity. Its solubility rises strongly with temperature — that is how syrups are made and sugar crystals grown.',
    },
  },
  media: [],
  modelNotes: [{ uk: 'Розчинення цукру рушій поки не розраховує: для цього потрібна крива розчинності, яку ще треба перевірити за джерелами.', en: 'The engine does not compute dissolving sugar yet: it needs a solubility curve still to be checked against sources.' }],
} as const satisfies Component;
