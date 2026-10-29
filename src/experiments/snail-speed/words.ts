import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import { tr, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import type { BoardAt, StepText } from '../types.js';
import { SNAIL_TEXT, SNAIL_TIME, type SnailCommand, snailSurfaceName } from './bench.js';

export const setup: LocalizedText = { uk: 'Садовий равлик, пластиковий аркуш (сухий, мокрий, вертикально), наждачний папір P120, лінійка, камера телефона, секундомір', en: 'A garden snail, a plastic sheet (dry, wet, upright), P120 sandpaper, a ruler, a phone camera, a stopwatch' };

export const text = (c: SnailCommand): StepText => SNAIL_TEXT['lab.snail'](c);

export const busy = (): LocalizedText => ({ uk: 'Равлик повзе — знімаємо 30 секунд…', en: 'The snail crawls — filming for 30 seconds…' });

export const shown = (_c: SnailCommand, recs: readonly MeasurementRecord[], locale: Locale): string => `${Math.round((recs[0]?.value ?? 0) * 1000)} ${locale === 'uk' ? 'мм' : 'mm'}`;

/** The distance in 30 s. */
export function say(_c: SnailCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const mm = Math.round((recs[0]?.value ?? 0) * 1000);
  return locale === 'uk' ? `За 30 с равлик проповз ${mm} мм.` : `In 30 s the snail went ${mm} mm.`;
}

/** The board's lines for a done step. */
export function board(c: SnailCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const t = r.inputs?.['time'] ?? SNAIL_TIME;
  out.push({ id: `sn:${i}`, title: tr(snailSurfaceName(c.surface), locale), formula: 'v = l / t', numbers: `${Math.round(r.value! * 1000)} ${uk ? 'мм' : 'mm'} / ${t} ${uk ? 'с' : 's'} ≈ ${n((r.value! * 1000) / t, 2)} ${uk ? 'мм/с' : 'mm/s'}` });
  return out;
}
