import type { Command, ExperimentLogEntry, ExperimentResult } from '../core/index.js';
import type { SystemState } from '../core/state.js';
import type { LocalizedText } from '../knowledge/i18n.js';
import type { FormulaSpec, LawSpec, SourcedValue } from '../knowledge/types.js';
import type { Block } from './blocks.js';
import type { ExplainContext } from './format.js';

/** A value the run depended on, and where it came from. */
export type DataUsage =
  | { readonly label: LocalizedText; readonly origin: 'catalog'; readonly sourced: SourcedValue }
  | { readonly label: LocalizedText; readonly origin: 'scenario'; readonly value: number; readonly unit: string };

/** What a physics domain contributes to explanations. */
export interface DomainKnowledge<C extends Command> {
  readonly formulas: readonly FormulaSpec[];
  readonly laws: readonly LawSpec[];
  /** "What happened": table + narrative. */
  timeline(result: ExperimentResult<C>, ctx: ExplainContext): Block[];
  describeCommand(entry: ExperimentLogEntry<C>, ctx: ExplainContext, state: SystemState): string;
  energyBalance(result: ExperimentResult<C>, ctx: ExplainContext): Block[];
  dataUsed(state: SystemState): readonly DataUsage[];
}
