import { msg } from '../knowledge/messages.js';
import type { ComponentData } from './types.js';
import { cite, sv } from './sourced.js';

/** Cp 218.9 J/(mol·K), ΔfusH 18.28 kJ/mol, ΔvapH 61.0 kJ/mol ÷ 0.092094 kg/mol. */
export const GLYCEROL = {
  id: 'glycerol',
  kind: 'compound',
  group: 'alcohol',
  name: msg('component-glycerol'),
  formula: 'C₃H₈O₃',
  composition: { C: 3, H: 8, O: 3 },
  wikidata: 'Q132501',
  stateAtRoom: 'liquid',
  phases: {
    solid: {
      specificHeat: sv(1629, 'J/(kg·K)', 'solid, 279–284 K average', 'single-source', 0.02, [cite('nist-glycerol', 'Cp,solid 150 J/(mol·K), 279–284 K (Volmer and Marder, 1931) ÷ 0.092094 kg/mol', '279–284 K', 1628.8)], 'The only measurement of the solid in NIST, averaged over 279–284 K.'),
    },
    liquid: {
      density: sv(1261, 'kg/m³', 'liquid, 20 °C', 'cross-checked', 0.005, [cite('wikipedia-glycerol', 'Chembox: density 1.261 g/cm³', '—', 1261), cite('wikidata', 'Q132501 P2054', 'liquid, 20 °C', 1261.3)]),
      specificHeat: sv(2377, 'J/(kg·K)', 'liquid, 25 °C', 'single-source', 0.02, [cite('nist-glycerol', 'Cp,liquid 218.9 J/(mol·K) at 298.15 K (Bastos et al., 1988) ÷ 0.092094 kg/mol', '298.15 K', 2376.9)], 'NIST lists several measurements, 218.9–229.3 J/(mol·K) (the higher one at 40 °C).'),
      viscosity: sv(1.412, 'Pa·s', 'liquid, 20 °C', 'single-source', 0.02, [cite('wikipedia-glycerol', 'Chembox: viscosity 1.412 Pa·s (20 °C)', '20 °C', 1.412)], 'Falls fast with temperature and with a little water in it.'),
      conductivity: sv(0.285, 'W/(m·K)', 'liquid, 25 °C', 'single-source', 0.01, [cite('wikidata', 'Q132501 P2068', 'liquid, 25 °C', 0.285)], 'Only Wikidata checked; it also gives 0.288…0.296 at 50…100 °C.'),
    },
  },
  melting: {
    point: sv(17.8, '°C', '1 atm', 'cross-checked', 0.03, [cite('wikipedia-glycerol', 'Chembox: melting point 17.8 °C', '—', 17.8), cite('wikidata', 'Q132501 P2101', '—', 18.2)]),
    latentHeat: sv(198_500, 'J/kg', 'at the melting point', 'single-source', 0.01, [cite('nist-glycerol', 'ΔfusH 18.28 kJ/mol (Acree, 1991) ÷ 0.092094 kg/mol', '293 K', 198_490)], 'NIST lists four measurements, 18.28–18.48 kJ/mol.'),
  },
  boiling: {
    point: sv(290, '°C', '1 atm', 'cross-checked', 0.005, [cite('wikipedia-glycerol', 'Chembox: boiling point 290 °C', '—', 290), cite('wikidata', 'Q132501 P2102', '101.325 kPa', 290)]),
    latentHeat: sv(662_400, 'J/kg', 'at the boiling point', 'single-source', 0.02, [cite('wikidata', 'Q132501 P2116: 61.0 kJ/mol at 289 °C ÷ 0.092094 kg/mol', '289 °C, 101.325 kPa', 662_370)], 'NIST lists 78.5 kJ/mol at 484 K (a lower temperature, so a higher value is expected).'),
  },
  inWater: { solubility: 'miscible' },
  electrical: { conducts: 'insulator' },
  hazards: { flashPoint: sv(160, '°C', 'closed cup', 'single-source', 0.05, [cite('wikipedia-glycerol', 'Chembox: flash point 160 °C (closed cup)', '—', 160)], 'Wikidata lists 191–199 °C (closed cup) and 176 °C (open cup): the result depends on the test method.') },
  description: {
    novice: msg('component-glycerol-description-novice'),
    school: msg('component-glycerol-description-school'),
  },
  media: [],
  modelNotes: [
    msg('component-glycerol-model-notes'),
    msg('component-glycerol-model-notes-2'),
  ],
} as const satisfies ComponentData;
