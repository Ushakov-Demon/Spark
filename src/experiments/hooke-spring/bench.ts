import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { G } from '../../domains/mechanics/constants.js';
import { weight } from '../../domains/mechanics/formulas.js';
import { msg, t } from '../../knowledge/messages.js';
import { BENCH_SPRING_K, BENCH_SPRING_L0, BENCH_WEIGHT, measured, ruler, RULER_DIVISION, SPRING_SET } from '../../scenarios/bench-kit.js';

/** Hooke's law (grade 7): a spring on a stand with slotted weights and a ruler. */

/** Hang so many 100 g weights on the spring and read its length by the ruler. */
export interface StretchCommand {
  readonly type: 'lab.stretch';
  readonly weights: number;
  /** Which spring of the set, N/m (default: the stiffest). */
  readonly stiffness?: number;
}

export const stretchCommand: CommandHandler<StretchCommand> = {
  type: 'lab.stretch',
  apply(state, c) {
    if (!(c.weights >= 0 && c.weights <= 4 && Number.isInteger(c.weights))) return err(msg('hooke-spring-stretch-command-apply'));
    const k = c.stiffness ?? BENCH_SPRING_K.value;
    if (!SPRING_SET.includes(k)) return err(msg('hooke-spring-stretch-command-apply-2'));
    const F = weight(c.weights * BENCH_WEIGHT.value, G);
    const x = F / k;
    const l = BENCH_SPRING_L0 + x;
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [measured('ruler', 'length', ruler(l), l, { weights: c.weights, F, k, l0: BENCH_SPRING_L0, division: RULER_DIVISION })] });
  },
};

/** A step's button, its line in the plan, and what the Professor says doing it. */
export const STRETCH_TEXT = (c: StretchCommand): { say: LocalizedText; button: LocalizedText; plan: LocalizedText } => {
    const n = c.weights;
    return n === 0
      ? { say: msg('hooke-spring-stretch-text-say'), button: msg('hooke-spring-stretch-text-button'), plan: msg('hooke-spring-stretch-text-plan') }
      : {
          say: msg('hooke-spring-stretch-text-say-2', { value: (lang: Locale) => n === 1 ? t(lang, 'hooke-spring-say-uk') : t(lang, 'hooke-spring-say-uk-2', { n: String(n) }) }),
          button: msg('hooke-spring-stretch-text-button-2', { n: String(n) }),
          plan: msg('hooke-spring-stretch-text-plan-2', { n: String(n) }),
        };
  };
