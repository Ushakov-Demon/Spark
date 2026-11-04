import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import type { BoardAt, StepText } from '../types.js';
import { FOUNTAIN_TEXT, type FountainCommand } from './bench.js';


export const text = (c: FountainCommand): StepText => FOUNTAIN_TEXT['lab.fountain'](c);

/** The bottle is moved, the water runs (or stops). */
export const busy = (c: FountainCommand): LocalizedText => (c.head > 0 ? msg('fountain-model-busy') : msg('fountain-model-busy-2'));

const cm = (x: number) => Math.round(x * 100);
const unit = (locale: Locale) => t(locale, 'unit-sym-cm');

export function shown(c: FountainCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const r = recs[0];
  if (!r) return '';
  if (c.head <= 0) return t(locale, 'fountain-model-shown');
  return t(locale, 'fountain-model-shown-2', { head: String(cm(c.head)), value: String(cm(r.value ?? 0)) });
}

/** What the jet did. */
export function say(c: FountainCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const r = recs[0];
  if (!r) return '';
  if (c.head <= 0) return t(locale, 'fountain-model-say');
  return t(locale, 'fountain-model-say-2', { head: String(cm(c.head)), value: String(cm(r.value ?? 0)) });
}

/** The board's lines for a done step: the head, the jet, how much of the head the jet reached. */
export function board(c: FountainCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const r = trace[0];
  if (!r || r.value === null) return [];
  const u = unit(locale);
  if (c.head <= 0) return [{ id: `fh0:${i}`, title: t(locale, 'fountain-model-board-title'), formula: `H = −${cm(-c.head)} ${u}`, numbers: t(locale, 'fountain-model-board-numbers') }];
  return [{ id: `fh:${i}`, title: t(locale, 'fountain-model-board-title-2', { head: String(cm(c.head)), u }), formula: 'h / H', numbers: `${cm(r.value)} ${u} / ${cm(c.head)} ${u} ≈ ${sig(r.value / c.head, 2, locale)}` }];
}
