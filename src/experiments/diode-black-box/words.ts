import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { readingText } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { BOX_TEXT, type BoxCommand } from './bench.js';

export const setup: LocalizedText = { uk: '«Чорна скринька» з двома клемами, джерело струму, ключ, захисний резистор 100 Ом, мультиметр (міліамперметр), з’єднувальні дроти', en: 'A “black box” with two terminals, a source, a key, a 100 Ω protective resistor, a multimeter (a milliammeter), connecting wires' };

export const text = (c: BoxCommand): StepText => BOX_TEXT['lab.box'](c);

/** No motion: the picture just changes. */
export const busy = (): LocalizedText | null => null;

const mA = (v: number, locale: Locale) => `${(v * 1000).toFixed(1).replace('.', locale === 'uk' ? ',' : '.')} ${locale === 'uk' ? 'мА' : 'mA'}`;

export const shown = (_c: BoxCommand, recs: readonly MeasurementRecord[], locale: Locale): string => (recs[0]?.value !== null && recs[0] ? mA(recs[0].value!, locale) : recs[0] ? readingText(recs[0], locale) : '');

/** What the milliammeter shows, one way or turned round. */
export function say(c: BoxCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  const r = recs[0];
  if (!r || r.value === null) return '';
  const zero = r.value < (r.inputs?.['division'] ?? 0.0001);
  const I = mA(r.value, locale);
  return c.reversed
    ? zero ? (uk ? 'Скриньку перевернули — і міліамперметр показує нуль!' : 'The box turned round — and the milliammeter shows zero!') : uk ? `Скриньку перевернули — міліамперметр показує ${I}.` : `The box turned round — the milliammeter shows ${I}.`
    : uk ? `Ключ замкнено: міліамперметр показує ${I}.` : `The key is closed: the milliammeter shows ${I}.`;
}

/** The board's lines for a done step. */
export function board(c: BoxCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const U = c.source;
  const back = !!c.reversed;
  const div = r.inputs?.['division'] ?? 0.0001;
  const mAn = `${n(r.value! * 1000, 3)} ${uk ? 'мА' : 'mA'}`;
  const way = back ? (uk ? ', скринька перевернута' : ', the box turned round') : '';
  out.push({ id: `box:${back ? 'b' : 'a'}${U}`, title: uk ? `струм за ${n(U)} В${way}` : `the current at ${n(U)} V${way}`, formula: `I = ${mAn}` });
  if (r.value! >= div) out.push({ id: `boxR:${back ? 'b' : 'a'}${U}`, title: uk ? `опір кола${way}` : `the circuit’s resistance${way}`, formula: 'R = U / I', numbers: `${n(U)} ${uk ? 'В' : 'V'} / ${n(r.value! * 1000, 3)} ${uk ? 'мА' : 'mA'} ≈ ${n(U / r.value!, 2)} ${uk ? 'Ом' : 'Ω'}` });
  else out.push({ id: `boxR:${back ? 'b' : 'a'}${U}`, title: uk ? `опір кола${way}` : `the circuit’s resistance${way}`, formula: uk ? 'I ≈ 0 → R дуже великий' : 'I ≈ 0 → R very large' });
  return out;
}
