import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import { NUMBER_LOCALE, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { WINCH_TEXT, type WinchCommand } from './bench.js';


export const text = (c: WinchCommand): StepText => WINCH_TEXT['lab.winch'](c);

export const busy = (): LocalizedText => msg('windlass-busy');

export function shown(_c: WinchCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const r = recs[0];
  if (r?.quantity === 'turns') return formatMeasured('turns', r.value, 0.25, locale);
  return `${new Intl.NumberFormat(NUMBER_LOCALE[locale], { maximumFractionDigits: 1 }).format(Math.round((r?.value ?? 0) * 1000) / 10)} ${t(locale, 'unit-sym-cm')}`;
}

/** The turns counted, or how far the load rose. */
export function say(c: WinchCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const n = recs[0]?.value ?? 0;
  const count = formatMeasured('turns', n, 0.25, locale).replace(/ (об\.|turns)$/, '');
  if (c.mode === 'lower') return t(locale, 'windlass-say-turns', { spool: c.spool, count, n });
  return t(locale, 'windlass-say-rose', { cm: Math.round(n * 1000) / 10 });
}

/** The board's lines for a done step. */
export function board(c: WinchCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const d = r.inputs?.['diameter'] ?? 0;
  const amount = c.amount;
  const what = c.spool === 'pencil' ? t(locale, 'windlass-board-what') : t(locale, 'windlass-board-what-2');
  const cm = (x: number) => `${n(x * 100, 3)} ${t(locale, 'unit-sym-cm')}`;
  if (c.mode === 'lower') {
    out.push({ id: `wm:${i}`, title: t(locale, 'windlass-board-title', { what, amount: cm(amount) }), formula: `n = ${formatMeasured('turns', r.value, 0.25, locale)}` });
    out.push({ id: `wc:${i}`, title: t(locale, 'windlass-board-title-2'), formula: 'n = l / (π·d)', numbers: `${cm(amount)} / (3,14 · ${cm(d)}) ≈ ${n(amount / (Math.PI * d), 3)}`.replace('3,14', t(locale, 'windlass-board-numbers')) });
  } else {
    out.push({ id: `wm:${i}`, title: t(locale, 'windlass-board-title-3', { what, amount: String(amount) }), formula: `h = ${cm(r.value!)}` });
    out.push({ id: `wc:${i}`, title: t(locale, 'windlass-board-title-2'), formula: 'l = π·d·n', numbers: `3,14 · ${cm(d)} · ${amount} ≈ ${cm(Math.PI * d * amount)}`.replace('3,14', t(locale, 'windlass-board-numbers')) });
  }
  return out;
}
