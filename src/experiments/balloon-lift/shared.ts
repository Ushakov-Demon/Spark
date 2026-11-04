/** What the experiment's card (its presets) and its run both use: light — no commands, no board. */
import { NUMBER_LOCALE, type Locale } from '../../knowledge/i18n.js';
import { t } from '../../knowledge/messages.js';

const num = (x: number, l: Locale) => new Intl.NumberFormat(NUMBER_LOCALE[l], { maximumFractionDigits: 2 }).format(x);
export const sizeText = (m: number, l: Locale): string => (m < 1 ? `${num(m * 100, l)} ${t(l, 'unit-sym-cm')}` : `${num(m, l)} ${t(l, 'unit-sym-m')}`);
export const massText = (kg: number, l: Locale): string => (kg < 1 ? `${num(kg * 1000, l)} ${t(l, 'unit-sym-g')}` : kg < 1000 ? `${num(kg, l)} ${t(l, 'unit-sym-kg')}` : `${num(kg / 1000, l)} ${t(l, 'unit-sym-t')}`);
