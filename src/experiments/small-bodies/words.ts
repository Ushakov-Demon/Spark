import type { MeasurementRecord } from '../../core/trace.js';
import { tr, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import type { BoardAt, StepText } from '../types.js';
import { rowName, ROWS_TEXT, type RowsCommand } from './bench.js';


export const text = (c: RowsCommand): StepText => ROWS_TEXT['lab.rows'](c);

export const busy = (): LocalizedText => msg('small-bodies-busy');

export const shown = (_c: RowsCommand, recs: readonly MeasurementRecord[], locale: Locale): string => `${Math.round((recs[0]?.value ?? 0) * 1000)} ${t(locale, 'unit-sym-mm')}`;

/** The row's length (a single pea — to the ruler's division). */
export function say(c: RowsCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const L = `${Math.round((recs[0]?.value ?? 0) * 1000)} ${t(locale, 'unit-sym-mm')}`;
  if (c.count === 1) return t(locale, 'small-bodies-say', { L });
  const what = tr(rowName(c.body, c.count), locale);
  return c.body === 'thread' ? t(locale, 'small-bodies-say-2', { what, L }) : t(locale, 'small-bodies-say-3', { what, L });
}

/** The board's lines for a done step. */
export function board(c: RowsCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const N = c.count;
  const body = c.body;
  const L = `${Math.round(r.value! * 1000)} ${t(locale, 'unit-sym-mm')}`;
  const what = { pea: t(locale, 'small-bodies-what-pea'), millet: t(locale, 'small-bodies-what-millet'), thread: t(locale, 'small-bodies-what-thread') }[body] ?? '';
  if (N === 1) {
    out.push({ id: `r1:${i}`, title: t(locale, 'small-bodies-board-title'), formula: `d = ${L} ± 0,5 ${t(locale, 'unit-sym-mm')}`.replace('0,5', t(locale, 'small-bodies-board-formula')) });
    return out;
  }
  out.push({ id: `rw:${i}`, title: t(locale, 'small-bodies-board-title-4', { N: String(N), what, L, value: body === 'thread' ? t(locale, 'small-bodies-board-title-2') : t(locale, 'small-bodies-board-title-3') }), formula: 'd = L / N', numbers: `${L} / ${N} ≈ ${(r.value! / N * 1000).toFixed(2).replace('.', t(locale, 'small-bodies-answer-d2'))} ${t(locale, 'unit-sym-mm')}` });
  return out;
}
