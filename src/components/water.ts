import type { Component } from './types.js';
import { cite, sv } from './sourced.js';

const LATENT_FUSION = sv(334_000, 'J/kg', 'at 0 °C, 1 atm', 'cross-checked', 0.01, [
  cite('openstax-cp2e-latent', 'Table 14.2, Water', '0 °C, 1 atm', 334_000),
  cite('wikipedia-enthalpy-of-fusion', 'Water', 'not stated', 333_550),
]);
const LATENT_VAPORISATION = sv(2_256_000, 'J/kg', 'at 100 °C, 1 atm', 'cross-checked', 0.01, [
  cite('openstax-cp2e-latent', 'Table 14.2, Water', '100 °C, 1 atm', 2_256_000),
  cite('wikidata', 'Q283 molar enthalpy of vaporization 40.656 kJ/mol at 373.15 K ÷ 18.015 g/mol', '373.15 K', 2_256_800),
]);

export const WATER = {
  id: 'water',
  kind: 'compound',
  group: 'water',
  name: { uk: 'Вода', en: 'Water' },
  gender: 'f',
  formula: 'H₂O',
  composition: { H: 2, O: 1 },
  wikidata: 'Q283',
  stateAtRoom: 'liquid',
  phases: {
    solid: {
      name: { uk: 'Лід', en: 'Ice' },
      density: sv(916.7, 'kg/m³', 'ice at 0 °C', 'single-source', 0.01, [cite('wikidata', 'Q23392 density', '0 °C', 916.7)], 'Ice is lighter than water — that is why it floats.'),
      specificHeat: {
          value: 2090,
          unit: 'J/(kg·K)',
          conditions: 'solid, −50…0 °C average',
          verification: 'cross-checked',
          tolerance: 0.03,
          citations: [
            { source: 'openstax-cp2e', locator: 'Table 14.1, Ice', conditions: 'average −50…0 °C', value: 2090 },
            { source: 'wikipedia-specific-heat', locator: 'Water (ice)', conditions: '−10 °C', value: 2050 },
            { source: 'wikidata', locator: 'Q283 P2056 (solid)', conditions: '273 K', value: 2110 },
          ],
        },
      conductivity: {
          value: 2.2,
          unit: 'W/(m·K)',
          conditions: 'near 0 °C',
          verification: 'cross-checked',
          tolerance: 0.02,
          citations: [
            { source: 'wikipedia-thermal-conductivity', locator: 'Ice (CRC)', conditions: '273 K', value: 2.2 },
            { source: 'openstax-cp2e', locator: 'Table 14.3, Ice', conditions: 'near 0 °C', value: 2.2 },
          ],
        },
    },
    liquid: {
      density: {
          value: 997.05,
          unit: 'kg/m³',
          conditions: 'liquid, 25 °C, 1 atm',
          verification: 'cross-checked',
          tolerance: 0.0001,
          citations: [
            { source: 'wikidata', locator: 'Q283 P2054 (temperature 25)', conditions: '25 °C, liquid', value: 997.0479 },
            { source: 'wikipedia-properties-of-water', locator: 'Infobox, Density', conditions: '25 °C, VSMOW, 1 atm', value: 997.04702 },
          ],
          note: 'Depends on temperature: 998.2 at 20 °C, 958.4 at 100 °C (Wikidata Q283 P2054). Volumes are converted at 25 °C; error < 0.2 % for 4–40 °C.',
        },
      specificHeat: {
          value: 4181,
          unit: 'J/(kg·K)',
          conditions: 'liquid, 25 °C',
          verification: 'cross-checked',
          tolerance: 0.01,
          citations: [
            { source: 'wikipedia-specific-heat', locator: 'Water (liquid)', conditions: '25 °C', value: 4181 },
            { source: 'openstax-cp2e', locator: 'Table 14.1, Water', conditions: '15 °C', value: 4186 },
            { source: 'wikidata', locator: 'Q283 P2056', conditions: 'liquid, 333 K', value: 4184 },
          ],
        },
      conductivity: {
          value: 0.598,
          unit: 'W/(m·K)',
          conditions: 'liquid, 20 °C',
          verification: 'cross-checked',
          tolerance: 0.07,
          citations: [
            { source: 'wikipedia-thermal-conductivity', locator: 'Water', conditions: '293 K (TPRC)', value: 0.5918 },
            { source: 'openstax-cp2e', locator: 'Table 14.3, Water', conditions: 'near 0 °C (table footnote)', value: 0.6 },
            { source: 'wikidata', locator: 'Q283 P2068', conditions: 'not stated', value: 0.56 },
          ],
          note: 'k of water grows with temperature (≈0.56 at 0 °C → ≈0.60 at 20 °C); Wikidata 0.56 has no qualifiers and most likely refers to 0 °C.',
        },
    },
  },
  melting: {
    point: sv(0, '°C', '1 atm', 'cross-checked', 0.01, [cite('openstax-cp2e-latent', 'Table 14.2, Water', '1 atm', 0), cite('wikidata', 'Q283 melting point', '101.325 kPa', 0)]),
    latentHeat: LATENT_FUSION,
  },
  boiling: {
    point: sv(100, '°C', '1 atm', 'cross-checked', 0.001, [cite('openstax-cp2e-latent', 'Table 14.2, Water', '1 atm', 100), cite('wikidata', 'Q283 boiling point (ITS-90)', '101.325 kPa', 99.97)]),
    latentHeat: LATENT_VAPORISATION,
  },
  vapour: {
    pressure: { kind: 'buck' },
    data: sv(101.3, 'kPa', 'Buck equation; value at 100 °C', 'single-source', 0.001, [cite('wikipedia-vapour-pressure-water', 'Buck equation; table 101.32 kPa at 100 °C', '0–100 °C', 101.32)], 'Buck equation agrees with the table within 0.04 % over 0–100 °C.'),
    latentLow: { temperature: 37, value: sv(2_430_000, 'J/kg', 'water at 37 °C', 'single-source', 0.01, [cite('openstax-cp2e-latent', 'Table 14.2 footnote: Lv at 37.0 °C', '37 °C', 2_430_000)], 'Only OpenStax checked so far.') },
  },
  inWater: { solubility: 'miscible' },
  electrical: {
    conducts: 'insulator',
    conductivity: sv(7.5e-5, 'S/m', 'distilled, exposed to air, room temperature', 'single-source', 0.35, [{ source: 'wikipedia-conductivity-electrolytic', locator: 'distilled water exposed to air: 0.5–1 µS/cm', conditions: 'room temperature', range: [5e-5, 1e-4] }], 'Depends on how much carbon dioxide from the air has dissolved; ultrapure water is about 15 times lower (0.055 µS/cm).'),
    electrolysis: {
      voltage: sv(1.229, 'V', 'water splitting, 25 °C', 'cross-checked', 0.01, [
        cite('wikipedia-electrolysis-of-water', 'minimum voltage about 1.23 V', '25 °C', 1.23),
        cite('wikipedia-standard-electrode-potentials', 'O₂ + 4H⁺ + 4e⁻ ⇌ 2H₂O: 1.229 V', '298.15 K', 1.229),
      ], 'Thermodynamic minimum; real cells need more (over 1.48 V for a useful current) because of overpotentials.'),
      cathode: { component: 'hydrogen', electrons: 2 },
      anode: { component: 'oxygen', electrons: 4 },
    },
  },
  description: {
    novice: {
      uk: 'Чиста вода без домішок. При нормальному тиску замерзає при 0 °C і кипить при 100 °C.',
      en: 'Pure water without impurities. At normal pressure it freezes at 0 °C and boils at 100 °C.',
    },
    school: {
      uk: 'Має дуже велику питому теплоємність (≈ 4200 Дж/(кг·°C)), тому нагрівається й остигає повільно. Щоб розтопити 1 кг льоду, потрібно 334 кДж, а щоб випарувати 1 кг води — 2256 кДж.',
      en: 'It has a very high specific heat (≈ 4200 J/(kg·°C)), so it warms up and cools down slowly. Melting 1 kg of ice takes 334 kJ, boiling away 1 kg of water 2256 kJ.',
    },
  },
  media: [],
} as const satisfies Component;
