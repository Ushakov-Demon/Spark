/** What the experiment's card (its presets) and its run both use: light — no commands, no board. */
import { cite, sv } from '../../components/sourced.js';
import type { SourcedValue } from '../../knowledge/types.js';

/**
 * How animals move (grade 7): a garden snail (Cornu aspersum) crawls beside a ruler and is filmed for 30 s, as in
 * Pembury Smith & Ruxton (2021). Waves of muscle run along its foot over a thin layer of mucus and push it on. The
 * surface matters: across a horizontal plastic sheet it is quickest, up a vertical one a little slower, on wet
 * plastic slower still, and on rough sandpaper slowest of all. The distances are the study's mean speeds.
 */

export type SnailSurface = 'flat' | 'wall' | 'wet' | 'sandpaper';

const STUDY = 'pembury-smith-2021-snail';
/** The distance crawled in 30 s, m: the study's means (cm per 30 s; the others as differences from the horizontal one). */
export const SNAIL_PATH: Readonly<Record<SnailSurface, SourcedValue>> = {
  flat: sv(0.0447, 'm', 'a garden snail on horizontal plastic, in 30 s', 'single-source', 0.0012, [cite(STUDY, 'Horizontal PVC 4.47 ± 0.12 cm/30 s', '—', 0.0447)], 'The mean of 87 snails.'),
  wall: sv(0.0406, 'm', 'up vertical plastic, in 30 s', 'single-source', 0.0013, [cite(STUDY, 'Vertical PVC −0.41 ± 0.13 cm/30 s from the horizontal', '—', 0.0406)], 'The mean, 4.47 − 0.41.'),
  wet: sv(0.0382, 'm', 'on wet plastic, in 30 s', 'single-source', 0.0013, [cite(STUDY, 'Wet PVC −0.65 ± 0.13 cm/30 s from the horizontal', '—', 0.0382)], 'The mean, 4.47 − 0.65.'),
  sandpaper: sv(0.0246, 'm', 'on sandpaper P120, in 30 s', 'single-source', 0.0013, [cite(STUDY, 'Sandpaper P120 −2.01 ± 0.13 cm/30 s from the horizontal', '—', 0.0246)], 'The mean, 4.47 − 2.01.'),
};
/** The snail is filmed this long. */
export const SNAIL_TIME = 30;
