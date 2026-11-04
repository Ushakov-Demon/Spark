import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { G } from '../../domains/mechanics/constants.js';
import { slidingFriction, weight } from '../../domains/mechanics/formulas.js';
import { SCALES, scaleReading } from '../../equipment/scales.js';
import { msg, t } from '../../knowledge/messages.js';
import { BENCH_WEIGHT, blockMass, measured, PAPER_ON_WOOD, WOOD_ON_WOOD } from '../../scenarios/bench-kit.js';

/** Sliding friction (grade 7): a wooden block pulled along a wooden board by a dynamometer. */

/** Pull the block along the board at a steady speed with so many weights on it; read the dynamometer. */
export interface PullCommand {
  readonly type: 'lab.pull';
  readonly weights: number;
  /** The face the block lies on: the widest (default) or the narrower side face. */
  readonly face?: 'wide' | 'narrow';
  /** What it slides on: the bare board (default) or a sheet of paper laid on it. */
  readonly surface?: 'wood' | 'paper';
}

export const pullCommand: CommandHandler<PullCommand> = {
  type: 'lab.pull',
  apply(state, c) {
    if (!(c.weights >= 0 && c.weights <= 3 && Number.isInteger(c.weights))) return err(msg('sliding-friction-pull-command-apply'));
    const N = weight(blockMass() + c.weights * BENCH_WEIGHT.value, G);
    // (Amontons' law: the face it lies on does not matter, only the pair of materials and the load.)
    const mu = (c.surface === 'paper' ? PAPER_ON_WOOD : WOOD_ON_WOOD).value;
    const F = slidingFriction(mu, N);
    const dyn = SCALES.dynamometer;
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [measured('dynamometer', 'force', scaleReading(dyn, F), F, { weights: c.weights, N, mu, block: blockMass(), narrow: c.face === 'narrow' ? 1 : 0, paper: c.surface === 'paper' ? 1 : 0 })] });
  },
};

/** A step's button, its line in the plan, and what the Professor says doing it. */
export const PULL_TEXT = (c: PullCommand): { say: LocalizedText; button: LocalizedText; plan: LocalizedText } => {
    const p = c as PullCommand;
    const n = p.weights;
    if (p.face === 'narrow')
      return {
        say: msg('sliding-friction-pull-text-say'),
        button: msg('sliding-friction-pull-text-button'),
        plan: msg('sliding-friction-pull-text-plan'),
      };
    if (p.surface === 'paper')
      return {
        say: msg('sliding-friction-pull-text-say-2'),
        button: msg('sliding-friction-pull-text-button-2'),
        plan: msg('sliding-friction-pull-text-plan-2'),
      };
    return {
      say: n === 0 ? msg('sliding-friction-pull-text-say-3') : msg('sliding-friction-pull-text-say-4', { value: (l: Locale) => n === 1 ? t(l, 'sliding-friction-say-uk') : t(l, 'sliding-friction-say-uk-2', { n: String(n) }), value2: (l: Locale) => p.face ? t(l, 'sliding-friction-say-uk-3') : t(l, 'sliding-friction-say-uk-4') }),
      button: msg('sliding-friction-pull-text-button-3', { n: (l: Locale) => n ? t(l, 'sliding-friction-button-uk', { n: String(n) }) : '' }),
      plan: msg('sliding-friction-pull-text-plan-3', { value: (l: Locale) => n === 1 ? t(l, 'sliding-friction-plan-uk') : n ? t(l, 'sliding-friction-plan-uk-2', { n: String(n) }) : '' }),
    };
  };
