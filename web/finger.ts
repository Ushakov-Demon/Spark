/**
 * A pointing finger for what is out of sight: the list of experiments when the table is empty, the first step's
 * button when an experiment is chosen, «Пояснити» when it is done. It waits on the screen's edge (or the edge of the
 * phone's panel the target is in), turned to the target's middle; once the target is in sight it is not needed and
 * goes. A tap on it scrolls to the target.
 */
import { glide, glideToTop } from './glide.js';

type Direction = 'left' | 'right' | 'up' | 'down';

const GLYPH: Record<Direction, string> = { left: '👈', right: '👉', up: '👆', down: '👇' };
const SIZE = 48;
const EDGE = 8;
/** A target scrolled to stands this far from the screen's edge. */
const BOTTOM_GAP = 28;
const TOP_GAP = 16;

export interface Finger {
  /** Point at what `find` finds (each frame: the page re-renders); null — put the finger away. */
  point(find: (() => Element | null) | null): void;
}

/** A target taller than a third of the screen: it is its beginning that is pointed at and scrolled to. */
const tallTarget = (e: Element) => e.getBoundingClientRect().height > window.innerHeight / 3;

export function createFinger(): Finger {
  const el = document.createElement('div');
  el.className = 'guide-finger';
  el.setAttribute('aria-hidden', 'true');
  el.hidden = true;
  document.body.append(el);
  let find: (() => Element | null) | null = null;
  // A tap: a short target comes up just over the screen's bottom, so that what is above it stays in sight (one above the
  // screen — to the middle); a tall one, its beginning to the top. On a phone, of the experiment's panel only (the scene stays put).
  el.onclick = () => {
    const target = find?.();
    if (!target) return;
    const tall = tallTarget(target);
    const r = target.getBoundingClientRect();
    const panel = target.closest('.exp-panel-body');
    if (panel) {
      const p = panel.getBoundingClientRect();
      return void glide(panel.scrollTop + (tall ? r.top - p.top - EDGE : r.top + r.height / 2 - (p.top + p.height / 2)), panel);
    }
    if (tall) return void glideToTop(target, TOP_GAP);
    const vh = window.innerHeight;
    void glide(window.scrollY + (r.top < 0 ? r.top + r.height / 2 - vh / 2 : r.bottom - (vh - BOTTOM_GAP)));
  };
  let frame = 0;

  /** The finger at (x, y), pointing at the target's middle (at its beginning, when it is tall): the nearest of the four glyphs, turned by the rest of the angle. */
  const show = (x: number, y: number, r: DOMRect) => {
    el.hidden = false;
    const aimY = r.height > window.innerHeight / 3 ? r.top + EDGE : r.top + r.height / 2;
    const angle = (Math.atan2(aimY - (y + SIZE / 2), r.left + r.width / 2 - (x + SIZE / 2)) * 180) / Math.PI;
    const quarter = Math.round(angle / 90);
    const dir: Direction = (['left', 'up', 'right', 'down', 'left'] as const)[quarter + 2]!;
    if (el.dataset['dir'] !== dir) {
      el.dataset['dir'] = dir;
      el.innerHTML = `<span>${GLYPH[dir]}</span>`;
    }
    el.style.setProperty('--tilt', `${Math.round(angle - quarter * 90)}deg`);
    el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  };

  const place = () => {
    frame = 0;
    const target = find?.();
    const r = target?.getBoundingClientRect();
    if (!find || !target || !r || (r.width === 0 && r.height === 0)) {
      el.hidden = true;
      return;
    }
    // What is seen: the screen, or (on a phone) the experiment's panel the target scrolls in.
    const vw = document.documentElement.clientWidth;
    const box = target.closest('.exp-panel-body')?.getBoundingClientRect();
    const top = Math.max(0, box?.top ?? 0);
    const bottom = Math.min(window.innerHeight, box?.bottom ?? Infinity);
    const clampX = (x: number) => Math.min(vw - SIZE - EDGE, Math.max(EDGE, x));
    const midX = clampX(r.left + r.width / 2 - SIZE / 2);
    // Scrolled away: on the edge, pointing to it; in sight: no finger.
    if (r.bottom < top + EDGE + SIZE / 2) show(midX, top + EDGE, r);
    else if (r.top > bottom - EDGE - SIZE / 2) show(midX, bottom - EDGE - SIZE, r);
    else el.hidden = true;
    frame = requestAnimationFrame(place);
  };

  return {
    point(f) {
      find = f;
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
