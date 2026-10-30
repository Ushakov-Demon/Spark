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
import { GRAPHITE } from './graphite.js';
import { IRON_II_HYDROXIDE } from './iron-hydroxide.js';
import { HYDROGEN } from './hydrogen.js';
import { HELIUM } from './helium.js';
import { IRON } from './iron.js';
import { NITROGEN } from './nitrogen.js';
import { OXYGEN } from './oxygen.js';
import { PORCELAIN } from './porcelain.js';
import { SODIUM_BICARBONATE } from './sodium-bicarbonate.js';
import { AMMONIUM_CHLORIDE } from './ammonium-chloride.js';
import { SODIUM_HYDROXIDE } from './sodium-hydroxide.js';
import { SODIUM_ACETATE } from './sodium-acetate.js';
import { SODIUM_CHLORIDE } from './sodium-chloride.js';
import { STEARIC_ACID } from './stearic-acid.js';
import { STEEL } from './steel.js';
import { SUCROSE } from './sucrose.js';
import { SUNFLOWER_OIL } from './sunflower-oil.js';
import { TIN } from './tin.js';
import type { Component } from './types.js';
import { WATER } from './water.js';
import { WOOD } from './wood.js';
import { RUBBER } from './rubber.js';
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
  'ammonium-chloride': AMMONIUM_CHLORIDE,
  'sodium-hydroxide': SODIUM_HYDROXIDE,
  'sodium-acetate': SODIUM_ACETATE,
  'copper-sulfate': COPPER_SULFATE,
  'calcium-carbonate': CALCIUM_CARBONATE,
  ethanol: ETHANOL,
  'acetic-acid': ACETIC_ACID,
  glycerol: GLYCEROL,
  'sunflower-oil': SUNFLOWER_OIL,
  oxygen: OXYGEN,
  nitrogen: NITROGEN,
  hydrogen: HYDROGEN,
  helium: HELIUM,
  'carbon-dioxide': CARBON_DIOXIDE,
  chlorine: CHLORINE,
  air: AIR,
  iron: IRON,
  steel: STEEL,
  copper: COPPER,
  brass: BRASS,
  aluminium: ALUMINIUM,
  tin: TIN,
  glass: GLASS,
  brick: BRICK,
  porcelain: PORCELAIN,
  'stearic-acid': STEARIC_ACID,
  graphite: GRAPHITE,
  'iron-ii-hydroxide': IRON_II_HYDROXIDE,
  wood: WOOD,
  rubber: RUBBER,
} as const satisfies Record<string, Component>;

export type ComponentId = keyof typeof LIST;
export const COMPONENTS: Readonly<Record<ComponentId, Component>> = LIST;

export const isComponentId = (id: string): id is ComponentId => id in LIST;

/** Molar mass, kg/mol — computed from the formula; undefined for materials without one. */
export const molarMass = (c: Component): number | undefined => (c.composition ? molarMassOf(c.composition) : undefined);

/** A material's molar mass, kg/mol: a mixture's own (air), or a pure substance's from its formula. */
export const molarMassOfComponent = (c: Component): number | undefined => c.molarMass?.value ?? (c.composition ? molarMassOf(c.composition) : undefined);
