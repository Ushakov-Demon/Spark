import type { MeasurementRecord } from '../../core/trace.js';
import { type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { CIRCUIT_TEXT, type PairCommand } from '../resistor-circuit/bench.js';

export const setup: LocalizedText = { uk: 'Джерело струму, ключ, два резистори (2 і 4 Ом), амперметр, вольтметр, з’єднувальні дроти', en: 'A source, a key, two resistors (2 and 4 Ω), an ammeter, a voltmeter, connecting wires' };

export const text = (c: PairCommand): StepText => CIRCUIT_TEXT['lab.pair'](c);

/** No motion: the picture just changes. */
export const busy = (): LocalizedText | null => null;

export const shown = (_c: PairCommand, recs: readonly MeasurementRecord[], locale: Locale): string =>
  // (Two instruments at once: both are written.)
  recs.map((x) => formatMeasured(x.quantity, x.value, x.quantity === 'current' ? 0.01 : 0.1, locale)).join(' · ');

/** The key closed: what the ammeter and the voltmeter show. */
export function say(_c: PairCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const I = formatMeasured('current', recs.find((x) => x.quantity === 'current')?.value ?? 0, 0.01, locale);
  const U = formatMeasured('voltage', recs.find((x) => x.quantity === 'voltage')?.value ?? 0, 0.1, locale);
  return locale === 'uk' ? `Ключ замкнено: амперметр показує ${I}, вольтметр — ${U}.` : `The key is closed: the ammeter shows ${I}, the voltmeter ${U}.`;
}

/** The board's lines for a done step. */
export function board(c: PairCommand, trace: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const out: BoardLine[] = [];
  const recs = trace;
  const I = recs.find((x) => x.quantity === 'current')?.value;
  const U = recs.find((x) => x.quantity === 'voltage')?.value;
  if (I == null || U == null) return out;
  const at = c.at;
  const series = c.connection === 'series';
  // (The readings so far of this connection, by where the instruments were: the sums need all three.)
  const pair: Partial<Record<'r1' | 'r2' | 'both', { I: number; U: number }>> = {};
  for (const x of before) {
    if (!x.ok || x.command.type !== 'lab.pair' || (x.command as unknown as PairCommand).connection !== c.connection) continue;
    const ms = x.trace.filter((y): y is MeasurementRecord => y.kind === 'measurement' && y.value !== null);
    const xi = ms.find((y) => y.quantity === 'current')?.value;
    const xu = ms.find((y) => y.quantity === 'voltage')?.value;
    if (xi != null && xu != null) pair[(x.command as unknown as PairCommand).at] = { I: xi, U: xu };
  }
  pair[at] = { I, U };
  const A = (x: number) => formatMeasured('current', x, 0.01, locale);
  const V = (x: number) => formatMeasured('voltage', x, 0.1, locale);
  const sub = at === 'r1' ? '₁' : at === 'r2' ? '₂' : '';
  const place = at === 'both' ? (series ? (uk ? 'на обох резисторах разом' : 'across both resistors') : uk ? 'до розгалуження' : 'before the fork') : uk ? `резистор ${at === 'r1' ? 1 : 2}` : `resistor ${at === 'r1' ? 1 : 2}`;
  out.push({ id: `pair:${i}`, title: uk ? `покази: ${place}` : `the readings: ${place}`, formula: series ? `I = ${A(I)}, U${sub} = ${V(U)}` : `I${sub} = ${A(I)}, U = ${V(U)}` });
  const { r1, r2, both } = pair;
  if (r1 && r2 && both) {
    out.push(series
      ? { id: `sum:${i}`, title: uk ? 'сума напруг на резисторах — і загальна напруга' : 'the voltages across the resistors added — and the total', formula: 'U = U₁ + U₂', numbers: `${V(r1.U)} + ${V(r2.U)} = ${V(r1.U + r2.U)} (${uk ? 'виміряно' : 'measured'} ${V(both.U)})` }
      : { id: `sum:${i}`, title: uk ? 'сума струмів у гілках — і загальний струм' : 'the branch currents added — and the total', formula: 'I = I₁ + I₂', numbers: `${A(r1.I)} + ${A(r2.I)} = ${A(r1.I + r2.I)} (${uk ? 'виміряно' : 'measured'} ${A(both.I)})` });
  }
  return out;
}
