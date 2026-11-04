import type { CommandHandler } from '../../core/commands.js';
import { ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg } from '../../knowledge/messages.js';
import { type SnailSurface, SNAIL_PATH, SNAIL_TIME } from './shared.js';
export { type SnailSurface, SNAIL_PATH, SNAIL_TIME } from './shared.js';

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
