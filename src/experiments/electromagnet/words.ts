import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { MAGNET_TEXT, type MagnetCommand } from './bench.js';

export const setup: LocalizedText = msg('electromagnet-setup');

export const text = (c: MagnetCommand): StepText => MAGNET_TEXT['lab.magnet'](c);

export const busy = (c: MagnetCommand): LocalizedText =>
  c.core ? msg('electromagnet-busy') : msg('electromagnet-busy-2');

export const shown = (_c: MagnetCommand, recs: readonly MeasurementRecord[], locale: Locale): string => recs.map((x) => formatMeasured(x.quantity, x.value, x.quantity === 'current' ? 0.01 : 1, locale)).join(' · ');

/** The compass needle's turn — and which way. */
export function say(c: MagnetCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const deg = Math.abs(recs.find((x) => x.quantity === 'angle')?.value ?? 0);
  if (c.current === 0) return t(locale, 'electromagnet-say');
  if (!c.core) return t(locale, 'electromagnet-say-4', { value: deg < 2 ? t(locale, 'electromagnet-say-2') : t(locale, 'electromagnet-say-3', { deg: String(deg) }) });
  if (c.reversed) return t(locale, 'electromagnet-say-5', { deg: String(deg) });
  return t(locale, 'electromagnet-say-6', { deg: String(deg) });
}

/** The board's lines for a done step. */
export function board(c: MagnetCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const m = trace.find((x): x is MeasurementRecord => x.kind === 'measurement' && x.quantity === 'angle');
  if (!m || m.value === null) return out;
  const I = c.current;
  const earth = m.inputs?.['earth'] ?? 19.4e-6;
  const what = I === 0 ? t(locale, 'electromagnet-board-what') : `${n(I, 2)} ${t(locale, 'unit-sym-A')}${c.reversed ? t(locale, 'electromagnet-board-what-2') : ''}${c.core ? '' : t(locale, 'electromagnet-board-what-3')}`;
  if (I === 0) {
    const where = c.place ? ` (${c.place}${c.example ? t(locale, 'electromagnet-question-uk') : ''})` : '';
    out.push({ id: 'm0', title: t(locale, 'electromagnet-m0-title', { what }), formula: `θ = ${m.value}°` });
    out.push({ id: 'mE', title: t(locale, 'electromagnet-m-e-title', { where }), formula: `B_З ≈ ${n(earth * 1e6)} ${t(locale, 'unit-sym-uT')}` });
    return out;
  }
  const key = `${I}${c.reversed ? 'r' : ''}${c.core ? '' : 'n'}`;
  out.push({ id: `mB:${key}`, title: t(locale, 'electromagnet-board-title', { what }), formula: `θ = ${n(m.value)}°, B = B_З·tg θ`, numbers: `${n(earth * 1e6)} ${t(locale, 'unit-sym-uT')} · tg ${n(m.value)}° ≈ ${n(earth * Math.tan((m.value * Math.PI) / 180) * 1e6, 2)} ${t(locale, 'unit-sym-uT')}` });
  return out;
}
