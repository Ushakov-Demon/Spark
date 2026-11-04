/** What the experiment's card (its presets) and its run both use: light — no commands, no board. */
import { blockMass } from '../../scenarios/bench-kit.js';

/** Weights on the block (two of 100 g by default): the dynamometer reads more of a newton, and less of the error. */
export const SLOPE_WEIGHTS = 2;
const SLOPE_WEIGHT = 0.1;
/** The block and its weights, kg. */
export const slopeLoad = (weights = SLOPE_WEIGHTS): number => blockMass() + weights * SLOPE_WEIGHT;
