/** What the experiment's card (its presets) and its run both use: light — no commands, no board. */
import { sig } from '../../explain/format.js';
import type { Locale } from '../../knowledge/i18n.js';
import { t } from '../../knowledge/messages.js';

export { massText } from '../pulley/shared.js';

/** The magnets to choose from. */
export const TOUCH_MAGNETS = ['ferrite', 'neodymium'] as const;
export type TouchMagnet = (typeof TOUCH_MAGNETS)[number];

/** The gap between the magnet and the ball, in the unit that suits it. */
export const gapText = (gap: number, l: Locale): string => (gap >= 1 ? `${sig(gap, 3, l)} ${t(l, 'unit-sym-m')}` : `${sig(gap * 100, 3, l)} ${t(l, 'unit-sym-cm')}`);
