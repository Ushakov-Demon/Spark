import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import { tr, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { LIFT_TEXT, type LiftCommand, liftPhaseText } from './bench.js';

export const setup: LocalizedText = { uk: 'Кабіна ліфта, динамометр (до 5 Н) під її стелею, чотири тягарці по 100 г', en: 'A lift cabin, a dynamometer (up to 5 N) under its ceiling, four 100 g weights' };

export const text = (c: LiftCommand): StepText => LIFT_TEXT['lab.lift'](c);

export const busy = (): LocalizedText => ({ uk: 'Ліфт їде — стежимо за динамометром…', en: 'The lift is moving — watch the dynamometer…' });

export const shown = (_c: LiftCommand, recs: readonly MeasurementRecord[], locale: Locale): string => formatMeasured('force', recs[0]?.value ?? null, 0.1, locale);

/** What the dynamometer shows now. */
export function say(c: LiftCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  const P = formatMeasured('force', recs[0]?.value ?? null, 0.1, locale);
  return c.phase === 'fall' ? (uk ? `У падінні динамометр показує ${P} — тягарці нічого не тягнуть: невагомість!` : `Falling, the dynamometer shows ${P} — the weights pull on nothing: weightlessness!`) : uk ? `Динамометр показує ${P}.` : `The dynamometer shows ${P}.`;
}

/** The board's lines for a done step. */
export function board(c: LiftCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const a = r.inputs?.['a'] ?? 0;
  const phase = c.phase;
  const title = tr(liftPhaseText(phase).plan, locale);
  const acc = phase === 'fall' ? (uk ? 'вільне падіння' : 'free fall') : a === 0 ? (uk ? 'без прискорення' : 'no acceleration') : `a = ${n(Math.abs(a), 2)} ${uk ? 'м/с²' : 'm/s²'} ${a > 0 ? '↑' : '↓'}`;
  out.push({ id: `lf:${i}`, title: `${title} (${acc})`, formula: `P = ${formatMeasured('force', r.value, 0.1, locale)}` });
  return out;
}
