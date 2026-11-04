/** What the experiment's card (its presets) and its run both use: light — no commands, no board. */
import { NUMBER_LOCALE, type Locale } from '../../knowledge/i18n.js';
import { t } from '../../knowledge/messages.js';

/** A number as the pupil put it in: up to a tenth, without trailing zeros. */
const num = (x: number, l: Locale) => new Intl.NumberFormat(NUMBER_LOCALE[l], { maximumFractionDigits: 1 }).format(x);
/** A mass in the unit that suits it: grams, kilograms, tonnes. */
export const massText = (kg: number, l: Locale): string => (kg < 1 ? `${num(kg * 1000, l)} ${t(l, 'unit-sym-g')}` : kg < 1000 ? `${num(kg, l)} ${t(l, 'unit-sym-kg')}` : `${num(kg / 1000, l)} ${t(l, 'unit-sym-t')}`);
/** A height in centimetres or metres. */
export const heightText = (m: number, l: Locale): string => (m < 1 ? `${num(m * 100, l)} ${t(l, 'unit-sym-cm')}` : `${num(m, l)} ${t(l, 'unit-sym-m')}`);
