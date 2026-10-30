import type { Motion } from '../../motion.js';
import type { BenchView } from './bench.js';
import { sceneOf } from '../../experiments/index.js';

/**
 * How the bench comes to its new picture: each experiment module plays its own step (web/experiments), the motion
 * itself is the general one of motion.ts.
 */

/** A long run (many turns, many swings) is played this much faster than real time: about this many seconds at most. */
export const PLAY_SECONDS = 6;

/** The motion from the previous picture to the new one; null — nothing moves (it is drawn at once). */
export function benchMotion(prev: BenchView | null, next: BenchView, draw: (v: BenchView) => void): Motion | null {
  const scene = sceneOf(next.kind);
  if (!scene || next.scene === undefined) return null;
  return scene.motion(next.scene, (v) => draw({ ...next, scene: v }), prev?.kind === next.kind && prev.scene !== undefined ? prev.scene : null);
}
