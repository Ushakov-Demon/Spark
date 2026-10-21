import type { Component } from './types.js';
import { cite, sv } from './sourced.js';

/**
 * Sodium acetate as its trihydrate CH₃COONa·3H₂O — the crystals that form in a hand warmer. The model counts
 * the crystal water as part of the solute (as with copper sulfate): solubility is grams of the trihydrate per
 * 100 g of free water, converted from the table's grams of the anhydrous salt (× 136.08/82.03, minus the water
 * that goes into the crystals). Cp 229 J/(mol·K) ÷ 0.136079 kg/mol.
 */
export const SODIUM_ACETATE = {
  id: 'sodium-acetate',
  kind: 'compound',
  group: 'salt',
  name: { uk: 'Натрій ацетат (тригідрат)', en: 'Sodium acetate (trihydrate)' },
  genitive: { uk: 'натрій ацетату', en: 'sodium acetate' },
  gender: 'm',
  formula: 'CH₃COONa·3H₂O',
  composition: { Na: 1, C: 2, H: 9, O: 5 },
  stateAtRoom: 'solid',
  phases: {
    solid: {
      density: sv(1450, 'kg/m³', 'trihydrate, 20 °C', 'single-source', 0.01, [cite('wikipedia-sodium-acetate', 'Chembox: density 1.45 g/cm³ (trihydrate, 20 °C)', '20 °C', 1450)], 'Second source not checked yet.'),
      specificHeat: sv(1683, 'J/(kg·K)', 'trihydrate', 'single-source', 0.02, [cite('wikipedia-sodium-acetate', 'Chembox: heat capacity 229 J/(mol·K) (trihydrate) ÷ 0.136079 kg/mol', '—', 1682.8)], 'Second source not checked yet.'),
    },
  },
  melting: { point: sv(58, '°C', 'trihydrate', 'single-source', 0.01, [cite('wikipedia-sodium-acetate', 'Chembox: melting point 58 °C (trihydrate); text: crystals melt at 58–58.4 °C', '—', 58)], 'The trihydrate "melts" by dissolving in its own crystal water. Dry, the model does not melt it (no latent heat checked).') },
  inWater: {
    solubility: sv(46.4, 'g CH₃COONa/100 mL water', '20 °C', 'cross-checked', 0.01, [cite('wikipedia-solubility-table', 'Sodium acetate row: 46.4 at 20 °C', '20 °C', 46.4), cite('wikipedia-sodium-acetate', 'Chembox: 46.4 g/100 mL at 20 °C', '20 °C', 46.4)], 'Grams of the anhydrous salt.'),
    ions: ['Na⁺', 'CH₃COO⁻'],
    solubilityTable: {
      t: [0, 10, 20, 30, 40, 50, 60],
      gPer100g: [78.9, 92.6, 110.9, 141.5, 191.6, 295.8, 2737],
      data: sv(110.9, 'g CH₃COONa·3H₂O/100 g water', '20 °C', 'single-source', 0.02, [cite('wikipedia-solubility-table', 'Sodium acetate row 0–40, 60 °C: 36.2, 40.8, 46.4, 54.6, 65.6, 139 g of the anhydrous salt; 46.4 g at 20 °C → 46.4 × 136.08/82.03 = 77.0 g of trihydrate in 100 − 30.6 = 69.4 g of free water = 110.9 g per 100 g', '20 °C', 110.9)], 'Converted to the trihydrate per 100 g of free water; the 50 °C point (82 g) is from the Wikipedia chembox. Near 58 °C it grows without limit (the trihydrate melts in its own water); above 60 °C the model keeps the 60 °C value.'),
    },
    enthalpyOfSolution: sv(19.66, 'kJ/mol', 'trihydrate, infinite dilution, 25 °C', 'single-source', 0.01, [cite('crc-enthalpy-of-solution', 'NaC2H3O2·3H2O (c): 19.66 kJ/mol', '25 °C', 19.66)], 'Dissolving the trihydrate takes heat; crystallising it gives the heat back — the hand warmer. At infinite dilution; used at any concentration.'),
    supersaturates: {
      citations: [
        { source: 'wikipedia-sodium-acetate', locator: 'Uses: Heating pad', claim: 'A hand warmer contains a supersaturated solution of sodium acetate which releases heat upon crystallization' },
        { source: 'wikipedia-sodium-acetate', locator: 'Uses: Heating pad', claim: 'By pressing on a metal disc within the heating pad, a nucleation center is formed' },
      ],
    },
  },
  electrical: { conducts: 'ions-in-solution' },
  hazards: { irritant: true },
  description: {
    novice: {
      uk: 'Білі кристали — з них роблять багаторазові грілки для рук. Його розчин може «забути» закристалізуватися, а від одного кристалика раптом твердне й нагрівається.',
      en: 'White crystals — reusable hand warmers are made of them. Its solution can "forget" to crystallise, and then from a single crystal it suddenly sets and warms up.',
    },
    school: {
      uk: 'Гарячий розчин натрій ацетату можна охолодити нижче насичення, і він лишиться рідким — пересичений розчин. Досить кинути в нього кристалик (затравку), і зайва речовина кристалізується, віддаючи теплоту розчинення: розчин нагрівається.',
      en: 'A hot sodium acetate solution can be cooled below saturation and stay liquid — a supersaturated solution. Drop in a crystal (a seed), and the excess crystallises, giving off its heat of solution: the solution warms up.',
    },
  },
  safety: { school: { uk: 'Подразнює очі. Гарячий розчин може обпекти.', en: 'Irritates the eyes. The hot solution can burn.' } },
  media: [],
  modelNotes: [{ uk: 'Кристалізація — миттєва: щойно в пересиченому розчині з’являється затравка, він доходить до рівноваги; росту кристалів у часі модель не рахує. Сам, без затравки, розчин у моделі не кристалізується.', en: 'Crystallisation is instant: as soon as a supersaturated solution has a seed, it comes to equilibrium; the model does not compute crystals growing over time. Without a seed the solution does not crystallise by itself in the model.' }],
} as const satisfies Component;
