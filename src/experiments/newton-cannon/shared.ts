/** What the experiment's card (its presets) and its run both use: light — no commands, no board. */
import { sig } from '../../explain/format.js';
import type { Locale } from '../../knowledge/i18n.js';
import { t } from '../../knowledge/messages.js';

/** A speed: metres a second below a kilometre a second, kilometres a second from it. */
export const speedText = (v: number, l: Locale): string => (v < 1000 ? `${sig(v, 3, l)} ${t(l, 'unit-sym-m-per-s')}` : `${sig(v / 1000, 3, l)} ${t(l, 'unit-sym-km-per-s')}`);
/** A distance: metres below a kilometre, kilometres from it. */
export const kmText = (m: number, l: Locale): string => (m < 1000 ? `${sig(m, 3, l)} ${t(l, 'unit-sym-m')}` : `${sig(m / 1000, 3, l)} ${t(l, 'unit-sym-km')}`);

/** An angle to the horizon («30°»). */
export const degText = (d: number, l: Locale): string => `${sig(d, 3, l)}${t(l, 'unit-sym-deg')}`;
