import { ZERO_CELSIUS_IN_KELVIN } from '../../core/units.js';
import { sig } from '../../explain/format.js';
import { tr, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import { localized } from '../../knowledge/messages.js';
import type { SubstanceItem } from '../../substances/types.js';

/** Small helpers shared by the operation files. */
export const K = (c: number): number => c + ZERO_CELSIUS_IN_KELVIN;
export const both = (f: (l: Locale) => string): LocalizedText => localized((l: Locale) => f(l));
export const T = (c: number, l: Locale): string => `${sig(c, 4, l)} °C`;
export const lower = (sub: SubstanceItem, l: Locale): string => tr(sub.name, l).toLowerCase();
export const capital = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
