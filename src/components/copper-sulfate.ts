import type { Component } from './types.js';
import { cite, estimate, sv } from './sourced.js';

/** Blue crystals of copper(II) sulfate pentahydrate (CuSO₄·5H₂O). */
export const COPPER_SULFATE = {
  id: 'copper-sulfate',
  kind: 'compound',
  group: 'salt',
  name: { uk: 'Мідний купорос', en: 'Copper sulfate' },
  genitive: { uk: 'мідного купоросу', en: 'copper sulfate' },
  gender: 'm',
  formula: 'CuSO₄·5H₂O',
  composition: { Cu: 1, S: 1, O: 9, H: 10 },
  wikidata: 'Q6135414',
  stateAtRoom: 'solid',
  phases: {
    solid: {
      density: sv(2286, 'kg/m³', 'pentahydrate', 'single-source', 0.01, [cite('wikipedia-copper-sulfate', 'Chembox: density 2.286 g/cm³ (pentahydrate)', '—', 2286)], 'Second source not checked yet.'),
      specificHeat: estimate(1100, 'J/(kg·K)', 'pentahydrate, room temperature', 950, 1300, 'No table checked yet: hydrated salts hold ≈ 1.0–1.3 kJ/(kg·K) (their water of crystallisation counts). Matters only when heated dry.'),
    },
  },
  decomposes: {
    point: sv(650, '°C', 'anhydrous CuSO₄', 'single-source', 0.02, [cite('wikipedia-copper-sulfate', 'Chembox: decomposes to cupric oxide at 650 °C', '—', 650)], 'The pentahydrate loses its water and turns white much earlier; that temperature is not checked yet.'),
    into: { uk: 'оксид міді (CuO) і оксиди сірки', en: 'copper oxide (CuO) and sulfur oxides' },
  },
  inWater: {
    solubility: sv(20.1, 'g CuSO₄/100 mL water', '20 °C', 'single-source', 0.01, [cite('wikipedia-copper-sulfate', 'Chembox: anhydrous 201 g/L at 20 °C', '20 °C', 20.1)], 'Given for the anhydrous salt, per volume of water. Second source not checked yet.'),
    ions: ['Cu²⁺', 'SO₄²⁻'],
    // Cu²⁺ ions in water are blue.
    tint: [40, 120, 225],
    // CRC by mass % of anhydrous CuSO₄ (0.5…15 %), converted to the blue crystals: w = w(CuSO₄) ÷ 0.6392 (159.6 of 249.7 g/mol).
    conductivityTable: {
      w: [0, 0.0078, 0.0156, 0.0313, 0.0782, 0.1564, 0.2347],
      kappa: [0, 0.29, 0.54, 0.93, 1.9, 3.22, 4.23],
      data: sv(0.54, 'S/m', '1 % CuSO₄, 20 °C', 'single-source', 0.01, [cite('crc-electrical-conductivity', 'Copper(II) sulfate row: 2.9, 5.4, 9.3, 19.0, 32.2, 42.3 mS/cm at 0.5–15 %', '20 °C', 0.54)], 'One table; between its rows the model interpolates, above 15 % it keeps the last value.'),
    },
    electrolysis: {
      voltage: sv(0.892, 'V', 'CuSO₄ solution: copper + oxygen', 'single-source', 0.01, [cite('wikipedia-standard-electrode-potentials', '1.229 V (O₂/H₂O) − 0.337 V (Cu²⁺/Cu)', '298.15 K', 0.892)], 'Thermodynamic minimum from standard potentials; real cells need more (overpotentials).'),
      cathode: { component: 'copper', electrons: 2, potential: sv(0.337, 'V', 'Cu²⁺ + 2e⁻ ⇌ Cu', 'single-source', 0.01, [cite('wikipedia-standard-electrode-potentials', 'Cu²⁺ + 2e⁻ ⇌ Cu(s): 0.337 V', '298.15 K', 0.337)], 'Only one table checked.') },
      anode: { component: 'oxygen', electrons: 4, potential: sv(1.229, 'V', 'O₂ + 4H⁺ + 4e⁻ ⇌ 2H₂O', 'single-source', 0.01, [cite('wikipedia-standard-electrode-potentials', 'O₂(g) + 4H⁺ + 4e⁻ ⇌ 2H₂O: 1.229 V', '298.15 K', 1.229)], 'The solution turns acidic at the anode (sulfuric acid forms), so the acid form of the reaction.') },
      note: {
        uk: 'Під струмом на катоді осідає мідь (Cu²⁺ + 2e⁻ → Cu), на аноді виділяється кисень, а в розчині лишається сульфатна кислота: 2CuSO₄ + 2H₂O → 2Cu + O₂ + 2H₂SO₄. Розчин поступово світлішає — йонів міді меншає.',
        en: 'Under current copper settles on the cathode (Cu²⁺ + 2e⁻ → Cu), oxygen forms at the anode, and sulfuric acid stays in the solution: 2CuSO₄ + 2H₂O → 2Cu + O₂ + 2H₂SO₄. The solution slowly pales as the copper ions are used up.',
      },
    },
    solubilityTable: {
      t: [0, 10, 20, 30, 40, 60, 80, 100],
      gPer100g: [23.1, 27.5, 32, 37.8, 44.6, 61.8, 83.8, 114],
      data: sv(32, 'g CuSO₄·5H₂O/100 g water', '20 °C', 'single-source', 0.02, [cite('wikipedia-solubility-table', 'Copper(II) sulfate CuSO₄·5H₂O row, 0–100 °C', '20 °C', 32)], 'Grams of the blue crystals (with their water) per 100 g of water; the model treats the crystal water as part of the solute — an approximation.'),
    },
  },
  electrical: { conducts: 'ions-in-solution' },
  magnetic: 'paramagnetic',
  hazards: { irritant: true },
  description: {
    novice: {
      uk: 'Яскраво-сині кристали. З його розчину легко виростити великий синій кристал. Якщо кристали нагріти, вони втрачають воду й біліють, а від краплі води знову синіють.',
      en: 'Bright blue crystals. A big blue crystal is easy to grow from its solution. Heated, the crystals lose water and turn white; a drop of water turns them blue again.',
    },
    school: {
      uk: 'Синій колір дають молекули води, зв’язані з йонами міді (п’ятиводний гідрат CuSO₄·5H₂O). Розчин проводить струм; на катоді при електролізі осідає мідь.',
      en: 'The blue colour comes from water molecules bound to copper ions (the pentahydrate CuSO₄·5H₂O). The solution conducts electricity; in electrolysis copper deposits on the cathode.',
    },
  },
  safety: { school: { uk: 'Шкідливий, якщо проковтнути, подразнює очі й шкіру. Працюй у рукавичках і мий руки.', en: 'Harmful if swallowed, irritates eyes and skin. Wear gloves and wash your hands.' } },
  media: [],
} as const satisfies Component;
