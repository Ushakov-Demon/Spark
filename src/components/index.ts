import { ACETIC_ACID } from './acetic-acid.js';
import { AIR } from './air.js';
import { ALUMINIUM } from './aluminium.js';
import { BRASS } from './brass.js';
import { BRICK } from './brick.js';
import { CALCIUM_CARBONATE } from './calcium-carbonate.js';
import { CARBON_DIOXIDE } from './carbon-dioxide.js';
import { CHLORINE } from './chlorine.js';
import { COPPER } from './copper.js';
import { COPPER_SULFATE } from './copper-sulfate.js';
import { ETHANOL } from './ethanol.js';
import { GLASS } from './glass.js';
import { GLYCEROL } from './glycerol.js';
import { HYDROGEN } from './hydrogen.js';
import { IRON } from './iron.js';
import { NITROGEN } from './nitrogen.js';
import { OXYGEN } from './oxygen.js';
import { SODIUM_BICARBONATE } from './sodium-bicarbonate.js';
import { SODIUM_CHLORIDE } from './sodium-chloride.js';
import { STEEL } from './steel.js';
import { SUCROSE } from './sucrose.js';
import { SUNFLOWER_OIL } from './sunflower-oil.js';
import type { Component } from './types.js';
import { WATER } from './water.js';
import { WOOD } from './wood.js';
import { molarMassOf } from './elements.js';

export * from './types.js';
export * from './elements.js';
export { NACL_CONDUCTIVITY, NACL_SOLUTE } from './sodium-chloride.js';

/** Every component, by id. Adding a substance = a new file + one line here. */
const LIST = {
  water: WATER,
  'sodium-chloride': SODIUM_CHLORIDE,
  sucrose: SUCROSE,
  'sodium-bicarbonate': SODIUM_BICARBONATE,
  'copper-sulfate': COPPER_SULFATE,
  'calcium-carbonate': CALCIUM_CARBONATE,
  ethanol: ETHANOL,
  'acetic-acid': ACETIC_ACID,
  glycerol: GLYCEROL,
  'sunflower-oil': SUNFLOWER_OIL,
  oxygen: OXYGEN,
  nitrogen: NITROGEN,
  hydrogen: HYDROGEN,
  'carbon-dioxide': CARBON_DIOXIDE,
  chlorine: CHLORINE,
  air: AIR,
  iron: IRON,
  steel: STEEL,
  copper: COPPER,
  brass: BRASS,
  aluminium: ALUMINIUM,
  glass: GLASS,
  brick: BRICK,
  wood: WOOD,
} as const satisfies Record<string, Component>;

export type ComponentId = keyof typeof LIST;
export const COMPONENTS: Readonly<Record<ComponentId, Component>> = LIST;

export const isComponentId = (id: string): id is ComponentId => id in LIST;

/** Molar mass, kg/mol — computed from the formula; undefined for materials without one. */
export const molarMass = (c: Component): number | undefined => (c.composition ? molarMassOf(c.composition) : undefined);
