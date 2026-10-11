import type { SourcedValue, LocalizedText } from '../../knowledge/types.js';
import {
  density,
  heatTransferCoeff,
  specificHeat,
  thermalConductivity,
  type Density,
  type HeatTransferCoeff,
  type SpecificHeat,
  type ThermalConductivity,
} from '../../core/units.js';

/**
 * Thermal properties of materials near room temperature.
 *
 * Every value carries its citations; tests/knowledge re-checks that the chosen
 * value agrees with them. To add or change a value see docs/DATA_POLICY.md.
 */
export interface ThermalMaterial {
  readonly id: string;
  readonly name: LocalizedText;
  readonly specificHeat: SourcedValue<SpecificHeat>;
  readonly conductivity: SourcedValue<ThermalConductivity>;
  /** Needed to turn volumes ("20 L") into masses. Added per material as sources are checked. */
  readonly density?: SourcedValue<Density>;
}

const C = 'J/(kg·K)';
const K = 'W/(m·K)';

export const MATERIALS = {
  water: {
    id: 'water',
    name: { uk: 'Вода', en: 'Water' },
    specificHeat: {
      value: specificHeat(4181),
      unit: C,
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
      value: thermalConductivity(0.598),
      unit: K,
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
    density: {
      value: density(997.05),
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
  },
  ice: {
    id: 'ice',
    name: { uk: 'Лід', en: 'Ice' },
    specificHeat: {
      value: specificHeat(2090),
      unit: C,
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
      value: thermalConductivity(2.2),
      unit: K,
      conditions: 'near 0 °C',
      verification: 'cross-checked',
      tolerance: 0.02,
      citations: [
        { source: 'wikipedia-thermal-conductivity', locator: 'Ice (CRC)', conditions: '273 K', value: 2.2 },
        { source: 'openstax-cp2e', locator: 'Table 14.3, Ice', conditions: 'near 0 °C', value: 2.2 },
      ],
    },
  },
  air: {
    id: 'air',
    name: { uk: 'Повітря', en: 'Air' },
    specificHeat: {
      value: specificHeat(1012),
      unit: C,
      conditions: 'dry, constant pressure, room conditions',
      verification: 'cross-checked',
      tolerance: 0.01,
      citations: [
        { source: 'wikipedia-specific-heat', locator: 'Air (room conditions), cp', conditions: '23 °C, 1 atm', value: 1012 },
        { source: 'openstax-cp2e', locator: 'Table 14.1, Air (dry), cp', conditions: '20 °C, 1 atm', value: 1015 },
      ],
      note: 'cp (constant pressure). OpenStax also lists cv = 721 for closed-volume problems.',
    },
    conductivity: {
      value: thermalConductivity(0.026),
      unit: K,
      conditions: '≈ 300 K, 1 bar',
      verification: 'cross-checked',
      tolerance: 0.15,
      citations: [
        { source: 'wikipedia-thermal-conductivity', locator: 'Air (CRC)', conditions: '300 K, 1 bar', value: 0.0262 },
        { source: 'openstax-cp2e', locator: 'Table 14.3, Air', conditions: 'near 0 °C', value: 0.023 },
      ],
      note: 'OpenStax value is for ~0 °C, hence the wider tolerance.',
    },
  },
  aluminium: {
    id: 'aluminium',
    name: { uk: 'Алюміній', en: 'Aluminium' },
    specificHeat: {
      value: specificHeat(897),
      unit: C,
      conditions: 'solid, 25 °C',
      verification: 'cross-checked',
      tolerance: 0.01,
      citations: [
        { source: 'wikidata', locator: 'Q663 P2056', conditions: 'not stated', value: 897 },
        { source: 'wikipedia-specific-heat', locator: 'Aluminium', conditions: '25 °C', value: 897 },
        { source: 'openstax-cp2e', locator: 'Table 14.1, Aluminum', conditions: '25 °C', value: 900 },
      ],
    },
    conductivity: {
      value: thermalConductivity(237),
      unit: K,
      conditions: 'pure, ≈ 293 K',
      verification: 'cross-checked',
      tolerance: 0.08,
      citations: [
        { source: 'wikipedia-thermal-conductivity', locator: 'Aluminium (pure)', conditions: '293 K', value: 237 },
        { source: 'wikidata', locator: 'Q663 P2068', conditions: 'solid', value: 236 },
        { source: 'openstax-cp2e', locator: 'Table 14.3, Aluminum', conditions: 'near 0 °C', value: 220 },
      ],
      note: 'OpenStax rounds down (220); alloys used in cookware are typically lower than pure Al.',
    },
  },
  copper: {
    id: 'copper',
    name: { uk: 'Мідь', en: 'Copper' },
    specificHeat: {
      value: specificHeat(385),
      unit: C,
      conditions: 'solid, 25 °C',
      verification: 'cross-checked',
      tolerance: 0.01,
      citations: [
        { source: 'wikidata', locator: 'Q753 P2056', conditions: 'not stated', value: 385 },
        { source: 'wikipedia-specific-heat', locator: 'Copper', conditions: '25 °C', value: 385 },
        { source: 'openstax-cp2e', locator: 'Table 14.1, Copper', conditions: '25 °C', value: 387 },
      ],
    },
    conductivity: {
      value: thermalConductivity(401),
      unit: K,
      conditions: 'pure, ≈ 293–300 K',
      verification: 'cross-checked',
      tolerance: 0.03,
      citations: [
        { source: 'wikipedia-thermal-conductivity', locator: 'Copper (pure)', conditions: '293 K', value: 401 },
        { source: 'wikidata', locator: 'Q753 P2068', conditions: '20 °C', value: 395 },
        { source: 'openstax-cp2e', locator: 'Table 14.3, Copper', conditions: 'near 0 °C', value: 390 },
      ],
    },
  },
  iron: {
    id: 'iron',
    name: { uk: 'Залізо', en: 'Iron' },
    specificHeat: {
      value: specificHeat(449),
      unit: C,
      conditions: 'pure, 25 °C',
      verification: 'cross-checked',
      tolerance: 0.01,
      citations: [
        { source: 'wikidata', locator: 'Q677 P2056', conditions: 'not stated', value: 449 },
        { source: 'wikipedia-specific-heat', locator: 'Iron', conditions: '25 °C', value: 449 },
        { source: 'openstax-cp2e', locator: 'Table 14.1, Iron, steel', conditions: '25 °C', value: 452 },
      ],
    },
    conductivity: {
      value: thermalConductivity(80),
      unit: K,
      conditions: 'pure, ≈ 293–300 K',
      verification: 'cross-checked',
      tolerance: 0.06,
      citations: [
        { source: 'wikipedia-thermal-conductivity', locator: 'Iron (pure, CRC)', conditions: '≈ 300 K', value: 80.2 },
        { source: 'openstax-cp2e', locator: 'Table 14.3, Steel iron', conditions: 'near 0 °C', value: 80 },
        { source: 'wikidata', locator: 'Q677 P2068', conditions: 'not stated', value: 84 },
      ],
    },
  },
  steel: {
    id: 'steel',
    name: { uk: 'Сталь (вуглецева)', en: 'Carbon steel' },
    specificHeat: {
      value: specificHeat(466),
      unit: C,
      conditions: 'solid, 25 °C',
      verification: 'cross-checked',
      tolerance: 0.04,
      citations: [
        { source: 'wikipedia-specific-heat', locator: 'Steel', conditions: '25 °C', value: 466 },
        { source: 'openstax-cp2e', locator: 'Table 14.1, Iron, steel', conditions: '25 °C', value: 452 },
      ],
    },
    conductivity: {
      value: thermalConductivity(45),
      unit: K,
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
  glass: {
    id: 'glass',
    name: { uk: 'Скло', en: 'Glass' },
    specificHeat: {
      value: specificHeat(840),
      unit: C,
      conditions: 'solid, 25 °C',
      verification: 'cross-checked',
      tolerance: 0.01,
      citations: [
        { source: 'wikipedia-specific-heat', locator: 'Glass (silica)', conditions: '25 °C', value: 840 },
        { source: 'openstax-cp2e', locator: 'Table 14.1, Glass', conditions: '25 °C', value: 840 },
      ],
      note: 'Depends on type: crown ≈ 670, flint ≈ 503, borosilicate ≈ 753 (Wikipedia).',
    },
    conductivity: {
      value: thermalConductivity(0.84),
      unit: K,
      conditions: 'average, ≈ 293 K',
      verification: 'cross-checked',
      tolerance: 0.02,
      citations: [
        { source: 'openstax-cp2e', locator: 'Table 14.3, Glass (average)', conditions: 'near 0 °C', value: 0.84 },
        { source: 'wikipedia-thermal-conductivity', locator: 'Glass (general)', conditions: '293 K', range: [0.8, 0.93] },
      ],
    },
  },
  brick: {
    id: 'brick',
    name: { uk: 'Цегла', en: 'Brick' },
    specificHeat: {
      value: specificHeat(840),
      unit: C,
      conditions: 'building brick',
      verification: 'single-source',
      tolerance: 0.02,
      citations: [{ source: 'wikipedia-specific-heat', locator: 'Brick (building materials)', conditions: 'not stated', value: 840 }],
      note: 'OpenStax 840 is for "concrete, granite", a different material, so it is not counted.',
    },
    conductivity: {
      value: thermalConductivity(0.84),
      unit: K,
      conditions: 'building brick',
      verification: 'cross-checked',
      tolerance: 0.02,
      citations: [
        { source: 'openstax-cp2e', locator: 'Table 14.3, Concrete brick', conditions: 'near 0 °C', value: 0.84 },
        { source: 'wikipedia-thermal-conductivity', locator: 'Brick, outer leaf (UK 2016, 1700 kg/m³)', conditions: '293–298 K', value: 0.84 },
      ],
      note: 'Real bricks span 0.15–1.31 depending on density and moisture.',
    },
  },
  wood: {
    id: 'wood',
    name: { uk: 'Деревина', en: 'Wood' },
    specificHeat: {
      value: specificHeat(1700),
      unit: C,
      conditions: 'dry, typical',
      verification: 'cross-checked',
      tolerance: 0.01,
      citations: [
        { source: 'wikipedia-specific-heat', locator: 'Wood (range 1200–2900)', conditions: 'not stated', value: 1700 },
        { source: 'openstax-cp2e', locator: 'Table 14.1, Wood', conditions: '25 °C', value: 1700 },
      ],
    },
    conductivity: {
      value: thermalConductivity(0.13),
      unit: K,
      conditions: 'across the grain, typical (pine…oak)',
      verification: 'cross-checked',
      tolerance: 0.2,
      citations: [
        { source: 'openstax-cp2e', locator: 'Table 14.3, Wood', conditions: 'near 0 °C', range: [0.08, 0.16] },
        { source: 'wikipedia-thermal-conductivity', locator: 'White pine, across grain', conditions: 'not stated', value: 0.112 },
        { source: 'wikipedia-thermal-conductivity', locator: 'Oak, across grain', conditions: 'not stated', value: 0.147 },
      ],
      note: 'Depends on species and moisture; ±20 % is the honest uncertainty.',
    },
  },
} as const satisfies Record<string, ThermalMaterial>;

export type MaterialName = keyof typeof MATERIALS;

/**
 * Typical convective heat transfer coefficients h, W/(m²·K).
 * No reliable source found yet — these are marked as estimates.
 */
export const CONVECTION = {
  stillAir: {
    value: heatTransferCoeff(10),
    unit: 'W/(m²·K)',
    conditions: 'natural convection, air',
    verification: 'estimate',
    tolerance: 0.5,
    citations: [
      { source: 'wikipedia-heat-transfer-coefficient', locator: 'Overall coefficient, Air', conditions: 'not stated', range: [10, 100] },
    ],
    note: 'Lower end of the air range; natural convection in still air is commonly 5–25. Source is [citation needed] — replace with Incropera Table 1.1 once checked.',
  },
  wind: {
    value: heatTransferCoeff(50),
    unit: 'W/(m²·K)',
    conditions: 'forced convection, air',
    verification: 'estimate',
    tolerance: 0.5,
    citations: [
      { source: 'wikipedia-heat-transfer-coefficient', locator: 'Overall coefficient, Air', conditions: 'not stated', range: [10, 100] },
    ],
    note: 'Mid-range engineering guess for a light breeze. Source is [citation needed].',
  },
  stillWater: {
    value: heatTransferCoeff(500),
    unit: 'W/(m²·K)',
    conditions: 'natural convection, water',
    verification: 'estimate',
    tolerance: 0.5,
    citations: [
      { source: 'wikipedia-heat-transfer-coefficient', locator: 'Overall coefficient, Water', conditions: 'not stated', range: [500, 10_000] },
    ],
    note: 'Lower end of the water range. Source is [citation needed].',
  },
} as const satisfies Record<string, SourcedValue<HeatTransferCoeff>>;
