import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { BoardAt, StepText } from '../types.js';
import { MAGNET_TEXT, type MagnetCommand } from './bench.js';

export const setup: LocalizedText = { uk: 'Сталевий цвях, ізольований дріт, джерело струму, ключ, реостат, амперметр, компас, пластикова трубочка', en: 'A steel nail, insulated wire, a source, a key, a rheostat, an ammeter, a compass, a plastic straw' };

export const text = (c: MagnetCommand): StepText => MAGNET_TEXT['lab.magnet'](c);

export const busy = (c: MagnetCommand): LocalizedText =>
  c.core ? { uk: 'Стрілка компаса ще гойдається — чекаємо…', en: 'The compass needle is still swinging — wait…' } : { uk: 'Повільно витягую цвях із котушки…', en: 'Slowly pulling the nail out of the coil…' };

export const shown = (_c: MagnetCommand, recs: readonly MeasurementRecord[], locale: Locale): string => recs.map((x) => formatMeasured(x.quantity, x.value, x.quantity === 'current' ? 0.01 : 1, locale)).join(' · ');

/** The compass needle's turn — and which way. */
export function say(c: MagnetCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  const deg = Math.abs(recs.find((x) => x.quantity === 'angle')?.value ?? 0);
  if (c.current === 0) return uk ? 'Струму немає — стрілка дивиться на північ.' : 'No current — the needle looks north.';
  if (!c.core) return uk ? `Без цвяха стрілка ${deg < 2 ? 'майже не ворухнулася' : `відхилилася лише на ${deg}°`}.` : `Without the nail the needle ${deg < 2 ? 'hardly moved' : `turned only ${deg}°`}.`;
  if (c.reversed) return uk ? `Стрілка відхилилася на ${deg}° — але в інший бік!` : `The needle turned ${deg}° — but the other way!`;
  return uk ? `Стрілка компаса відхилилася на ${deg}°.` : `The compass needle turned ${deg}°.`;
}

/** The board's lines for a done step. */
export function board(c: MagnetCommand, trace: readonly MeasurementRecord[], { index: i, locale }: BoardAt): BoardLine[] {
  const uk = locale === 'uk';
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  const m = trace.find((x): x is MeasurementRecord => x.kind === 'measurement' && x.quantity === 'angle');
  if (!m || m.value === null) return out;
  const I = c.current;
  const earth = m.inputs?.['earth'] ?? 19.4e-6;
  const what = I === 0 ? (uk ? 'без струму' : 'no current') : `${n(I, 2)} ${uk ? 'А' : 'A'}${c.reversed ? (uk ? ', струм в інший бік' : ', reversed') : ''}${c.core ? '' : uk ? ', без цвяха' : ', no nail'}`;
  if (I === 0) {
    const where = c.place ? ` (${c.place}${c.example ? (uk ? ', для прикладу' : ', for example') : ''})` : '';
    out.push({ id: 'm0', title: uk ? `компас ${what}` : `the compass, ${what}`, formula: `θ = ${m.value}°` });
    out.push({ id: 'mE', title: uk ? `поле Землі${where}` : `the Earth’s field${where}`, formula: `B_З ≈ ${n(earth * 1e6)} ${uk ? 'мкТл' : 'µT'}` });
    return out;
  }
  const key = `${I}${c.reversed ? 'r' : ''}${c.core ? '' : 'n'}`;
  out.push({ id: `mB:${key}`, title: uk ? `поле електромагніта: ${what}` : `the electromagnet’s field: ${what}`, formula: `θ = ${n(m.value)}°, B = B_З·tg θ`, numbers: `${n(earth * 1e6)} ${uk ? 'мкТл' : 'µT'} · tg ${n(m.value)}° ≈ ${n(earth * Math.tan((m.value * Math.PI) / 180) * 1e6, 2)} ${uk ? 'мкТл' : 'µT'}` });
  return out;
}
