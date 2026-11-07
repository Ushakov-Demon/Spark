/**
 * What happens on a scene, and how it sounds — one place for every experiment. A scene does not pick a sound: it says
 * what happened (a body went into a liquid, a weight hit the floor), and here it is decided what is heard. A motion
 * says it every frame it is so; `once` makes it heard the first time only.
 */
import { clunk, plunge, thud } from './index.js';

export type Happening =
  /** A body goes into a liquid: `size` — about 1 for a ball of a few centimetres, more for a wider body; `thick` — glycerol, oil: a lower «бульк». */
  | { readonly kind: 'into-liquid'; readonly size?: number; readonly thick?: boolean }
  /** A body lands on something hard: a plasticine ball, a block — a dull «тук»; a metal weight — with a knock of metal in it. */
  | { readonly kind: 'lands'; readonly metal?: boolean };

/** It happened: heard now. */
export function sound(h: Happening): void {
  if (h.kind === 'into-liquid') return plunge((h.size ?? 1) * (h.thick ? 1.4 : 1));
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
