import type { Command, ExperimentLogEntry, ExperimentResult } from '../core/index.js';
import type { SystemState } from '../core/state.js';
import type { Level } from '../knowledge/levels.js';
import type { FormulaSpec, LawSpec, SourcedValue } from '../knowledge/types.js';
import type { Block } from './blocks.js';

/** A value the run depended on, and where it came from. */
export type DataUsage =
  | { readonly label: string; readonly origin: 'catalog'; readonly sourced: SourcedValue }
  | { readonly label: string; readonly origin: 'scenario'; readonly value: number; readonly unit: string };

/** What a physics domain contributes to explanations. */
export interface DomainKnowledge<C extends Command> {
  readonly formulas: readonly FormulaSpec[];
  readonly laws: readonly LawSpec[];
  /** "What happened": table + narrative. */
  timeline(result: ExperimentResult<C>, level: Level): Block[];
  describeCommand(entry: ExperimentLogEntry<C>, level: Level, state: SystemState): string;
  energyBalance(result: ExperimentResult<C>, level: Level): Block[];
  dataUsed(state: SystemState): readonly DataUsage[];
}
