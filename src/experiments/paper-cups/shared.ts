/** What the experiment's card (its presets) and its run both use: light — no commands, no board. */
import { NUMBER_LOCALE, type Locale } from '../../knowledge/i18n.js';
import { t } from '../../knowledge/messages.js';

/** A person's mass: kilograms (tonnes from a thousand). */
export const massText = (kg: number, l: Locale): string => (kg < 1000 ? `${new Intl.NumberFormat(NUMBER_LOCALE[l], { maximumFractionDigits: 1 }).format(kg)} ${t(l, 'unit-sym-kg')}` : `${new Intl.NumberFormat(NUMBER_LOCALE[l], { maximumFractionDigits: 2 }).format(kg / 1000)} ${t(l, 'unit-sym-t')}`);
