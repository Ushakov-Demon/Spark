import { moving } from './prefs.js';

/**
 * The page's own scroll: it sets off slowly, gathers speed, and slows down to a stop — where a browser's smooth scroll
 * starts at full speed. Longer ways take longer, within limits. A hand on the wheel or the screen takes over at once.
 */
const SHORTEST = 550;
const LONGEST = 1200;
const MS_PER_PX = 0.9;
const speedUpAndDown = (t: number): number => (t < 0.5 ? 4 * t ** 3 : 1 - (2 - 2 * t) ** 3 / 2);

let stop: (() => void) | null = null;

/** Scroll the page (or a panel that scrolls itself) to `to`, px from its top; resolved once it is there or was stopped. */
export function glide(to: number, panel?: Element): Promise<void> {
  stop?.();
  const now = () => (panel ? panel.scrollTop : window.scrollY);
  const set = (y: number) => (panel ? (panel.scrollTop = y) : window.scrollTo({ top: y, behavior: 'instant' }));
  const from = now();
  const way = to - from;
  if (Math.abs(way) < 2 || !moving()) {
    set(to);
    return Promise.resolve();
  }
  const time = Math.min(LONGEST, Math.max(SHORTEST, Math.abs(way) * MS_PER_PX));
  return new Promise((done) => {
    const start = performance.now();
    let frame = 0;
    const end = () => {
      cancelAnimationFrame(frame);
      for (const ev of ['wheel', 'touchstart']) window.removeEventListener(ev, end);
      stop = null;
      done();
    };
    stop = end;
    for (const ev of ['wheel', 'touchstart']) window.addEventListener(ev, end, { passive: true });
    const step = (at: number) => {
      const t = Math.min(1, (at - start) / time);
      set(from + way * speedUpAndDown(t));
      if (t < 1) frame = requestAnimationFrame(step);
      else end();
    };
    frame = requestAnimationFrame(step);
  });
}

/** The page glides to an element's top, `gap` px under the screen's top. */
export const glideToTop = (e: Element, gap = 0): Promise<void> => glide(Math.max(0, e.getBoundingClientRect().top + window.scrollY - gap));
