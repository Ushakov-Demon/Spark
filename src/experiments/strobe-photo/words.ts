import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import { type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import type { BoardAt, StepText } from '../types.js';
import { STROBE_INTERVAL, STROBE_SCALE, STROBE_TEXT, type StrobeCommand } from './bench.js';

export const setup: LocalizedText = { uk: 'Два стробоскопічні фото кульки (масштаб 1 : 5, спалахи 4 рази на секунду), лінійка з міліметровими поділками', en: 'Two stroboscopic photos of the ball (scale 1 : 5, four flashes a second), a ruler with millimetre divisions' };

export const text = (c: StrobeCommand): StepText => STROBE_TEXT['lab.strobe'](c);

export const busy = (): LocalizedText => ({ uk: 'Спалахи один за одним — кулька лишає зображення…', en: 'Flash after flash — the ball leaves its images…' });

export const shown = (_c: StrobeCommand, recs: readonly MeasurementRecord[], locale: Locale): string => `${recs.map((x) => Math.round((x.value ?? 0) * 1000)).join(', ')} ${locale === 'uk' ? 'мм' : 'mm'}`;

/** The gaps measured on the photo. */
export function say(_c: StrobeCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const g = recs.map((x) => Math.round((x.value ?? 0) * 1000));
  return locale === 'uk' ? `Проміжки на фото: ${g.join(', ')} мм.` : `The gaps on the photo: ${g.join(', ')} mm.`;
}

/** The board's lines for a done step. */
export function board(c: StrobeCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const g = trace.map((x) => x.value!);
  const table = c.photo === 'table';
  const cm = (x: number) => `${n(x * STROBE_SCALE * 100, 2)} ${uk ? 'см' : 'cm'}`;
  const where = table ? (uk ? 'на столі' : 'on the table') : uk ? 'на жолобі' : 'in the groove';
  out.push({ id: `sg:${i}`, title: `${where}: ${g.map((x) => Math.round(x * 1000)).join(', ')} ${uk ? 'мм на фото' : 'mm on the photo'}`, formula: `l = ${STROBE_SCALE} · l_${uk ? 'фото' : 'photo'}`, numbers: g.map(cm).join(', ') });
  out.push({ id: `sv:${i}`, title: uk ? 'за 0,25 с між спалахами' : 'in 0.25 s between the flashes', formula: 'v = l / t', numbers: g.map((x) => `${n((x * STROBE_SCALE) / STROBE_INTERVAL, 2)}`).join(', ') + (uk ? ' м/с' : ' m/s') });
  return out;
}
