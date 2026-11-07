/**
 * What happens on a scene, and how it sounds — one place for every experiment. A scene does not pick a sound: it says
 * what happened (a body went into a liquid, a weight hit the floor), and here it is decided what is heard. A motion
 * says it every frame it is so; `once` makes it heard the first time only.
 */
import { clunk, plunge, thud, tock } from './index.js';

export type Happening =
  /** A body goes into a liquid: `size` — about 1 for a ball of a few centimetres, more for a wider body; `thick` — glycerol, oil: a lower «бульк». */
  | { readonly kind: 'into-liquid'; readonly size?: number; readonly thick?: boolean }
  /** A body lands on something hard: a plasticine ball, a block — a dull «тук»; a metal weight — with a knock of metal in it. */
  | { readonly kind: 'lands'; readonly metal?: boolean }
  /** A ball bounces off something hard: its `mass`, kg, and diameter `size`, m — its knock comes from them; `strength` 0…1 — how fast it hit. */
  | { readonly kind: 'bounces'; readonly mass: number; readonly size: number; readonly strength: number };

/**
 * A ball's knock, Hz, from what it is: smaller and lighter for its size (hollow) — higher and brighter; bigger and denser —
 * lower and duller. A ping-pong ball (2.7 g, 4 cm) knocks at about 2100 Hz, a tennis ball (58 g, 6.7 cm) at about 400.
 * Not a law: a way to hear the difference, kept within what an ear finds plausible.
 */
export function ringOf(mass: number, size: number): number {
  const density = mass / ((Math.PI * size ** 3) / 6) / 1000;
  return Math.max(150, Math.min(4000, RING_K / (size * density ** 0.75)));
}
/** The scale of `ringOf`: a ping-pong ball's knock at about 2100 Hz. */
const RING_K = 12.7;

/** It happened: heard now. */
export function sound(h: Happening): void {
  if (h.kind === 'into-liquid') return plunge((h.size ?? 1) * (h.thick ? 1.4 : 1));
  if (h.kind === 'bounces') return tock(ringOf(h.mass, h.size), h.strength);
  if (h.metal) clunk();
  else thud();
}

/**
 * Within one motion: `(now)` every frame — heard the first time `now` is true, never again. `already` — it has happened
 * before the motion began (nothing to be heard).
 */
export function once(h: Happening, already = false): (now: boolean) => void {
  let heard = already;
  return (now) => {
    if (heard || !now) return;
    heard = true;
    sound(h);
  };
}
