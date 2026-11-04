import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import type { LocalizedText, Locale } from '../../knowledge/i18n.js';
import { msg, t as tl } from '../../knowledge/messages.js';
import { STOPWATCH_DIVISION } from '../motion-lab-works/bench.js';
import { sinkSpeed } from '../bodies-in-liquids/bench.js';

/**
 * The relativity of motion, modelled (grade 7): the bubble in the bottle of washing-up liquid rises 9 cm, while the
 * bottle is carried steadily along a ruler on the table. A sheet of paper stands behind the bottle, fixed to the
 * table: the bubble's place is marked on it at the zero mark and at the 9 cm one, and the line between is measured.
 * In the bottle's frame the bubble goes up the same 9 cm each time; in the table's frame its path is a slanted
 * straight line, the longer the faster the bottle goes: s = √(h² + (u·t)²). The time of the rise does not change.
 */

/** The bubble: ≈ 4 mm across, in the textbook's washing-up liquid. */
export const CARRY_BUBBLE = 0.004;
/** It is watched from the zero mark to this one, m. */
export const CARRY_RISE = 0.09;
/** The paper and the table's ruler: millimetre divisions. */
export const CARRY_DIVISION = 0.001;

/** Let the bubble rise while the bottle is carried along the table at `speed`, m/s (0 — it stands). */
export interface CarryCommand {
  readonly type: 'lab.carry';
  readonly speed: number;
}

export const carryCommand: CommandHandler<CarryCommand> = {
  type: 'lab.carry',
  apply(state, c) {
    if (!(c.speed >= 0 && c.speed <= 0.02)) return err(msg('relative-motion-carry-command-apply'));
    const { speed: v } = sinkSpeed('bubble', CARRY_BUBBLE, 'washing-up');
    const t = CARRY_RISE / v;
    const shift = c.speed * t;
    const path = Math.hypot(CARRY_RISE, shift);
    const div = STOPWATCH_DIVISION.value;
    const mm = (x: number) => Math.round(x / CARRY_DIVISION) * CARRY_DIVISION;
    const inputs = { carry: c.speed, rise: CARRY_RISE, bubble: v, division: CARRY_DIVISION };
    const trace: MeasurementRecord[] = [
      { kind: 'measurement', instrument: 'stopwatch', quantity: 'time', value: Math.round(t / div) * div, exact: t, entities: [], inputs: { ...inputs, which: 0, division: div } },
      { kind: 'measurement', instrument: 'ruler', quantity: 'length', value: mm(shift), exact: shift, entities: [], inputs: { ...inputs, which: 1 } },
      { kind: 'measurement', instrument: 'ruler', quantity: 'length', value: mm(path), exact: path, entities: [], inputs: { ...inputs, which: 2 } },
    ];
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace });
  },
};

export const CARRY_COMMANDS = [carryCommand] as const;

const cms = (u: number, l: Locale) => `${String(Math.round(u * 1000) / 10).replace('.', tl(l, 'relative-motion-cms'))} ${tl(l, 'unit-sym-cm-per-s')}`;

export const CARRY_TEXT: Record<CarryCommand['type'], (c: CarryCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.carry': (x) => {
    const c = x as CarryCommand;
    if (c.speed === 0)
      return {
        say: msg('relative-motion-labcarry-say'),
        button: msg('relative-motion-labcarry-button'),
        plan: msg('relative-motion-labcarry-plan'),
      };
    return {
      say: msg('relative-motion-labcarry-say-2', { speed: (l: Locale) => cms(c.speed, l) }),
      button: msg('relative-motion-labcarry-button-2', { speed: (l: Locale) => cms(c.speed, l) }),
      plan: msg('relative-motion-labcarry-plan-2', { speed: (l: Locale) => cms(c.speed, l) }),
    };
  },
};
