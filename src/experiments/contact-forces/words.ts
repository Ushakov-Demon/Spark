import type { MeasurementRecord } from '../../core/trace.js';
import { tr, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import type { BoardAt, StepText } from '../types.js';
import { TOUCH_CASES, TOUCH_TEXT, type TouchCommand, touchSeen } from './bench.js';

export const setup: LocalizedText = msg('contact-forces-setup');

export const text = (c: TouchCommand): StepText => TOUCH_TEXT['lab.touch'](c);

export const busy = (): LocalizedText => msg('contact-forces-busy');

export const shown = (_c: TouchCommand, recs: readonly MeasurementRecord[], locale: Locale): string =>
  recs[0]?.inputs?.['acts'] === 1 ? t(locale, 'contact-forces-shown') : t(locale, 'contact-forces-shown-2');

/** What was seen. */
export function say(c: TouchCommand, _recs: readonly MeasurementRecord[], locale: Locale): string {
  const s = tr(touchSeen(c.case), locale);
  return `${s.charAt(0).toUpperCase()}${s.slice(1)}.`;
}

/** The board's lines for a done step. */
export function board(c: TouchCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const k = c.case;
  const acts = r.inputs?.['acts'] === 1;
  out.push({ id: `tc:${i}`, title: tr(touchSeen(k), locale), formula: `${tr(TOUCH_CASES[k].force, locale)}: ${acts ? t(locale, 'contact-forces-shown') : t(locale, 'contact-forces-board-formula')}` });
  return out;
}
