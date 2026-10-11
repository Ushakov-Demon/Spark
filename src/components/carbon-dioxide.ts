import type { Component } from './types.js';
import { cite, sv } from './sourced.js';

/** Cp 37.135 J/(mol·K) ÷ 0.044009 kg/mol. */
export const CARBON_DIOXIDE = {
  id: 'carbon-dioxide',
  kind: 'compound',
  group: 'gas',
  name: { uk: 'Вуглекислий газ', en: 'Carbon dioxide' },
  gender: 'm',
  formula: 'CO₂',
  composition: { C: 1, O: 2 },
  wikidata: 'Q1997',
  stateAtRoom: 'gas',
  phases: {
    solid: {
      name: { uk: 'Сухий лід', en: 'Dry ice' },
      density: sv(1562, 'kg/m³', 'solid, −78.5 °C, 1 atm', 'single-source', 0.01, [cite('wikipedia-carbon-dioxide', 'Chembox: 1562 kg/m³ solid at 1 atm and −78.5 °C', '—', 1562)], 'Wikidata lists 1560 for the solid, but with a wrong unit (g/m³), so it is not counted.'),
    },
    gas: {
      density: sv(1.98, 'kg/m³', '0 °C, 1 atm', 'single-source', 0.01, [cite('wikipedia-carbon-dioxide', 'Properties: density at STP around 1.98 kg/m³', 'STP', 1.98)], 'About 1.5 times heavier than air — it collects near the floor.'),
      specificHeat: sv(844, 'J/(kg·K)', 'gas, 25 °C, constant pressure', 'single-source', 0.01, [cite('wikipedia-carbon-dioxide', 'Chembox: heat capacity 37.135 J/(K·mol) ÷ 0.044009 kg/mol', '—', 843.8)], 'Wikidata has no heat capacity for CO₂; Second source not checked yet.'),
    },
  },
  sublimation: {
    point: sv(-78.46, '°C', '1 atm', 'cross-checked', 0.002, [cite('wikipedia-carbon-dioxide', 'Chembox: sublimation 194.6855 K (−78.4645 °C) at 1 atm', '1 atm', -78.4645), cite('wikidata', 'Q1997 P2113', '1 atm', -78.5)]),
  },
  inWater: {
    solubility: sv(0.145, 'g/100 mL water', '25 °C, 100 kPa', 'single-source', 0.01, [cite('wikipedia-carbon-dioxide', 'Chembox: 1.45 g/L at 25 °C, 100 kPa', '25 °C', 0.145)], 'Wikidata gives 0.2 g/100 g at 25 °C. More dissolves under pressure — that is what makes soda water fizzy.'),
  },
  electrical: { conducts: 'insulator' },
  hazards: { asphyxiant: true },
  description: {
    novice: {
      uk: 'Газ без кольору, який ми видихаємо. Саме він робить газовану воду газованою. Замерзлий — це «сухий лід»: він не тане, а одразу перетворюється на газ.',
      en: 'A colourless gas that we breathe out. It is what makes soda water fizzy. Frozen, it is “dry ice”: it does not melt but turns straight into gas.',
    },
    school: {
      uk: 'При звичайному тиску CO₂ не буває рідким: при −78,5 °C твердий CO₂ сублімує — переходить у газ, минаючи рідину. Газ важчий за повітря.',
      en: 'At normal pressure CO₂ is never liquid: at −78.5 °C solid CO₂ sublimes — turns into gas, skipping the liquid. The gas is heavier than air.',
    },
  },
  safety: { school: { uk: 'У великій кількості витісняє кисень. Сухий лід спричиняє холодові опіки — бери його лише рукавичками.', en: 'In large amounts it displaces oxygen. Dry ice causes cold burns — handle it only with gloves.' } },
  media: [],
} as const satisfies Component;
