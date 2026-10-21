import type { Component } from './types.js';
import { cite, sv } from './sourced.js';

/** Cp 87.6 J/(mol·K) ÷ 0.084006 kg/mol. */
export const SODIUM_BICARBONATE = {
  id: 'sodium-bicarbonate',
  kind: 'compound',
  group: 'salt',
  name: { uk: 'Харчова сода', en: 'Baking soda' },
  genitive: { uk: 'харчової соди', en: 'baking soda' },
  gender: 'f',
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
    into: { uk: 'кальциновану соду (Na₂CO₃), воду й вуглекислий газ', en: 'washing soda (Na₂CO₃), water and carbon dioxide' },
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
    novice: {
      uk: 'Білий порошок, який є на кожній кухні. З оцтом бурхливо шипить — виділяється вуглекислий газ. Тому сода «розпушує» тісто.',
      en: 'A white powder found in every kitchen. With vinegar it fizzes violently, giving off carbon dioxide. That is why soda makes dough rise.',
    },
    school: {
      uk: 'Гідрокарбонат натрію NaHCO₃ уже від ≈ 50 °C починає розкладатися на Na₂CO₃, воду й CO₂. З кислотами (оцтова, лимонна) реагує, виділяючи CO₂.',
      en: 'Sodium hydrogen carbonate NaHCO₃ starts to decompose from ≈ 50 °C into Na₂CO₃, water and CO₂. With acids (acetic, citric) it reacts, releasing CO₂.',
    },
  },
  safety: { school: { uk: 'Подразнює очі — не допускай потрапляння в очі.', en: 'Irritates the eyes — keep it out of your eyes.' } },
  media: [],
  modelNotes: [{ uk: 'Хімічні реакції (сода + оцет) рушій поки не розраховує.', en: 'The engine does not compute chemical reactions (soda + vinegar) yet.' }, { uk: 'Теплоту розчинення ще не перевірено за джерелами, тому в моделі розчинення не змінює температуру.', en: 'The enthalpy of solution is not checked against sources yet, so in the model dissolving does not change the temperature.' }],
} as const satisfies Component;
