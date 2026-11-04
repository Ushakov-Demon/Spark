import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import { tr, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import { msg, t as tl } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { BEAUFORT, beaufortOf, WIND_TEXT, WIND_TRACK, type WindCommand } from './bench.js';

export const setup: LocalizedText = msg('wind-speed-setup');

export const text = (c: WindCommand): StepText => WIND_TEXT['lab.wind'](c);

export const busy = (): LocalizedText => msg('wind-speed-busy');

export const shown = (_c: WindCommand, recs: readonly MeasurementRecord[], locale: Locale): string => formatMeasured('time', recs[0]?.value ?? null, 0.01, locale);

/** The bubble's time over the 6 m. */
export function say(_c: WindCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const t = formatMeasured('time', recs[0]?.value ?? null, 0.01, locale);
  return tl(locale, 'wind-speed-say', { t });
}

/** The board's lines for a done step. */
export function board(c: WindCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const day = c.day;
  const l = r.inputs?.['track'] ?? WIND_TRACK;
  const v = l / r.value!;
  const f = beaufortOf(v);
  const name = BEAUFORT[f as 1 | 2 | 3]?.name;
  out.push({ id: `wd:${i}`, title: tr(BEAUFORT[day].signs, locale), formula: 'v = l / t', numbers: `${n(l, 2)} ${tl(locale, 'unit-sym-m')} / ${formatMeasured('time', r.value, 0.01, locale)} ≈ ${n(v, 2)} ${tl(locale, 'unit-sym-m-per-s')}${name ? tl(locale, 'wind-speed-board-force', { f, name: tr(name, locale) }) : ''}` });
  return out;
}
