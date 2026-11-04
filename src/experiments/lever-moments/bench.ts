import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { cite, sv } from '../../components/sourced.js';
import { G } from '../../domains/mechanics/constants.js';
import { moment, slidingFriction, weight } from '../../domains/mechanics/formulas.js';
import { msg, t } from '../../knowledge/messages.js';
import { blockMass, WOOD_ON_WOOD } from '../../scenarios/bench-kit.js';
import { SCALES, scaleReading } from '../../equipment/scales.js';
import type { LocalizedText, Locale } from '../../knowledge/i18n.js';
import type { SourcedValue } from '../../knowledge/types.js';

/**
 * The lever of grade 8 (lab work 1, the condition of a lever's balance): a ruler on an axis at its middle,
 * balanced by itself, with holes for hooks along it; 100 g weights hang on it, a dynamometer pulls it down. What
 * the dynamometer shows follows from the balance of moments, F₁·l₁ = F₂·l₂.
 */

/** The holes for the hooks: every so many metres from the axis, up to the end. */
export const LEVER_STEP: SourcedValue = sv(0.05, 'm', 'between the holes of a school lever', 'estimate', 0.5, [cite('spark', 'estimate', 'school lever rulers have holes every 2–5 cm', 0.05)], 'Estimate: the arms are read by the ruler on the lever all the same.');
export const LEVER_ARM = 0.2;
/** One weight, kg (the set of the lab works). */
export const LEVER_WEIGHT = 0.1;

/** On the left: so many weights so far from the axis. On the right: weights, or a dynamometer pulling down. */
export interface LeverCommand {
  readonly type: 'lab.lever';
  readonly left: { readonly weights: number; readonly at: number };
  readonly right: { readonly weights: number; readonly at: number } | { readonly dynamometer: true; readonly at: number };
}

const onLever = (x: number) => x > 0 && x <= LEVER_ARM + 1e-9 && Math.abs(x / LEVER_STEP.value - Math.round(x / LEVER_STEP.value)) < 1e-6;

export const leverCommand: CommandHandler<LeverCommand> = {
  type: 'lab.lever',
  apply(state, c) {
    if (!onLever(c.left.at) || !onLever(c.right.at)) return err(msg('lever-moments-command-apply'));
    if (!(Number.isInteger(c.left.weights) && c.left.weights >= 1 && c.left.weights <= 4)) return err(msg('lever-moments-command-apply-2'));
    const F1 = weight(c.left.weights * LEVER_WEIGHT, G);
    const M1 = moment(F1, c.left.at);
    if ('dynamometer' in c.right) {
      // The force that balances: F₂ = M₁ / l₂ — the dynamometer shows it to its division.
      const F2 = M1 / c.right.at;
      const dyn = SCALES.dynamometer;
      return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [{ kind: 'measurement', instrument: 'dynamometer', quantity: 'force', value: scaleReading(dyn, F2), exact: F2, entities: [], inputs: { F1, l1: c.left.at, l2: c.right.at, balanced: 1 } } satisfies MeasurementRecord] });
    }
    // Weights on both sides: it balances or tips to the side with the larger moment.
    const F2 = weight(c.right.weights * LEVER_WEIGHT, G);
    const M2 = moment(F2, c.right.at);
    const tip = Math.abs(M1 - M2) < 1e-9 ? 0 : M1 > M2 ? -1 : 1;
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [{ kind: 'measurement', instrument: 'lever', quantity: 'force', value: F2, exact: F2, entities: [], inputs: { F1, l1: c.left.at, l2: c.right.at, balanced: tip === 0 ? 1 : 0, tip } } satisfies MeasurementRecord] });
  },
};

/**
 * The inclined plane (lab work 2, the efficiency of a simple machine): the wooden board of the friction lab work,
 * one end raised on the stand; the block with weights on it is pulled up along it at a steady speed. The
 * dynamometer shows F = P·(sin α + μ·cos α) — gravity along the board and sliding friction, wood on wood.
 */
export const SLOPE_LENGTH: SourcedValue = sv(0.6, 'm', 'the board raised as a slope', 'estimate', 0.3, [cite('spark', 'estimate', 'the school wooden board, 0.5–0.8 m', 0.6)], 'Estimate: its length is measured by the ruler all the same.');
/** Weights on the block (two of 100 g by default): the dynamometer reads more of a newton, and less of the error. */
export const SLOPE_WEIGHTS = 2;
const SLOPE_WEIGHT = 0.1;
/** The block and its weights, kg. */
export const slopeLoad = (weights = SLOPE_WEIGHTS): number => blockMass() + weights * SLOPE_WEIGHT;

/** Raise the board's end so high and pull the block up along it steadily; read the dynamometer. */
export interface SlopeCommand {
  readonly type: 'lab.slope';
  readonly height: number;
  /** 100 g weights on the block (two if not said). */
  readonly weights?: number;
}

export const slopeCommand: CommandHandler<SlopeCommand> = {
  type: 'lab.slope',
  apply(state, c) {
    const l = SLOPE_LENGTH.value;
    if (!(c.height > 0 && c.height < l)) return err(msg('lever-moments-slope-command-apply'));
    const P = weight(slopeLoad(c.weights), G);
    const sin = c.height / l;
    const cos = Math.sqrt(1 - sin * sin);
    // Along the board: the share of gravity pulling down the slope, and friction against the normal force P·cos α.
    const F = P * sin + slidingFriction(WOOD_ON_WOOD.value, P * cos);
    const dyn = SCALES.dynamometer;
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [{ kind: 'measurement', instrument: 'dynamometer', quantity: 'force', value: scaleReading(dyn, F), exact: F, entities: [], inputs: { h: c.height, l, P, mu: WOOD_ON_WOOD.value, weights: c.weights ?? SLOPE_WEIGHTS } } satisfies MeasurementRecord] });
  },
};

export const LEVER_COMMANDS = [leverCommand, slopeCommand] as const;

const cm = (m: number) => Math.round(m * 100);
const w = (n: number, l: Locale) => t(l, 'count-weights', { n });

export const LEVER_TEXT: Record<LeverCommand['type'] | SlopeCommand['type'], (c: LeverCommand | SlopeCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.slope': (x) => {
    const c = x as SlopeCommand;
    return {
    say: msg('lever-moments-labslope-say', { height: String(cm(c.height)) }),
    button: msg('lever-moments-labslope-button', { height: String(cm(c.height)) }),
    plan: msg('lever-moments-labslope-plan', { height: String(cm(c.height)) }),
    };
  },
  'lab.lever': (x) => {
    const c = x as LeverCommand;
    const l = c.left;
    const r = c.right;
    const left = msg('lever-moments-lablever-left', { weights: (lang: Locale) => w(l.weights, lang), at: String(cm(l.at)) });
    const right = 'dynamometer' in r ? msg('lever-moments-lablever-right', { at: String(cm(r.at)) }) : msg('lever-moments-lablever-right-2', { weights: (l: Locale) => w(r.weights, l), at: String(cm(r.at)) });
    return {
      say: 'dynamometer' in r
        ? msg('lever-moments-lablever-say', { left: (l: Locale) => left[l], at: String(cm(r.at)) })
        : msg('lever-moments-lablever-say-2', { left: (l: Locale) => left[l], right: (l: Locale) => right[l] }),
      button: msg('lever-moments-lablever-button', { left: (l: Locale) => left[l], right: (l: Locale) => right[l] }),
      plan: msg('lever-moments-lablever-plan', { left: (l: Locale) => left[l], right: (l: Locale) => right[l] }),
    };
  },
};
