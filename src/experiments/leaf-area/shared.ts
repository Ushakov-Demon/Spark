/** What the experiment's card (its presets) and its run both use: light — no commands, no board. */
import { sig } from '../../explain/format.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { t, msg } from '../../knowledge/messages.js';

/**
 * A leaf's area (grade 7, introduction: «вимірювання фізичних величин (… площ …)»): a card is measured with a ruler
 * (S = a·b), a leaf of any length and form — with a palette, a transparent sheet ruled in squares of any size: the
 * whole squares and half the cut ones (the domain's palette area). The leaf's outline is the drawing's own, so its
 * exact area is known to check the palettes against. Here — only the card, the leaf and the palettes.
 */

/** The leaf's forms (botany's names for a blade's outline): how wide for its length, and where it is widest. */
export const LEAF_FORMS = {
  /** Ovate: widest below the middle. */
  ovate: { width: 0.62, a: 0.76, b: 0.9 },
  /** Lanceolate: long and narrow, widest at the middle. */
  lanceolate: { width: 0.22, a: 1, b: 1 },
  /** Orbicular: almost round. */
  orbicular: { width: 0.9, a: 1, b: 0.55 },
} as const;
export type LeafForm = keyof typeof LEAF_FORMS;

/** The leaf's form in words: «яйцеподібний». */
export const formName = (f: LeafForm): LocalizedText => msg(`leaf-area-form-${f}`);

/** A square's side: in millimetres below a centimetre, in centimetres from it («5 мм», «1 см»). */
export const sideText = (side: number, l: Locale): string => (side < 0.01 ? `${sig(side * 1000, 3, l)} ${t(l, 'unit-sym-mm')}` : `${sig(side * 100, 3, l)} ${t(l, 'unit-sym-cm')}`);
