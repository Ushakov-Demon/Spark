import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured, readingText } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { MOTION_SETUP, MOTION_TEXT, type MotionCommand } from './bench.js';

/** (Each experiment names its own set: the groove, the body on a thread, the pendulum — `benchSetup`.) */
export const setup: LocalizedText = MOTION_SETUP.incline;

export const text = (c: MotionCommand): StepText => MOTION_TEXT[c.type](c);

/** The tape is put along — no motion; the runs play with the stopwatch going. */
export function busy(c: MotionCommand): LocalizedText | null {
  if (c.type === 'lab.roll') return { uk: 'Кулька котиться — секундомір іде…', en: 'The ball is rolling — the stopwatch is running…' };
  if (c.type === 'lab.whirl') return { uk: 'Рахую оберти: раз, два, три…', en: 'Counting the turns: one, two, three…' };
  if (c.type === 'lab.swing') return { uk: 'Рахую коливання: раз, два, три…', en: 'Counting the swings: one, two, three…' };
  return null;
}

export const shown = (_c: MotionCommand, recs: readonly MeasurementRecord[], locale: Locale): string => (recs[0] ? readingText(recs[0], locale) : '');

/** What the tape and the stopwatch showed. */
export function say(c: MotionCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  const v = recs[0]?.value ?? null;
  const cm = (x: number) => formatMeasured('length', x, 0.001, locale);
  const sec = (x: number | null) => formatMeasured('time', x ?? 0, 0.01, locale);
  if (c.type === 'lab.tape') return uk ? `${c.what === 'path' ? 'Шлях кульки' : 'Довжина маятника'}: l = ${cm(v ?? 0)}.` : `${c.what === 'path' ? 'The ball’s path' : 'The pendulum’s length'}: l = ${cm(v ?? 0)}.`;
  if (c.type === 'lab.roll') return uk ? `Кулька докотилася до циліндра за ${sec(v)}.` : `The ball reached the cylinder in ${sec(v)}.`;
  if (c.type === 'lab.whirl') return uk ? `${c.turns} обертів — ${sec(v)}: один оберт ≈ ${sig((v ?? 0) / c.turns, 3, locale)} с.` : `${c.turns} turns — ${sec(v)}: one turn ≈ ${sig((v ?? 0) / c.turns, 3, locale)} s.`;
  return uk ? `${c.count} коливань — ${sec(v)}: одне коливання ≈ ${sig((v ?? 0) / c.count, 3, locale)} с.` : `${c.count} swings — ${sec(v)}: one swing ≈ ${sig((v ?? 0) / c.count, 3, locale)} s.`;
}

/** The board's lines for a done step: a path by the tape, times by the stopwatch — speeds and periods. */
export function board(c: MotionCommand, trace: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const cm = (x: number) => formatMeasured('length', x, 0.001, locale);
  const sec = (x: number) => formatMeasured('time', x, 0.01, locale);
  // (The path the tape measured last, before this step.)
  const tapePath = before.flatMap((x) => (x.ok && x.command.type === 'lab.tape' ? x.trace : [])).filter((x): x is MeasurementRecord => x.kind === 'measurement' && x.value !== null).pop()?.value ?? null;
  if (c.type === 'lab.tape') {
    out.push({ id: `tape:${i}`, title: c.what === 'path' ? (uk ? 'шлях кульки — від позначки до циліндра' : 'the ball’s path — from the mark to the cylinder') : uk ? 'довжина маятника' : 'the length of the pendulum', formula: `l = ${cm(r.value!)}` });
    return out;
  }
  if (c.type === 'lab.roll') {
    const path = c.path;
    // Half the path: half of what the tape measured.
    const l = tapePath === null ? path : path < tapePath - 1e-9 ? tapePath / 2 : tapePath;
    const half = tapePath !== null && path < tapePath - 1e-9;
    out.push({ id: `roll:${i}`, title: half ? (uk ? 'середня швидкість на першій половині шляху' : 'the average speed on the first half of the path') : uk ? 'середня швидкість кульки на всьому шляху' : 'the ball’s average speed on the whole path', formula: 'v = l / t', numbers: `${n(l)} ${uk ? 'м' : 'm'} / ${sec(r.value!)} ≈ ${n(l / r.value!, 2)} ${uk ? 'м/с' : 'm/s'}` });
    return out;
  }
  if (c.type === 'lab.whirl') {
    const N = c.turns;
    const T = r.value! / N;
    const R = r.inputs?.['radius'] ?? 0.15;
    out.push({ id: `T:${i}`, title: uk ? `період обертання (нитка ${cm(c.thread)})` : `the period of turning (thread ${cm(c.thread)})`, formula: 'T = t / N', numbers: `${sec(r.value!)} / ${N} ≈ ${sec(T)}` });
    out.push({ id: `n:${i}`, title: uk ? 'обертова частота' : 'the frequency', formula: 'n = N / t', numbers: `${N} / ${sec(r.value!)} ≈ ${n(N / r.value!, 2)} ${uk ? 'об/с' : 'rev/s'}` });
    out.push({ id: `vc:${i}`, title: uk ? 'швидкість тіла на колі' : 'the body’s speed on the circle', formula: 'v = 2πR / T', numbers: `2π · ${n(R)} ${uk ? 'м' : 'm'} / ${sec(T)} ≈ ${n((2 * Math.PI * R) / T, 2)} ${uk ? 'м/с' : 'm/s'}` });
    return out;
  }
  if (c.type === 'lab.swing') {
    const N = c.count;
    out.push({ id: `Tp:${i}`, title: uk ? `період: ${cm(c.length)}, відхилення ${cm(c.amplitude)}, кулька ${Math.round(c.mass * 1000)} г` : `the period: ${cm(c.length)}, ${cm(c.amplitude)} aside, a ${Math.round(c.mass * 1000)} g ball`, formula: 'T = t / N', numbers: `${sec(r.value!)} / ${N} ≈ ${sec(r.value! / N)}` });
    return out;
  }
  return out;
}
