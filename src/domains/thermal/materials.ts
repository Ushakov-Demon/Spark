import type { SourcedValue, LocalizedText } from '../../knowledge/types.js';
import { heatTransferCoeff, type Density, type HeatTransferCoeff, type SpecificHeat, type ThermalConductivity } from '../../core/units.js';
import { AIR } from '../../components/air.js';
import { ALUMINIUM } from '../../components/aluminium.js';
import { BRASS } from '../../components/brass.js';
import { BRICK } from '../../components/brick.js';
import { COPPER } from '../../components/copper.js';
import { GLASS } from '../../components/glass.js';
import { IRON } from '../../components/iron.js';
import { STEEL } from '../../components/steel.js';
import type { PhaseProps } from '../../components/types.js';
import { WATER } from '../../components/water.js';
import { WOOD } from '../../components/wood.js';

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
