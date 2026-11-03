import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import { EARTH_MEAN_RADIUS } from '../../domains/mechanics/constants.js';
import { greatCircleDistance } from '../../domains/mechanics/formulas.js';
import { NUMBER_LOCALE, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import { msg } from '../../knowledge/messages.js';
import { measured, ruler, RULER_DIVISION } from '../../scenarios/bench-kit.js';
import { parsePlace } from '../../scenarios/place.js';

/**
 * Distances on maps (grade 7, «вимірювання: … відстаней на планах і картах»): two towns (any, the pupil's) on two maps
 * of different scales (any); a ruler measures the distance between the towns' dots on each, to a millimetre. On the
 * ground it is the shortest way over the Earth (the domain's great-circle distance on its mean radius) — the map shows
 * it N times smaller (the map's distortions left out). Here — only the maps and the ruler.
 */

/** Lviv (Wikipedia) — the other town by default; Boston for the English. */
export const PLACE_LVIV = 'Львів|49.8425|24.0322';
export const PLACE_BOSTON = 'Boston|42.3603|-71.0578';

export type MapCommand = { readonly type: 'lab.map'; readonly from: string; readonly to: string; readonly scale: number };

export const mapCommand: CommandHandler<MapCommand> = {
  type: 'lab.map',
  apply(state, c) {
    const a = parsePlace(c.from);
    const b = parsePlace(c.to);
    if (!a || !b) return err(msg('map-scale-no-towns'));
    if (!(c.scale >= 1)) return err(msg('map-scale-bad-scale'));
    const ground = greatCircleDistance(a.lat, a.lon, b.lat, b.lon, EARTH_MEAN_RADIUS.value);
    if (ground < 1) return err(msg('map-scale-same-place'));
    const onMap = ground / c.scale;
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [measured('ruler', 'length', ruler(onMap), onMap, { scale: c.scale, ground, division: RULER_DIVISION })] });
  },
};

/** 1 : 2 000 000, with the digits grouped. */
export const scaleText = (n: number, l: Locale): string => `1 : ${new Intl.NumberFormat(NUMBER_LOCALE[l], { maximumFractionDigits: 0 }).format(n)}`;
const name = (v: string) => parsePlace(v)?.name ?? '?';

export const MAP_TEXT: Record<MapCommand['type'], (c: MapCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.map': (x) => {
    const c = x as MapCommand;
    const args = { scale: (l: Locale) => scaleText(c.scale, l), from: name(c.from), to: name(c.to) };
    return { say: msg('map-scale-step-say', args), button: msg('map-scale-step-button', args), plan: msg('map-scale-step-plan', args) };
  },
};
