/** What the experiment's card (its presets) and its run both use: light — no commands, no board. */
import { sig } from '../../explain/format.js';
import type { Locale } from '../../knowledge/i18n.js';
import { t } from '../../knowledge/messages.js';

export const HOUR = 3600;

/** A span of time: seconds, minutes, hours or days, whichever reads best («40 хв», «6 год», «2 доби»). */
export function spanText(s: number, l: Locale): string {
  if (s < 60) return `${sig(s, 3, l)}\u00a0${t(l, 'unit-sym-s')}`;
  if (s < HOUR) return `${sig(s / 60, 3, l)}\u00a0${t(l, 'unit-sym-min')}`;
  if (s < 48 * HOUR) return `${sig(s / HOUR, 3, l)}\u00a0${t(l, 'unit-sym-h')}`;
  return t(l, 'plant-motion-days', { n: Number((s / 86_400).toPrecision(3)) });
}
/** A speed in millimetres a second, three figures. */
export const mmPerS = (v: number, l: Locale): string => `${sig(v * 1000, 3, l)}\u00a0${t(l, 'unit-sym-mm-per-s')}`;
