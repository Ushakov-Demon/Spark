import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured, readingText } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { LEVER_TEXT, type SlopeCommand } from '../lever-moments/bench.js';


export const text = (c: SlopeCommand): StepText => LEVER_TEXT['lab.slope'](c);

export const busy = (): LocalizedText => msg('slope-efficiency-busy');

export const shown = (_c: SlopeCommand, recs: readonly MeasurementRecord[], locale: Locale): string => (recs[0] ? readingText(recs[0], locale) : '');

/** The dynamometer pulling the block up the board. */
export function say(_c: SlopeCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const F = formatMeasured('force', recs[0]?.value ?? null, 0.1, locale);
  return t(locale, 'slope-efficiency-say', { F });
}

/** The board's lines for a done step. */
export function board(c: SlopeCommand, trace: readonly MeasurementRecord[], { index: i, locale, before }: BoardAt): BoardLine[] {
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const cm = (x: number) => formatMeasured('length', x, 0.001, locale);
  // (The block weighed in the air before: the last such weighing.)
  const weighed = before.flatMap((x) => (x.ok && x.command.type === 'lab.hang' && (x.command as unknown as { into: string }).into === 'air' ? x.trace : [])).filter((x): x is MeasurementRecord => x.kind === 'measurement' && x.quantity === 'force' && x.value !== null).pop();
  const h = r.inputs?.['h'] ?? 0;
  const l = r.inputs?.['l'] ?? 1;
  // The weight as the dynamometer showed it in the air (the last weighing), else the model's.
  const P = weighed?.value ?? r.inputs?.['P'] ?? 0;
  const N1 = (x: number) => formatMeasured('force', x, 0.1, locale);
  const J = t(locale, 'unit-sym-J');
  const Au = P * h;
  const At = r.value! * l;
  out.push({ id: `Au:${i}`, title: t(locale, 'slope-efficiency-board-title', { h: cm(h) }), formula: 'A_к = P·h', numbers: `${N1(P)} · ${n(h)} ${t(locale, 'unit-sym-m')} ≈ ${n(Au, 3)} ${J}` });
  out.push({ id: `At:${i}`, title: t(locale, 'slope-efficiency-board-title-2', { l: cm(l) }), formula: 'A_п = F·l', numbers: `${N1(r.value!)} · ${n(l)} ${t(locale, 'unit-sym-m')} ≈ ${n(At, 3)} ${J}` });
  out.push({ id: `eta:${i}`, title: t(locale, 'slope-efficiency-board-title-3', { h: cm(h) }), formula: 'η = A_к / A_п', numbers: `${n(Au, 3)} ${J} / ${n(At, 3)} ${J} ≈ ${n((Au / At) * 100, 2)} %` });
  return out;
}
