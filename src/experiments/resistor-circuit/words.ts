import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { CIRCUIT_TEXT, type CircuitCommand } from './bench.js';


export const text = (c: CircuitCommand): StepText => CIRCUIT_TEXT['lab.circuit'](c);

/** No motion: the picture just changes. */
export const busy = (): LocalizedText | null => null;

export const shown = (_c: CircuitCommand, recs: readonly MeasurementRecord[], locale: Locale): string =>
  // (Two instruments at once: both are written.)
  recs.map((x) => formatMeasured(x.quantity, x.value, x.quantity === 'current' ? 0.01 : 0.1, locale)).join(' · ');

/** The key closed: what the ammeter and the voltmeter show. */
export function say(_c: CircuitCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const I = formatMeasured('current', recs.find((x) => x.quantity === 'current')?.value ?? 0, 0.01, locale);
  const U = formatMeasured('voltage', recs.find((x) => x.quantity === 'voltage')?.value ?? 0, 0.1, locale);
  return t(locale, 'resistor-circuit-say', { I, U });
}

/** The board's lines for a done step. */
export function board(c: CircuitCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const recs = trace;
  const I = recs.find((x) => x.quantity === 'current');
  const U = recs.find((x) => x.quantity === 'voltage');
  if (!I || !U || I.value === null || U.value === null || I.value <= 0) return out;
  const A = (x: number) => formatMeasured('current', x, 0.01, locale);
  const V = (x: number) => formatMeasured('voltage', x, 0.1, locale);
  out.push({ id: `IU:${i}`, title: t(locale, 'resistor-circuit-board-title', { source: n(c.source, 2) }), formula: `I = ${A(I.value)}, U = ${V(U.value)}` });
  if (c.power) out.push({ id: `P:${i}`, title: t(locale, 'resistor-circuit-board-title-2'), formula: 'P = U · I', numbers: `${V(U.value)} · ${A(I.value)} ≈ ${n(U.value * I.value, 2)} ${t(locale, 'unit-sym-W')}` });
  else out.push({ id: `R:${i}`, title: t(locale, 'resistor-circuit-board-title-3'), formula: 'R = U / I', numbers: `${V(U.value)} / ${A(I.value)} ≈ ${n(U.value / I.value, 2)} ${t(locale, 'unit-sym-ohm')}` });
  return out;
}
