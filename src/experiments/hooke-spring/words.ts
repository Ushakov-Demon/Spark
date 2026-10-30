import type { ExperimentLogEntry } from '../../core/experiment.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured, readingText } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { STRETCH_TEXT, type StretchCommand } from './bench.js';

export const setup: LocalizedText = { uk: 'Штатив із лапкою, пружина з набору, тягарці по 100 г, учнівська лінійка', en: 'A stand with a clamp, a spring of the set, 100 g weights, a ruler' };

export const text = (c: StretchCommand): StepText => STRETCH_TEXT(c);

export const busy = (): LocalizedText => ({ uk: 'Пружина ще коливається — чекаємо, поки заспокоїться…', en: 'The spring is still bouncing — wait until it settles…' });

export const shown = (_c: StretchCommand, recs: readonly MeasurementRecord[], locale: Locale): string => (recs[0] ? readingText(recs[0], locale) : '');

/** The first reading of an earlier step of this kind in the run that passes `pick`. */
const earlier = (before: readonly ExperimentLogEntry<{ readonly type: string }>[], type: string, pick: (c: Record<string, unknown>) => boolean) =>
  before.flatMap((x) => (x.ok && x.command.type === type && pick(x.command as unknown as Record<string, unknown>) ? [x.trace.find((y): y is MeasurementRecord => y.kind === 'measurement' && y.value !== null)] : [])).filter((x): x is MeasurementRecord => !!x);

/** The spring's length, and — with weights — its extension from the length unloaded. */
export function say(c: StretchCommand, recs: readonly MeasurementRecord[], locale: Locale, before: readonly ExperimentLogEntry<{ readonly type: string }>[]): string {
  const uk = locale === 'uk';
  const cm = (x: number) => formatMeasured('length', x, 0.001, locale);
  const r = recs[0];
  const v = r?.value ?? null;
  const n = c.weights;
  const l0 = earlier(before, 'lab.stretch', (x) => x['weights'] === 0)[0]?.value;
  if (n === 0 || v === null) return uk ? `Довжина пружини без вантажу l₀ = ${cm(v ?? 0)}.` : `The spring’s length with no load l₀ = ${cm(v ?? 0)}.`;
  const x = l0 !== undefined && l0 !== null ? v - l0 : null;
  return uk ? `З ${n === 1 ? 'тягарцем' : `${n} тягарцями`} пружина завдовжки l = ${cm(v)}${x !== null ? `: видовження x = l − l₀ = ${cm(x)}` : ''}.` : `With ${n === 1 ? 'one weight' : `${n} weights`} the spring is l = ${cm(v)} long${x !== null ? `: the extension x = l − l₀ = ${cm(x)}` : ''}.`;
}

/** The board's lines for a done step. */
export function board(c: StretchCommand, trace: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
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
        out.push({ id: `l0:${i}`, title: uk ? 'довжина пружини без вантажу' : 'the spring with no load', formula: `l₀ = ${cm(r.value!)}` });
    return out;
  }
  if (springL0 === null) return out;
  const x = r.value! - springL0;
  const F = r.inputs?.['F'] ?? 0;
  out.push({ id: `hooke:${i}`, title: uk ? `${w} × 100 г: сила пружності дорівнює вазі тягарців` : `${w} × 100 g: the elastic force equals the weights’ weight`, formula: 'k = F / x', numbers: `${F2(F)} / ${n(x)} ${uk ? 'м' : 'm'} ≈ ${n(F / x)} ${uk ? 'Н/м' : 'N/m'} (x = ${cm(r.value!)} − ${cm(springL0)})` });
  return out;
  return out;
}
