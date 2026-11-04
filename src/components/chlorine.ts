import { msg } from '../knowledge/messages.js';
import type { ComponentData } from './types.js';
import { cite, sv } from './sourced.js';

/** Cp 33.949 J/(mol·K), ΔfusH 6.406 kJ/mol, ΔvapH 20.41 kJ/mol ÷ 0.0709 kg/mol. */
export const CHLORINE = {
  id: 'chlorine',
  kind: 'element',
  group: 'gas',
  name: msg('component-chlorine'),
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
    novice: msg('component-chlorine-description-novice'),
    school: msg('component-chlorine-description-school'),
  },
  safety: {
    school: msg('component-chlorine-safety-school'),
  },
  media: [],
} as const satisfies ComponentData;
