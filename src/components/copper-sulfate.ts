import type { Component } from './types.js';
import { cite, sv } from './sourced.js';

/** Blue crystals of copper(II) sulfate pentahydrate (CuSO₄·5H₂O). */
export const COPPER_SULFATE = {
  id: 'copper-sulfate',
  kind: 'compound',
  group: 'salt',
  name: { uk: 'Мідний купорос', en: 'Copper sulfate' },
  gender: 'm',
  formula: 'CuSO₄·5H₂O',
  composition: { Cu: 1, S: 1, O: 9, H: 10 },
  wikidata: 'Q6135414',
  stateAtRoom: 'solid',
  phases: {
    solid: {
      density: sv(2286, 'kg/m³', 'pentahydrate', 'single-source', 0.01, [cite('wikipedia-copper-sulfate', 'Chembox: density 2.286 g/cm³ (pentahydrate)', '—', 2286)], 'Second source not checked yet.'),
    },
  },
  decomposes: {
    point: sv(650, '°C', 'anhydrous CuSO₄', 'single-source', 0.02, [cite('wikipedia-copper-sulfate', 'Chembox: decomposes to cupric oxide at 650 °C', '—', 650)], 'The pentahydrate loses its water and turns white much earlier; that temperature is not checked yet.'),
    into: { uk: 'оксид міді (CuO) і оксиди сірки', en: 'copper oxide (CuO) and sulfur oxides' },
  },
  inWater: {
    solubility: sv(20.1, 'g CuSO₄/100 mL water', '20 °C', 'single-source', 0.01, [cite('wikipedia-copper-sulfate', 'Chembox: anhydrous 201 g/L at 20 °C', '20 °C', 20.1)], 'Given for the anhydrous salt, per volume of water. Second source not checked yet.'),
    ions: ['Cu²⁺', 'SO₄²⁻'],
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
