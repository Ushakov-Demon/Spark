import { cite, sv } from '../../components/sourced.js';
import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { averageSpeed } from '../../domains/mechanics/formulas.js';
import { sig } from '../../explain/format.js';
import { msg, t } from '../../knowledge/messages.js';
import type { SourcedValue } from '../../knowledge/types.js';

/**
 * How plants move (grade 7, topic 1: «моделювання: … рухів тварин і рослин»). A shoot of moso bamboo, the quickest
 * of the plants measured, is photographed by a measuring pole time-lapse: its top's height read at each photo, the
 * speed v = Δh/Δt — to be set beside a snail's (the snail-speed experiment). The «what if…»: a Venus flytrap
 * filmed in slow motion snapping shut, its time counted in frames. The speed is the mechanics domain's; here — the
 * plants and the camera.
 */

/** Moso bamboo: how much its shoot grows in a day at its quickest, and how tall it can get. */
export const MOSO_GROWTH: SourcedValue = sv(1.19, 'm', 'a moso bamboo shoot in 24 hours, at its quickest', 'single-source', 0.05, [cite('wikipedia-moso-bamboo', 'Description (Austin and Ueda 1970, p. 193)', 'Moso bamboo grows as much as 119 cm in twenty-four hours', 1.19)], 'The most it grows in a day; taken as the same in every hour of it.');
export const MOSO_HEIGHT: SourcedValue = sv(28, 'm', 'the tallest moso culms', 'single-source', 0.1, [cite('wikipedia-moso-bamboo', 'Description', 'can reach a height of 28 m', 28)], 'A shoot grows no taller: past it the model does not hold.');
/** The shoot when the photos begin. */
export const SHOOT_START: SourcedValue = sv(0.5, 'm', 'a young shoot just out of the ground', 'estimate', 0.5, [cite('spark', 'estimate', 'a shoot half a metre tall, growing fast', 0.5)], 'Estimate: any height in its quick weeks would do.');
/** The pole beside the shoot: marked every centimetre. */
export const POLE_DIVISION = 0.01;
export const DAY = 86_400;
export const HOUR = 3600;

/** A Venus flytrap: how long its lobes take to snap shut, and the way a lobe's edge goes. */
export const TRAP_CLOSE: SourcedValue = sv(0.1, 's', 'a Venus flytrap’s lobes snapping shut', 'single-source', 0.3, [cite('wikipedia-venus-flytrap', 'Carnivory', 'the lobes of the trap will snap shut, typically in about one-tenth of a second', 0.1)], 'Typical; the article gives no spread.');
export const TRAP_EDGE_PATH: SourcedValue = sv(0.01, 'm', 'the edge of a lobe, from open to shut', 'estimate', 0.5, [cite('spark', 'estimate', 'a trap a couple of centimetres long; its lobe’s edge swings about a centimetre', 0.01)], 'Estimate: traps differ in size.');

/** A photo of the shoot `t` seconds after the first; or the flytrap filmed at `fps` frames a second. */
export type PlantCommand = { readonly type: 'lab.plant'; readonly step: 'shoot'; readonly t: number } | { readonly type: 'lab.plant'; readonly step: 'trap'; readonly fps: number };

/** The shoot's height `t` s after the first photo, m. */
export const shootAt = (t: number): number => SHOOT_START.value + (MOSO_GROWTH.value / DAY) * t;

export const plantCommand: CommandHandler<PlantCommand> = {
  type: 'lab.plant',
  apply(state, c) {
    if (c.step === 'shoot') {
      if (!(c.t >= 0 && Number.isFinite(c.t))) return err(msg('plant-motion-bad-time'));
      const h = shootAt(c.t);
      // As tall as moso gets, no more: it does not grow so fast all its life.
      if (h > MOSO_HEIGHT.value) return err(msg('plant-motion-too-tall', { max: (l) => `${MOSO_HEIGHT.value} ${t(l, 'unit-sym-m')}` }));
      const record: MeasurementRecord = { kind: 'measurement', instrument: 'pole', quantity: 'length', value: Math.round(h / POLE_DIVISION) * POLE_DIVISION, exact: h, entities: [], inputs: { t: c.t, division: POLE_DIVISION } };
      return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [record] });
    }
    if (!(c.fps > 0 && Number.isFinite(c.fps))) return err(msg('plant-motion-bad-fps'));
    // The frames from the first move to shut: the time to a frame.
    const frames = Math.round(TRAP_CLOSE.value * c.fps);
    if (frames < 1) return err(msg('plant-motion-too-slow-camera', { t: (l) => `${sig(TRAP_CLOSE.value, 2, l)} ${t(l, 'unit-sym-s')}`, fps: (l) => sig(c.fps, 3, l) }));
    const time = frames / c.fps;
    const record: MeasurementRecord = { kind: 'measurement', instrument: 'camera', quantity: 'time', value: time, exact: TRAP_CLOSE.value, entities: [], inputs: { frames, fps: c.fps, division: 1 / c.fps, path: TRAP_EDGE_PATH.value, v: averageSpeed(TRAP_EDGE_PATH.value, time) } };
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [record] });
  },
};
