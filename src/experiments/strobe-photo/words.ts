import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import type { BoardAt, StepText } from '../types.js';
import { STROBE_INTERVAL, STROBE_SCALE, STROBE_TEXT, type StrobeCommand } from './bench.js';

export const setup: LocalizedText = msg('strobe-photo-setup');

export const text = (c: StrobeCommand): StepText => STROBE_TEXT['lab.strobe'](c);

export const busy = (): LocalizedText => msg('strobe-photo-busy');

export const shown = (_c: StrobeCommand, recs: readonly MeasurementRecord[], locale: Locale): string => `${recs.map((x) => Math.round((x.value ?? 0) * 1000)).join(', ')} ${t(locale, 'unit-sym-mm')}`;

/** The gaps measured on the photo. */
export function say(_c: StrobeCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const g = recs.map((x) => Math.round((x.value ?? 0) * 1000));
  return t(locale, 'strobe-photo-say', { g: g.join(', ') });
}

/** The board's lines for a done step. */
export function board(c: StrobeCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const g = trace.map((x) => x.value!);
  const table = c.photo === 'table';
  const cm = (x: number) => `${n(x * STROBE_SCALE * 100, 2)} ${t(locale, 'unit-sym-cm')}`;
  const where = table ? t(locale, 'strobe-photo-board-where') : t(locale, 'strobe-photo-board-where-2');
  out.push({ id: `sg:${i}`, title: `${where}: ${g.map((x) => Math.round(x * 1000)).join(', ')} ${t(locale, 'strobe-photo-board-title')}`, formula: `l = ${STROBE_SCALE} · l_${t(locale, 'strobe-photo-board-formula')}`, numbers: g.map(cm).join(', ') });
  out.push({ id: `sv:${i}`, title: t(locale, 'strobe-photo-board-title-2'), formula: 'v = l / t', numbers: g.map((x) => `${n((x * STROBE_SCALE) / STROBE_INTERVAL, 2)}`).join(', ') + t(locale, 'strobe-photo-board-numbers') });
  return out;
}
