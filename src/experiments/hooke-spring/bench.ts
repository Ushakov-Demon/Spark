import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { G } from '../../domains/mechanics/constants.js';
import { weight } from '../../domains/mechanics/formulas.js';
import { msg, t } from '../../knowledge/messages.js';
import { massText } from './shared.js';
import { BENCH_SPRING_K, BENCH_SPRING_L0, BENCH_SPRING_LONGEST, BENCH_WEIGHT, measured, ruler, RULER_DIVISION, SPRING_SET } from '../../scenarios/bench-kit.js';

/** Hooke's law (grade 7): a spring on a stand with slotted weights and a ruler. */

/** Hang so many weights on the spring and read its length by the ruler. */
export interface StretchCommand {
  readonly type: 'lab.stretch';
  readonly weights: number;
  /** Which spring of the set, N/m (default: the stiffest). */
  readonly stiffness?: number;
  /** One weight, kg (default: the 100 g of the set). */
  readonly mass?: number;
}

export const stretchCommand: CommandHandler<StretchCommand> = {
  type: 'lab.stretch',
  apply(state, c) {
    if (!(c.weights >= 0 && c.weights <= 4 && Number.isInteger(c.weights))) return err(msg('hooke-spring-stretch-command-apply'));
    const k = c.stiffness ?? BENCH_SPRING_K.value;
    if (!SPRING_SET.includes(k)) return err(msg('hooke-spring-stretch-command-apply-2'));
    const mass = c.mass ?? BENCH_WEIGHT.value;
    if (!(mass > 0)) return err(msg('hooke-spring-bad-mass'));
    const F = weight(c.weights * mass, G);
    const x = F / k;
    const l = BENCH_SPRING_L0 + x;
    if (l > BENCH_SPRING_LONGEST.value + 1e-9) return err(msg('hooke-spring-too-long'));
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [measured('ruler', 'length', ruler(l), l, { weights: c.weights, F, k, l0: BENCH_SPRING_L0, mass, division: RULER_DIVISION })] });
  },
};

/** A step's button, its line in the plan, and what the Professor says doing it. */
export const STRETCH_TEXT = (c: StretchCommand): { say: LocalizedText; button: LocalizedText; plan: LocalizedText } => {
    const n = c.weights;
    const m = (l: Locale) => massText(c.mass ?? BENCH_WEIGHT.value, l);
    return n === 0
      ? { say: msg('hooke-spring-stretch-text-say'), button: msg('hooke-spring-stretch-text-button'), plan: msg('hooke-spring-stretch-text-plan') }
      : {
          say: msg('hooke-spring-stretch-text-say-2', { value: (lang: Locale) => n === 1 ? t(lang, 'hooke-spring-say-uk', { m: m(lang) }) : t(lang, 'hooke-spring-say-uk-2', { n: String(n), m: m(lang) }) }),
          button: msg('hooke-spring-stretch-text-button-2', { n: String(n), m }),
          plan: msg('hooke-spring-stretch-text-plan-2', { n: String(n), m }),
        };
  };
