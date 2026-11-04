import type { MeasurementRecord } from '../../core/trace.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg, t, t as tl } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import type { BoardAt, StepText } from '../types.js';
import { GRAVI_TEXT, type GraviCommand } from './bench.js';

/** The roots' words: the steps, the photos' angles, the board. */


export const text = (c: GraviCommand): StepText => GRAVI_TEXT['lab.gravi'](c);

export const busy = (): LocalizedText => msg('roots-gravity-busy');

/** The photos in words: «0 хв — 0°, 20 хв — 0°, …»; the jar standing — the roots straight down. */
export function shown(c: GraviCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  if (c.step === 'upright') return t(locale, 'roots-gravity-shown');
  return recs.map((r) => `${r.inputs?.['time'] ?? 0} ${t(locale, 'unit-sym-min')} — ${r.value}°`).join(', ');
}

/** The board: the bend after two hours on the side; on the clinostat. */
export function board(c: GraviCommand, recs: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const out: BoardLine[] = [];
  const step = c.step;
  if (step === 'upright' || !recs.length) return out;
  const last = recs[recs.length - 1]!;
  out.push({ id: `${step === 'side' ? 'gr' : 'gc'}:${i}`, title: (step === 'side' ? tl(locale, 'roots-gravity-board-title') : tl(locale, 'roots-gravity-board-title-2')), formula: t(locale, 'roots-gravity-board-formula', { time: last.inputs?.['time'] }), numbers: `${last.value}°` });
  return out;
}
