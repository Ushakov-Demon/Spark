import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { CARTS_TEXT, type CartsCommand } from './bench.js';

export const setup: LocalizedText = { uk: 'Два легкі візки по 100 г, пружина між ними, нитка й сірники, тягарці по 100 г, лінійка, камера телефона, динамометр (до 5 Н)', en: 'Two light 100 g carts, a spring between them, a thread and matches, 100 g weights, a ruler, a phone camera, a dynamometer (up to 5 N)' };

export const text = (c: CartsCommand): StepText => CARTS_TEXT['lab.carts'](c);

export const busy = (): LocalizedText => ({ uk: 'Нитка перегоріла — візки роз’їжджаються…', en: 'The thread burnt — the carts roll apart…' });

const cm = (x: number | null, locale: Locale) => `${String(Math.round((x ?? 0) * 1000) / 10).replace('.', locale === 'uk' ? ',' : '.')} ${locale === 'uk' ? 'см' : 'cm'}`;

export const shown = (c: CartsCommand, recs: readonly MeasurementRecord[], locale: Locale): string =>
  c.mode === 'weigh' ? formatMeasured('force', recs[0]?.value ?? null, 0.1, locale) : recs.map((x) => cm(x.value, locale)).join(' · ');

/** The two paths, or the weight. */
export function say(c: CartsCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  if (c.mode === 'weigh') return uk ? `Динамометр показує ${formatMeasured('force', recs[0]?.value ?? null, 0.1, locale)}.` : `The dynamometer shows ${formatMeasured('force', recs[0]?.value ?? null, 0.1, locale)}.`;
  return uk ? `За 0,5 с: перший візок — ${cm(recs[0]?.value ?? null, locale)}, другий — ${cm(recs[1]?.value ?? null, locale)}.` : `In 0.5 s: the first cart — ${cm(recs[0]?.value ?? null, locale)}, the second — ${cm(recs[1]?.value ?? null, locale)}.`;
}

/** The board's lines for a done step. */
export function board(c: CartsCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const recs = trace;
  if (c.mode === 'weigh') {
    out.push({ id: `cw:${i}`, title: uk ? `візок ${c.cart} на динамометрі` : `cart ${c.cart} on the dynamometer`, formula: `P = ${formatMeasured('force', recs[0]?.value ?? 0, 0.1, locale)}` });
    return out;
  }
  const [a, b] = recs.map((x) => x.value!);
  const w = c.weights;
  const cmn = (x: number) => `${n(x * 100, 3)} ${uk ? 'см' : 'cm'}`;
  out.push({ id: `cl:${i}`, title: uk ? `${w === 0 ? 'однакові візки' : `візок 2 + ${w} × 100 г`}: за 0,5 с` : `${w === 0 ? 'alike carts' : `cart 2 + ${w} × 100 g`}: in 0.5 s`, formula: `l₁ = ${cmn(a ?? 0)}, l₂ = ${cmn(b ?? 0)}` });
  out.push({ id: `cr:${i}`, title: uk ? 'у скільки разів повільніший — у стільки разів важчий' : 'as many times slower — so many times heavier', formula: 'm₂ / m₁ = v₁ / v₂ = l₁ / l₂', numbers: `${cmn(a ?? 0)} / ${cmn(b ?? 0)} ≈ ${n((a ?? 0) / (b ?? 1), 2)}` });
  return out;
}
