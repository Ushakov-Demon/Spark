/**
 * The user's own settings, kept in this browser (localStorage: they never leave it, unlike a cookie, which goes to
 * the server with every request). Optional: in a private window nothing is kept, and the lab works as it is.
 */
export const store = {
  get: (k: string): string | null => {
    try {
      return localStorage.getItem(`spark.${k}`);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string): void => {
    try {
      localStorage.setItem(`spark.${k}`, v);
    } catch {
      /* private mode etc. — preferences are optional */
    }
  },
};

/** What the browser keeps that is the user's own work, not a setting: kept when the settings go back to their defaults. */
const NOT_SETTINGS = ['recordings', 'console-history'];
/** Every setting back to its default (the page is loaded again to show it); recordings and the console's history stay. */
export function resetSettings(): void {
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith('spark.') && !NOT_SETTINGS.includes(k.slice('spark.'.length))) localStorage.removeItem(k);
  } catch {
    /* nothing was kept */
  }
}

/** A setting that is on unless turned off: the newspaper coming by itself, the speaker on the scene, the motion, the music. */
export type Switch = 'news' | 'speaker' | 'motion' | 'music';
export const isOn = (k: Switch): boolean => store.get(k) !== 'off';
export function setOn(k: Switch, on: boolean): void {
  store.set(k, on ? 'on' : 'off');
  if (k === 'motion') document.documentElement.classList.toggle('no-motion', !moving());
  if (k === 'speaker') document.documentElement.classList.toggle('no-speaker', !on);
}

/** Things move on the screen: not when turned off here, nor when the system asks for less motion. */
export const moving = (): boolean => isOn('motion') && !matchMedia('(prefers-reduced-motion: reduce)').matches;
/** Turned off here (not by the system): the experiment also runs through on its own, its result at once. */
export const instant = (): boolean => !isOn('motion');

// The page's classes as the settings left them.
document.documentElement.classList.toggle('no-motion', !moving());
document.documentElement.classList.toggle('no-speaker', !isOn('speaker'));
