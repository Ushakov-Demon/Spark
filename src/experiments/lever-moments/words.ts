import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import { type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured, readingText } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { LEVER_TEXT, type LeverCommand } from './bench.js';

export const setup: LocalizedText = msg('lever-moments-setup');

export const text = (c: LeverCommand): StepText => LEVER_TEXT['lab.lever'](c);

/** No motion: the picture just changes. */
export const busy = (): LocalizedText | null => null;

export function shown(_c: LeverCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const r = recs[0];
  if (!r) return '';
  // (Weights on both sides: no instrument — it balances or tips.)
  if (r.instrument === 'lever') return (r.inputs?.['tip'] ?? 0) === 0 ? t(locale, 'lever-moments-shown') : t(locale, 'lever-moments-shown-2');
  return readingText(r, locale);
}

/** It balances, or tips which way; with the dynamometer — what it shows. */
export function say(_c: LeverCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const r = recs[0];
  if (!r) return '';
  if (r.instrument === 'dynamometer') return t(locale, 'lever-moments-say', { value: formatMeasured('force', r.value, 0.1, locale) });
  const tip = r.inputs?.['tip'] ?? 0;
  return tip === 0 ? t(locale, 'lever-moments-say-2') : t(locale, 'lever-moments-say-5', { value: tip < 0 ? t(locale, 'lever-moments-say-3') : t(locale, 'lever-moments-say-4') });
}

/** The board's lines for a done step. */
export function board(c: LeverCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const cm = (x: number) => formatMeasured('length', x, 0.001, locale);
  const F2 = (x: number) => formatMeasured('force', x, 0.01, locale);
  const F1 = r.inputs?.['F1'] ?? 0;
  const l1 = r.inputs?.['l1'] ?? 0;
  const l2 = r.inputs?.['l2'] ?? 0;
  const dyn = r.instrument === 'dynamometer';
  const F2s = dyn ? formatMeasured('force', r.value, 0.1, locale) : F2(r.value!);
  const Nm = t(locale, 'unit-sym-N-m');
  out.push({ id: `M1:${i}`, title: t(locale, 'lever-moments-board-title', { F1: F2(F1), l1: cm(l1) }), formula: 'M₁ = F₁·l₁', numbers: `${F2(F1)} · ${n(l1)} ${t(locale, 'unit-sym-m')} ≈ ${n(F1 * l1, 3)} ${Nm}` });
  out.push({ id: `M2:${i}`, title: dyn ? (t(locale, 'lever-moments-board-title-2', { l2: cm(l2) })) : t(locale, 'lever-moments-board-title-3', { F2s, l2: cm(l2) }), formula: 'M₂ = F₂·l₂', numbers: `${F2s} · ${n(l2)} ${t(locale, 'unit-sym-m')} ≈ ${n(r.value! * l2, 3)} ${Nm}` });
  return out;
}
