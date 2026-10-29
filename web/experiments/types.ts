import type { ExperimentLogEntry } from '../../src/core/experiment.js';
import type { Locale } from '../../src/knowledge/i18n.js';
import type { ProtocolStep } from '../../src/scenarios/protocol.js';
import type { Motion } from '../motion.js';

/** What a scene is drawn from: the done steps, the latest one, the steps still ahead. */
export interface SceneContext {
  /** The run's log, the steps that went well. */
  readonly log: readonly Extract<ExperimentLogEntry<{ readonly type: string }>, { readonly ok: true }>[];
  /** The latest step of the bench, and its command (absent before the first). */
  readonly last?: Extract<ExperimentLogEntry<{ readonly type: string }>, { readonly ok: true }>;
  readonly command?: { readonly type: string } & Record<string, unknown>;
  readonly plan: readonly ProtocolStep[];
  /** The run's substance (the liquid in the vessel, chosen in the experiment's setup). */
  readonly substance: string;
  readonly locale: Locale;
}

/**
 * The picture of an experiment module (src/experiments): its view from the run, the drawing, and the motion of the
 * step just done. Every step the module says it is busy with must have a motion — or the next button never comes.
 */
export interface ExperimentScene<V, K extends string = string> {
  readonly kind: K;
  readonly view: (ctx: SceneContext) => V;
  readonly svg: (v: V) => string;
  /** The motion from the previous picture (`prev`, when it was this experiment's too) to `next`; null — nothing to play. */
  readonly motion: (next: V, draw: (v: V) => void, prev: V | null) => Motion | null;
}

export const defineScene = <V, const K extends string>(s: ExperimentScene<V, K>): ExperimentScene<V, K> => s;
