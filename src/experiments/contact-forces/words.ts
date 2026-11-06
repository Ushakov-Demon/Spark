import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import { G } from '../../domains/mechanics/constants.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { balanceText, forceText, TOUCH_TEXT, touchForce, type TouchCommand } from './bench.js';
import { massText } from './shared.js';

export const text = (c: TouchCommand): StepText => TOUCH_TEXT['lab.touch'](c);

export const busy = (): LocalizedText => msg('contact-forces-busy');

export const shown = (c: TouchCommand, recs: readonly MeasurementRecord[], locale: Locale): string => (recs[0] ? touchForce(c.case, recs[0], locale) : '');

/** What was seen, with the instrument's numbers. */
export function say(c: TouchCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const r = recs[0];
  if (!r) return '';
  const reading = c.case === 'magnet' || c.case === 'card' ? balanceText(r.value ?? 0, locale) : formatMeasured(r.quantity, r.value, r.inputs?.['division'] ?? 0.1, locale);
  return t(locale, `contact-forces-${c.case}-seen`, { reading, force: touchForce(c.case, r, locale) });
}

const gText = (l: Locale) => `${sig(G, 2, l)} ${t(l, 'unit-sym-N')}/${t(l, 'unit-sym-kg')}`;

/** The board's lines for a done step. */
export function board(c: TouchCommand, trace: readonly MeasurementRecord[], { index: i, locale: l }: BoardAt): BoardLine[] {
  const r = trace[0];
  if (!r) return [];
  const title = t(l, `contact-forces-${c.case}-title`);
  const value = r.value ?? 0;
  const dm = `${t(l, 'contact-forces-board-loss')} · g`;
  if (c.case === 'magnet' || c.case === 'card') return [{ id: `tc:${i}`, title, formula: `F = ${dm}`, numbers: value > 0 ? `${formatMeasured('mass', value, 1e-5, l)} · ${gText(l)} = ${forceText(value * G, l)}` : t(l, 'contact-forces-below-division') }];
  if (c.case === 'comb') {
    const bit = r.inputs?.['bit'] ?? 0;
    return [{ id: `tc:${i}`, title, formula: 'F > P = m · g', numbers: `${sig(bit * 1e6, 2, l)} ${t(l, 'unit-sym-mg')} · ${gText(l)} = ${forceText(r.inputs?.['bitWeight'] ?? 0, l)}` }];
  }
  if (c.case === 'fall') return [{ id: `tc:${i}`, title, formula: 'P = m · g', numbers: `${massText(r.inputs?.['mass'] ?? 0, l)} · ${gText(l)} = ${formatMeasured('force', value, r.inputs?.['division'] ?? 0.1, l)}` }];
  return [{ id: `tc:${i}`, title, formula: t(l, 'contact-forces-board-friction'), numbers: formatMeasured('force', value, r.inputs?.['division'] ?? 0.1, l) }];
}
