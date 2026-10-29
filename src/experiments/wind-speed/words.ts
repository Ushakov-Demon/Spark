import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import { tr, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { BEAUFORT, beaufortOf, WIND_TEXT, WIND_TRACK, type WindCommand } from './bench.js';

export const setup: LocalizedText = { uk: 'Подвір’я в три вітряні дні: дві позначки за 6 м уздовж вітру (рулетка), мильні бульбашки, секундомір', en: 'A yard on three windy days: two marks 6 m apart along the wind (a tape measure), soap bubbles, a stopwatch' };

export const text = (c: WindCommand): StepText => WIND_TEXT['lab.wind'](c);

export const busy = (): LocalizedText => ({ uk: 'Бульбашка летить — секундомір іде…', en: 'The bubble flies — the stopwatch is running…' });

export const shown = (_c: WindCommand, recs: readonly MeasurementRecord[], locale: Locale): string => formatMeasured('time', recs[0]?.value ?? null, 0.01, locale);

/** The bubble's time over the 6 m. */
export function say(_c: WindCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const t = formatMeasured('time', recs[0]?.value ?? null, 0.01, locale);
  return locale === 'uk' ? `Бульбашка пролетіла 6 м за ${t}.` : `The bubble flew 6 m in ${t}.`;
}

/** The board's lines for a done step. */
export function board(c: WindCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const day = c.day;
  const l = r.inputs?.['track'] ?? WIND_TRACK;
  const v = l / r.value!;
  const f = beaufortOf(v);
  const name = BEAUFORT[f as 1 | 2 | 3]?.name;
  out.push({ id: `wd:${i}`, title: tr(BEAUFORT[day].signs, locale), formula: 'v = l / t', numbers: `${n(l, 2)} ${uk ? 'м' : 'm'} / ${formatMeasured('time', r.value, 0.01, locale)} ≈ ${n(v, 2)} ${uk ? 'м/с' : 'm/s'}${name ? (uk ? ` — ${f} ${f === 1 ? 'бал' : 'бали'}, ${name.uk}` : ` — force ${f}, ${name.en}`) : ''}` });
  return out;
}
