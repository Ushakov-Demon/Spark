import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { SINK_TEXT, type SinkCommand } from './bench.js';

export const setup: LocalizedText = { uk: 'Мірні циліндри (250 мл) з гліцерином, соняшниковою олією й водою, з позначками; сталева кулька від підшипника, секундомір', en: '250 mL measuring cylinders of glycerol, sunflower oil and water, with marks; a steel bearing ball, a stopwatch' };

export const text = (c: SinkCommand): StepText => SINK_TEXT['lab.sink'](c);

export const busy = (): LocalizedText => ({ uk: 'Стежу — секундомір іде…', en: 'Watching — the stopwatch is running…' });

const laps = (recs: readonly MeasurementRecord[]) => recs.filter((x) => x.quantity === 'time');

export const shown = (_c: SinkCommand, recs: readonly MeasurementRecord[], locale: Locale): string => laps(recs).map((x) => formatMeasured('time', x.value, 0.01, locale)).join(' · ');

/** The last mark's time — and the speed it gives. */
export function say(c: SinkCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  const lp = laps(recs).at(-1);
  if (!lp) return '';
  const s = Math.round((lp.inputs?.['mark'] ?? 0) * 100);
  const T = formatMeasured('time', lp.value, 0.01, locale);
  return c.body === 'bubble' ? (uk ? `Бульбашка пройшла ${s} см за ${T}.` : `The bubble went ${s} cm in ${T}.`) : uk ? `Кулька пройшла ${s} см за ${T}.` : `The ball went ${s} cm in ${T}.`;
}

/** The board's lines for a done step. */
export function board(c: SinkCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const times = laps(trace);
  const last = times[times.length - 1];
  if (!last) return out;
  const bubble = c.body === 'bubble';
  const d = c.diameter * 1000;
  const liquid = { 'washing-up': uk ? 'у рідині для посуду' : 'in washing-up liquid', glycerol: uk ? 'у гліцерині' : 'in glycerol', 'sunflower-oil': uk ? 'в олії' : 'in oil', water: uk ? 'у воді' : 'in water' }[c.liquid] ?? '';
  const what = bubble ? (uk ? `бульбашка ≈ ${n(d, 2)} мм` : `a ≈ ${n(d, 2)} mm bubble`) : uk ? `кулька ${liquid}` : `the ball ${liquid}`;
  const cmT = (m: number) => `${Math.round(m * 100)} ${uk ? 'см' : 'cm'}`;
  out.push({ id: `st:${i}`, title: uk ? `${what}: час на позначках` : `${what}: the times at the marks`, formula: times.map((x) => `${cmT(x.inputs?.['mark'] ?? 0)} — ${formatMeasured('time', x.value, 0.01, locale)}`).join('; ') });
  const s = last.inputs?.['mark'] ?? 0;
  const v = s / last.value!;
  out.push({ id: `${bubble ? 'bv' : 'kv'}:${i}`, title: uk ? `${what}: швидкість` : `${what}: the speed`, formula: 'v = l / t', numbers: `${n(s * 100)} ${uk ? 'см' : 'cm'} / ${formatMeasured('time', last.value, 0.01, locale)} ≈ ${v < 0.1 ? `${n(v * 100, 2)} ${uk ? 'см/с' : 'cm/s'}` : `${n(v, 2)} ${uk ? 'м/с' : 'm/s'}`}` });
  return out;
}
