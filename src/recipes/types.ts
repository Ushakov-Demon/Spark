import type { ComponentId } from '../components/index.js';
import type { LocalizedText } from '../knowledge/i18n.js';
import type { LeveledText } from '../knowledge/levels.js';
import type { SourcedValue } from '../knowledge/types.js';

/**
 * A recipe: which components to take and in what proportion ("sea water =
 * water + 3.5 % salt"). Not a substance of its own — the engine computes the
 * result from the components, so any other proportion works just as well.
 * Recipes are shortcuts on the shelf and, later, steps the Professor suggests.
 */
export interface Recipe {
  readonly id: string;
  readonly name: LocalizedText;
  /** Grammatical gender of the name in Ukrainian. */
  readonly gender: 'f' | 'm' | 'n';
  readonly description: LeveledText;
  /** Mass fractions; they add up to 1. */
  readonly parts: readonly { readonly component: ComponentId; readonly fraction: number }[];
  /** Where the proportion comes from (sea water salinity), if it is not just a round number. */
  readonly basis?: SourcedValue;
  readonly notes?: readonly LocalizedText[];
}
