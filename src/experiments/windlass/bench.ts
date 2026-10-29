import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import type { LocalizedText } from '../../knowledge/i18n.js';

/**
 * A mechanism turning straight motion into turning and back (grade 7, construction): a well's windlass made on a
 * stand — a spool on an axis with a handle, a thread wound on it, a small load on the thread. Let down, the load
 * unwinds the thread and turns the spool; turned by the handle, the spool winds the thread and lifts the load. Each
 * turn moves the thread by the spool's circumference: l = π·d·n. The thread's own thickness is left out.
 */

/** The spools the pupils make it from, measured across by a ruler: a cotton reel's barrel, a pencil. */
export const WINCH_SPOOLS: Readonly<Record<WinchSpool, number>> = { reel: 0.02, pencil: 0.008 };
export type WinchSpool = 'reel' | 'pencil';
/** The turns are counted by a mark on the spool — to a quarter of a turn. */
export const WINCH_TURN_DIVISION = 0.25;
/** The ruler along the thread: millimetres. */
export const WINCH_DIVISION = 0.001;

/** Let the load down by `amount` metres (count the turns), or turn the handle `amount` times (measure the lift). */
export interface WinchCommand {
  readonly type: 'lab.winch';
  readonly spool: WinchSpool;
  readonly mode: 'lower' | 'turn';
  readonly amount: number;
}

export const winchCommand: CommandHandler<WinchCommand> = {
  type: 'lab.winch',
  apply(state, c) {
    const d = WINCH_SPOOLS[c.spool];
    if (c.mode === 'lower') {
      if (!(c.amount > 0 && c.amount <= 0.5)) return err({ uk: 'Вантаж опускаємо до 50 см.', en: 'The load goes down up to 50 cm.' });
      const n = c.amount / (Math.PI * d);
      const record: MeasurementRecord = { kind: 'measurement', instrument: 'eye', quantity: 'turns', value: Math.round(n / WINCH_TURN_DIVISION) * WINCH_TURN_DIVISION, exact: n, entities: [], inputs: { diameter: d, length: c.amount, division: WINCH_TURN_DIVISION } };
      return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [record] });
    }
    if (!(c.amount > 0 && c.amount <= 20)) return err({ uk: 'Ручку повертаємо до 20 разів.', en: 'Turn the handle up to 20 times.' });
    const l = Math.PI * d * c.amount;
    const record: MeasurementRecord = { kind: 'measurement', instrument: 'ruler', quantity: 'length', value: Math.round(l / WINCH_DIVISION) * WINCH_DIVISION, exact: l, entities: [], inputs: { diameter: d, turns: c.amount, division: WINCH_DIVISION } };
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [record] });
  },
};

export const WINCH_COMMANDS = [winchCommand] as const;

const SPOOL: Record<WinchSpool, { uk: string; en: string }> = {
  reel: { uk: 'котушка від ниток (d = 2 см)', en: 'the cotton reel (d = 2 cm)' },
  pencil: { uk: 'олівець (d = 8 мм)', en: 'the pencil (d = 8 mm)' },
};
export const winchSpoolName = (s: WinchSpool) => SPOOL[s];

export const WINCH_TEXT: Record<WinchCommand['type'], (c: WinchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.winch': (x) => {
    const c = x as WinchCommand;
    const sp = SPOOL[c.spool];
    if (c.mode === 'lower') {
      const cm = Math.round(c.amount * 100);
      return {
        say: { uk: `Нитка намотана на ${sp.uk}. Опусти вантаж на ${cm} см і порахуй оберти за міткою на котушці.`, en: `The thread is wound on ${sp.en}. Let the load down by ${cm} cm and count the turns by the mark on the spool.` },
        button: { uk: `⬇ Опустити на ${cm} см: ${c.spool === 'reel' ? 'котушка' : 'олівець'}`, en: `⬇ Let down ${cm} cm: ${c.spool === 'reel' ? 'the reel' : 'the pencil'}` },
        plan: { uk: `${sp.uk}: опустити вантаж на ${cm} см`, en: `${sp.en}: let the load down ${cm} cm` },
      };
    }
    return {
      say: { uk: `А тепер навпаки: поверни ручку — ${sp.uk} — ${c.amount} разів і виміряй лінійкою, на скільки піднявся вантаж.`, en: `And now the other way: turn the handle — ${sp.en} — ${c.amount} times and measure by the ruler how far the load rose.` },
      button: { uk: `🔄 ${c.amount} обертів ручки: ${c.spool === 'reel' ? 'котушка' : 'олівець'}`, en: `🔄 ${c.amount} turns of the handle: ${c.spool === 'reel' ? 'the reel' : 'the pencil'}` },
      plan: { uk: `${sp.uk}: ${c.amount} обертів ручки`, en: `${sp.en}: ${c.amount} turns of the handle` },
    };
  },
};
