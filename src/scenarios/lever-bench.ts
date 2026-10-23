import type { CommandHandler } from '../core/commands.js';
import { err, ok } from '../core/result.js';
import type { MeasurementRecord } from '../core/trace.js';
import { cite, sv } from '../components/sourced.js';
import { G } from '../domains/mechanics/constants.js';
import { moment, weight } from '../domains/mechanics/formulas.js';
import { SCALES, scaleReading } from '../equipment/scales.js';
import type { LocalizedText } from '../knowledge/i18n.js';
import type { SourcedValue } from '../knowledge/types.js';

/**
 * The lever of grade 8 (lab work 1, the condition of a lever's balance): a ruler on an axis at its middle,
 * balanced by itself, with holes for hooks along it; 100 g weights hang on it, a dynamometer pulls it down. What
 * the dynamometer shows follows from the balance of moments, F₁·l₁ = F₂·l₂.
 */

/** The holes for the hooks: every so many metres from the axis, up to the end. */
export const LEVER_STEP: SourcedValue = sv(0.05, 'm', 'between the holes of a school lever', 'estimate', 0.5, [cite('spark', 'estimate', 'school lever rulers have holes every 2–5 cm', 0.05)], 'Estimate: the arms are read by the ruler on the lever all the same.');
export const LEVER_ARM = 0.2;
/** One weight, kg (the set of the lab works). */
export const LEVER_WEIGHT = 0.1;

/** On the left: so many weights so far from the axis. On the right: weights, or a dynamometer pulling down. */
export interface LeverCommand {
  readonly type: 'lab.lever';
  readonly left: { readonly weights: number; readonly at: number };
  readonly right: { readonly weights: number; readonly at: number } | { readonly dynamometer: true; readonly at: number };
}

const onLever = (x: number) => x > 0 && x <= LEVER_ARM + 1e-9 && Math.abs(x / LEVER_STEP.value - Math.round(x / LEVER_STEP.value)) < 1e-6;

export const leverCommand: CommandHandler<LeverCommand> = {
  type: 'lab.lever',
  apply(state, c) {
    if (!onLever(c.left.at) || !onLever(c.right.at)) return err({ uk: 'Гачки чіпляють лише в отвори важеля — через 5 см, до 20 см від осі.', en: 'Hooks go only into the lever’s holes — every 5 cm, up to 20 cm from the axis.' });
    if (!(Number.isInteger(c.left.weights) && c.left.weights >= 1 && c.left.weights <= 4)) return err({ uk: 'Ліворуч — від 1 до 4 тягарців.', en: 'On the left: 1 to 4 weights.' });
    const F1 = weight(c.left.weights * LEVER_WEIGHT, G);
    const M1 = moment(F1, c.left.at);
    if ('dynamometer' in c.right) {
      // The force that balances: F₂ = M₁ / l₂ — the dynamometer shows it to its division.
      const F2 = M1 / c.right.at;
      const dyn = SCALES.dynamometer;
      return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [{ kind: 'measurement', instrument: 'dynamometer', quantity: 'force', value: scaleReading(dyn, F2), exact: F2, entities: [], inputs: { F1, l1: c.left.at, l2: c.right.at, balanced: 1 } } satisfies MeasurementRecord] });
    }
    // Weights on both sides: it balances or tips to the side with the larger moment.
    const F2 = weight(c.right.weights * LEVER_WEIGHT, G);
    const M2 = moment(F2, c.right.at);
    const tip = Math.abs(M1 - M2) < 1e-9 ? 0 : M1 > M2 ? -1 : 1;
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [{ kind: 'measurement', instrument: 'lever', quantity: 'force', value: F2, exact: F2, entities: [], inputs: { F1, l1: c.left.at, l2: c.right.at, balanced: tip === 0 ? 1 : 0, tip } } satisfies MeasurementRecord] });
  },
};

export const LEVER_COMMANDS = [leverCommand] as const;

const cm = (m: number) => Math.round(m * 100);
const w = (n: number, uk: boolean) => (uk ? (n === 1 ? '1 тягарець' : `${n} тягарці`) : n === 1 ? '1 weight' : `${n} weights`);

export const LEVER_TEXT: Record<LeverCommand['type'], (c: LeverCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.lever': (c) => {
    const l = c.left;
    const r = c.right;
    const left = { uk: `${w(l.weights, true)} на ${cm(l.at)} см ліворуч`, en: `${w(l.weights, false)} ${cm(l.at)} cm left` };
    const right = 'dynamometer' in r ? { uk: `динамометр на ${cm(r.at)} см праворуч`, en: `the dynamometer ${cm(r.at)} cm right` } : { uk: `${w(r.weights, true)} на ${cm(r.at)} см праворуч`, en: `${w(r.weights, false)} ${cm(r.at)} cm right` };
    return {
      say: 'dynamometer' in r
        ? { uk: `Почепи ${left.uk}, а праворуч, на ${cm(r.at)} см, тягни динамометром униз, поки важіль не стане горизонтально. Що він показує?`, en: `Hang ${left.en}, and on the right, ${cm(r.at)} cm out, pull down with the dynamometer until the lever is level. What does it show?` }
        : { uk: `Почепи ${left.uk} і ${right.uk}. Чи буде важіль у рівновазі?`, en: `Hang ${left.en} and ${right.en}. Will the lever balance?` },
      button: { uk: `⚖ ${left.uk} · ${right.uk}`, en: `⚖ ${left.en} · ${right.en}` },
      plan: { uk: `${left.uk}, ${right.uk}`, en: `${left.en}, ${right.en}` },
    };
  },
};
