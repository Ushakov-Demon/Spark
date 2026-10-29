import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import { STOPWATCH_DIVISION } from '../../scenarios/motion-bench.js';
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
    if (!(c.speed >= 0 && c.speed <= 0.02)) return err({ uk: 'Пляшку ведуть рукою — до 2 см/с.', en: 'The bottle is carried by hand — up to 2 cm/s.' });
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

const cms = (u: number, uk: boolean) => `${String(Math.round(u * 1000) / 10).replace('.', uk ? ',' : '.')} ${uk ? 'см/с' : 'cm/s'}`;

export const CARRY_TEXT: Record<CarryCommand['type'], (c: CarryCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.carry': (x) => {
    const c = x as CarryCommand;
    if (c.speed === 0)
      return {
        say: { uk: 'Спершу пляшка стоїть. Переверни її, познач бульбашку на аркуші на нульовій позначці й на позначці 9 см і засічи час.', en: 'First the bottle stands. Turn it over, mark the bubble on the paper at the zero mark and at the 9 cm one, and time it.' },
        button: { uk: '🫧 Пляшка стоїть', en: '🫧 The bottle stands' },
        plan: { uk: 'пляшка стоїть', en: 'the bottle stands' },
      };
    return {
      say: { uk: `Тепер, поки бульбашка спливає, веди пляшку вздовж лінійки рівномірно — ${cms(c.speed, true)}. Познач бульбашку на аркуші на старті й на 9 см.`, en: `Now, while the bubble rises, carry the bottle along the ruler steadily — ${cms(c.speed, false)}. Mark the bubble on the paper at the start and at 9 cm.` },
      button: { uk: `➡ Вести пляшку: ${cms(c.speed, true)}`, en: `➡ Carry the bottle: ${cms(c.speed, false)}` },
      plan: { uk: `вести пляшку ${cms(c.speed, true)}`, en: `carry the bottle at ${cms(c.speed, false)}` },
    };
  },
};
