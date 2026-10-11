import type { Component } from './types.js';
import { cite, sv } from './sourced.js';

/** Cp 28.836 J/(mol·K), ΔfusH 0.117 kJ/mol, ΔvapH 0.904 kJ/mol ÷ 0.002016 kg/mol. */
export const HYDROGEN = {
  id: 'hydrogen',
  kind: 'element',
  group: 'gas',
  name: { uk: 'Водень', en: 'Hydrogen' },
  gender: 'm',
  formula: 'H₂',
  composition: { H: 2 },
  wikidata: 'Q3027893',
  stateAtRoom: 'gas',
  phases: {
    gas: {
      density: sv(0.08988, 'kg/m³', '0 °C, 1 atm', 'cross-checked', 0.001, [cite('wikipedia-hydrogen', 'Infobox: density at STP 0.08988 g/L', 'STP', 0.08988), cite('wikidata', 'Q556 P2054', '0 °C, 101.325 kPa', 0.08987)]),
      specificHeat: sv(14_300, 'J/(kg·K)', 'gas, 25 °C, constant pressure', 'cross-checked', 0.01, [cite('wikipedia-hydrogen', 'Infobox: molar heat capacity (H₂) 28.836 J/(mol·K) ÷ 0.002016 kg/mol', '—', 14_304), cite('wikidata', 'Q556 P2056', '—', 14_304)]),
      conductivity: sv(0.1805, 'W/(m·K)', 'gas, ≈ 300 K', 'single-source', 0.01, [cite('wikipedia-hydrogen', 'Infobox: thermal conductivity 0.1805 W/(m·K)', '—', 0.1805)], 'Only the Wikipedia infobox checked so far.'),
    },
  },
  melting: {
    point: sv(-259.16, '°C', '1 atm', 'cross-checked', 0.002, [cite('wikipedia-hydrogen', 'Infobox: melting point', '—', -259.16), cite('wikidata', 'Q556 P2101', '—', -259.14)]),
    latentHeat: sv(58_000, 'J/kg', 'at the melting point', 'single-source', 0.01, [cite('wikipedia-hydrogen', 'Infobox: heat of fusion (H₂) 0.117 kJ/mol ÷ 0.002016 kg/mol', '—', 58_036)], 'Only the Wikipedia infobox checked so far.'),
  },
  boiling: {
    point: sv(-252.88, '°C', '1 atm', 'cross-checked', 0.001, [cite('wikipedia-hydrogen', 'Infobox: boiling point', '—', -252.879), cite('wikidata', 'Q3027893 P2102', '101.325 kPa', -252.87)]),
    latentHeat: sv(448_400, 'J/kg', 'at the boiling point', 'single-source', 0.01, [cite('wikipedia-hydrogen', 'Infobox: heat of vaporization (H₂) 0.904 kJ/mol ÷ 0.002016 kg/mol', '—', 448_413)], 'Only the Wikipedia infobox checked so far.'),
  },
  electrical: { conducts: 'insulator' },
  magnetic: 'diamagnetic',
  hazards: { flammable: true },
  description: {
    novice: {
      uk: 'Найлегший газ: у 14 разів легший за повітря. Горить, а з повітрям утворює вибухову суміш. Виділяється, наприклад, коли струм проходить крізь воду.',
      en: 'The lightest gas: 14 times lighter than air. It burns, and with air forms an explosive mixture. It is released, for example, when current passes through water.',
    },
    school: {
      uk: 'Водень має найбільшу питому теплоємність серед газів (≈ 14 кДж/(кг·K)) і дуже добре проводить теплоту. Згоряючи, утворює лише воду.',
      en: 'Hydrogen has the highest specific heat of all gases (≈ 14 kJ/(kg·K)) and conducts heat very well. Burning, it forms only water.',
    },
  },
  safety: { school: { uk: 'Суміш водню з повітрям вибухає від іскри. Справжні досліди з воднем роблять лише з малими кількостями й подалі від вогню.', en: 'A hydrogen–air mixture explodes from a spark. Real experiments with hydrogen use only small amounts, away from flames.' } },
  media: [],
} as const satisfies Component;
