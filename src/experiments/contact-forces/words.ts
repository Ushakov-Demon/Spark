import type { MeasurementRecord } from '../../core/trace.js';
import { tr, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import type { BoardAt, StepText } from '../types.js';
import { TOUCH_CASES, TOUCH_TEXT, type TouchCommand, touchSeen } from './bench.js';

export const setup: LocalizedText = { uk: 'Штатив, скріпка на нитці, магніт, картонка, пластиковий гребінець, шматочки паперу, брусок на нитці, тягарець', en: 'A stand, a paper clip on a thread, a magnet, a card, a plastic comb, bits of paper, a block on a thread, a weight' };

export const text = (c: TouchCommand): StepText => TOUCH_TEXT['lab.touch'](c);

export const busy = (): LocalizedText => ({ uk: 'Дивимося…', en: 'Watching…' });

export const shown = (_c: TouchCommand, recs: readonly MeasurementRecord[], locale: Locale): string =>
  recs[0]?.inputs?.['acts'] === 1 ? (locale === 'uk' ? 'діє без дотику' : 'acts without touching') : locale === 'uk' ? 'без дотику не діє' : 'no force without touching';

/** What was seen. */
export function say(c: TouchCommand, _recs: readonly MeasurementRecord[], locale: Locale): string {
  const s = tr(touchSeen(c.case), locale);
  return `${s.charAt(0).toUpperCase()}${s.slice(1)}.`;
}

/** The board's lines for a done step. */
export function board(c: TouchCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const k = c.case;
  const acts = r.inputs?.['acts'] === 1;
  out.push({ id: `tc:${i}`, title: tr(touchSeen(k), locale), formula: `${tr(TOUCH_CASES[k].force, locale)}: ${acts ? (uk ? 'діє без дотику' : 'acts without touching') : uk ? 'без дотику не діє' : 'does not act without touching'}` });
  return out;
}
