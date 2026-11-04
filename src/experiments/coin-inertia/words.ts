import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg, t, t as tl } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import type { BoardAt, StepText } from '../types.js';
import { COIN_TEXT, type CoinCommand } from './bench.js';


export const text = (c: CoinCommand): StepText => COIN_TEXT['lab.coin'](c);

export const busy = (): LocalizedText => msg('coin-inertia-busy');

export const shown = (_c: CoinCommand, recs: readonly MeasurementRecord[], locale: Locale): string => `${Math.round((recs[0]?.value ?? 0) * 1000)} ${t(locale, 'unit-sym-mm')}`;

/** How far the coin moved, and where it ended. */
export function say(_c: CoinCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const r = recs[0];
  const inGlass = r?.inputs?.['inGlass'] === 1;
  const slipped = r?.inputs?.['slipped'] === 1;
  const mm = Math.round((r?.value ?? 0) * 1000);
  return (inGlass ? tl(locale, 'coin-inertia-say', { mm: String(mm) }) : slipped ? tl(locale, 'coin-inertia-say-2', { mm: String(mm) }) : tl(locale, 'coin-inertia-say-3'));
}

/** The board's lines for a done step. */
export function board(c: CoinCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const v = r.inputs?.['speed'] ?? 0;
  const slipped = r.inputs?.['slipped'] === 1;
  const inGlass = r.inputs?.['inGlass'] === 1;
  const res = inGlass ? t(locale, 'coin-inertia-board-res') : slipped ? t(locale, 'coin-inertia-board-res-2') : t(locale, 'coin-inertia-board-res-3');
  out.push({ id: `cn:${i}`, title: t(locale, 'coin-inertia-board-title', { v: n(v, 2), value: String(Math.round(r.value! * 1000)), res }), formula: 't = l / v', numbers: `${n(slipped ? 0.075 : 0.15, 2)} ${t(locale, 'unit-sym-m')} / ${n(v, 2)} ${t(locale, 'unit-sym-m-per-s')} ≈ ${n(r.inputs?.['time'] ?? 0, 2)} ${t(locale, 'unit-sym-s')}` });
  return out;
}
