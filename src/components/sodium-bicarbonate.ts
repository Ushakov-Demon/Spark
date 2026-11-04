import { msg } from '../knowledge/messages.js';
import type { ComponentData } from './types.js';
import { cite, sv } from './sourced.js';

/** Cp 87.6 J/(mol·K) ÷ 0.084006 kg/mol. */
export const SODIUM_BICARBONATE = {
  id: 'sodium-bicarbonate',
  kind: 'compound',
  group: 'salt',
  name: msg('component-sodium-bicarbonate'),
  formula: 'NaHCO₃',
  composition: { Na: 1, H: 1, C: 1, O: 3 },
  wikidata: 'Q179731',
  stateAtRoom: 'solid',
  phases: {
    solid: {
      density: sv(2200, 'kg/m³', 'solid', 'cross-checked', 0.02, [cite('wikipedia-sodium-bicarbonate', 'Chembox: density 2.20 g/cm³ (CRC)', 'solid', 2200), cite('wikidata', 'Q179731 P2054', 'solid', 2159)]),
      specificHeat: sv(1043, 'J/(kg·K)', 'solid, 25 °C', 'single-source', 0.01, [cite('wikipedia-sodium-bicarbonate', 'Chembox: heat capacity 87.6 J/(mol·K) ÷ 0.084006 kg/mol', '—', 1042.8)], 'Wikidata has no heat capacity for it; Second source not checked yet.'),
    },
  },
  decomposes: {
    point: sv(50, '°C', 'starts to decompose', 'single-source', 0.05, [cite('wikipedia-sodium-bicarbonate', 'Chembox: decomposes to sodium carbonate starting at 50 °C', '—', 50)], 'Decomposition is slow at first and speeds up with temperature.'),
    into: msg('component-sodium-bicarbonate-decomposes-into'),
  },
  inWater: {
    solubility: sv(9.6, 'g/100 mL water', '20 °C', 'single-source', 0.01, [cite('wikipedia-sodium-bicarbonate', 'Chembox: 96 g/L at 20 °C', '20 °C', 9.6)], 'Wikidata has no solubility value for it; Second source not checked yet.'),
    ions: ['Na⁺', 'HCO₃⁻'],
    conductivityTable: {
      w: [0, 0.005, 0.01, 0.02, 0.05],
      kappa: [0, 0.42, 0.82, 1.5, 3.14],
      data: sv(0.82, 'S/m', '1 % NaHCO₃, 20 °C', 'single-source', 0.01, [cite('crc-electrical-conductivity', 'Sodium hydrogen carbonate row: 4.2, 8.2, 15.0, 31.4 mS/cm at 0.5–5 %', '20 °C', 0.82)], 'One table, up to 5 %; above it the model keeps the last value.'),
    },
    solubilityTable: {
      t: [0, 10, 20, 30, 40, 60],
      gPer100g: [7, 8.1, 9.6, 11.1, 12.7, 16],
      data: sv(9.6, 'g/100 g water', '20 °C', 'single-source', 0.01, [cite('wikipedia-solubility-table', 'Sodium hydrogen carbonate row, 0–60 °C', '20 °C', 9.6)], 'The table stops at 60 °C: above it the model keeps the 60 °C value. In hot water baking soda slowly decomposes, giving off CO₂ — not modelled yet.'),
    },
  },
  electrical: { conducts: 'ions-in-solution' },
  hazards: { irritant: true },
  description: {
    novice: msg('component-sodium-bicarbonate-description-novice'),
    school: msg('component-sodium-bicarbonate-description-school'),
  },
  safety: { school: msg('component-sodium-bicarbonate-safety-school') },
  media: [],
  modelNotes: [msg('component-sodium-bicarbonate-model-notes'), msg('component-sodium-bicarbonate-model-notes-2')],
} as const satisfies ComponentData;
