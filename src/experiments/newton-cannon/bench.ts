import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { EARTH_GM, EARTH_MEAN_RADIUS } from '../../domains/mechanics/constants.js';
import { conic, flight } from '../../domains/mechanics/orbit.js';
import { msg } from '../../knowledge/messages.js';

/**
 * Newton's cannonball (grade 7, topic 2: «Рухи небесних тіл та штучних супутників Землі»): a cannon on a mountain
 * higher than the air shoots sideways (or at any angle — beyond Newton's own), each time faster. Slow, the ball comes down — farther each time; at the
 * circular speed it goes round the Earth and comes back to the mountain: a satellite; faster, on a stretched orbit;
 * faster still, away for good. The path, the range, the time and the period are the mechanics domain's (orbit.ts,
 * Kepler's third law); here — the mountain and the tracking of the ball.
 */

/** A shot at `v` m/s from `h` m above the ground, `angle` degrees above the horizon (0 — sideways, Newton's own). */
export type CannonCommand = { readonly type: 'lab.cannon'; readonly h: number; readonly v: number; readonly angle?: number };

/** The tracking gives three figures: the range and the time, or the period. */
export const FIGURES = 3;
export const threeFigures = (x: number): number => (x > 0 ? 10 ** (Math.floor(Math.log10(x)) - (FIGURES - 1)) : 1);

export const mu = () => EARTH_GM.value;
export const earthR = () => EARTH_MEAN_RADIUS.value;

/** How a shot ends: 0 — down on the ground, 1 — round the Earth, 2 — away. */
export const OUTCOME = { lands: 0, orbits: 1, escapes: 2 } as const;

export const cannonCommand: CommandHandler<CannonCommand> = {
  type: 'lab.cannon',
  apply(state, c) {
    if (!(c.h >= 0 && Number.isFinite(c.h))) return err(msg('newton-cannon-bad-height'));
    if (!(c.v >= 0 && Number.isFinite(c.v))) return err(msg('newton-cannon-bad-speed'));
    const angle = c.angle ?? 0;
    if (!(angle >= -90 && angle <= 90)) return err(msg('newton-cannon-bad-angle'));
    const gamma = (angle * Math.PI) / 180;
    const f = flight(mu(), earthR(), c.h, c.v, gamma);
    const { p, e } = conic(mu(), earthR() + c.h, c.v, gamma);
    const base = { h: c.h, v: c.v, p, e, angle };
    if (f.outcome === 'lands') {
      const d = threeFigures(f.range);
      const record: MeasurementRecord = { kind: 'measurement', instrument: 'tracker', quantity: 'length', value: Math.round(f.range / d) * d, exact: f.range, entities: [], inputs: { ...base, outcome: OUTCOME.lands, division: d, angle: f.angle, time: f.time } };
      return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [record] });
    }
    if (f.outcome === 'orbits') {
      const d = threeFigures(f.period);
      const record: MeasurementRecord = { kind: 'measurement', instrument: 'tracker', quantity: 'time', value: Math.round(f.period / d) * d, exact: f.period, entities: [], inputs: { ...base, outcome: OUTCOME.orbits, division: d, near: f.near, far: f.far, a: p / (1 - e * e) } };
      return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [record] });
    }
    // Away for good: it never comes back — no time to read (a period without end).
    const record: MeasurementRecord = { kind: 'measurement', instrument: 'tracker', quantity: 'time', value: null, exact: Infinity, entities: [], inputs: { ...base, outcome: OUTCOME.escapes, division: 1 } };
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [record] });
  },
};
