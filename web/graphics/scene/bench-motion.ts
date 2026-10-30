import type { LocalizedText } from '../../../src/knowledge/i18n.js';
import { Channel, type Motion } from '../../motion.js';
import type { BenchView } from './bench.js';
import { sceneOf } from '../../experiments/index.js';

/**
 * How each instrument of the bench comes to its reading, described once — the motion itself is the general
 * one of motion.ts. A new reading is played from the previous picture to the new one; what moves and by
 * which law follows from the instrument (a spring's period from its stiffness and load: T = 2π√(m/k)).
 */


/** What the Professor says while an instrument is still moving, by the command that set it going. */
export const BUSY: Readonly<Record<string, LocalizedText>> = {
  'lab.roll': { uk: 'Кулька котиться — секундомір іде…', en: 'The ball is rolling — the stopwatch is running…' },
  'lab.whirl': { uk: 'Рахую оберти: раз, два, три…', en: 'Counting the turns: one, two, three…' },
  'lab.swing': { uk: 'Рахую коливання: раз, два, три…', en: 'Counting the swings: one, two, three…' },
  /** (The planets set going; the way out to Voyager.) */
  /** (The band stretched on the dynamometer.) */
  /** (The scale being drawn.) */
  /** (The airship climbing to 2 km.) */
  /** (A body let into the tower.) */
  /** (The step that takes the nail out of the coil.) */
};

/** A long run (many turns, many swings) is played this much faster than real time: about this many seconds at most. */
export const PLAY_SECONDS = 6;
/** The stopwatch's display: seconds to hundredths. */
const sw = (t: number, comma: boolean) => `${t.toFixed(2).replace('.', comma ? ',' : '.')} ${comma ? 'с' : 's'}`;

/** The motion from the previous picture to the new one; null — nothing moves (it is drawn at once). */
export function benchMotion(prev: BenchView | null, next: BenchView, draw: (v: BenchView) => void): Motion | null {
  const scene = sceneOf(next.kind);
  if (scene) return next.scene === undefined ? null : scene.motion(next.scene, (v) => draw({ ...next, scene: v }), prev?.kind === next.kind && prev.scene !== undefined ? prev.scene : null);
  if (next.run && (next.kind === 'incline' || next.kind === 'circle' || next.kind === 'pendulum')) return timed(next, next.run, draw);
  return null;
}

/**
 * A timed run with the stopwatch going: the ball speeding up down the groove (its share of the path grows as t²),
 * the body going round, the pendulum swinging (its angle A·cos of the phase). Long runs are sped up.
 */
function timed(next: BenchView, run: NonNullable<BenchView['run']>, draw: (v: BenchView) => void): Motion {
  const fast = Math.max(1, run.seconds / PLAY_SECONDS);
  const comma = (next.stopwatch?.display ?? ',').includes(',');
  const clock = new Channel(0, run.seconds, { kind: 'steady', speed: fast }, 1e-6);
  return {
    channels: [clock],
    frame: (done) => {
      const t = clock.value;
      const stopwatch = { display: done ? (next.stopwatch?.display ?? sw(t, comma)) : sw(t, comma), fast };
      if (next.kind === 'incline') return draw({ ...next, stopwatch, incline: { stop: next.incline?.stop ?? 1, ball: (t / run.seconds) ** 2 } });
      const phase = run.period ? (2 * Math.PI * t) / run.period : 0;
      if (next.kind === 'circle') return draw({ ...next, stopwatch, circle: { thread: next.circle?.thread ?? 0.5, angle: phase } });
      return draw({ ...next, stopwatch, pendulum: { length: next.pendulum?.length ?? 1, mass: next.pendulum?.mass ?? 0.03, angle: done ? 0 : (run.amplitude ?? 0) * Math.cos(phase) } });
    },
  };
}

























