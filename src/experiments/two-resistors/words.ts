import type { MeasurementRecord } from '../../core/trace.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { CIRCUIT_TEXT, type PairCommand } from '../resistor-circuit/bench.js';


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
  return t(locale, 'two-resistors-say', { I, U });
}

/** The board's lines for a done step. */
export function board(c: PairCommand, trace: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
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
  const place = at === 'both' ? (series ? t(locale, 'two-resistors-board-place') : t(locale, 'two-resistors-board-place-2')) : t(locale, 'two-resistors-board-place-3', { value: at === 'r1' ? 1 : 2 });
  out.push({ id: `pair:${i}`, title: t(locale, 'two-resistors-board-title', { place }), formula: series ? `I = ${A(I)}, U${sub} = ${V(U)}` : `I${sub} = ${A(I)}, U = ${V(U)}` });
  const { r1, r2, both } = pair;
  if (r1 && r2 && both) {
    out.push(series
      ? { id: `sum:${i}`, title: t(locale, 'two-resistors-board-title-2'), formula: 'U = U₁ + U₂', numbers: `${V(r1.U)} + ${V(r2.U)} = ${V(r1.U + r2.U)} (${t(locale, 'two-resistors-board-numbers')} ${V(both.U)})` }
      : { id: `sum:${i}`, title: t(locale, 'two-resistors-board-title-3'), formula: 'I = I₁ + I₂', numbers: `${A(r1.I)} + ${A(r2.I)} = ${A(r1.I + r2.I)} (${t(locale, 'two-resistors-board-numbers')} ${A(both.I)})` });
  }
  return out;
}
