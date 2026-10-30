import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import { G } from '../../domains/mechanics/constants.js';
import { slidingFriction, weight } from '../../domains/mechanics/formulas.js';
import { SCALES, scaleReading } from '../../equipment/scales.js';
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
    if (!(c.weights >= 0 && c.weights <= 3 && Number.isInteger(c.weights))) return err({ uk: 'На брусок кладуть від 0 до 3 тягарців.', en: 'Put 0 to 3 weights on the block.' });
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
        say: { uk: 'Тепер постав брусок на вужчу бічну грань — площа дотику з дошкою менша — і знову рівномірно тягни.', en: 'Now stand the block on its narrower side face — less area touching the board — and pull it steadily again.' },
        button: { uk: '➡ Брусок на вужчій грані', en: '➡ The block on its narrower face' },
        plan: { uk: 'брусок на вужчій грані', en: 'the block on its narrower face' },
      };
    if (p.surface === 'paper')
      return {
        say: { uk: 'Покладемо на дошку аркуш паперу й потягнемо брусок по ньому — тією самою широкою гранню.', en: 'Lay a sheet of paper on the board and pull the block over it — on the same wide face.' },
        button: { uk: '➡ Брусок по папері', en: '➡ The block over paper' },
        plan: { uk: 'брусок по аркушу паперу', en: 'the block over a sheet of paper' },
      };
    return {
      say: n === 0 ? { uk: 'Поклади брусок широкою гранню на дошку й рівномірно тягни його динамометром. Що він показує?', en: 'Lay the block on its widest face on the board and pull it at a steady speed with the dynamometer. What does it show?' } : { uk: `Поклади на брусок ${n === 1 ? 'тягарець' : `${n} тягарці`} і ${p.face ? 'рівномірно тягни його широкою гранню по дошці' : 'знову рівномірно тягни'}.`, en: `Put ${n === 1 ? 'a weight' : `${n} weights`} on the block and ${p.face ? 'pull it on its wide face along the board steadily' : 'pull it steadily again'}.` },
      button: { uk: `➡ Тягти брусок${n ? ` (+${n} × 100 г)` : ''}`, en: `➡ Pull the block${n ? ` (+${n} × 100 g)` : ''}` },
      plan: { uk: `тягти брусок${n === 1 ? ' із тягарцем' : n ? ` із ${n} тягарцями` : ''}`, en: `pull the block${n === 1 ? ' with a weight' : n ? ` with ${n} weights` : ''}` },
    };
  };
