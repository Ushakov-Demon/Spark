import type { CommandHandler } from '../core/commands.js';
import { err, ok } from '../core/result.js';
import type { MeasurementRecord } from '../core/trace.js';
import { cite, sv } from '../components/sourced.js';
import { G } from '../domains/mechanics/constants.js';
import type { LocalizedText } from '../knowledge/i18n.js';
import type { SourcedValue } from '../knowledge/types.js';

/**
 * Inertia (grade 7): a postcard on a glass, a coin on the card over the glass's mouth. The card is pulled out
 * sideways. While it slides under the coin, friction drags the coin after it — but friction can speed the coin up
 * only so fast, μ·g. Pulled slowly and smoothly, the card takes the coin with it; pushed or flicked, it is gone from
 * under the coin in t = l / v, and in that time the coin moves only μ·g·t²/2: it stays nearly where it was and drops
 * into the glass. (The coin slips all the time the card moves faster than friction can carry it: v² > μ·g·l.)
 */

/** A coin on paper: the static friction measured; sliding is taken the same. */
export const COIN_FRICTION: SourcedValue = sv(0.29, '', 'a coin on paper', 'single-source', 0.05, [cite('physics-factbook-paper-friction', 'penny 0.29, nickel 0.28 (static)', '—', 0.29)], 'A school measurement of static friction; the sliding friction is taken the same (estimate) — it is usually somewhat less.');
/** How far the card goes before its edge leaves the coin: half a 15 cm postcard. */
export const COIN_CARD = 0.075;
/** The coin falls in if it moves less than this: the glass's mouth (6.5 cm across, estimate) less the coin's own half (2.6 cm coin). */
export const COIN_GAP: SourcedValue = sv(0.019, 'm', 'the glass’s mouth radius less the coin’s', 'estimate', 0.005, [cite('spark', 'estimate', 'a tumbler 6.5 cm across inside, a 2.6 cm coin: 3.25 − 1.3 cm', 0.0195)], 'Estimate.');
/** The ruler: millimetres. */
export const COIN_DIVISION = 0.001;

export type CoinPull = 'slow' | 'push' | 'flick' | 'snap';
/** How the card is moved: its speed, m/s ('slow' — drawn smoothly, gently speeding up: the coin goes with it). */
export const COIN_PULLS: Readonly<Record<CoinPull, number>> = { slow: 0.1, push: 0.5, flick: 1, snap: 3 };

/** Take the card from under the coin this way; measure how far the coin moved, and where it fell. */
export interface CoinCommand {
  readonly type: 'lab.coin';
  readonly pull: CoinPull;
}

/** How far the coin moves while the card goes, m, and whether it slipped on the card or rode with it. */
export function coinShift(pull: CoinPull): { shift: number; slipped: boolean; time: number } {
  const v = COIN_PULLS[pull];
  const a = COIN_FRICTION.value * G;
  const l = COIN_CARD;
  // Smoothly drawn, or too slow to slip: the coin rides on the card all the way (the card is pulled 15 cm).
  if (pull === 'slow' || v * v <= a * l) return { shift: 2 * l, slipped: false, time: (2 * l) / v };
  const t = l / v;
  return { shift: (a * t * t) / 2, slipped: true, time: t };
}

export const coinCommand: CommandHandler<CoinCommand> = {
  type: 'lab.coin',
  apply(state, c) {
    if (!(c.pull in COIN_PULLS)) return err({ uk: 'Як витягати картку?', en: 'How to take the card out?' });
    const { shift, slipped, time } = coinShift(c.pull);
    const inGlass = shift < COIN_GAP.value;
    const record: MeasurementRecord = { kind: 'measurement', instrument: 'ruler', quantity: 'length', value: Math.round(shift / COIN_DIVISION) * COIN_DIVISION, exact: shift, entities: [], inputs: { speed: COIN_PULLS[c.pull], time, slipped: slipped ? 1 : 0, inGlass: inGlass ? 1 : 0, division: COIN_DIVISION } };
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [record] });
  },
};

export const COIN_COMMANDS = [coinCommand] as const;

const PULL: Record<CoinPull, { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  slow: { say: { uk: 'Повільно й плавно тягнемо картку вбік. Куди потрапить монета?', en: 'Slowly and smoothly draw the card aside. Where will the coin end up?' }, button: { uk: '🐢 Тягнути повільно', en: '🐢 Draw slowly' }, plan: { uk: 'тягнути картку повільно', en: 'draw the card slowly' } },
  push: { say: { uk: 'Знову монета на картці. Тепер штовхаємо картку пальцем — зі швидкістю близько 0,5 м/с.', en: 'The coin on the card again. Now push the card with a finger — about 0.5 m/s.' }, button: { uk: '👉 Штовхнути: 0,5 м/с', en: '👉 Push: 0.5 m/s' }, plan: { uk: 'штовхнути картку (0,5 м/с)', en: 'push the card (0.5 m/s)' } },
  flick: { say: { uk: 'Швидше: різко штовхаємо — близько 1 м/с.', en: 'Faster: a sharp push — about 1 m/s.' }, button: { uk: '👉 Різко: 1 м/с', en: '👉 Sharply: 1 m/s' }, plan: { uk: 'різко штовхнути (1 м/с)', en: 'push sharply (1 m/s)' } },
  snap: { say: { uk: 'І найшвидше: клацаємо по картці пальцем — близько 3 м/с.', en: 'And fastest: flick the card with a finger — about 3 m/s.' }, button: { uk: '🫰 Клацнути: 3 м/с', en: '🫰 Flick: 3 m/s' }, plan: { uk: 'клацнути по картці (3 м/с)', en: 'flick the card (3 m/s)' } },
};

export const COIN_TEXT: Record<CoinCommand['type'], (c: CoinCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.coin': (x) => PULL[(x as CoinCommand).pull],
};
