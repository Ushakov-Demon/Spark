import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured, readingText } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { MOTION_SETUP, MOTION_TEXT, type MotionCommand } from './bench.js';
import { massText } from '../pulley/shared.js';
import { pendulumLength } from './shared.js';


export const text = (c: MotionCommand): StepText => MOTION_TEXT[c.type](c);

/** The tape is put along — no motion; the runs play with the stopwatch going. */
export function busy(c: MotionCommand): LocalizedText | null {
  if (c.type === 'lab.roll') return msg('motion-lab-works-busy');
  if (c.type === 'lab.whirl') return msg('motion-lab-works-busy-2');
  if (c.type === 'lab.swing') return msg('motion-lab-works-busy-3');
  return null;
}

export const shown = (_c: MotionCommand, recs: readonly MeasurementRecord[], locale: Locale): string => (recs[0] ? readingText(recs[0], locale) : '');

/** What the tape and the stopwatch showed. */
export function say(c: MotionCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const v = recs[0]?.value ?? null;
  const cm = (x: number) => formatMeasured('length', x, 0.001, locale);
  const sec = (x: number | null) => formatMeasured('time', x ?? 0, 0.01, locale);
  if (c.type === 'lab.tape') return t(locale, 'motion-lab-works-say-3', { v: cm(v ?? 0), value: t(locale, 'motion-lab-works-say') });
  if (c.type === 'lab.roll') return t(locale, 'motion-lab-works-say-4', { v: sec(v) });
  if (c.type === 'lab.whirl') return t(locale, 'motion-lab-works-say-5', { turns: String(c.turns), v: sec(v), v2: sig((v ?? 0) / c.turns, 3, locale) });
  return t(locale, 'motion-lab-works-say-6', { count: String(c.count), v: sec(v), v2: sig((v ?? 0) / c.count, 3, locale) });
}

/** The board's lines for a done step: a path by the tape, times by the stopwatch — speeds and periods. */
export function board(c: MotionCommand, trace: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const cm = (x: number) => formatMeasured('length', x, 0.001, locale);
  const sec = (x: number) => formatMeasured('time', x, 0.01, locale);
  // (The path the tape measured last, before this step.)
  const tapePath = before.flatMap((x) => (x.ok && x.command.type === 'lab.tape' ? x.trace : [])).filter((x): x is MeasurementRecord => x.kind === 'measurement' && x.value !== null).pop()?.value ?? null;
  if (c.type === 'lab.tape') {
    out.push({ id: `tape:${i}`, title: t(locale, 'motion-lab-works-board-title'), formula: `l = ${cm(r.value!)}` });
    return out;
  }
  if (c.type === 'lab.roll') {
    const path = c.path;
    // Half the path: half of what the tape measured.
    const l = tapePath === null ? path : path < tapePath - 1e-9 ? tapePath / 2 : tapePath;
    const half = tapePath !== null && path < tapePath - 1e-9;
    out.push({ id: `roll:${i}`, title: half ? t(locale, 'motion-lab-works-board-title-3') : t(locale, 'motion-lab-works-board-title-4'), formula: 'v = l / t', numbers: `${n(l)} ${t(locale, 'unit-sym-m')} / ${sec(r.value!)} ≈ ${n(l / r.value!, 2)} ${t(locale, 'unit-sym-m-per-s')}` });
    return out;
  }
  if (c.type === 'lab.whirl') {
    const N = c.turns;
    const T = r.value! / N;
    const R = r.inputs?.['radius'] ?? 0.15;
    out.push({ id: `T:${i}`, title: t(locale, 'motion-lab-works-board-title-5', { thread: pendulumLength(c.thread, locale) }), formula: 'T = t / N', numbers: `${sec(r.value!)} / ${N} ≈ ${sec(T)}` });
    out.push({ id: `n:${i}`, title: t(locale, 'motion-lab-works-board-title-6'), formula: 'n = N / t', numbers: `${N} / ${sec(r.value!)} ≈ ${n(N / r.value!, 2)} ${t(locale, 'motion-lab-works-board-numbers')}` });
    out.push({ id: `vc:${i}`, title: t(locale, 'motion-lab-works-board-title-7'), formula: 'v = 2πR / T', numbers: `2π · ${n(R)} ${t(locale, 'unit-sym-m')} / ${sec(T)} ≈ ${n((2 * Math.PI * R) / T, 2)} ${t(locale, 'unit-sym-m-per-s')}` });
    return out;
  }
  if (c.type === 'lab.swing') {
    const N = c.count;
    out.push({ id: `Tp:${i}`, title: t(locale, 'motion-lab-works-board-title-8', { length: pendulumLength(c.length, locale), amplitude: pendulumLength(c.amplitude, locale), mass: massText(c.mass, locale) }), formula: 'T = t / N', numbers: `${sec(r.value!)} / ${N} ≈ ${sec(r.value! / N)}` });
    return out;
  }
  return out;
}
