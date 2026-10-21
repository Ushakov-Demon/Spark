import type { SourcedValue, LocalizedText } from '../../knowledge/types.js';
import { heatTransferCoeff, type Density, type HeatTransferCoeff, type SpecificHeat, type ThermalConductivity } from '../../core/units.js';
import { AIR } from '../../components/air.js';
import { ALUMINIUM } from '../../components/aluminium.js';
import { BRASS } from '../../components/brass.js';
import { BRICK } from '../../components/brick.js';
import { COPPER } from '../../components/copper.js';
import { GLASS } from '../../components/glass.js';
import { IRON } from '../../components/iron.js';
import { PORCELAIN } from '../../components/porcelain.js';
import { STEEL } from '../../components/steel.js';
import type { PhaseProps } from '../../components/types.js';
import { WATER } from '../../components/water.js';
import { WOOD } from '../../components/wood.js';

/** Melting points of the metals pots are made of (the numbers and their citations live in the components). */
const MATERIAL_MELTING = { aluminium: ALUMINIUM.melting.point as SourcedValue, copper: COPPER.melting.point as SourcedValue };

/**
 * Thermal properties of materials near room temperature — a view of the
 * components (src/components), which hold the values and their citations.
 * tests/knowledge re-checks that every value agrees with its sources.
 */
export interface ThermalMaterial {
  readonly id: string;
  readonly name: LocalizedText;
  readonly specificHeat: SourcedValue<SpecificHeat>;
  readonly conductivity: SourcedValue<ThermalConductivity>;
  /** Needed to turn volumes ("20 L") into masses. Added per material as sources are checked. */
  readonly density?: SourcedValue<Density>;
}


/** Component values are plain numbers; the thermal domain uses unit-branded ones. */
const branded = <Q extends number>(v: SourcedValue): SourcedValue<Q> => v as SourcedValue<Q>;

/** Thermal view of one state of a component (the numbers live in src/components). */
function thermalMaterial(id: string, name: LocalizedText, p: PhaseProps | undefined): ThermalMaterial {
  if (!p?.specificHeat || !p.conductivity) throw new Error(`${id}: the component has no thermal data for this state`);
  return {
    id,
    name,
    specificHeat: branded<SpecificHeat>(p.specificHeat),
    conductivity: branded<ThermalConductivity>(p.conductivity),
    ...(p.density ? { density: branded<Density>(p.density) } : {}),
  };
}

export const MATERIALS = {
  water: { ...thermalMaterial('water', WATER.name, WATER.phases.liquid), density: branded<Density>(WATER.phases.liquid.density) },
  ice: thermalMaterial('ice', WATER.phases.solid.name, WATER.phases.solid),
  air: thermalMaterial('air', AIR.name, AIR.phases.gas),
  aluminium: thermalMaterial('aluminium', ALUMINIUM.name, ALUMINIUM.phases.solid),
  copper: thermalMaterial('copper', COPPER.name, COPPER.phases.solid),
  brass: thermalMaterial('brass', BRASS.name, BRASS.phases.solid),
  iron: thermalMaterial('iron', IRON.name, IRON.phases.solid),
  steel: thermalMaterial('steel', STEEL.name, STEEL.phases.solid),
  glass: thermalMaterial('glass', GLASS.name, GLASS.phases.solid),
  porcelain: thermalMaterial('porcelain', PORCELAIN.name, PORCELAIN.phases.solid),
  brick: thermalMaterial('brick', BRICK.name, BRICK.phases.solid),
  wood: thermalMaterial('wood', WOOD.name, WOOD.phases.solid),
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
  dryContact: {
    value: heatTransferCoeff(100),
    unit: 'W/(m²·K)',
    conditions: 'vessel wall → a dry solid in it (salt poured in, a metal lump)',
    verification: 'estimate',
    tolerance: 0.8,
    citations: [{ source: 'spark', locator: 'estimate', conditions: 'no source found', range: [30, 500] }],
    note: 'A heap of grains or a lump touches the wall only at points; the gaps are air. A packed bed of grains is at the low end, a flat metal piece on a flat bottom higher. Not measured.',
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

/**
 * The outside of a vessel: how well it radiates (emissivity ε, 0…1), and the hottest it
 * stands. Above that a metal pot melts or burns through, glass softens or cracks. A vessel
 * of a material without a limit here has none in the model (it would melt far above anything
 * a hob gives).
 */
export interface Surface {
  readonly emissivity: SourcedValue;
  readonly limit?: { readonly temperature: SourcedValue; readonly what: LocalizedText };
}


export const SURFACES: Partial<Record<MaterialName, Surface>> = {
  steel: {
    emissivity: {
      value: 0.4, unit: '', conditions: 'stainless pot, shiny to tarnished by heat', verification: 'estimate', tolerance: 0.6,
      citations: [{ source: 'engineeringtoolbox-emissivity', locator: 'Stainless steel, polished 0.075; weathered 0.85; steel oxidized 0.79', conditions: '300 K', range: [0.075, 0.85] }],
      note: 'A polished pot radiates little; once heated dry it tarnishes and radiates more. Somewhere between.',
    },
  },
  aluminium: {
    emissivity: {
      value: 0.2, unit: '', conditions: 'oxidised aluminium', verification: 'single-source', tolerance: 0.3,
      citations: [{ source: 'engineeringtoolbox-emissivity', locator: 'Aluminum heavily oxidized 0.2–0.31; commercial sheet 0.09', conditions: '300 K', range: [0.09, 0.31] }, { source: 'wikipedia-emissivity', locator: 'Aluminium, rough, oxidized 0.2', conditions: '300 K', value: 0.2 }],
    },
    limit: { temperature: MATERIAL_MELTING.aluminium, what: { uk: 'алюміній плавиться і дно прогорає', en: 'the aluminium melts and the bottom burns through' } },
  },
  iron: {
    emissivity: {
      value: 0.65, unit: '', conditions: 'cast iron, turned and heated', verification: 'single-source', tolerance: 0.1,
      citations: [{ source: 'engineeringtoolbox-emissivity', locator: 'Cast iron, turned and heated 0.60–0.70', conditions: 'not stated', range: [0.6, 0.7] }],
    },
  },
  copper: {
    emissivity: {
      value: 0.3, unit: '', conditions: 'copper, shiny to oxidised', verification: 'estimate', tolerance: 0.9,
      citations: [{ source: 'wikipedia-emissivity', locator: 'Copper, polished 0.04; oxidized 0.87', conditions: '300 K', range: [0.04, 0.87] }],
      note: 'Polished copper hardly radiates; heated in air it darkens with oxide.',
    },
    limit: { temperature: MATERIAL_MELTING.copper, what: { uk: 'мідь плавиться', en: 'the copper melts' } },
  },
  brass: {
    emissivity: {
      value: 0.3, unit: '', conditions: 'brass, shiny to oxidised', verification: 'estimate', tolerance: 0.9,
      citations: [{ source: 'engineeringtoolbox-emissivity', locator: 'Brass, polished 0.03; oxidized (600 °C) 0.6', conditions: 'not stated', range: [0.03, 0.6] }],
    },
  },
  glass: {
    emissivity: {
      value: 0.93, unit: '', conditions: 'smooth glass', verification: 'cross-checked', tolerance: 0.03,
      citations: [{ source: 'engineeringtoolbox-emissivity', locator: 'Glass, smooth 0.92–0.94', conditions: '300 K', range: [0.92, 0.94] }, { source: 'wikipedia-emissivity', locator: 'Glass, smooth uncoated 0.95', conditions: '300 K', value: 0.95 }],
    },
    limit: {
      temperature: {
        value: 500, unit: '°C', conditions: 'borosilicate laboratory glass', verification: 'cross-checked', tolerance: 0.05,
        citations: [{ source: 'arborsci-glassware', locator: 'Borosilicate: max working temperature 500 °C (short-term 520 °C)', conditions: 'not stated', value: 500 }, { source: 'schott-duran', locator: 'Transformation temperature 525 °C', conditions: 'DURAN', value: 525 }],
        note: 'Above it the glass starts to soften; a sudden change of a hundred degrees or so can crack it much earlier (not modelled).',
      },
      what: { uk: 'скло розм’якне й може тріснути', en: 'the glass softens and may crack' },
    },
  },
  porcelain: {
    emissivity: {
      value: 0.92, unit: '', conditions: 'glazed porcelain', verification: 'single-source', tolerance: 0.02,
      citations: [{ source: 'engineeringtoolbox-emissivity', locator: 'Porcelain, glazed 0.92–0.93', conditions: '300 K', range: [0.92, 0.93] }],
    },
    limit: {
      temperature: {
        value: 1150, unit: '°C', conditions: 'porcelain crucible, maximum use temperature', verification: 'cross-checked', tolerance: 0.05,
        citations: [{ source: 'fishersci-porcelain-crucible-30', locator: 'Maximum temperature 1150 °C', conditions: '30 mL high form', value: 1150 }, { source: 'sigma-coors-crucible-30', locator: 'max. use temp. 1150 °C', conditions: '30 mL wide form', value: 1150 }],
      },
      what: { uk: 'порцеляна може тріснути', en: 'the porcelain may crack' },
    },
  },
};
