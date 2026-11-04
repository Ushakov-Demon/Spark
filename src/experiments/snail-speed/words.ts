import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import { tr, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import { msg, t as tl } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import type { BoardAt, StepText } from '../types.js';
import { SNAIL_TEXT, SNAIL_TIME, type SnailCommand, snailSurfaceName } from './bench.js';

export const setup: LocalizedText = msg('snail-speed-setup');

export const text = (c: SnailCommand): StepText => SNAIL_TEXT['lab.snail'](c);

export const busy = (): LocalizedText => msg('snail-speed-busy');

export const shown = (_c: SnailCommand, recs: readonly MeasurementRecord[], locale: Locale): string => `${Math.round((recs[0]?.value ?? 0) * 1000)} ${tl(locale, 'unit-sym-mm')}`;

/** The distance in 30 s. */
export function say(_c: SnailCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const mm = Math.round((recs[0]?.value ?? 0) * 1000);
  return tl(locale, 'snail-speed-say', { mm: String(mm) });
}

/** The board's lines for a done step. */
export function board(c: SnailCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const t = r.inputs?.['time'] ?? SNAIL_TIME;
  out.push({ id: `sn:${i}`, title: tr(snailSurfaceName(c.surface), locale), formula: 'v = l / t', numbers: `${Math.round(r.value! * 1000)} ${tl(locale, 'unit-sym-mm')} / ${t} ${tl(locale, 'unit-sym-s')} ≈ ${n((r.value! * 1000) / t, 2)} ${tl(locale, 'unit-sym-mm-per-s')}` });
  return out;
}
