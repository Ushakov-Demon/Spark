/** What the experiment's card (its presets) and its run both use: light — no commands, no board. */
import { NUMBER_LOCALE, type Locale } from '../../knowledge/i18n.js';
import { t } from '../../knowledge/messages.js';

const num = (x: number, l: Locale, d = 1) => new Intl.NumberFormat(NUMBER_LOCALE[l], { maximumFractionDigits: d }).format(x);
/** A size: centimetres below a metre, metres beyond. */
export const sizeText = (m: number, l: Locale): string => (m < 1 ? `${num(m * 100, l)} ${t(l, 'unit-sym-cm')}` : `${num(m, l, 2)} ${t(l, 'unit-sym-m')}`);
/** A peel's thickness: millimetres (centimetres from 2 cm). */
export const mmText = (m: number, l: Locale): string => (m < 0.02 ? `${num(m * 1000, l)} ${t(l, 'unit-sym-mm')}` : sizeText(m, l));
/** Salt to a litre of water: grams (kilograms from one). */
export const saltText = (kg: number, l: Locale): string => (kg < 1 ? `${num(kg * 1000, l, 0)} ${t(l, 'unit-sym-g')}` : `${num(kg, l, 2)} ${t(l, 'unit-sym-kg')}`);
