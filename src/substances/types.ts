import type { LocalizedText } from '../knowledge/i18n.js';
import type { LeveledText } from '../knowledge/levels.js';
import type { SourcedValue } from '../knowledge/types.js';
import type { MediaAsset } from '../equipment/types.js';

/**
 * A shelf item: what the experimenter can put into a vessel — a component
 * (src/components) or a recipe of components (src/recipes), seen through the
 * lab's eyes. Built from them in catalog.ts; holds no numbers of its own.
 *
 * Temperatures in data are in °C (as in the sources); the thermal domain
 * converts them.
 */
export type SubstanceCategory = 'liquid.water' | 'liquid.alcohol' | 'liquid.acid' | 'liquid.oil' | 'liquid.solution' | 'solid.salt' | 'solid.metal';

export interface SubstanceItem {
  readonly id: string;
  /** Where it comes from: one component, or a recipe of several. */
  readonly component?: string;
  readonly recipe?: string;
  readonly category: SubstanceCategory;
  readonly name: LocalizedText;
  /** The name after an amount: "7 г кухонної солі". */
  readonly genitive?: LocalizedText;
  /** Grammatical gender of the name in Ukrainian — verbs in sentences agree with it. */
  readonly gender: 'f' | 'm' | 'n';
  /** Name of the solid form, if it has a special one ("лід"). */
  readonly solidName?: LocalizedText;
  readonly description: LeveledText;
  readonly safety?: LeveledText;
  readonly media: readonly MediaAsset[];
  /**
   * Water + table salt (NaCl) in this proportion: not a substance of its own but a mix of
   * components, computed by the mixture model (freezing, boiling, crystals follow from the
   * composition). saltFraction = salt / (salt + water); 1 = dry salt.
   */
  readonly mixture?: { readonly saltFraction: number };
  /** For liquids — the liquid; for a solid component (salt) — the solid's own properties. */
  readonly liquid: {
    readonly specificHeat: SourcedValue; // J/(kg·K)
    readonly density: SourcedValue; // kg/m³
    /** Not used by the lumped model (heat transfer into liquids uses h); kept for explanations. */
    readonly conductivity?: SourcedValue; // W/(m·K)
  };
  /** Absent: no reliable freezing data — the model does not freeze it. */
  readonly freezing?: {
    readonly point: SourcedValue; // °C
    readonly latentHeat: SourcedValue; // J/kg
    readonly solidSpecificHeat: SourcedValue; // J/(kg·K)
    readonly solidDensity?: SourcedValue; // kg/m³
  };
  /** Absent: does not boil at normal pressure (oil decomposes first). */
  readonly boiling?: {
    readonly point: SourcedValue; // °C
    readonly latentHeat: SourcedValue; // J/kg
  };
  /** Evaporation below the boiling point. Absent: negligible (oil). */
  readonly vapor?: {
    readonly molarMass: SourcedValue; // kg/mol
    readonly pressure: { readonly kind: 'buck' } | { readonly kind: 'antoine'; readonly A: number; readonly B: number; readonly C: number };
    readonly pressureData: SourcedValue; // the source of the vapour-pressure equation
    /** Latent heat at a lower temperature (it grows as temperature falls), °C and J/kg. */
    readonly latentLow?: { readonly temperature: number; readonly value: SourcedValue };
  };
  /** Temperature at which it starts to smoke / decompose, °C (oils). */
  readonly decomposes?: SourcedValue;
  /** Catches fire easily — never heated over an open flame in real life. */
  readonly flammable?: boolean;
  /** Simplifications specific to this substance, shown in explanations. */
  readonly modelNotes?: readonly LocalizedText[];
}
