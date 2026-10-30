import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import { gearTrain } from '../../domains/mechanics/formulas.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
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
    if (!(c.train.length >= 2 && c.train.length <= 4 && c.train.every((z) => (GEAR_SET as readonly number[]).includes(z)))) return err({ uk: 'Передачу складають із 2–4 шестірень набору (8, 24, 40 зубців).', en: 'A train is made of 2–4 gears of the set (8, 24, 40 teeth).' });
    if (!(c.turns > 0 && c.turns <= 10)) return err({ uk: 'Ручку повертають від частки оберту до 10 обертів.', en: 'The handle is turned from a part of a turn to 10 turns.' });
    const out = gearTrain(c.turns, c.train);
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [measured('eye', 'turns', Math.round(out.turns / QUARTER) * QUARTER, out.turns, { driver: c.turns, first: c.train[0]!, last: c.train[c.train.length - 1]!, gears: c.train.length, same: out.sameDirection ? 1 : 0 })] });
  },
};

const turnsText = (n: number, uk: boolean) => (uk ? `${String(n).replace('.', ',')} ${n === 1 ? 'оберт' : n > 1 && n < 5 && Number.isInteger(n) ? 'оберти' : 'обертів'}` : `${n} turn${n === 1 ? '' : 's'}`);
export const GEAR_TEXT: Record<GearCommand['type'], (c: GearCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.gears': (x) => {
    const c = x as GearCommand;
    if (c.step === 'count')
      return {
        say: { uk: 'Порахуй зубці на трьох шестірнях набору.', en: 'Count the teeth on the set’s three gears.' },
        button: { uk: '⚙ Порахувати зубці', en: '⚙ Count the teeth' },
        plan: { uk: 'порахувати зубці шестірень', en: 'count the gears’ teeth' },
      };
    const chain = c.train.join(' → ');
    const idler = c.train.length > 2;
    return {
      say: idler
        ? { uk: `А тепер поставимо між ними ще одну шестірню: ${chain}. Поверни ведучу (${c.train[0]} зубців) на ${turnsText(c.turns, true)}. Скільки обертів зробить остання — і в який бік?`, en: `Now put one more gear between them: ${chain}. Turn the driver (${c.train[0]} teeth) ${turnsText(c.turns, false)}. How many turns will the last one make — and which way?` }
        : { uk: `Зчепи шестірні ${chain}. Поверни ведучу (${c.train[0]} зубців) на ${turnsText(c.turns, true)} і порахуй за крейдяною рискою оберти веденої (${c.train[1]}). У який бік вона крутиться?`, en: `Mesh the gears ${chain}. Turn the driver (${c.train[0]} teeth) ${turnsText(c.turns, false)} and count the driven one’s (${c.train[1]}) turns by its chalk mark. Which way does it turn?` },
      button: { uk: `⚙ ${chain}: ведучу на ${turnsText(c.turns, true)}`, en: `⚙ ${chain}: the driver ${turnsText(c.turns, false)}` },
      plan: { uk: `${chain}: повернути ведучу на ${turnsText(c.turns, true)}`, en: `${chain}: turn the driver ${turnsText(c.turns, false)}` },
    };
  },
};
