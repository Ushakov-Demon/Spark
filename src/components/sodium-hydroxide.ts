import { msg } from '../knowledge/messages.js';
import type { ComponentData } from './types.js';
import { cite, sv } from './sourced.js';

/** Cp 59.5 J/(mol·K) ÷ 0.039997 kg/mol. Dissolving it gives off a lot of heat. */
export const SODIUM_HYDROXIDE = {
  id: 'sodium-hydroxide',
  kind: 'compound',
  group: 'salt',
  name: msg('component-sodium-hydroxide'),
  formula: 'NaOH',
  composition: { Na: 1, O: 1, H: 1 },
  stateAtRoom: 'solid',
  phases: {
    solid: {
      density: sv(2130, 'kg/m³', 'solid', 'single-source', 0.01, [cite('wikipedia-sodium-hydroxide', 'Chembox: density 2.13 g/cm³', 'solid', 2130)], 'Second source not checked yet.'),
      specificHeat: sv(1488, 'J/(kg·K)', 'solid, 25 °C', 'single-source', 0.02, [cite('wikipedia-sodium-hydroxide', 'Chembox: heat capacity 59.5 J/(mol·K) ÷ 0.039997 kg/mol', '—', 1487.6)], 'Second source not checked yet.'),
    },
  },
  melting: { point: sv(323, '°C', '1 atm', 'single-source', 0.01, [cite('wikipedia-sodium-hydroxide', 'Chembox: melting point 323 °C', '—', 323)], 'Latent heat of fusion not checked yet: the model does not melt it.') },
  inWater: {
    solubility: sv(109, 'g/100 mL water', '20 °C', 'cross-checked', 0.1, [cite('wikipedia-solubility-table', 'Sodium hydroxide row: 109 at 20 °C', '20 °C', 109), cite('wikipedia-sodium-hydroxide', 'Chembox: 1000 g/L at 25 °C', '25 °C', 100)]),
    ions: ['Na⁺', 'OH⁻'],
    solubilityTable: {
      t: [10, 20, 30, 40, 60],
      gPer100g: [98, 109, 119, 129, 174],
      data: sv(109, 'g/100 g water', '20 °C', 'single-source', 0.02, [cite('wikipedia-solubility-table', 'Sodium hydroxide row, 10–60 °C', '20 °C', 109)], 'The table has 10–60 °C; outside it the model keeps the end values. The chembox gives 41.8 g/100 mL at 0 °C (below 12 °C a hydrate crystallises), not modelled.'),
    },
    conductivityTable: {
      w: [0, 0.005, 0.01, 0.02, 0.05],
      kappa: [0, 2.48, 4.86, 9.31, 20.6],
      data: sv(4.86, 'S/m', '1 % NaOH, 20 °C', 'single-source', 0.01, [cite('crc-electrical-conductivity', 'Sodium hydroxide row: 24.8, 48.6, 93.1, 206 mS/cm at 0.5–5 %', '20 °C', 4.86)], 'One table, up to 5 %; above it the model keeps the last value.'),
    },
    enthalpyOfSolution: sv(-44.51, 'kJ/mol', 'infinite dilution, 25 °C', 'single-source', 0.01, [cite('crc-enthalpy-of-solution', 'NaOH (c): −44.51 kJ/mol', '25 °C', -44.51)], 'At infinite dilution; in concentrated solutions less heat is given per mole — the model uses this value at any concentration.'),
  },
  electrical: { conducts: 'ions-in-solution' },
  hazards: { corrosive: true },
  description: {
    novice: msg('component-sodium-hydroxide-description-novice'),
    school: msg('component-sodium-hydroxide-description-school'),
  },
  safety: {
    school: msg('component-sodium-hydroxide-safety-school'),
  },
  media: [],
  modelNotes: [msg('component-sodium-hydroxide-model-notes')],
} as const satisfies ComponentData;
