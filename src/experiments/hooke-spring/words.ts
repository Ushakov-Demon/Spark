import type { ExperimentLogEntry } from '../../core/experiment.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured, readingText } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { STRETCH_TEXT, type StretchCommand } from './bench.js';

export const setup: LocalizedText = msg('hooke-spring-setup');

export const text = (c: StretchCommand): StepText => STRETCH_TEXT(c);

export const busy = (): LocalizedText => msg('hooke-spring-busy');

export const shown = (_c: StretchCommand, recs: readonly MeasurementRecord[], locale: Locale): string => (recs[0] ? readingText(recs[0], locale) : '');

/** The first reading of an earlier step of this kind in the run that passes `pick`. */
const earlier = (before: readonly ExperimentLogEntry<{ readonly type: string }>[], type: string, pick: (c: Record<string, unknown>) => boolean) =>
  before.flatMap((x) => (x.ok && x.command.type === type && pick(x.command as unknown as Record<string, unknown>) ? [x.trace.find((y): y is MeasurementRecord => y.kind === 'measurement' && y.value !== null)] : [])).filter((x): x is MeasurementRecord => !!x);

/** The spring's length, and — with weights — its extension from the length unloaded. */
export function say(c: StretchCommand, recs: readonly MeasurementRecord[], locale: Locale, before: readonly ExperimentLogEntry<{ readonly type: string }>[]): string {
  const cm = (x: number) => formatMeasured('length', x, 0.001, locale);
  const r = recs[0];
  const v = r?.value ?? null;
  const n = c.weights;
  const l0 = earlier(before, 'lab.stretch', (x) => x['weights'] === 0)[0]?.value;
  if (n === 0 || v === null) return t(locale, 'hooke-spring-say', { v: cm(v ?? 0) });
  const x = l0 !== undefined && l0 !== null ? v - l0 : null;
  return t(locale, 'hooke-spring-say-5', { v: cm(v), value: n === 1 ? t(locale, 'hooke-spring-say-2') : t(locale, 'hooke-spring-say-3', { n: String(n) }), x: x !== null ? t(locale, 'hooke-spring-say-4', { x: cm(x) }) : '' });
}

/** The board's lines for a done step. */
export function board(c: StretchCommand, trace: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const cm = (x: number) => formatMeasured('length', x, 0.001, locale);
  const F2 = (x: number) => formatMeasured('force', x, 0.01, locale);
  // (The length unloaded, measured first.)
  const springL0 = earlier(before, 'lab.stretch', (x) => x['weights'] === 0)[0]?.value ?? null;
  const w = c.weights;
  if (w === 0) {
        out.push({ id: `l0:${i}`, title: t(locale, 'hooke-spring-board-title'), formula: `l₀ = ${cm(r.value!)}` });
    return out;
  }
  if (springL0 === null) return out;
  const x = r.value! - springL0;
  const F = r.inputs?.['F'] ?? 0;
  out.push({ id: `hooke:${i}`, title: t(locale, 'hooke-spring-board-title-2', { w: String(w) }), formula: 'k = F / x', numbers: `${F2(F)} / ${n(x)} ${t(locale, 'unit-sym-m')} ≈ ${n(F / x)} ${t(locale, 'unit-sym-N-per-m')} (x = ${cm(r.value!)} − ${cm(springL0)})` });
  return out;
  return out;
}
