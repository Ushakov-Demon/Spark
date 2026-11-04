import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { INDUCT_TEXT, type InductCommand } from './bench.js';

export const setup: LocalizedText = msg('electromagnetic-induction-setup');

export const text = (c: InductCommand): StepText => INDUCT_TEXT['lab.induct'](c);

/** No motion: the picture just changes. */
export const busy = (): LocalizedText | null => null;

/** The milliammeter's reading: signed, in mA; past its end — off the scale. */
export const inductShown = (v: number | null, locale: Locale) => (v === null ? t(locale, 'electromagnetic-induction-induct-shown') : `${v > 0 ? '+' : ''}${formatMeasured('current', v * 1000, 1, locale).replace(/ (А|A)$/, '').replace('-', '−')} ${t(locale, 'unit-sym-mA')}`);

export const shown = (_c: InductCommand, recs: readonly MeasurementRecord[], locale: Locale): string => inductShown(recs[0]?.value ?? null, locale);

/** The needle's swing — which way and how far. */
export function say(c: InductCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const v = recs[0]?.value ?? 0;
  if (Math.abs(v) < 1e-9) return c.move === 'still' ? t(locale, 'electromagnetic-induction-say') : t(locale, 'electromagnetic-induction-say-2');
  return t(locale, 'electromagnetic-induction-say-5', { v: inductShown(v, locale), value: v > 0 ? t(locale, 'electromagnetic-induction-say-3') : t(locale, 'electromagnetic-induction-say-4') });
}

/** The board's lines for a done step. */
export function board(c: InductCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const R = r.inputs?.['resistance'] ?? 0;
  const move = c.move;
  const fast = c.time <= 0.5;
  const pace = fast ? t(locale, 'electromagnetic-induction-labinduct-pace') : t(locale, 'electromagnetic-induction-labinduct-pace-2');
  const what = move === 'still' ? t(locale, 'electromagnetic-induction-board-what') : move === 'out' ? t(locale, 'electromagnetic-induction-board-what-2', { pace }) : move === 'coil' ? t(locale, 'electromagnetic-induction-board-what-3', { pace }) : t(locale, 'electromagnetic-induction-board-what-4', { pace, value: c.pole === 'S' ? t(locale, 'electromagnetic-induction-pole-s') : t(locale, 'electromagnetic-induction-pole-n') });
  const mA = `${r.value! > 0 ? '+' : ''}${n(r.value! * 1000, 2)} ${t(locale, 'unit-sym-mA')}`;
  if (move === 'still' || r.value! === 0) out.push({ id: `iI:${i}`, title: what, formula: `I = ${mA}` });
  else out.push({ id: `iE:${i}`, title: what, formula: `I = ${mA}, ε = I·R`, numbers: `${n(Math.abs(r.value!), 3)} ${t(locale, 'unit-sym-A')} · ${n(R, 2)} ${t(locale, 'unit-sym-ohm')} ≈ ${n(Math.abs(r.value!) * R, 2)} ${t(locale, 'unit-sym-V')}` });
  return out;
}
