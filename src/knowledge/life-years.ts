import type { Locale } from './i18n.js';
import { t } from './messages.js';

/** Life years for "Archimedes (c. 287–212 BC)": negative years are before the common era. */
export function lifeYears(born: number, died: number, locale: Locale): string {
  if (born >= 0) return `${born}–${died}`;
  return t(locale, died < 0 ? 'life-years-bc' : 'life-years-born-bc', { born: String(-born), died: String(Math.abs(died)) });
}
