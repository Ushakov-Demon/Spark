/**
 * A pointing finger that keeps something in sight: the list of experiments when the table is empty, the first step's
 * button when an experiment is chosen. On the screen it stands beside its target and points at it; scrolled away, it
 * waits on the screen's edge, pointing up or down to where the target is. Where there is no room beside (a phone,
 * the target the whole width wide), it stands above or below it.
 */

/** Where the finger stands by its target when there is room: to its right (pointing left) or to its left (pointing right). */
export type FingerSide = 'right' | 'left';
type Direction = 'left' | 'right' | 'up' | 'down';

const GLYPH: Record<Direction, string> = { left: '👈', right: '👉', up: '👆', down: '👇' };
const SIZE = 48;
const GAP = 6;
const EDGE = 8;

export interface Finger {
  /** Point at what `find` finds (each frame: the page re-renders), from `side`; null — put the finger away. */
  point(find: (() => Element | null) | null, side?: FingerSide): void;
}

export function createFinger(): Finger {
  const el = document.createElement('div');
  el.className = 'guide-finger';
  el.setAttribute('aria-hidden', 'true');
  el.hidden = true;
  document.body.append(el);
  let find: (() => Element | null) | null = null;
  let side: FingerSide = 'right';
  let frame = 0;

  const show = (dir: Direction, x: number, y: number) => {
    el.hidden = false;
    if (el.dataset['dir'] !== dir) {
      el.dataset['dir'] = dir;
      el.innerHTML = `<span>${GLYPH[dir]}</span>`;
    }
    el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  };

  const place = () => {
    frame = 0;
    const target = find?.();
    const r = target?.getBoundingClientRect();
    if (!find || !r || (r.width === 0 && r.height === 0)) {
      el.hidden = true;
      return;
    }
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const clampX = (x: number) => Math.min(vw - SIZE - EDGE, Math.max(EDGE, x));
    const midX = clampX(r.left + r.width / 2 - SIZE / 2);
    // Scrolled away: on the edge, pointing to it.
    if (r.bottom < EDGE + SIZE / 2) show('up', midX, EDGE);
    else if (r.top > vh - EDGE - SIZE / 2) show('down', midX, vh - EDGE - SIZE);
    else {
      // In sight: beside it, at the middle of the part that is on the screen.
      const y = Math.min(vh - SIZE - EDGE, Math.max(EDGE, (Math.max(r.top, 0) + Math.min(r.bottom, vh)) / 2 - SIZE / 2));
      if (side === 'right' && r.right + GAP + SIZE <= vw - EDGE) show('left', r.right + GAP, y);
      else if (side === 'left' && r.left - GAP - SIZE >= EDGE) show('right', r.left - GAP - SIZE, y);
      // No room beside: above it, pointing down (or under it, pointing up, when it is at the very top).
      else if (r.top - GAP - SIZE >= EDGE) show('down', midX, r.top - GAP - SIZE);
      else show('up', midX, Math.min(vh - SIZE - EDGE, r.bottom + GAP));
    }
    frame = requestAnimationFrame(place);
  };

  return {
    point(f, s = 'right') {
      find = f;
      side = s;
      if (!f) {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        el.hidden = true;
        return;
      }
      if (!frame) frame = requestAnimationFrame(place);
    },
  };
}
