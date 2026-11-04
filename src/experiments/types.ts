import type { CommandHandler } from '../core/commands.js';
import type { ExperimentLogEntry } from '../core/experiment.js';
import type { MeasurementRecord } from '../core/trace.js';
import type { Locale, LocalizedText } from '../knowledge/i18n.js';
import type { BoardLine } from '../scenarios/lab-board.js';
import type { PresetAnswer, PresetRun } from '../scenarios/preset-answers.js';
import type { Preset } from '../scenarios/presets.js';

/**
 * An experiment's card: what the lab knows of it before it is opened — its bench, what stands on the table, its
 * ready-made experiments (the catalogue, the search, the notebook's page). Light on purpose (the module's preset.ts,
 * which imports no commands, no words, no answers): the page has every card from the start, and the rest of a module
 * comes when its experiment opens.
 */
export interface ExperimentCard<K extends string = string> {
  /** The bench's name: presets ask for it (`bench`), the scene draws it. */
  readonly kind: K;
  /** What stands on the table, for the line under the experiment's title. */
  readonly setup: LocalizedText;
  readonly presets: readonly Preset[];
}

/** An experiment's card, its `kind` kept as a literal. */
export const defineCard = <const K extends string>(c: ExperimentCard<K>): ExperimentCard<K> => c;

/**
 * An experiment of the bench, whole in one place: its card, its physics (the commands), its words (the buttons, the
 * Professor's lines, the protocol, the board) and its answers. The general code — the lab, the protocol, the board —
 * only asks the experiment; nothing about one experiment is written anywhere else. Its picture lives on the web side
 * (web/experiments), by the same `kind`.
 */
export interface ExperimentModule<C extends { readonly type: string } = { readonly type: string }, K extends string = string> extends ExperimentCard<K> {
  readonly commands: readonly CommandHandler<C>[];
  /** A step's button, its line in the plan, and what the Professor says doing it. */
  readonly text: (c: C) => StepText;
  /** A done step's outcome in words: the protocol's line; capitalised, with a full stop, the Professor's. */
  readonly shown: (c: C, recs: readonly MeasurementRecord[], locale: Locale) => string;
  /** The Professor's line, when it says more than the protocol's (a whole sentence, with its full stop); `before` — the run's log up to the step. */
  readonly say?: (c: C, recs: readonly MeasurementRecord[], locale: Locale, before: readonly ExperimentLogEntry<{ readonly type: string }>[]) => string;
  /** What the Professor says while the step's motion plays; null — the step has no motion (the picture just changes). */
  readonly busy: (c: C) => LocalizedText | null;
  /** The board's lines for a done step (`before` — the log up to it). */
  readonly board?: (c: C, recs: readonly MeasurementRecord[], at: BoardAt) => BoardLine[];
  /** The answers to the presets' questions, by preset id. */
  readonly answers: Readonly<Record<string, (run: PresetRun) => PresetAnswer>>;
}

export interface StepText {
  readonly say: LocalizedText;
  readonly button: LocalizedText;
  readonly plan: LocalizedText;
}

export interface BoardAt {
  /** The step's place in the log (the board's line ids carry it). */
  readonly index: number;
  readonly before: readonly ExperimentLogEntry<{ readonly type: string }>[];
  readonly locale: Locale;
}

/** An experiment module, its `kind` kept as a literal. */
export const defineExperiment = <C extends { readonly type: string }, const K extends string>(m: ExperimentModule<C, K>): ExperimentModule<C, K> => m;

/** The command type of a module (distributes over a union of modules). */
export type CommandOf<M> = M extends ExperimentModule<infer C, string> ? C : never;
