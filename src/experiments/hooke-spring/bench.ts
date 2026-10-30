import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import { G } from '../../domains/mechanics/constants.js';
import { weight } from '../../domains/mechanics/formulas.js';
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
    if (!(c.weights >= 0 && c.weights <= 4 && Number.isInteger(c.weights))) return err({ uk: 'На пружину вішають від 0 до 4 тягарців.', en: 'Hang 0 to 4 weights on the spring.' });
    const k = c.stiffness ?? BENCH_SPRING_K.value;
    if (!SPRING_SET.includes(k)) return err({ uk: 'Такої пружини в наборі немає.', en: 'There is no such spring in the set.' });
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
      ? { say: { uk: 'Підвісь пружину на лапку штатива й виміряй лінійкою її довжину без вантажу — l₀.', en: 'Hang the spring on the stand’s clamp and measure its length with no load — l₀.' }, button: { uk: '📏 Виміряти l₀', en: '📏 Measure l₀' }, plan: { uk: 'виміряти довжину пружини', en: 'measure the spring' } }
      : {
          say: { uk: `Підвісь до пружини ${n === 1 ? 'тягарець 100 г' : `${n} тягарці по 100 г`} і виміряй її довжину l.`, en: `Hang ${n === 1 ? 'a 100 g weight' : `${n} weights of 100 g`} on the spring and measure its length l.` },
          button: { uk: `📏 ${n} × 100 г: виміряти l`, en: `📏 ${n} × 100 g: measure l` },
          plan: { uk: `${n} × 100 г — виміряти довжину`, en: `${n} × 100 g — measure the length` },
        };
  };
