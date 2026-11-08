import type { MeasurementRecord } from '../../core/trace.js';
import { G } from '../../domains/mechanics/constants.js';
import { sig } from '../../explain/format.js';
import { NUMBER_LOCALE, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { CUPS_TEXT, type CupsCommand } from './bench.js';

export const text = (c: CupsCommand): StepText => CUPS_TEXT['lab.cups'](c);

/** Pressing a cup, stepping on the scales, stepping on the board: each moves. */
export const busy = (c: CupsCommand): LocalizedText => (c.step === 'press' ? msg('paper-cups-busy-press') : c.step === 'weigh' ? msg('paper-cups-busy-weigh') : msg('paper-cups-busy-stand'));

export const N = (F: number, l: Locale): string => `${sig(F, 3, l)} ${t(l, 'unit-sym-N')}`;
const force = (r: MeasurementRecord, l: Locale) => formatMeasured('force', r.value, r.inputs?.['division'] ?? 0.1, l);
const kg = (r: MeasurementRecord, l: Locale) => `${new Intl.NumberFormat(NUMBER_LOCALE[l], { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(r.value ?? 0)} ${t(l, 'unit-sym-kg')}`;

export function shown(c: CupsCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const r = recs[0];
  if (!r || r.value === null) return '';
  if (c.step === 'press') return `F = ${force(r, locale)}`;
  if (c.step === 'weigh') return `m = ${kg(r, locale)}`;
  return t(locale, 'paper-cups-shown-stand', { holds: r.value ? 'yes' : 'no', most: N(r.inputs?.['most'] ?? 0, locale) });
}

/** What the Professor says when it is done. */
export function say(c: CupsCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const r = recs[0];
  if (!r || r.value === null) return '';
  if (c.step === 'press') return t(locale, 'paper-cups-say-press', { way: c.way, F: force(r, locale) });
  if (c.step === 'weigh') return t(locale, 'paper-cups-say-weigh', { m: kg(r, locale) });
  const inp = r.inputs ?? {};
  return t(locale, 'paper-cups-say-stand', { holds: r.value ? 'yes' : 'no', at: c.at, most: N(inp['most'] ?? 0, locale), bears: N(inp['bears'] ?? 0, locale), crushed: String(inp['crushed'] ?? 0) });
}

/** The board: what a cup bears; the weight; on the board — each cup's share, the most loaded one's force. */
export function board(c: CupsCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const r = trace[0];
  if (!r || r.value === null) return [];
  if (c.step === 'press') return [{ id: `cp:${i}`, title: t(locale, 'paper-cups-board-press', { way: c.way }), formula: `F_max = ${force(r, locale)}` }];
  if (c.step === 'weigh') return [{ id: `cw:${i}`, title: t(locale, 'paper-cups-board-weigh'), formula: 'P = m·g', numbers: `${kg(r, locale)} · ${sig(G, 3, locale)} ${t(locale, 'unit-sym-N-per-kg')} ≈ ${N((r.value ?? 0) * G, locale)}` }];
  if (c.step !== 'stand') return [];
  const inp = r.inputs ?? {};
  const P = inp['weight'] ?? 0;
  const n = inp['cups'] ?? 1;
  const most = inp['most'] ?? 0;
  const bears = inp['bears'] ?? 0;
  const title = t(locale, 'paper-cups-board-stand', { way: c.way, at: c.at });
  const line: BoardLine = c.at === 'middle'
    ? { id: `cs:${i}`, title, formula: 'F₁ = P / n', numbers: `${N(P, locale)} / ${n} ≈ ${N(most, locale)} ${most <= bears ? '<' : '>'} ${N(bears, locale)}` }
    : { id: `cs:${i}`, title, formula: 'F₁ = P/n + P·e·x₁/Σx²', numbers: `≈ ${N(most, locale)} ${most <= bears ? '<' : '>'} ${N(bears, locale)}` };
  return [line];
}
