import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import { tr, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { LIFT_TEXT, type LiftCommand, liftPhaseText } from './bench.js';

export const setup: LocalizedText = msg('weight-in-lift-setup');

export const text = (c: LiftCommand): StepText => LIFT_TEXT['lab.lift'](c);

export const busy = (): LocalizedText => msg('weight-in-lift-busy');

export const shown = (_c: LiftCommand, recs: readonly MeasurementRecord[], locale: Locale): string => formatMeasured('force', recs[0]?.value ?? null, 0.1, locale);

/** What the dynamometer shows now. */
export function say(c: LiftCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const P = formatMeasured('force', recs[0]?.value ?? null, 0.1, locale);
  return c.phase === 'fall' ? t(locale, 'weight-in-lift-say', { P }) : t(locale, 'weight-in-lift-say-2', { P });
}

/** The board's lines for a done step. */
export function board(c: LiftCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const a = r.inputs?.['a'] ?? 0;
  const phase = c.phase;
  const title = tr(liftPhaseText(phase).plan, locale);
  const acc = phase === 'fall' ? t(locale, 'weight-in-lift-board-acc') : a === 0 ? t(locale, 'weight-in-lift-board-acc-2') : `a = ${n(Math.abs(a), 2)} ${t(locale, 'unit-sym-m-per-s2')} ${a > 0 ? '↑' : '↓'}`;
  out.push({ id: `lf:${i}`, title: `${title} (${acc})`, formula: `P = ${formatMeasured('force', r.value, 0.1, locale)}` });
  return out;
}
