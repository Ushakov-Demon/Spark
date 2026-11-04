/** What the experiment's card (its presets) and its run both use: light — no commands, no board. */
import { NUMBER_LOCALE, type Locale } from '../../knowledge/i18n.js';

/**
 * Distances on maps (grade 7, «вимірювання: … відстаней на планах і картах»): two towns (any, the pupil's) on two maps
 * of different scales (any); a ruler measures the distance between the towns' dots on each, to a millimetre. On the
 * ground it is the shortest way over the Earth (the domain's great-circle distance on its mean radius) — the map shows
 * it N times smaller (the map's distortions left out). Here — only the maps and the ruler.
 */

/** Lviv (Wikipedia) — the other town by default; Boston for the English. */
export const PLACE_LVIV = 'Львів|49.8425|24.0322';
export const PLACE_BOSTON = 'Boston|42.3603|-71.0578';

/** 1 : 2 000 000, with the digits grouped. */
export const scaleText = (n: number, l: Locale): string => `1 : ${new Intl.NumberFormat(NUMBER_LOCALE[l], { maximumFractionDigits: 0 }).format(n)}`;
