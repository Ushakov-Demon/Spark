/** What the experiment's card (its presets) and its run both use: light — no commands, no board. */
import type { LocalizedText } from '../../knowledge/i18n.js';
import { COMPONENTS } from '../../components/index.js';
import { form } from '../../knowledge/messages.js';

/** A mass in the unit that suits it (grams, kilograms, tonnes) — as the pulley's. */
export { massText } from '../pulley/shared.js';

/** What hangs on the hook: slotted weights (or a crate, a small weight — by the mass), or a block of a substance from the shelf. */
export const MG_BLOCKS = ['wood', 'aluminium', 'brick', 'glass'] as const;
export type MgBlock = (typeof MG_BLOCKS)[number];
export type MgBody = 'weights' | MgBlock;

/** The block's substance: its name («Деревина»), and as a block is said to be of it («деревини»). */
export const blockName = (b: MgBlock): LocalizedText => COMPONENTS[b].name;
export const blockOf = (b: MgBlock): LocalizedText => form(COMPONENTS[b].name, 'genitive');
