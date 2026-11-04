/** What the experiment's card (its presets) and its run both use: light — no commands, no board. */
import { cite, sv } from '../../components/sourced.js';
import type { SourcedValue } from '../../knowledge/types.js';

/** The resistor of the lab work (a wire resistor of the school set), Ω. */
export const LAB_RESISTOR: SourcedValue = sv(5, 'Ω', 'wire resistor of the school set', 'estimate', 0.05, [cite('spark', 'estimate', 'school sets have 1–10 Ω wire resistors', 5)], 'Estimate: its value is what the lab work finds.');

/**
 * The resistors one may take from the set for the resistance and the power lab works, Ω: numbered, not
 * labelled (their value is what the lab work finds). Within the ammeter's 2 A at 4.5 V, and large enough
 * a current at 1.5 V for its 0.05 A divisions.
 */
export const SET_RESISTORS: readonly SourcedValue[] = [
  sv(3, 'Ω', 'wire resistor of the school set', 'estimate', 0.05, [cite('spark', 'estimate', 'school sets have 1–10 Ω wire resistors', 3)], 'Estimate.'),
  LAB_RESISTOR,
  sv(6, 'Ω', 'wire resistor of the school set', 'estimate', 0.05, [cite('spark', 'estimate', 'school sets have 1–10 Ω wire resistors', 6)], 'Estimate.'),
];
