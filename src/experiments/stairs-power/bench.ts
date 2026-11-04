import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import { G } from '../../domains/mechanics/constants.js';
import { power, weight, work } from '../../domains/mechanics/formulas.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import { msg } from '../../knowledge/messages.js';
import { measured, ruler, RULER_DIVISION } from '../../scenarios/bench-kit.js';

/**
 * What power do I develop running up the stairs? (grade 7, «визначення: … механічної роботи, коли сила діє вздовж
 * напрямку руху; потужності»). The pupil measures themself: their mass on floor scales, one step's height with a ruler
 * and the steps to the next floor, the time up them walking and running with a stopwatch (a friend's). The numbers are
 * the pupil's own, set under the scene (an example by default); the physics is the domain's — the weight to lift,
 * the work over the height, the power over the time.
 */

/** Floor scales: a tenth of a kilogram. */
export const FLOOR_SCALES = 0.1;
/** A stopwatch: a hundredth of a second. */
export const STOPWATCH = 0.01;

export type Pace = 'walk' | 'run';
export type StairsCommand =
  | { readonly type: 'lab.stairs'; readonly step: 'weigh'; readonly mass: number }
  | { readonly type: 'lab.stairs'; readonly step: 'measure'; readonly steps: number; readonly rise: number }
  | { readonly type: 'lab.stairs'; readonly step: 'climb'; readonly pace: Pace; readonly mass: number; readonly steps: number; readonly rise: number; readonly time: number };

const round = (x: number, d: number) => Math.round(x / d) * d;

export const stairsCommand: CommandHandler<StairsCommand> = {
  type: 'lab.stairs',
  apply(state, c) {
    const done = (...r: ReturnType<typeof measured>[]) => ok({ state, kind: 'measurement' as const, externalEnergy: 0, trace: r });
    if (c.step !== 'measure' && !(c.mass >= 20 && c.mass <= 150)) return err(msg('stairs-power-wrong-mass'));
    if (c.step === 'weigh') return done(measured('floor-scales', 'mass', round(c.mass, FLOOR_SCALES), c.mass, { division: FLOOR_SCALES }));
    if (!(Number.isInteger(c.steps) && c.steps >= 3 && c.steps <= 100)) return err(msg('stairs-power-wrong-steps'));
    if (!(c.rise >= 0.1 && c.rise <= 0.22)) return err(msg('stairs-power-wrong-rise'));
    const height = c.steps * c.rise;
    if (c.step === 'measure') return done(measured('ruler', 'length', ruler(c.rise), c.rise, { steps: c.steps, height, division: RULER_DIVISION }));
    if (!(c.time > 0.5 && c.time <= 600)) return err(msg('stairs-power-wrong-time'));
    // Lifting oneself: a force equal to one's weight, along the height (the steps forward need no work against it).
    const F = weight(c.mass, G);
    const A = work(F, height);
    const N = power(A, c.time);
    return done(measured('stopwatch', 'time', round(c.time, STOPWATCH), c.time, { mass: c.mass, height, force: F, work: A, power: N, run: c.pace === 'run' ? 1 : 0, division: STOPWATCH }));
  },
};

export const STAIRS_TEXT: Record<StairsCommand['type'], (c: StairsCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.stairs': (x) => {
    const c = x as StairsCommand;
    if (c.step === 'weigh')
      return {
        say: msg('stairs-power-labstairs-say'),
        button: msg('stairs-power-labstairs-button'),
        plan: msg('stairs-power-labstairs-plan'),
      };
    if (c.step === 'measure')
      return {
        say: msg('stairs-power-labstairs-say-2'),
        button: msg('stairs-power-labstairs-button-2'),
        plan: msg('stairs-power-labstairs-plan-2'),
      };
    return c.pace === 'walk'
      ? {
          say: msg('stairs-power-labstairs-say-3'),
          button: msg('stairs-power-labstairs-button-3'),
          plan: msg('stairs-power-labstairs-plan-3'),
        }
      : {
          say: msg('stairs-power-labstairs-say-4'),
          button: msg('stairs-power-labstairs-button-4'),
          plan: msg('stairs-power-labstairs-plan-4'),
        };
  },
};
