import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import { gearTrain } from '../../domains/mechanics/formulas.js';
import type { LocalizedText, Locale } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import { measured } from '../../scenarios/bench-kit.js';

/**
 * A gear train (grade 7, «зміни швидкості й напряму руху ведучої частини механізму, що містить зубчасту передачу»;
 * «конструювання: … зубчастих передач»): gears of a construction set on pins of a board. Their teeth are counted; the
 * driving gear is turned so many times by its handle, and the turns of the driven one are counted by a chalk mark on
 * it, and which way it went. The physics is the domain's (gearTrain): the turns by the first and the last gear's
 * teeth, the direction by the number of meshes.
 */

/** The set's gears, teeth: a small, a middle and a big one. */
export const GEAR_SET = [8, 24, 40] as const;
/** The driven gear's turns are counted to a quarter (the chalk mark at the top, the side, the bottom). */
const QUARTER = 0.25;

export type GearCommand = { readonly type: 'lab.gears'; readonly step: 'count' } | { readonly type: 'lab.gears'; readonly step: 'turn'; readonly train: readonly number[]; readonly turns: number };

export const gearCommand: CommandHandler<GearCommand> = {
  type: 'lab.gears',
  apply(state, c) {
    if (c.step === 'count') return ok({ state, kind: 'measurement', externalEnergy: 0, trace: GEAR_SET.map((z, k) => measured('eye', 'ratio', z, z, { which: k, teeth: z })) });
    if (!(c.train.length >= 2 && c.train.length <= 4 && c.train.every((z) => (GEAR_SET as readonly number[]).includes(z)))) return err(msg('gear-train-command-apply'));
    if (!(c.turns > 0 && c.turns <= 10)) return err(msg('gear-train-command-apply-2'));
    const out = gearTrain(c.turns, c.train);
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [measured('eye', 'turns', Math.round(out.turns / QUARTER) * QUARTER, out.turns, { driver: c.turns, first: c.train[0]!, last: c.train[c.train.length - 1]!, gears: c.train.length, same: out.sameDirection ? 1 : 0 })] });
  },
};

const turnsText = (n: number, l: Locale) => t(l, 'count-turns', { n });
export const GEAR_TEXT: Record<GearCommand['type'], (c: GearCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.gears': (x) => {
    const c = x as GearCommand;
    if (c.step === 'count')
      return {
        say: msg('gear-train-labgears-say'),
        button: msg('gear-train-labgears-button'),
        plan: msg('gear-train-labgears-plan'),
      };
    const chain = c.train.join(' → ');
    const idler = c.train.length > 2;
    return {
      say: idler
        ? msg('gear-train-labgears-say-2', { chain, train: c.train[0], turns: (l: Locale) => turnsText(c.turns, l) })
        : msg('gear-train-labgears-say-3', { chain, train: c.train[0], turns: (l: Locale) => turnsText(c.turns, l), train2: c.train[1] }),
      button: msg('gear-train-labgears-button-2', { chain, turns: (l: Locale) => turnsText(c.turns, l) }),
      plan: msg('gear-train-labgears-plan-2', { chain, turns: (l: Locale) => turnsText(c.turns, l) }),
    };
  },
};
