import { msg } from '../knowledge/messages.js';
import type { ComponentData } from './types.js';
import { cite, sv } from './sourced.js';

/** Cp 29.124 J/(mol·K), ΔfusH 0.72 kJ/mol, ΔvapH 5.57 kJ/mol ÷ 0.028014 kg/mol. */
export const NITROGEN = {
  id: 'nitrogen',
  kind: 'element',
  group: 'gas',
  name: msg('component-nitrogen'),
  formula: 'N₂',
  composition: { N: 2 },
  wikidata: 'Q2370426',
  stateAtRoom: 'gas',
  phases: {
    gas: {
      density: sv(1.2506, 'kg/m³', '0 °C, 1 atm', 'single-source', 0.001, [cite('wikipedia-nitrogen', 'Infobox: density at STP 1.2506 g/L', 'STP', 1.2506)], 'Wikidata gives only the density of solid nitrogen. Second source not checked yet.'),
      specificHeat: sv(1040, 'J/(kg·K)', 'gas, 25 °C, constant pressure', 'cross-checked', 0.01, [cite('wikipedia-nitrogen', 'Infobox: molar heat capacity (N₂) 29.124 J/(mol·K) ÷ 0.028014 kg/mol', '—', 1039.6), cite('wikidata', 'Q627 P2056', '—', 1040)]),
      conductivity: sv(0.0258, 'W/(m·K)', 'gas, ≈ 300 K', 'single-source', 0.01, [cite('wikipedia-nitrogen', 'Infobox: thermal conductivity 25.83 mW/(m·K)', '—', 0.02583)], 'Only the Wikipedia infobox checked so far.'),
    },
  },
  melting: {
    point: sv(-209.92, '°C', '1 atm', 'cross-checked', 0.001, [cite('wikipedia-nitrogen', 'Infobox: melting point', '—', -209.92), cite('wikidata', 'Q2370426 P2101', '—', -210)]),
    latentHeat: sv(25_700, 'J/kg', 'at the melting point', 'single-source', 0.01, [cite('wikipedia-nitrogen', 'Infobox: heat of fusion (N₂) 0.72 kJ/mol ÷ 0.028014 kg/mol', '—', 25_701)], 'Only the Wikipedia infobox checked so far.'),
  },
  boiling: {
    point: sv(-195.8, '°C', '1 atm', 'cross-checked', 0.001, [cite('wikipedia-nitrogen', 'Infobox: boiling point', '—', -195.795), cite('wikidata', 'Q2370426 P2102', '101.325 kPa', -195.79)]),
    latentHeat: sv(198_800, 'J/kg', 'at the boiling point', 'single-source', 0.01, [cite('wikipedia-nitrogen', 'Infobox: heat of vaporization (N₂) 5.57 kJ/mol ÷ 0.028014 kg/mol', '—', 198_829)], 'Only the Wikipedia infobox checked so far.'),
  },
  electrical: { conducts: 'insulator' },
  magnetic: 'diamagnetic',
  hazards: { asphyxiant: true },
  description: {
    novice: msg('component-nitrogen-description-novice'),
    school: msg('component-nitrogen-description-school'),
  },
  safety: { school: msg('component-nitrogen-safety-school') },
  media: [],
} as const satisfies ComponentData;
