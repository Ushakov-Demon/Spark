import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import { type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { CIRCUIT_TEXT, type CircuitCommand } from './bench.js';

export const setup: LocalizedText = { uk: 'Джерело струму, ключ, резистор, амперметр, вольтметр, з’єднувальні дроти', en: 'A source, a key, a resistor, an ammeter, a voltmeter, connecting wires' };

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
  return locale === 'uk' ? `Ключ замкнено: амперметр показує ${I}, вольтметр — ${U}.` : `The key is closed: the ammeter shows ${I}, the voltmeter ${U}.`;
}

/** The board's lines for a done step. */
export function board(c: CircuitCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const recs = trace;
  const I = recs.find((x) => x.quantity === 'current');
  const U = recs.find((x) => x.quantity === 'voltage');
  if (!I || !U || I.value === null || U.value === null || I.value <= 0) return out;
  const A = (x: number) => formatMeasured('current', x, 0.01, locale);
  const V = (x: number) => formatMeasured('voltage', x, 0.1, locale);
  out.push({ id: `IU:${i}`, title: uk ? `покази приладів (джерело ${n(c.source, 2)} В)` : `the instruments (source ${n(c.source, 2)} V)`, formula: `I = ${A(I.value)}, U = ${V(U.value)}` });
  if (c.power) out.push({ id: `P:${i}`, title: uk ? 'потужність споживача' : 'the power of the consumer', formula: 'P = U · I', numbers: `${V(U.value)} · ${A(I.value)} ≈ ${n(U.value * I.value, 2)} ${uk ? 'Вт' : 'W'}` });
  else out.push({ id: `R:${i}`, title: uk ? 'опір провідника' : 'the resistance of the conductor', formula: 'R = U / I', numbers: `${V(U.value)} / ${A(I.value)} ≈ ${n(U.value / I.value, 2)} ${uk ? 'Ом' : 'Ω'}` });
  return out;
}
