import type { Component } from './types.js';
import { cite, sv } from './sourced.js';

export const STEEL = {
  id: 'steel',
  kind: 'material',
  group: 'alloy',
  name: { uk: 'Сталь (вуглецева)', en: 'Carbon steel' },
  genitive: { uk: 'сталі', en: 'steel' },
  gender: 'f',
  madeOf: [{ part: { uk: 'залізо', en: 'iron' }, fraction: 0.98 }, { part: { uk: 'вуглець', en: 'carbon' } }],
  stateAtRoom: 'solid',
  phases: {
    solid: {
      density: {
        value: 7850,
        unit: 'kg/m³',
        conditions: 'carbon steel, room temperature',
        verification: 'cross-checked',
        tolerance: 0.03,
        citations: [
          { source: 'engineeringtoolbox-metal-densities', locator: 'Steel', conditions: 'not stated', value: 7850 },
          { source: 'wikipedia-steel', locator: 'Properties: usually 7,750–8,050 kg/m³', conditions: 'depends on alloying', range: [7750, 8050] },
        ],
      },
      specificHeat: {
        value: 466,
        unit: 'J/(kg·K)',
        conditions: 'solid, 25 °C',
        verification: 'cross-checked',
        tolerance: 0.04,
        citations: [
          { source: 'wikipedia-specific-heat', locator: 'Steel', conditions: '25 °C', value: 466 },
          { source: 'openstax-cp2e', locator: 'Table 14.1, Iron, steel', conditions: '25 °C', value: 452 },
        ],
      },
      conductivity: {
        value: 45,
        unit: 'W/(m·K)',
        conditions: 'carbon / mild steel, ≈ 293–298 K',
        verification: 'single-source',
        tolerance: 0.2,
        citations: [
          { source: 'wikipedia-thermal-conductivity', locator: 'Steel, carbon (range)', conditions: '293–298 K', range: [36, 54] },
        ],
        note:
          'Strongly depends on grade (stainless ≈ 14–24). OpenStax "steel iron = 80" effectively describes iron and is not used. Needs a primary reference (e.g. CRC Handbook) before marking cross-checked.',
      },
    },
  },
  electrical: { conducts: 'metal', electrode: { metal: 'iron', ion: 'Fe²⁺', electrons: 2, potential: sv(-0.44, 'V', 'Fe²⁺ + 2e⁻ ⇌ Fe', 'single-source', 0.02, [cite('wikipedia-standard-electrode-potentials', 'Fe²⁺ + 2e⁻ ⇌ Fe(s): −0.44 V', '298.15 K', -0.44)], 'Iron’s value: steel is mostly iron; carbon and alloying elements change it little for this. Stainless steel is protected by a film of chromium oxide and dissolves far less — not modelled.'), hydroxide: 'iron-ii-hydroxide' } },
  magnetic: 'ferromagnetic',
  description: {
    novice: { uk: 'Сплав заліза з невеликою кількістю вуглецю — міцніший за чисте залізо. З нього роблять каструлі, інструменти, конструкції.', en: "An alloy of iron with a little carbon — stronger than pure iron. Used for pots, tools, structures." },
    school: { uk: 'Сталь проводить теплоту приблизно в 5 разів гірше за алюміній, зате міцна й не боїться високих температур.', en: "Steel conducts heat about 5 times worse than aluminium, but it is strong and withstands high temperatures." },
  },
  media: [],
  modelNotes: [{ uk: 'Властивості сталі залежать від марки: нержавіюча сталь проводить теплоту в 2–3 рази гірше за вуглецеву, а деякі її марки не магнітні.', en: 'Steel properties depend on the grade: stainless steel conducts heat 2–3 times worse than carbon steel, and some grades are not magnetic.' }],
} as const satisfies Component;
