import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { cite, sv } from '../../components/sourced.js';
import { G } from '../../domains/mechanics/constants.js';
import { SCALES, scaleReading } from '../../equipment/scales.js';
import type { LocalizedText, Locale } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
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
    if (!(Number.isInteger(c.weights) && c.weights >= 0 && c.weights <= 3)) return err(msg('carts-mass-command-apply'));
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

const W = (n: number, l: Locale) => t(l, 'carts-mass-weights', { n });

export const CARTS_TEXT: Record<CartsCommand['type'], (c: CartsCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.carts': (x) => {
    const c = x as CartsCommand;
    if (c.mode === 'weigh') {
      const two = c.cart === 2;
      return {
        say: two ? msg('carts-mass-second-say', { n: c.weights }) : msg('carts-mass-labcarts-say'),
        button: two ? msg('carts-mass-labcarts-button') : msg('carts-mass-labcarts-button-2'),
        plan: two ? msg('carts-mass-labcarts-plan') : msg('carts-mass-labcarts-plan-2'),
      };
    }
    if (c.weights === 0)
      return {
        say: msg('carts-mass-labcarts-say-2'),
        button: msg('carts-mass-labcarts-button-3'),
        plan: msg('carts-mass-labcarts-plan-3'),
      };
    return {
      say: msg('carts-mass-labcarts-say-3', { weights: (l: Locale) => W(c.weights, l) }),
      button: msg('carts-mass-labcarts-button-4', { weights: (l: Locale) => W(c.weights, l) }),
      plan: msg('carts-mass-labcarts-plan-4', { weights: (l: Locale) => W(c.weights, l) }),
    };
  },
};
