import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { cite, sv } from '../../components/sourced.js';
import { G } from '../../domains/mechanics/constants.js';
import { conicalPeriod, pendulumPeriodAt, rollingAcceleration } from '../../domains/mechanics/formulas.js';
import { NUMBER_LOCALE, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import { msg, t as tl } from '../../knowledge/messages.js';
import type { SourcedValue } from '../../knowledge/types.js';
import { ROLL_PATH } from './shared.js';
export { BODY_MASS, CIRCLE_RADIUS, ROLL_PATH, THREAD_LENGTH, PENDULUM_BALLS, MOTION_SETUP } from './shared.js';
import { CIRCLE_RADIUS, PENDULUM_LONGEST, PENDULUM_SHORTEST, pendulumLength } from './shared.js';
import { massText } from '../pulley/shared.js';

/**
 * The bench of grade 7 for motion (lab works 1–3): a ball rolling down a sloping groove, a body going round a
 * circle on a thread, a thread pendulum on a stand. A stopwatch times them, a measuring tape measures; what
 * they take follows from the laws of motion (rolling, the conical pendulum, the pendulum) and the bench's sizes.
 * The stopwatch is read exactly: a hand that starts and stops it adds ≈ 0.1–0.2 s, which is why the
 * textbook times many turns and repeats a run — the answer says so.
 */

/** The groove, m: as long as the textbook asks (1–1.5 m); its upper end raised on the stand so much. */
export const GROOVE_LENGTH: SourcedValue = sv(1.2, 'm', 'the groove', 'single-source', 0.2, [cite('ua-textbook-2024-bariakhtar-physics-7', 'Лабораторна робота № 1, обладнання: жолоб завдовжки 1–1,5 м', '—', 1.2)]);
export const GROOVE_RAISE: SourcedValue = sv(0.1, 'm', 'how high the upper end is', 'estimate', 0.5, [cite('spark', 'estimate', '«під невеликим кутом до горизонту»', 0.1)], 'Estimate: the textbook says only «at a small angle».');
/** A stopwatch that shows hundredths of a second (a phone's). */
export const STOPWATCH_DIVISION: SourcedValue = sv(0.01, 's', 'electronic stopwatch', 'estimate', 0, [cite('spark', 'estimate', 'phone and electronic stopwatches show hundredths', 0.01)]);
/** The measuring tape: millimetre marks. */
export const TAPE_DIVISION = 0.001;

const measured = (instrument: string, quantity: MeasurementRecord['quantity'], value: number, exact: number, inputs: Record<string, number>): MeasurementRecord => ({ kind: 'measurement', instrument, quantity, value, exact, entities: [], inputs });
const stopwatch = (t: number) => Math.round(t / STOPWATCH_DIVISION.value) * STOPWATCH_DIVISION.value;
const tape = (x: number) => Math.round(x / TAPE_DIVISION) * TAPE_DIVISION;

/** Measure a distance on the bench with the tape: the groove's path, the pendulum's length. */
export interface TapeCommand {
  readonly type: 'lab.tape';
  readonly what: 'path';
  readonly length: number;
}
/** Let the ball go from the mark (or from half-way) and time it down to the cylinder. */
export interface RollCommand {
  readonly type: 'lab.roll';
  readonly path: number;
  /** How high the groove's upper end is, m (GROOVE_RAISE if not said): a steeper groove, a quicker roll. */
  readonly raise?: number;
}
/** Swing the body round the circle on the thread; time so many turns. */
export interface WhirlCommand {
  readonly type: 'lab.whirl';
  readonly thread: number;
  /** The circle's radius, m (CIRCLE_RADIUS if not said). */
  readonly radius?: number;
  /** The body's mass, kg (BODY_MASS if not said): it does not enter the period. */
  readonly mass?: number;
  readonly turns: number;
}
/** Pull the ball aside so far and let go; time so many swings. */
export interface SwingCommand {
  readonly type: 'lab.swing';
  readonly length: number;
  readonly amplitude: number;
  readonly mass: number;
  readonly count: number;
}
export type MotionCommand = TapeCommand | RollCommand | WhirlCommand | SwingCommand;

/** The ball's acceleration down the groove, m/s²: a solid steel ball rolling. */
export const grooveAcceleration = (raise = GROOVE_RAISE.value): number => rollingAcceleration(G, raise / GROOVE_LENGTH.value);

export const tapeCommand: CommandHandler<TapeCommand> = {
  type: 'lab.tape',
  apply(state, c) {
    if (!(c.length > 0 && c.length <= 2)) return err(msg('motion-lab-works-tape-command-apply'));
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [measured('tape', 'length', tape(c.length), c.length, { division: TAPE_DIVISION })] });
  },
};

export const rollCommand: CommandHandler<RollCommand> = {
  type: 'lab.roll',
  apply(state, c) {
    if (!(c.path > 0 && c.path <= GROOVE_LENGTH.value)) return err(msg('motion-lab-works-roll-command-apply'));
    const raise = c.raise ?? GROOVE_RAISE.value;
    if (!(raise > 0 && raise <= 0.3)) return err(msg('motion-lab-works-roll-command-apply-2'));
    // From rest, at a steady acceleration: l = a·t²/2.
    const a = grooveAcceleration(raise);
    const t = Math.sqrt((2 * c.path) / a);
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [measured('stopwatch', 'time', stopwatch(t), t, { path: c.path, a, raise, division: STOPWATCH_DIVISION.value })] });
  },
};

export const whirlCommand: CommandHandler<WhirlCommand> = {
  type: 'lab.whirl',
  apply(state, c) {
    const r = c.radius ?? CIRCLE_RADIUS.value;
    if (!(r > 0 && c.thread > r && c.thread <= PENDULUM_LONGEST)) return err(msg('motion-lab-works-whirl-command-apply'));
    if (!(Number.isInteger(c.turns) && c.turns > 0)) return err(msg('motion-lab-works-whirl-command-apply-2'));
    const T = conicalPeriod(c.thread, r, G);
    const t = T * c.turns;
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [measured('stopwatch', 'time', stopwatch(t), t, { thread: c.thread, radius: r, turns: c.turns, period: T, division: STOPWATCH_DIVISION.value })] });
  },
};

export const swingCommand: CommandHandler<SwingCommand> = {
  type: 'lab.swing',
  apply(state, c) {
    if (!(c.length >= PENDULUM_SHORTEST && c.length <= PENDULUM_LONGEST)) return err(msg('motion-lab-works-swing-command-apply'));
    if (!(c.amplitude > 0 && c.amplitude < c.length / 2)) return err(msg('motion-lab-works-swing-command-apply-2'));
    if (!(Number.isInteger(c.count) && c.count > 0)) return err(msg('motion-lab-works-swing-command-apply-3'));
    // The mass does not enter: the period follows from the length (and, a little, from the angle of the swing).
    const angle = Math.asin(c.amplitude / c.length);
    const T = pendulumPeriodAt(c.length, G, angle);
    const t = T * c.count;
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [measured('stopwatch', 'time', stopwatch(t), t, { length: c.length, amplitude: c.amplitude, mass: c.mass, count: c.count, period: T, division: STOPWATCH_DIVISION.value })] });
  },
};

export const MOTION_COMMANDS = [tapeCommand, rollCommand, whirlCommand, swingCommand] as const;

// To half a centimetre where it is one (an amplitude of 2,5 cm), whole ones otherwise.
const num = (m: number, l: Locale) => new Intl.NumberFormat(NUMBER_LOCALE[l], { maximumFractionDigits: 1, useGrouping: false }).format(Math.round(m * 200) / 2);
const cm = (m: number, l: Locale) => `${num(m, l)} ${tl(l, 'unit-sym-cm')}`;
const g = (kg: number, l: Locale) => `${Math.round(kg * 1000)} ${tl(l, 'unit-sym-g')}`;

/** What a step of the motion bench asks to do and what its button says. */
export const MOTION_TEXT: Record<MotionCommand['type'], (c: MotionCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.tape': () => ({ say: msg('motion-lab-works-labtape-say'), button: msg('motion-lab-works-labtape-button'), plan: msg('motion-lab-works-labtape-plan') }),
  'lab.roll': (c) => {
    const half = (c as RollCommand).path < ROLL_PATH - 1e-9;
    return half
      ? { say: msg('motion-lab-works-labroll-say'), button: msg('motion-lab-works-labroll-button'), plan: msg('motion-lab-works-labroll-plan') }
      : { say: msg('motion-lab-works-labroll-say-2'), button: msg('motion-lab-works-labroll-button-2'), plan: msg('motion-lab-works-labroll-plan-2') };
  },
  'lab.whirl': (c) => {
    const w = c as WhirlCommand;
    return {
      say: msg('motion-lab-works-labwhirl-say', { thread: (l: Locale) => pendulumLength(w.thread, l), turns: String(w.turns) }),
      button: msg('motion-lab-works-labwhirl-button', { turns: String(w.turns), thread: (l: Locale) => pendulumLength(w.thread, l) }),
      plan: msg('motion-lab-works-labwhirl-plan', { turns: String(w.turns), thread: (l: Locale) => pendulumLength(w.thread, l) }),
    };
  },
  'lab.swing': (c) => {
    const s = c as SwingCommand;
    return {
      say: msg('motion-lab-works-labswing-say', { length: (l: Locale) => pendulumLength(s.length, l), mass: (l: Locale) => massText(s.mass, l), amplitude: (l: Locale) => pendulumLength(s.amplitude, l), count: String(s.count) }),
      button: msg('motion-lab-works-labswing-button', { count: String(s.count), length: (l: Locale) => pendulumLength(s.length, l), amplitude: (l: Locale) => pendulumLength(s.amplitude, l), mass: (l: Locale) => massText(s.mass, l) }),
      plan: msg('motion-lab-works-labswing-plan', { length: (l: Locale) => pendulumLength(s.length, l), amplitude: (l: Locale) => pendulumLength(s.amplitude, l), mass: (l: Locale) => massText(s.mass, l) }),
    };
  },
};
