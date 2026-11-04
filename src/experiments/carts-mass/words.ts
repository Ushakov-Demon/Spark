import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { CARTS_TEXT, type CartsCommand } from './bench.js';

export const setup: LocalizedText = msg('carts-mass-setup');

export const text = (c: CartsCommand): StepText => CARTS_TEXT['lab.carts'](c);

export const busy = (): LocalizedText => msg('carts-mass-busy');

const cm = (x: number | null, locale: Locale) => `${String(Math.round((x ?? 0) * 1000) / 10).replace('.', t(locale, 'carts-mass-cm'))} ${t(locale, 'unit-sym-cm')}`;

export const shown = (c: CartsCommand, recs: readonly MeasurementRecord[], locale: Locale): string =>
  c.mode === 'weigh' ? formatMeasured('force', recs[0]?.value ?? null, 0.1, locale) : recs.map((x) => cm(x.value, locale)).join(' · ');

/** The two paths, or the weight. */
export function say(c: CartsCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  if (c.mode === 'weigh') return t(locale, 'carts-mass-say', { value: formatMeasured('force', recs[0]?.value ?? null, 0.1, locale) });
  return t(locale, 'carts-mass-say-2', { recs: cm(recs[0]?.value ?? null, locale), recs2: cm(recs[1]?.value ?? null, locale) });
}

/** The board's lines for a done step. */
export function board(c: CartsCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const recs = trace;
  if (c.mode === 'weigh') {
    out.push({ id: `cw:${i}`, title: t(locale, 'carts-mass-board-title', { cart: c.cart }), formula: `P = ${formatMeasured('force', recs[0]?.value ?? 0, 0.1, locale)}` });
    return out;
  }
  const [a, b] = recs.map((x) => x.value!);
  const w = c.weights;
  const cmn = (x: number) => `${n(x * 100, 3)} ${t(locale, 'unit-sym-cm')}`;
  out.push({ id: `cl:${i}`, title: t(locale, 'carts-mass-board-title-3', { value: w === 0 ? t(locale, 'carts-mass-labcarts-plan-3') : t(locale, 'carts-mass-board-title-2', { w: String(w) }) }), formula: `l₁ = ${cmn(a ?? 0)}, l₂ = ${cmn(b ?? 0)}` });
  out.push({ id: `cr:${i}`, title: t(locale, 'carts-mass-board-title-4'), formula: 'm₂ / m₁ = v₁ / v₂ = l₁ / l₂', numbers: `${cmn(a ?? 0)} / ${cmn(b ?? 0)} ≈ ${n((a ?? 0) / (b ?? 1), 2)}` });
  return out;
}
