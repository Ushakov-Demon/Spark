/** What the experiment's card (its presets) and its run both use: light — no commands, no board. */
import { sig } from '../../explain/format.js';
import { NUMBER_LOCALE, type Locale } from '../../knowledge/i18n.js';
import { t } from '../../knowledge/messages.js';

/** A time: seconds below a minute, minutes from it («3 с», «1,5 хв»), to so many significant figures. */
export const timeText = (s: number, l: Locale, digits = 3): string => (s < 60 ? `${sig(s, digits, l)} ${t(l, 'unit-sym-s')}` : `${sig(s / 60, digits, l)} ${t(l, 'unit-sym-min')}`);
/** A temperature given in °C, as many decimals as asked. */
export const degC = (x: number, l: Locale, decimals = 0): string => `${new Intl.NumberFormat(NUMBER_LOCALE[l], { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(x)} ${t(l, 'unit-sym-degC')}`;
