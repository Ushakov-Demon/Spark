import type { CommandHandler } from '../core/commands.js';
import { err, ok } from '../core/result.js';
import type { MeasurementRecord } from '../core/trace.js';
import { cite, sv } from '../components/sourced.js';
import { G } from '../domains/mechanics/constants.js';
import { weight } from '../domains/mechanics/formulas.js';
import { SCALES, scaleReading } from '../equipment/scales.js';
import type { LocalizedText } from '../knowledge/i18n.js';
import type { SourcedValue } from '../knowledge/types.js';
import { BENCH_WEIGHT } from './bench-kit.js';

/**
 * Adding forces along one line (grade 7): one load — two 100 g weights on a light ruler — held by one dynamometer,
 * then by two at the ruler's ends (the load in the middle, then nearer one end), then by one pulling up while the
 * other pulls it down. At rest the forces on the load balance: the dynamometers' resultant equals the load's weight
 * each time, R = F₁ + F₂ (the same way) or R = F₁ − F₂ (opposite ways). How the load shares itself between two ends
 * follows from the balance of moments about either end: F₁ = P·(L − x)/L + P_ruler/2.
 */

/** The ruler the weights hang on. */
export const FORCES_RULER: { readonly length: SourcedValue; readonly mass: SourcedValue } = {
  length: sv(0.3, 'm', 'a school wooden ruler', 'estimate', 0, [cite('spark', 'estimate', 'the usual 30 cm ruler', 0.3)], 'Estimate.'),
  mass: sv(0.02, 'kg', 'a 30 cm wooden ruler', 'estimate', 0.5, [cite('spark', 'estimate', 'a 30 × 3 × 0.3 cm strip of wood, some 600 kg/m³: ≈ 16 g', 0.02)], 'Estimate: its weight is in every reading alike — the first one, by a single dynamometer, includes it.'),
};
/** The load: so many 100 g weights. */
export const FORCES_WEIGHTS = 2;

/**
 * How the load is held: by one dynamometer at the ruler's middle; by two at its ends, the weights `at` metres
 * from the left end; by one at the middle pulling up while the other pulls the weights down with `down` newtons.
 */
export interface ForcesCommand {
  readonly type: 'lab.forces';
  readonly hold: 'one' | 'two' | 'down';
  readonly at?: number;
  readonly down?: number;
}

export const forcesLoad = (): { readonly weights: number; readonly ruler: number } => ({ weights: weight(FORCES_WEIGHTS * BENCH_WEIGHT.value, G), ruler: weight(FORCES_RULER.mass.value, G) });

export const forcesCommand: CommandHandler<ForcesCommand> = {
  type: 'lab.forces',
  apply(state, c) {
    const L = FORCES_RULER.length.value;
    const { weights: P, ruler: Pr } = forcesLoad();
    const dyn = SCALES.dynamometer;
    const read = (which: number, F: number, inputs: Record<string, number> = {}): MeasurementRecord => ({ kind: 'measurement', instrument: 'dynamometer', quantity: 'force', value: scaleReading(dyn, F), exact: F, entities: [], inputs: { which, load: P + Pr, ...inputs } });
    const trace = (records: MeasurementRecord[]) => ok({ state, kind: 'measurement' as const, externalEnergy: 0, trace: records });
    if (c.hold === 'one') return trace([read(0, P + Pr)]);
    if (c.hold === 'two') {
      const x = c.at ?? L / 2;
      if (!(x >= 0 && x <= L)) return err({ uk: 'Тягарці чіпляють на лінійку — від 0 до 30 см.', en: 'The weights hang on the ruler — 0 to 30 cm.' });
      // Moments about the right end give the left one's share, and the other way round; the ruler's own weight halves.
      const left = (P * (L - x)) / L + Pr / 2;
      const right = (P * x) / L + Pr / 2;
      return trace([read(0, left, { at: x }), read(1, right, { at: x })]);
    }
    const down = c.down ?? 1;
    if (!(down > 0 && down <= 1.5)) return err({ uk: 'Униз тягнемо з силою до 1,5 Н.', en: 'Pull down with up to 1.5 N.' });
    // The upper one holds the load and the lower one's pull as well.
    return trace([read(0, P + Pr + down), read(1, down, { down: 1 })]);
  },
};

export const FORCES_COMMANDS = [forcesCommand] as const;

const cm = (m: number) => Math.round(m * 100);
const N = (x: number, uk: boolean) => `${String(x).replace('.', uk ? ',' : '.')} ${uk ? 'Н' : 'N'}`;

export const FORCES_TEXT: Record<ForcesCommand['type'], (c: ForcesCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.forces': (x) => {
    const c = x as ForcesCommand;
    if (c.hold === 'one')
      return {
        say: { uk: 'Почепи лінійку з тягарцями на один динамометр — за середину. Що він показує?', en: 'Hang the ruler with the weights on one dynamometer — by its middle. What does it show?' },
        button: { uk: '⬆ Один динамометр', en: '⬆ One dynamometer' },
        plan: { uk: 'тримати вантаж одним динамометром', en: 'hold the load by one dynamometer' },
      };
    if (c.hold === 'two') {
      const mid = Math.abs((c.at ?? 0.15) - FORCES_RULER.length.value / 2) < 1e-6;
      return mid
        ? {
            say: { uk: 'Тепер тримаймо лінійку двома динамометрами за кінці, тягарці — посередині. Що показують обидва?', en: 'Now hold the ruler by two dynamometers at its ends, the weights in the middle. What do both show?' },
            button: { uk: '⬆⬆ Два динамометри, тягарці посередині', en: '⬆⬆ Two dynamometers, weights in the middle' },
            plan: { uk: 'два динамометри, тягарці посередині', en: 'two dynamometers, weights in the middle' },
          }
        : {
            say: { uk: `Пересунь тягарці на ${cm(c.at!)} см від лівого кінця. Як змінилися покази?`, en: `Move the weights to ${cm(c.at!)} cm from the left end. How did the readings change?` },
            button: { uk: `⬆⬆ Тягарці на ${cm(c.at!)} см`, en: `⬆⬆ Weights at ${cm(c.at!)} cm` },
            plan: { uk: `два динамометри, тягарці на ${cm(c.at!)} см`, en: `two dynamometers, weights at ${cm(c.at!)} cm` },
          };
    }
    const d = c.down ?? 1;
    return {
      say: { uk: `Знову один динамометр тримає лінійку за середину, а другим тягни тягарці вниз, доки він не покаже ${N(d, true)}. Що показує верхній?`, en: `Again one dynamometer holds the ruler by the middle, and pull the weights down with the other until it shows ${N(d, false)}. What does the upper one show?` },
      button: { uk: `⬆⬇ Вгору й униз (${N(d, true)})`, en: `⬆⬇ Up and down (${N(d, false)})` },
      plan: { uk: `один угору, другий униз з силою ${N(d, true)}`, en: `one up, the other down with ${N(d, false)}` },
    };
  },
};
