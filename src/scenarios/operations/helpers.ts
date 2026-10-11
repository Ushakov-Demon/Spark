import { ZERO_CELSIUS_IN_KELVIN } from '../../core/units.js';
import { sig } from '../../explain/format.js';
import { tr, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import type { SubstanceItem } from '../../substances/types.js';

/** Small helpers shared by the operation files. */
export const K = (c: number): number => c + ZERO_CELSIUS_IN_KELVIN;
export const both = (f: (l: Locale) => string): LocalizedText => ({ uk: f('uk'), en: f('en') });
export const T = (c: number, l: Locale): string => `${sig(c, 4, l === 'uk' ? 'uk' : 'en')} °C`;
export const lower = (sub: SubstanceItem, l: Locale): string => tr(sub.name, l).toLowerCase();
export const capital = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
/** "вона / він / воно" agreeing with the substance name. */
export const pronounUk = (sub: SubstanceItem): string => ({ f: 'вона', m: 'він', n: 'воно' })[sub.gender];
