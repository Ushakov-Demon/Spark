import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { cite, sv } from '../../components/sourced.js';
import { G } from '../../domains/mechanics/constants.js';
import { SCALES, scaleReading } from '../../equipment/scales.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import type { SourcedValue } from '../../knowledge/types.js';
import { BENCH_WEIGHT } from '../../scenarios/bench-kit.js';

/**
 * Mass as the measure of inertia and of gravity (grade 7, the textbook's § 16): two light carts on the table with a
 * compressed spring between them, held by a thread. The thread is burnt: the spring pushes both, and the heavier
 * cart gets the smaller speed — m₂ / m₁ = v₁ / v₂. Filmed, the carts' paths in the same 0.5 s are in the ratio of
 * their speeds. Then the same carts hang on a dynamometer: the forces of gravity are in the same ratio, P = m·g.
 * The spring's energy is shared so that the momenta are equal (rolling friction over 0.5 s is left out).
 */

/** A light cart, as weighed. */
export const CART_MASS = 0.1;
/** The spring between the carts: its stiffness and how far it is squeezed. */
export const CART_SPRING: { readonly stiffness: SourcedValue; readonly squeeze: number } = {
  stiffness: sv(40, 'N/m', 'a cart’s buffer spring', 'estimate', 0.5, [cite('spark', 'estimate', 'a light school spring, some tens of newtons per metre', 40)], 'Estimate: it sets how fast the carts go, not their ratio.'),
  squeeze: 0.03,
};
/** The carts are filmed for this long after the thread burns. */
export const CART_TIME = 0.5;
/** The ruler along the table: millimetres. */
export const CART_DIVISION = 0.001;

/** Burn the thread with `weights` 100 g weights on cart 2; or hang a cart (2 — with its weights) on the dynamometer. */
export interface CartsCommand {
  readonly type: 'lab.carts';
  readonly mode: 'push' | 'weigh';
  readonly weights: number;
  readonly cart?: 1 | 2;
}

/** The carts' masses and speeds after the push: equal momenta, the spring's energy shared, m₁v₁ = m₂v₂. */
export function cartSpeeds(weights: number): { m1: number; m2: number; v1: number; v2: number } {
  const m1 = CART_MASS;
  const m2 = CART_MASS + weights * BENCH_WEIGHT.value;
  const E = (CART_SPRING.stiffness.value * CART_SPRING.squeeze ** 2) / 2;
  const v1 = Math.sqrt((2 * E * m2) / (m1 * (m1 + m2)));
  return { m1, m2, v1, v2: (m1 * v1) / m2 };
}

export const cartsCommand: CommandHandler<CartsCommand> = {
  type: 'lab.carts',
  apply(state, c) {
    if (!(Number.isInteger(c.weights) && c.weights >= 0 && c.weights <= 3)) return err({ uk: 'На візок — до трьох тягарців.', en: 'Up to three weights on the cart.' });
    const { m1, m2, v1, v2 } = cartSpeeds(c.weights);
    if (c.mode === 'push') {
      const mm = (x: number) => Math.round(x / CART_DIVISION) * CART_DIVISION;
      const trace: MeasurementRecord[] = [v1, v2].map((v, k) => ({ kind: 'measurement', instrument: 'ruler', quantity: 'length', value: mm(v * CART_TIME), exact: v * CART_TIME, entities: [], inputs: { which: k, time: CART_TIME, m1, m2, division: CART_DIVISION } }));
      return ok({ state, kind: 'measurement', externalEnergy: 0, trace });
    }
    const m = c.cart === 2 ? m2 : m1;
    const F = m * G;
    const record: MeasurementRecord = { kind: 'measurement', instrument: 'dynamometer', quantity: 'force', value: scaleReading(SCALES.dynamometer, F), exact: F, entities: [], inputs: { cart: c.cart ?? 1, mass: m } };
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [record] });
  },
};

export const CARTS_COMMANDS = [cartsCommand] as const;

const W = (n: number, uk: boolean) => (uk ? (n === 1 ? 'один тягарець' : n === 2 ? 'два тягарці' : `${n} тягарці`) : n === 1 ? 'one weight' : `${n} weights`);

export const CARTS_TEXT: Record<CartsCommand['type'], (c: CartsCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.carts': (x) => {
    const c = x as CartsCommand;
    if (c.mode === 'weigh') {
      const two = c.cart === 2;
      return {
        say: two ? { uk: `А тепер другий візок із ${c.weights === 2 ? 'двома тягарцями' : W(c.weights, true)}. У скільки разів більша сила тяжіння?`, en: `And now the second cart with ${W(c.weights, false)}. How many times greater is the force of gravity?` } : { uk: 'Підвісимо перший візок на динамометр. Яка сила тяжіння на нього діє?', en: 'Hang the first cart on the dynamometer. What force of gravity acts on it?' },
        button: two ? { uk: '⚖ Динамометр: візок 2', en: '⚖ Dynamometer: cart 2' } : { uk: '⚖ Динамометр: візок 1', en: '⚖ Dynamometer: cart 1' },
        plan: two ? { uk: 'візок 2 на динамометрі', en: 'cart 2 on the dynamometer' } : { uk: 'візок 1 на динамометрі', en: 'cart 1 on the dynamometer' },
      };
    }
    if (c.weights === 0)
      return {
        say: { uk: 'Візки однакові. Перепалюємо нитку — пружина розштовхує їх. За кадрами відео міряємо, хто скільки проїхав за 0,5 с.', en: 'The carts are alike. We burn the thread — the spring pushes them apart. By the video’s frames we measure how far each went in 0.5 s.' },
        button: { uk: '🔥 Однакові візки', en: '🔥 Alike carts' },
        plan: { uk: 'однакові візки', en: 'alike carts' },
      };
    return {
      say: { uk: `На другий візок — ${W(c.weights, true)} по 100 г. Знову стискаємо пружину й перепалюємо нитку.`, en: `On the second cart — ${W(c.weights, false)} of 100 g. Squeeze the spring again and burn the thread.` },
      button: { uk: `🔥 Візок 2 + ${W(c.weights, true)}`, en: `🔥 Cart 2 + ${W(c.weights, false)}` },
      plan: { uk: `візок 2 + ${W(c.weights, true)}`, en: `cart 2 + ${W(c.weights, false)}` },
    };
  },
};
