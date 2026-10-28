import type { CommandHandler } from '../core/commands.js';
import { ok } from '../core/result.js';
import type { MeasurementRecord } from '../core/trace.js';
import { cite, sv } from '../components/sourced.js';
import { G } from '../domains/mechanics/constants.js';
import { SCALES, scaleReading } from '../equipment/scales.js';
import type { LocalizedText } from '../knowledge/i18n.js';
import type { SourcedValue } from '../knowledge/types.js';
import { BENCH_WEIGHT } from './bench.js';

/**
 * Weight in a lift (grade 7): a dynamometer hangs from the cabin's ceiling with four 100 g weights. Standing or
 * moving steadily, it shows P = m·g. Speeding up — the spring has to speed the load up as well: while the
 * acceleration a points up (starting up, stopping on the way down) it shows m·(g + a), more; while it points down
 * (stopping on the way up, starting down) m·(g − a), less. Falling freely with the load (the textbook's
 * investigation, § 25), it shows nothing: weightlessness.
 */

/** A passenger lift's acceleration and deceleration in normal operation. */
export const LIFT_ACCELERATION: SourcedValue = sv(1.2, 'm/s²', 'a passenger lift, normal operation', 'single-source', 0.3, [cite('elevator-world-acceleration', 'the industry limits acceleration/deceleration to 1.2 m/s²', '—', 1.2)], 'The comfort limit lifts are built to; many accelerate more gently.');
/** The load: so many 100 g weights. */
export const LIFT_WEIGHTS = 4;

export type LiftPhase = 'rest' | 'up-start' | 'up' | 'up-stop' | 'down-start' | 'down' | 'down-stop' | 'fall';

/** The lift (or the dynamometer let go) in this phase; read the dynamometer. */
export interface LiftCommand {
  readonly type: 'lab.lift';
  readonly phase: LiftPhase;
}

/** The acceleration in a phase, m/s², upwards positive. */
export function liftAcceleration(phase: LiftPhase): number {
  const a = LIFT_ACCELERATION.value;
  return phase === 'up-start' || phase === 'down-stop' ? a : phase === 'up-stop' || phase === 'down-start' ? -a : phase === 'fall' ? -G : 0;
}

export const liftCommand: CommandHandler<LiftCommand> = {
  type: 'lab.lift',
  apply(state, c) {
    const m = LIFT_WEIGHTS * BENCH_WEIGHT.value;
    const a = liftAcceleration(c.phase);
    // The spring holds the load and gives it its acceleration: F = m·(g + a).
    const F = Math.max(0, m * (G + a));
    const record: MeasurementRecord = { kind: 'measurement', instrument: 'dynamometer', quantity: 'force', value: scaleReading(SCALES.dynamometer, F), exact: F, entities: [], inputs: { a, mass: m } };
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [record] });
  },
};

export const LIFT_COMMANDS = [liftCommand] as const;

const PHASE: Record<LiftPhase, { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  rest: { say: { uk: 'Ліфт стоїть на першому поверсі. Що показує динамометр?', en: 'The lift stands on the ground floor. What does the dynamometer show?' }, button: { uk: '⏸ Ліфт стоїть', en: '⏸ The lift stands' }, plan: { uk: 'ліфт стоїть', en: 'the lift stands' } },
  'up-start': { say: { uk: 'Тиснемо кнопку — ліфт рушає вгору, розганяючись. Поглянь на динамометр!', en: 'Press the button — the lift starts up, speeding up. Look at the dynamometer!' }, button: { uk: '⏫ Рушає вгору', en: '⏫ Starts up' }, plan: { uk: 'ліфт рушає вгору', en: 'the lift starts up' } },
  up: { say: { uk: 'Ліфт їде вгору рівномірно. А тепер?', en: 'The lift goes up steadily. And now?' }, button: { uk: '⬆ Їде вгору рівномірно', en: '⬆ Goes up steadily' }, plan: { uk: 'ліфт їде вгору рівномірно', en: 'the lift goes up steadily' } },
  'up-stop': { say: { uk: 'Ліфт гальмує біля верхнього поверху. Що з показами?', en: 'The lift slows down at the top floor. What about the reading?' }, button: { uk: '⏬ Гальмує нагорі', en: '⏬ Slows at the top' }, plan: { uk: 'ліфт гальмує нагорі', en: 'the lift slows at the top' } },
  'down-start': { say: { uk: 'Тепер униз: ліфт рушає, розганяючись.', en: 'Now down: the lift starts, speeding up.' }, button: { uk: '⏬ Рушає вниз', en: '⏬ Starts down' }, plan: { uk: 'ліфт рушає вниз', en: 'the lift starts down' } },
  down: { say: { uk: 'Ліфт їде вниз рівномірно.', en: 'The lift goes down steadily.' }, button: { uk: '⬇ Їде вниз рівномірно', en: '⬇ Goes down steadily' }, plan: { uk: 'ліфт їде вниз рівномірно', en: 'the lift goes down steadily' } },
  'down-stop': { say: { uk: 'Ліфт гальмує внизу. А тепер?', en: 'The lift slows down at the bottom. And now?' }, button: { uk: '⏫ Гальмує внизу', en: '⏫ Slows at the bottom' }, plan: { uk: 'ліфт гальмує внизу', en: 'the lift slows at the bottom' } },
  fall: { say: { uk: 'Дослід із підручника: на мить відпустимо динамометр разом із тягарцями — хай падають на підлогу кабіни. Що він показує в польоті?', en: 'The textbook’s investigation: let the dynamometer go for a moment with its weights — let them fall to the cabin’s floor. What does it show in flight?' }, button: { uk: '🪂 Відпустити динамометр', en: '🪂 Let the dynamometer go' }, plan: { uk: 'відпустити динамометр із тягарцями', en: 'let the dynamometer go with the weights' } },
};
export const liftPhaseText = (p: LiftPhase) => PHASE[p];

export const LIFT_TEXT: Record<LiftCommand['type'], (c: LiftCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.lift': (x) => PHASE[(x as LiftCommand).phase],
};
