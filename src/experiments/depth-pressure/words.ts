import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { DEPTH_TEXT, type DepthCommand } from './bench.js';


export const text = (c: DepthCommand): StepText => DEPTH_TEXT['lab.depth'](c);

/** No motion: the picture just changes. */
export const busy = (): LocalizedText | null => null;

const cm = (x: number, locale: Locale) => formatMeasured('length', x, 0.001, locale);

export const shown = (_c: DepthCommand, recs: readonly MeasurementRecord[], locale: Locale): string => cm(recs[0]?.value ?? 0, locale);

/** How far apart the manometer's water levels are at this depth; sideways — the same as with the film down. */
export function say(c: DepthCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const v = recs[0]?.value;
  if (v === null || v === undefined) return '';
  const d = cm(c.depth, locale);
  if (c.sideways) return t(locale, 'depth-pressure-say', { d, v: cm(v, locale) });
  return t(locale, 'depth-pressure-say-2', { d, v: cm(v, locale) });
}

/** The board's lines for a done step. */
export function board(c: DepthCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const h = c.depth;
  const side = !!c.sideways;
  const rhoM = r.inputs?.['rhoManometer'] ?? 1000;
  const g = r.inputs?.['g'] ?? 9.81;
  const p = rhoM * g * r.value!;
  const cmT = (m: number) => `${n(m * 100)} ${t(locale, 'unit-sym-cm')}`;
  const where = side ? t(locale, 'depth-pressure-board-where') : '';
  out.push({ id: `dp:${side ? 's' : ''}${Math.round(h * 1000)}`, title: t(locale, 'depth-pressure-board-title', { h: cmT(h), where }), formula: 'p = ρ_води·g·Δh', numbers: `${n(rhoM, 4)} · ${n(g)} · ${n(r.value!, 3)} ≈ ${n(p, 3)} ${t(locale, 'unit-sym-Pa')}` });
  if (!side) out.push({ id: `rhoD:${Math.round(h * 1000)}`, title: t(locale, 'depth-pressure-board-title-2', { h: cmT(h) }), formula: 'ρ = p / (g·h)', numbers: `${n(p, 3)} / (${n(g)} · ${n(h)}) ≈ ${n(p / (g * h), 3)} ${t(locale, 'unit-sym-kg-per-m3')}` });
  return out;
}
