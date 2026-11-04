import type { CommandHandler } from '../../core/commands.js';
import { ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { cite, sv } from '../../components/sourced.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg } from '../../knowledge/messages.js';
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
/** The ruler beside it: millimetres. */
export const SNAIL_DIVISION = 0.001;

/** Film the snail crawling on this surface for 30 s; read the distance by the ruler. */
export interface SnailCommand {
  readonly type: 'lab.snail';
  readonly surface: SnailSurface;
}

export const snailCommand: CommandHandler<SnailCommand> = {
  type: 'lab.snail',
  apply(state, c) {
    const l = SNAIL_PATH[c.surface].value;
    const record: MeasurementRecord = { kind: 'measurement', instrument: 'ruler', quantity: 'length', value: Math.round(l / SNAIL_DIVISION) * SNAIL_DIVISION, exact: l, entities: [], inputs: { time: SNAIL_TIME, division: SNAIL_DIVISION } };
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [record] });
  },
};

export const SNAIL_COMMANDS = [snailCommand] as const;

const SURFACE: Record<SnailSurface, { name: LocalizedText; icon: string; say: LocalizedText }> = {
  flat: { name: msg('snail-speed-flat-name'), icon: '➡', say: msg('snail-speed-flat-say') },
  wall: { name: msg('snail-speed-wall-name'), icon: '⬆', say: msg('snail-speed-wall-say') },
  wet: { name: msg('snail-speed-wet-name'), icon: '💧', say: msg('snail-speed-wet-say') },
  sandpaper: { name: msg('snail-speed-sandpaper-name'), icon: '🟫', say: msg('snail-speed-sandpaper-say') },
};
export const snailSurfaceName = (s: SnailSurface) => SURFACE[s].name;

export const SNAIL_TEXT: Record<SnailCommand['type'], (c: SnailCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.snail': (x) => {
    const c = x as SnailCommand;
    const s = SURFACE[c.surface];
    return { say: s.say, button: msg('snail-speed-labsnail-button', { icon: s.icon, name: (l: Locale) => s.name[l] }), plan: msg('snail-speed-labsnail-plan', { name: (l: Locale) => s.name[l] }) };
  },
};
