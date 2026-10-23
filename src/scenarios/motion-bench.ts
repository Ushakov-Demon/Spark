import type { CommandHandler } from '../core/commands.js';
import { err, ok } from '../core/result.js';
import type { MeasurementRecord } from '../core/trace.js';
import { cite, sv } from '../components/sourced.js';
import { G } from '../domains/mechanics/constants.js';
import { conicalPeriod, pendulumPeriodAt, rollingAcceleration } from '../domains/mechanics/formulas.js';
import type { LocalizedText } from '../knowledge/i18n.js';
import type { SourcedValue } from '../knowledge/types.js';

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
/** From the chalk mark to the metal cylinder that stops the ball, m (the path), and half of it. */
export const ROLL_PATH = 1.0;
/** The circle on the sheet, m (radius), and the thread from the hand to the body. */
export const CIRCLE_RADIUS: SourcedValue = sv(0.15, 'm', 'the circle on the sheet', 'single-source', 0.01, [cite('ua-textbook-2024-bariakhtar-physics-7', 'Лабораторна робота № 2: аркуш із зображенням кола радіусом 15 см', '—', 0.15)]);
export const THREAD_LENGTH: SourcedValue = sv(0.5, 'm', 'the thread from the hand to the body', 'single-source', 0.2, [cite('ua-textbook-2024-bariakhtar-physics-7', 'Лабораторна робота № 2: нитка завдовжки 50–60 см (з петлею)', '—', 0.5)]);
/** The pendulum's balls, kg: «two small heavy balls of different masses» — the masses are an estimate (the period does not depend on them). */
export const PENDULUM_BALLS = { light: 0.03, heavy: 0.1 } as const;
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
  readonly what: 'path' | 'length';
  readonly length: number;
}
/** Let the ball go from the mark (or from half-way) and time it down to the cylinder. */
export interface RollCommand {
  readonly type: 'lab.roll';
  readonly path: number;
}
/** Swing the body round the circle on the thread; time so many turns. */
export interface WhirlCommand {
  readonly type: 'lab.whirl';
  readonly thread: number;
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
export const grooveAcceleration = (): number => rollingAcceleration(G, GROOVE_RAISE.value / GROOVE_LENGTH.value);

export const tapeCommand: CommandHandler<TapeCommand> = {
  type: 'lab.tape',
  apply(state, c) {
    if (!(c.length > 0 && c.length <= 2)) return err({ uk: 'Стрічкою міряють до 2 м.', en: 'The tape measures up to 2 m.' });
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [measured('tape', 'length', tape(c.length), c.length, { division: TAPE_DIVISION })] });
  },
};

export const rollCommand: CommandHandler<RollCommand> = {
  type: 'lab.roll',
  apply(state, c) {
    if (!(c.path > 0 && c.path <= GROOVE_LENGTH.value)) return err({ uk: 'Кулька котиться лише жолобом.', en: 'The ball rolls only along the groove.' });
    // From rest, at a steady acceleration: l = a·t²/2.
    const a = grooveAcceleration();
    const t = Math.sqrt((2 * c.path) / a);
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [measured('stopwatch', 'time', stopwatch(t), t, { path: c.path, a, division: STOPWATCH_DIVISION.value })] });
  },
};

export const whirlCommand: CommandHandler<WhirlCommand> = {
  type: 'lab.whirl',
  apply(state, c) {
    const r = CIRCLE_RADIUS.value;
    if (!(c.thread > r && c.thread <= 1)) return err({ uk: 'Нитка має бути довшою за радіус кола.', en: 'The thread must be longer than the circle’s radius.' });
    if (!(Number.isInteger(c.turns) && c.turns > 0)) return err({ uk: 'Скільки обертів рахувати?', en: 'How many turns to count?' });
    const T = conicalPeriod(c.thread, r, G);
    const t = T * c.turns;
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [measured('stopwatch', 'time', stopwatch(t), t, { thread: c.thread, radius: r, turns: c.turns, period: T, division: STOPWATCH_DIVISION.value })] });
  },
};

export const swingCommand: CommandHandler<SwingCommand> = {
  type: 'lab.swing',
  apply(state, c) {
    if (!(c.length > 0.05 && c.length <= 1.2)) return err({ uk: 'Маятник — від 5 см до 1,2 м.', en: 'The pendulum is 5 cm to 1.2 m long.' });
    if (!(c.amplitude > 0 && c.amplitude < c.length / 2)) return err({ uk: 'Відхили кульку трохи — на кілька сантиметрів.', en: 'Pull the ball aside a little — a few centimetres.' });
    if (!(Number.isInteger(c.count) && c.count > 0)) return err({ uk: 'Скільки коливань рахувати?', en: 'How many swings to count?' });
    // The mass does not enter: the period follows from the length (and, a little, from the angle of the swing).
    const angle = Math.asin(c.amplitude / c.length);
    const T = pendulumPeriodAt(c.length, G, angle);
    const t = T * c.count;
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [measured('stopwatch', 'time', stopwatch(t), t, { length: c.length, amplitude: c.amplitude, mass: c.mass, count: c.count, period: T, division: STOPWATCH_DIVISION.value })] });
  },
};

export const MOTION_COMMANDS = [tapeCommand, rollCommand, whirlCommand, swingCommand] as const;

// To half a centimetre where it is one (an amplitude of 2,5 cm), whole ones otherwise.
const num = (m: number, comma: boolean) => String(Math.round(m * 200) / 2).replace('.', comma ? ',' : '.');
const cm = (m: number) => `${num(m, true)} см`;
const cmEn = (m: number) => `${num(m, false)} cm`;
const g = (kg: number) => `${Math.round(kg * 1000)} г`;
const gEn = (kg: number) => `${Math.round(kg * 1000)} g`;

/** What a step of the motion bench asks to do and what its button says. */
export const MOTION_TEXT: Record<MotionCommand['type'], (c: MotionCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.tape': (c) => {
    const t = c as TapeCommand;
    return t.what === 'path'
      ? { say: { uk: 'Виміряй стрічкою відстань від позначки крейдою до циліндра — це шлях кульки.', en: 'Measure with the tape from the chalk mark to the cylinder — the ball’s path.' }, button: { uk: '📏 Виміряти шлях', en: '📏 Measure the path' }, plan: { uk: 'виміряти шлях кульки', en: 'measure the ball’s path' } }
      : { say: { uk: `Виміряй довжину маятника — від точки підвісу до середини кульки: ${cm(t.length)}.`, en: `Measure the pendulum — from the point of suspension to the middle of the ball: ${cmEn(t.length)}.` }, button: { uk: '📏 Виміряти довжину', en: '📏 Measure the length' }, plan: { uk: 'виміряти довжину маятника', en: 'measure the pendulum' } };
  },
  'lab.roll': (c) => {
    const half = (c as RollCommand).path < ROLL_PATH - 1e-9;
    return half
      ? { say: { uk: 'Тепер — лише половина шляху: постав циліндр посередині й знову відпусти кульку від позначки.', en: 'Now half the path: put the cylinder half-way and let the ball go from the mark again.' }, button: { uk: '⏱ Половина шляху', en: '⏱ Half the path' }, plan: { uk: 'скотити кульку на половині шляху', en: 'roll the ball half-way' } }
      : { say: { uk: 'Відпусти кульку від позначки, не штовхаючи, і виміряй секундоміром, за який час вона докотиться до циліндра.', en: 'Let the ball go from the mark without pushing and time it with the stopwatch down to the cylinder.' }, button: { uk: '⏱ Відпустити кульку', en: '⏱ Let the ball go' }, plan: { uk: 'скотити кульку жолобом', en: 'roll the ball down the groove' } };
  },
  'lab.whirl': (c) => {
    const w = c as WhirlCommand;
    return {
      say: { uk: `Тримай нитку (${cm(w.thread)}) за петлю над центром кола й розкрути тіло так, щоб воно йшло по колу. Виміряй час ${w.turns} обертів.`, en: `Hold the thread (${cmEn(w.thread)}) by its loop over the centre of the circle and swing the body round it. Time ${w.turns} turns.` },
      button: { uk: `⏱ ${w.turns} обертів (нитка ${cm(w.thread)})`, en: `⏱ ${w.turns} turns (thread ${cmEn(w.thread)})` },
      plan: { uk: `${w.turns} обертів, нитка ${cm(w.thread)}`, en: `${w.turns} turns, thread ${cmEn(w.thread)}` },
    };
  },
  'lab.swing': (c) => {
    const s = c as SwingCommand;
    return {
      say: { uk: `Маятник ${cm(s.length)}, кулька ${g(s.mass)}: відхили її на ${cm(s.amplitude)} і відпусти. Виміряй час ${s.count} коливань.`, en: `A ${cmEn(s.length)} pendulum with a ${gEn(s.mass)} ball: pull it ${cmEn(s.amplitude)} aside and let go. Time ${s.count} swings.` },
      button: { uk: `⏱ ${s.count} коливань: ${cm(s.length)}, ${cm(s.amplitude)}, ${g(s.mass)}`, en: `⏱ ${s.count} swings: ${cmEn(s.length)}, ${cmEn(s.amplitude)}, ${gEn(s.mass)}` },
      plan: { uk: `${cm(s.length)}, відхилення ${cm(s.amplitude)}, кулька ${g(s.mass)}`, en: `${cmEn(s.length)}, ${cmEn(s.amplitude)} aside, a ${gEn(s.mass)} ball` },
    };
  },
};

/** What stands on the table for each of the motion benches. */
export const MOTION_SETUP: Record<'incline' | 'circle' | 'pendulum', LocalizedText> = {
  incline: { uk: 'Жолоб на штативі, сталева кулька, металевий циліндр, вимірювальна стрічка, секундомір', en: 'A groove on a stand, a steel ball, a metal cylinder, a measuring tape, a stopwatch' },
  circle: { uk: 'Тіло на нитці з петлею, аркуш із колом радіусом 15 см, секундомір', en: 'A body on a thread with a loop, a sheet with a 15 cm circle, a stopwatch' },
  pendulum: { uk: 'Штатив із кільцем, дві кульки на нитках, мірна стрічка, секундомір', en: 'A stand with a ring, two balls on threads, a measuring tape, a stopwatch' },
};
