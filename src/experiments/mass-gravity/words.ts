import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import { tr, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { MG_TEXT, type MgCommand } from './bench.js';
import { blockOf, massText } from './shared.js';

export const text = (c: MgCommand): StepText => MG_TEXT['lab.mg'](c);

export const busy = (): LocalizedText => msg('mass-gravity-busy');

/** The force as its instrument read it. */
const force = (r: MeasurementRecord | undefined, l: Locale) => formatMeasured('force', r?.value ?? null, r?.inputs?.['division'] ?? 0.1, l);
/** The body in words: its mass, and its substance when it is a block. */
const what = (c: MgCommand, l: Locale) => (c.body === 'weights' ? massText(c.mass, l) : t(l, 'mass-gravity-block', { block: c.body, of: tr(blockOf(c.body), l).toLowerCase(), mass: massText(c.mass, l) }));

export const shown = (c: MgCommand, recs: readonly MeasurementRecord[], locale: Locale): string => `${what(c, locale)}: ${force(recs[0], locale)}`;

/** What the instrument shows, and on each kilogram. */
export function say(c: MgCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const r = recs[0];
  return t(locale, 'mass-gravity-say', { body: c.body === 'weights' ? 'weights' : 'block', block: c.body, of: c.body === 'weights' ? '' : tr(blockOf(c.body), locale).toLowerCase(), mass: massText(c.mass, locale), F: force(r, locale), instrument: r?.instrument === 'force-gauge' ? 'gauge' : 'dynamometer' });
}

/** The board: the reading, and the force on each kilogram — the answer (shown once the prediction is made). */
export function board(c: MgCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const r = trace[0];
  if (!r || r.value === null) return [];
  const F = force(r, locale);
  const m = `${sig(c.mass, 3, locale)} ${t(locale, 'unit-sym-kg')}`;
  return [
    { id: `mg:${i}`, title: what(c, locale), formula: `F = ${F}` },
    { id: `mg-ratio:${i}`, title: t(locale, 'mass-gravity-board-ratio', { what: what(c, locale) }), formula: `F / m = ${F} / ${m} ≈ ${sig(r.value / c.mass, 2, locale)} ${t(locale, 'unit-sym-N-per-kg')}` },
  ];
}
