import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import { G } from '../../domains/mechanics/constants.js';
import { power, weight, work } from '../../domains/mechanics/formulas.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
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
const wrong = (uk: string, en: string) => err({ uk, en });

export const stairsCommand: CommandHandler<StairsCommand> = {
  type: 'lab.stairs',
  apply(state, c) {
    const done = (...r: ReturnType<typeof measured>[]) => ok({ state, kind: 'measurement' as const, externalEnergy: 0, trace: r });
    if (c.step !== 'measure' && !(c.mass >= 20 && c.mass <= 150)) return wrong('Маса людини — від 20 до 150 кг.', 'A person’s mass is 20 to 150 kg.');
    if (c.step === 'weigh') return done(measured('floor-scales', 'mass', round(c.mass, FLOOR_SCALES), c.mass, { division: FLOOR_SCALES }));
    if (!(Number.isInteger(c.steps) && c.steps >= 3 && c.steps <= 100)) return wrong('Сходинок — від 3 до 100.', 'The steps: 3 to 100.');
    if (!(c.rise >= 0.1 && c.rise <= 0.22)) return wrong('Сходинка буває заввишки від 10 до 22 см.', 'A step is 10 to 22 cm high.');
    const height = c.steps * c.rise;
    if (c.step === 'measure') return done(measured('ruler', 'length', ruler(c.rise), c.rise, { steps: c.steps, height, division: RULER_DIVISION }));
    if (!(c.time > 0.5 && c.time <= 600)) return wrong('Час на сходах — від пів секунди до 10 хвилин.', 'The time on the stairs: half a second to 10 minutes.');
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
        say: { uk: 'Стань на підлогові ваги. Скільки ти важиш?', en: 'Stand on the floor scales. What is your mass?' },
        button: { uk: '⚖ Зважитися', en: '⚖ Weigh yourself' },
        plan: { uk: 'зважитися на підлогових вагах', en: 'weigh yourself on the floor scales' },
      };
    if (c.step === 'measure')
      return {
        say: { uk: 'Виміряй лінійкою висоту однієї сходинки й порахуй сходинки до наступного поверху.', en: 'Measure the height of one step with a ruler and count the steps to the next floor.' },
        button: { uk: '📏 Виміряти сходинку й порахувати сходинки', en: '📏 Measure a step and count the steps' },
        plan: { uk: 'виміряти сходинку й порахувати сходинки', en: 'measure a step and count the steps' },
      };
    return c.pace === 'walk'
      ? {
          say: { uk: 'Піднімися на поверх спокійним кроком — товариш засікає час секундоміром.', en: 'Walk up one floor at an easy pace — a friend times you with a stopwatch.' },
          button: { uk: '🚶 Піднятися кроком', en: '🚶 Walk up' },
          plan: { uk: 'піднятися на поверх кроком, з секундоміром', en: 'walk up one floor, with the stopwatch' },
        }
      : {
          say: { uk: 'А тепер — ті самі сходи бігом! Секундомір готовий.', en: 'Now the same stairs at a run! The stopwatch is ready.' },
          button: { uk: '🏃 Вибігти бігом', en: '🏃 Run up' },
          plan: { uk: 'вибігти на поверх бігом, з секундоміром', en: 'run up one floor, with the stopwatch' },
        };
  },
};
