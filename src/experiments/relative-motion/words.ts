import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg, t as tl } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { CARRY_TEXT, type CarryCommand } from './bench.js';

export const setup: LocalizedText = msg('relative-motion-setup');

export const text = (c: CarryCommand): StepText => CARRY_TEXT['lab.carry'](c);

export const busy = (): LocalizedText => msg('relative-motion-busy');

const cm = (x: number | null, locale: Locale) => `${String(Math.round((x ?? 0) * 1000) / 10).replace('.', tl(locale, 'relative-motion-cms'))} ${tl(locale, 'unit-sym-cm')}`;

export const shown = (_c: CarryCommand, recs: readonly MeasurementRecord[], locale: Locale): string =>
  recs.length === 3 ? recs.map((x, k) => (k === 0 ? formatMeasured('time', x.value, 0.01, locale) : cm(x.value, locale))).join(' · ') : formatMeasured('time', recs[0]?.value ?? null, 0.01, locale);

/** The time, how far the bottle went, the line on the paper. */
export function say(c: CarryCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const of = (w: number) => recs.find((x) => x.inputs?.['which'] === w)?.value ?? 0;
  const T = formatMeasured('time', of(0), 0.01, locale);
  if (c.speed === 0) return tl(locale, 'relative-motion-say', { T, value: cm(of(2), locale) });
  return tl(locale, 'relative-motion-say-2', { T, value: cm(of(1), locale), value2: cm(of(2), locale) });
}

/** The board's lines for a done step. */
export function board(c: CarryCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const recs = trace;
  const of = (w: number) => recs.find((x) => x.inputs?.['which'] === w)?.value ?? 0;
  const t = of(0);
  const u = c.speed;
  const cmn = (x: number) => `${n(x * 100, 3)} ${tl(locale, 'unit-sym-cm')}`;
  const T = formatMeasured('time', t, 0.01, locale);
  const v = (l: number) => `${n((l / t) * 100, 2)} ${tl(locale, 'unit-sym-cm-per-s')}`;
  const how = u === 0 ? tl(locale, 'relative-motion-labcarry-plan') : tl(locale, 'relative-motion-board-how', { u: n(u * 100, 2), value: cmn(of(1)) });
  out.push({ id: `cb:${i}`, title: tl(locale, 'relative-motion-board-title', { how }), formula: 'v = l / t', numbers: `${cmn(0.09)} / ${T} ≈ ${v(0.09)}` });
  out.push({ id: `ct:${i}`, title: tl(locale, 'relative-motion-board-title-2'), formula: 'v = s / t', numbers: `${cmn(of(2))} / ${T} ≈ ${v(of(2))}` });
  return out;
}
