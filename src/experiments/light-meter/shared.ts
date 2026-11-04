/** What the experiment's card (its presets) and its run both use: light — no commands, no board. */
import { sig } from '../../explain/format.js';
import type { Locale } from '../../knowledge/i18n.js';
import { t } from '../../knowledge/messages.js';
import { luminousFlux } from '../../domains/optics/formulas.js';
import { lampEfficacy, type LampKind } from '../../equipment/lamps.js';

/** The lamp's luminous flux, lm. */
export const lampFlux = (lamp: LampKind, power: number): number => luminousFlux(lampEfficacy(lamp, power), power);

export const fluxText = (lm: number, l: Locale): string => `${sig(lm, 3, l)}\u00a0${t(l, 'unit-sym-lm')}`;
export const wattText = (w: number, l: Locale): string => `${sig(w, 3, l)}\u00a0${t(l, 'unit-sym-W')}`;
export const degText = (d: number, l: Locale): string => `${sig(d, 3, l)}${t(l, 'unit-sym-deg')}`;
