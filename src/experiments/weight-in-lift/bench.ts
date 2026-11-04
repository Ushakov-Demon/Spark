import type { CommandHandler } from '../../core/commands.js';
import { ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { cite, sv } from '../../components/sourced.js';
import { G } from '../../domains/mechanics/constants.js';
import { SCALES, scaleReading } from '../../equipment/scales.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import { msg } from '../../knowledge/messages.js';
import type { SourcedValue } from '../../knowledge/types.js';
import { BENCH_WEIGHT } from '../../scenarios/bench-kit.js';

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
  rest: { say: msg('weight-in-lift-rest-say'), button: msg('weight-in-lift-rest-button'), plan: msg('weight-in-lift-rest-plan') },
  'up-start': { say: msg('weight-in-lift-up-start-say'), button: msg('weight-in-lift-up-start-button'), plan: msg('weight-in-lift-up-start-plan') },
  up: { say: msg('weight-in-lift-up-say'), button: msg('weight-in-lift-up-button'), plan: msg('weight-in-lift-up-plan') },
  'up-stop': { say: msg('weight-in-lift-up-stop-say'), button: msg('weight-in-lift-up-stop-button'), plan: msg('weight-in-lift-up-stop-plan') },
  'down-start': { say: msg('weight-in-lift-down-start-say'), button: msg('weight-in-lift-down-start-button'), plan: msg('weight-in-lift-down-start-plan') },
  down: { say: msg('weight-in-lift-down-say'), button: msg('weight-in-lift-down-button'), plan: msg('weight-in-lift-down-plan') },
  'down-stop': { say: msg('weight-in-lift-down-stop-say'), button: msg('weight-in-lift-down-stop-button'), plan: msg('weight-in-lift-down-stop-plan') },
  fall: { say: msg('weight-in-lift-fall-say'), button: msg('weight-in-lift-fall-button'), plan: msg('weight-in-lift-fall-plan') },
};
export const liftPhaseText = (p: LiftPhase) => PHASE[p];

export const LIFT_TEXT: Record<LiftCommand['type'], (c: LiftCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.lift': (x) => PHASE[(x as LiftCommand).phase],
};
