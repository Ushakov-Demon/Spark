import type { Component } from './types.js';
import { cite, estimate, sv } from './sourced.js';

/**
 * Pure (glacial) acetic acid. Table vinegar is a 6–9 % solution of it in water.
 * Cp 123.1 J/(mol·K), ΔfusH 11.72 kJ/mol, ΔvapH 23.7 kJ/mol ÷ 0.060052 kg/mol.
 */
export const ACETIC_ACID = {
  id: 'acetic-acid',
  kind: 'compound',
  group: 'acid',
  name: { uk: 'Оцтова кислота', en: 'Acetic acid' },
  genitive: { uk: 'оцтової кислоти', en: 'acetic acid' },
  gender: 'f',
  formula: 'CH₃COOH',
  composition: { C: 2, H: 4, O: 2 },
  wikidata: 'Q47512',
  stateAtRoom: 'liquid',
  phases: {
    solid: {
      density: sv(1270, 'kg/m³', 'solid', 'single-source', 0.01, [cite('wikipedia-acetic-acid', 'Chembox: density 1.27 g/cm³ (solid)', 'solid', 1270)], 'Second source not checked yet.'),
      specificHeat: estimate(1400, 'J/(kg·K)', 'solid, below 16.6 °C', 1100, 1700, 'No source found; solids of organic acids typically have 60–80 % of the liquid value.'),
    },
    liquid: {
      density: sv(1049, 'kg/m³', 'liquid, ≈ 20–25 °C', 'cross-checked', 0.01, [cite('wikipedia-acetic-acid', 'Chembox: density 1.049 g/cm³ (liquid)', 'liquid', 1049), cite('wikidata', 'Q47512 P2054', 'liquid, 25 °C', 1044.6)]),
      specificHeat: sv(2050, 'J/(kg·K)', 'liquid, 25 °C', 'cross-checked', 0.01, [
        cite('nist-acetic-acid', 'Cp,liquid 123.1 J/(mol·K) at 298.15 K (Martin and Andon, 1982)', '298.15 K', 2049.9),
        cite('wikipedia-acetic-acid', 'Chembox: heat capacity 123.1 J/(K·mol)', '—', 2049.9),
      ], 'Both cite the same measurement.'),
    },
  },
  melting: {
    point: sv(16.6, '°C', '1 atm', 'cross-checked', 0.02, [cite('wikidata', 'Q47512 P2101', '—', 16.6), cite('nist-acetic-acid', 'Tfus 289.6 ± 0.5 K', 'average of 8 values', 16.45)]),
    latentHeat: sv(195_200, 'J/kg', 'at the melting point', 'single-source', 0.02, [cite('nist-acetic-acid', 'ΔfusH 11.72 kJ/mol ÷ 0.060052 kg/mol', '298.7 K', 195_160)], 'NIST lists several measurements, 10.8–11.7 kJ/mol; the evaluated 11.72 kJ/mol is used.'),
  },
  boiling: {
    point: sv(117.9, '°C', '1 atm', 'cross-checked', 0.005, [cite('wikidata', 'Q47512 P2102', '101.325 kPa', 117.9), cite('nist-acetic-acid', 'Tboil 391.2 ± 0.6 K', 'average', 118.05)]),
    latentHeat: sv(394_700, 'J/kg', 'at the boiling point', 'single-source', 0.02, [cite('nist-acetic-acid', 'ΔvapH 23.7 kJ/mol at 391.1 K ÷ 0.060052 kg/mol', '391.1 K', 394_660)], 'Unusually low: in the vapour acetic acid molecules pair up (dimers). At lower temperatures NIST lists 39–41 kJ/mol.'),
  },
  // A weak acid: in water only about 1 % of it splits into ions — one particle per molecule.
  inWater: { solubility: 'miscible', ions: ['H⁺', 'CH₃COO⁻'], particles: 1 },
  electrical: { conducts: 'ions-in-solution' },
  hazards: {
    flammable: true,
    corrosive: true,
    flashPoint: sv(39, '°C', 'closed cup', 'single-source', 0.05, [cite('wikidata', 'Q47512 P2128', '—', 39)], 'Only Wikidata checked (it also lists 103 °F ≈ 39.4 °C, Pensky–Martens closed cup).'),
  },
  description: {
    novice: {
      uk: 'Кислота з різким запахом оцту. Столовий оцет — це 6–9 % розчин оцтової кислоти у воді. Чиста кислота замерзає вже при 16,6 °C, тому її називають «льодяною».',
      en: 'An acid with a sharp vinegar smell. Table vinegar is a 6–9 % solution of acetic acid in water. The pure acid freezes already at 16.6 °C, which is why it is called “glacial”.',
    },
    school: {
      uk: 'Слабка кислота: у воді на йони розпадається лише мала частка молекул. Реагує з содою й крейдою, виділяючи вуглекислий газ.',
      en: 'A weak acid: only a small share of its molecules split into ions in water. It reacts with baking soda and chalk, releasing carbon dioxide.',
    },
  },
  safety: {
    school: {
      uk: 'Концентрована оцтова кислота роз’їдає шкіру й очі, а її пара горить. Працюють із нею лише в окулярах і рукавичках.',
      en: 'Concentrated acetic acid burns skin and eyes, and its vapour is flammable. Work with it only in goggles and gloves.',
    },
  },
  media: [],
  modelNotes: [{ uk: 'Випаровування оцтової кислоти нижче температури кипіння поки не враховано: немає перевірених даних про тиск її пари.', en: 'Evaporation of acetic acid below its boiling point is not modelled yet: no checked vapour-pressure data.' }],
} as const satisfies Component;
