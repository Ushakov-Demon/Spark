/** What the experiment's card (its presets) and its run both use: light — no commands, no board. */
import { G } from '../../domains/mechanics/constants.js';
import { BENCH_SPRING_L0, BENCH_SPRING_LONGEST } from '../../scenarios/bench-kit.js';

export { massText } from '../pulley/shared.js';

/** How many weights go on the spring, one by one. */
export const STRETCH_WEIGHTS = 4;
/** The heaviest weight, kg, whole grams: all of them together stretch a spring of stiffness k to its longest (k·x = n·m·g). */
export const heaviestWeight = (k: number): number => Math.floor(((k * (BENCH_SPRING_LONGEST.value - BENCH_SPRING_L0)) / (STRETCH_WEIGHTS * G)) * 1000) / 1000;
