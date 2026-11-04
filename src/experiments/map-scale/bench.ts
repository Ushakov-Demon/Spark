import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import { EARTH_MEAN_RADIUS } from '../../domains/mechanics/constants.js';
import { greatCircleDistance } from '../../domains/mechanics/formulas.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg } from '../../knowledge/messages.js';
import { measured, ruler, RULER_DIVISION } from '../../scenarios/bench-kit.js';
import { parsePlace } from '../../scenarios/place.js';
import { scaleText } from './shared.js';
export { PLACE_LVIV, PLACE_BOSTON, scaleText } from './shared.js';

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
const name = (v: string) => parsePlace(v)?.name ?? '?';

export const MAP_TEXT: Record<MapCommand['type'], (c: MapCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.map': (x) => {
    const c = x as MapCommand;
    const args = { scale: (l: Locale) => scaleText(c.scale, l), from: name(c.from), to: name(c.to) };
    return { say: msg('map-scale-step-say', args), button: msg('map-scale-step-button', args), plan: msg('map-scale-step-plan', args) };
  },
};
