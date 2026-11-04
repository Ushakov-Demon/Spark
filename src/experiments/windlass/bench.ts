import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import type { Locale, LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';

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
      if (!(c.amount > 0 && c.amount <= 0.5)) return err(msg('windlass-winch-command-apply'));
      const n = c.amount / (Math.PI * d);
      const record: MeasurementRecord = { kind: 'measurement', instrument: 'eye', quantity: 'turns', value: Math.round(n / WINCH_TURN_DIVISION) * WINCH_TURN_DIVISION, exact: n, entities: [], inputs: { diameter: d, length: c.amount, division: WINCH_TURN_DIVISION } };
      return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [record] });
    }
    if (!(c.amount > 0 && c.amount <= 20)) return err(msg('windlass-winch-command-apply-2'));
    const l = Math.PI * d * c.amount;
    const record: MeasurementRecord = { kind: 'measurement', instrument: 'ruler', quantity: 'length', value: Math.round(l / WINCH_DIVISION) * WINCH_DIVISION, exact: l, entities: [], inputs: { diameter: d, turns: c.amount, division: WINCH_DIVISION } };
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [record] });
  },
};

export const WINCH_COMMANDS = [winchCommand] as const;

const SPOOL: Record<WinchSpool, { uk: string; en: string }> = {
  reel: msg('windlass-spool-reel'),
  pencil: msg('windlass-spool-pencil'),
};
export const winchSpoolName = (s: WinchSpool) => SPOOL[s];

export const WINCH_TEXT: Record<WinchCommand['type'], (c: WinchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.winch': (x) => {
    const c = x as WinchCommand;
    const sp = SPOOL[c.spool];
    if (c.mode === 'lower') {
      const cm = Math.round(c.amount * 100);
      return {
        say: msg('windlass-labwinch-say', { sp: (l: Locale) => sp[l], cm: String(cm) }),
        button: msg('windlass-labwinch-button', { cm: String(cm), value: (l: Locale) => c.spool === 'reel' ? t(l, 'windlass-button-uk') : t(l, 'windlass-button-uk-2') }),
        plan: msg('windlass-labwinch-plan', { sp: (l: Locale) => sp[l], cm: String(cm) }),
      };
    }
    return {
      say: msg('windlass-labwinch-say-2', { sp: (l: Locale) => sp[l], amount: String(c.amount) }),
      button: msg('windlass-labwinch-button-2', { amount: String(c.amount), value: (l: Locale) => c.spool === 'reel' ? t(l, 'windlass-button-uk') : t(l, 'windlass-button-uk-2') }),
      plan: msg('windlass-labwinch-plan-2', { sp: (l: Locale) => sp[l], amount: String(c.amount) }),
    };
  },
};
