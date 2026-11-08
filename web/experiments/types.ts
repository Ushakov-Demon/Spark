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
 * step just done. Every step the module says it is busy with (its `busy` not null) must have a motion — or the next button never comes.
 */
export interface ExperimentScene<V, K extends string = string> {
  readonly kind: K;
  readonly view: (ctx: SceneContext) => V;
  readonly svg: (v: V) => string;
  /** The least share of the board's room right of the Professor its apparatus takes (2/3 if not said): more for a long, low one; less for a small body that, blown up, would look like something else (a block like a crate); 0 — its own size. */
  readonly share?: number;
  /** The Professor himself is in this picture (stands on the apparatus): the page hides his figure in the corner, his bubble stays. */
  readonly onStage?: (v: V) => boolean;
  /** The motion from the previous picture (`prev`, when it was this experiment's too) to `next`; null — nothing to play. */
  readonly motion: (next: V, draw: (v: V) => void, prev: V | null) => Motion | null;
  /**
   * Knobs on the scene to turn between the steps: the picture and the instrument answer at once, and nothing goes
   * into the run (the next step sets them back). `controls` — what to show for this view (none — no knobs);
   * `apply` — the view with the knobs' values. A part of the drawing marked `data-live="<knob>"` can be dragged:
   * `drag` turns the pointer's way (from where it took hold to where it is, in the drawing's own units; `v` — the view
   * when it took hold) into that knob's value. `take` — the next step
   * measures what the knobs show: their values into its command.
   */
  readonly live?: {
    readonly controls: (v: V) => readonly LiveControl[];
    readonly apply: (v: V, values: Readonly<Record<string, number>>) => V;
    readonly drag?: (v: V, knob: string, from: { readonly x: number; readonly y: number }, to: { readonly x: number; readonly y: number }) => number;
    readonly take?: (command: { readonly type: string } & Record<string, unknown>, values: Readonly<Record<string, number>>) => { readonly type: string } & Record<string, unknown>;
  };
}

/** A knob on the scene: a slider from `min` to `max`, its value and how the value reads («8 Вт», «60°»). */
export interface LiveControl {
  readonly id: string;
  readonly label: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly value: number;
  readonly text: string;
}

export const defineScene = <V, const K extends string>(s: ExperimentScene<V, K>): ExperimentScene<V, K> => s;
