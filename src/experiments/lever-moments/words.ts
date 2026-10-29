import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import { type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured, readingText } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { LEVER_TEXT, type LeverCommand } from './bench.js';

export const setup: LocalizedText = { uk: 'Важіль-лінійка на осі в штативі, тягарці по 100 г, динамометр', en: 'A lever ruler on an axis in a stand, 100 g weights, a dynamometer' };

export const text = (c: LeverCommand): StepText => LEVER_TEXT['lab.lever'](c);

/** No motion: the picture just changes. */
export const busy = (): LocalizedText | null => null;

export function shown(_c: LeverCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const r = recs[0];
  if (!r) return '';
  // (Weights on both sides: no instrument — it balances or tips.)
  if (r.instrument === 'lever') return (r.inputs?.['tip'] ?? 0) === 0 ? (locale === 'uk' ? 'рівновага' : 'balanced') : locale === 'uk' ? 'переважує' : 'tips';
  return readingText(r, locale);
}

/** It balances, or tips which way; with the dynamometer — what it shows. */
export function say(_c: LeverCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  const r = recs[0];
  if (!r) return '';
  if (r.instrument === 'dynamometer') return uk ? `Важіль горизонтально — динамометр показує ${formatMeasured('force', r.value, 0.1, locale)}.` : `The lever is level — the dynamometer shows ${formatMeasured('force', r.value, 0.1, locale)}.`;
  const tip = r.inputs?.['tip'] ?? 0;
  return tip === 0 ? (uk ? 'Важіль у рівновазі — стоїть горизонтально!' : 'The lever balances — it stands level!') : uk ? `Важіль переважує ${tip < 0 ? 'ліворуч' : 'праворуч'}.` : `The lever tips to the ${tip < 0 ? 'left' : 'right'}.`;
}

/** The board's lines for a done step. */
export function board(c: LeverCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
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
  const Nm = uk ? 'Н·м' : 'N·m';
  out.push({ id: `M1:${i}`, title: uk ? `момент сили ліворуч (${F2(F1)} на ${cm(l1)})` : `the moment on the left (${F2(F1)} at ${cm(l1)})`, formula: 'M₁ = F₁·l₁', numbers: `${F2(F1)} · ${n(l1)} ${uk ? 'м' : 'm'} ≈ ${n(F1 * l1, 3)} ${Nm}` });
  out.push({ id: `M2:${i}`, title: dyn ? (uk ? `момент сили праворуч (динамометр на ${cm(l2)})` : `the moment on the right (the dynamometer at ${cm(l2)})`) : uk ? `момент сили праворуч (${F2s} на ${cm(l2)})` : `the moment on the right (${F2s} at ${cm(l2)})`, formula: 'M₂ = F₂·l₂', numbers: `${F2s} · ${n(l2)} ${uk ? 'м' : 'm'} ≈ ${n(r.value! * l2, 3)} ${Nm}` });
  return out;
}
