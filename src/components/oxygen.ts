import { msg } from '../knowledge/messages.js';
import type { ComponentData } from './types.js';
import { cite, sv } from './sourced.js';

/** Cp 29.378 J/(mol·K), ΔfusH 0.444 kJ/mol, ΔvapH 6.82 kJ/mol ÷ 0.031998 kg/mol. */
export const OXYGEN = {
  id: 'oxygen',
  kind: 'element',
  group: 'gas',
  name: msg('component-oxygen'),
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
    novice: msg('component-oxygen-description-novice'),
    school: msg('component-oxygen-description-school'),
  },
  safety: { school: msg('component-oxygen-safety-school') },
  media: [],
} as const satisfies ComponentData;
