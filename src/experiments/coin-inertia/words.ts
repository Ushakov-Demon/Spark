import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import { type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import type { BoardAt, StepText } from '../types.js';
import { COIN_TEXT, type CoinCommand } from './bench.js';

export const setup: LocalizedText = { uk: 'Склянка, листівка 10 × 15 см, монета (2,6 см), лінійка, камера телефона', en: 'A glass, a 10 × 15 cm postcard, a coin (2.6 cm), a ruler, a phone camera' };

export const text = (c: CoinCommand): StepText => COIN_TEXT['lab.coin'](c);

export const busy = (): LocalizedText => ({ uk: 'Знімаємо — дивимося покадрово…', en: 'Filming — watching frame by frame…' });

export const shown = (_c: CoinCommand, recs: readonly MeasurementRecord[], locale: Locale): string => `${Math.round((recs[0]?.value ?? 0) * 1000)} ${locale === 'uk' ? 'мм' : 'mm'}`;

/** How far the coin moved, and where it ended. */
export function say(_c: CoinCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const r = recs[0];
  const inGlass = r?.inputs?.['inGlass'] === 1;
  const slipped = r?.inputs?.['slipped'] === 1;
  const mm = Math.round((r?.value ?? 0) * 1000);
  return locale === 'uk' ? (inGlass ? `Монета зсунулася лише на ${mm} мм — і впала в склянку!` : slipped ? `Монета зсунулася на ${mm} мм, вдарилася об край склянки й упала поруч.` : 'Монета поїхала разом із карткою.') : inGlass ? `The coin moved just ${mm} mm — and dropped into the glass!` : slipped ? `The coin moved ${mm} mm, hit the rim and fell beside.` : 'The coin went with the card.';
}

/** The board's lines for a done step. */
export function board(c: CoinCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const r = trace[0];
  if (!r) return out;
  const v = r.inputs?.['speed'] ?? 0;
  const slipped = r.inputs?.['slipped'] === 1;
  const inGlass = r.inputs?.['inGlass'] === 1;
  const res = inGlass ? (uk ? 'у склянці' : 'in the glass') : slipped ? (uk ? 'повз склянку' : 'missed the glass') : uk ? 'поїхала з карткою' : 'went with the card';
  out.push({ id: `cn:${i}`, title: uk ? `картка ${n(v, 2)} м/с: монета зсунулася на ${Math.round(r.value! * 1000)} мм — ${res}` : `the card at ${n(v, 2)} m/s: the coin moved ${Math.round(r.value! * 1000)} mm — ${res}`, formula: 't = l / v', numbers: `${n(slipped ? 0.075 : 0.15, 2)} ${uk ? 'м' : 'm'} / ${n(v, 2)} ${uk ? 'м/с' : 'm/s'} ≈ ${n(r.inputs?.['time'] ?? 0, 2)} ${uk ? 'с' : 's'}` });
  return out;
}
