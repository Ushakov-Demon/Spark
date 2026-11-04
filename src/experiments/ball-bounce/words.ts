import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import { tr, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import type { BoardAt, StepText } from '../types.js';
import { BOUNCE_TEXT, bounceBallName, type BounceCommand } from './bench.js';
import { G } from '../../domains/mechanics/constants.js';


export const text = (c: BounceCommand): StepText => BOUNCE_TEXT['lab.bounce'](c);

export const busy = (): LocalizedText => msg('ball-bounce-busy');

export const shown = (_c: BounceCommand, recs: readonly MeasurementRecord[], locale: Locale): string => `${Math.round((recs[0]?.value ?? 0) * 100)} ${t(locale, 'unit-sym-cm')}`;

/** How high it rose this time. */
export function say(c: BounceCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const h = Math.round((recs[0]?.value ?? 0) * 100);
  if (h === 0) return t(locale, 'ball-bounce-say', { ball: tr(bounceBallName(c.ball), locale).replace(/^./, (x) => x.toUpperCase()) });
  return t(locale, 'ball-bounce-say-4', { h: String(h), value: c.bounce === 1 ? t(locale, 'ball-bounce-say-2') : t(locale, 'ball-bounce-say-3', { bounce: String(c.bounce) }) });
}

/** The board's lines for a done step. */
export function board(c: BounceCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const m = r.inputs?.['mass'] ?? 0;
  const k = c.bounce;
  const what = tr(bounceBallName(c.ball), locale);
  const h = `${Math.round(r.value! * 100)} ${t(locale, 'unit-sym-cm')}`;
  const title = t(locale, 'ball-bounce-board-title', { k: String(k), h });
  // (Its energy before the drop: the first bounce of each ball.)
  if (k === 1) out.push({ id: `b0:${i}`, title: t(locale, 'ball-bounce-board-title-2', { what }), formula: t(locale, 'ball-bounce-board-formula'), numbers: `${n(m, 2)} ${t(locale, 'unit-sym-kg')} · ${n(G, 2)} ${t(locale, 'unit-sym-N-per-kg')} · 1 ${t(locale, 'unit-sym-m')} ≈ ${n(m * G * 1000, 2)} ${t(locale, 'unit-sym-mJ')}` });
  out.push({ id: `bn:${i}`, title, formula: t(locale, 'ball-bounce-board-formula'), numbers: `${n(m, 2)} ${t(locale, 'unit-sym-kg')} · ${n(G, 2)} ${t(locale, 'unit-sym-N-per-kg')} · ${n(r.value!, 2)} ${t(locale, 'unit-sym-m')} ≈ ${n(m * G * r.value! * 1000, 2)} ${t(locale, 'unit-sym-mJ')}` });
  return out;
}
