import type { LocalizedText } from '../knowledge/i18n.js';
import type { LeveledText } from '../knowledge/levels.js';
import type { SourcedValue } from '../knowledge/types.js';
import type { MediaAsset } from '../equipment/types.js';

/**
 * Substances the experimenter can put into a vessel. Not tied to one physics
 * domain: thermal data today, chemical data later.
 *
 * Temperatures in data are in °C (as in the sources); the thermal domain
 * converts them.
 */
export type SubstanceCategory = 'liquid.water' | 'liquid.alcohol' | 'liquid.oil' | 'liquid.solution';

export interface SubstanceItem {
  readonly id: string;
  readonly category: SubstanceCategory;
  readonly name: LocalizedText;
  /** Grammatical gender of the name in Ukrainian — verbs in sentences agree with it. */
  readonly gender: 'f' | 'm' | 'n';
  /** Name of the solid form, if it has a special one ("лід"). */
  readonly solidName?: LocalizedText;
  readonly description: LeveledText;
  readonly safety?: LeveledText;
  readonly media: readonly MediaAsset[];
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
  /** Temperature at which it starts to smoke / decompose, °C (oils). */
  readonly decomposes?: SourcedValue;
  /** Catches fire easily — never heated over an open flame in real life. */
  readonly flammable?: boolean;
  /** Simplifications specific to this substance, shown in explanations. */
  readonly modelNotes?: readonly LocalizedText[];
}
