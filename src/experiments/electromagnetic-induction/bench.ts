import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { cite, sv } from '../../components/sourced.js';
import { COMPONENTS } from '../../components/index.js';
import { peakEmf, type CoilAndMagnet } from '../../domains/electrical/induction.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import type { SourcedValue } from '../../knowledge/types.js';

/**
 * Electromagnetic induction (grade 9, lab work 5 — «Дослідження явища електромагнітної індукції»): a coil joined to a
 * milliammeter with its zero in the middle; a bar magnet is pushed into the coil and pulled out, fast or slowly, with
 * its north or its south pole; at last the coil is moved onto the magnet at rest. The meter's needle swings as far as
 * the largest current: I = ε / (R_coil + R_meter), ε from Faraday's law (domains/electrical/induction.ts). The needle
 * is taken as quick enough to follow; the coil's own inductance is left out (L/R ≪ the motion's time).
 */

/** The ferrite bar magnet: Y30-like remanence; 10 cm long, its 2 × 1 cm section taken as a circle of the same area. */
export const BAR_MAGNET: { readonly remanence: SourcedValue; readonly radius: SourcedValue; readonly length: SourcedValue } = {
  remanence: sv(0.38, 'T', 'sintered ferrite, grade Y30', 'cross-checked', 0.05, [cite('stanford-magnets-ferrite', 'Y30: Br 370–400 mT', 'room temperature', 0.38), cite('magnetexpert-ferrite-grades', 'Y30: Br 370–400 mT', 'room temperature', 0.38)], 'Which grade a school magnet is, is not known: ferrites go from about 0.2 to 0.44 T.'),
  radius: sv(0.008, 'm', '2 × 1 cm section, as a circle of the same area', 'estimate', 0.2, [cite('spark', 'estimate', 'school bar magnets are about 2 × 1 × 10 cm', 0.008)], 'Estimate.'),
  length: sv(0.1, 'm', 'a school bar magnet', 'estimate', 0.1, [cite('spark', 'estimate', 'school bar magnets are about 10 cm long', 0.1)], 'Estimate.'),
};
/** The coil: its turns 2 cm from the axis, 4 cm long, of 0.3 mm copper wire. */
export const INDUCT_COIL = {
  radius: sv(0.02, 'm', 'the coil’s mean radius', 'estimate', 0.2, [cite('spark', 'estimate', 'a coil a bar magnet passes through freely', 0.02)], 'Estimate.'),
  length: sv(0.04, 'm', 'the winding’s length', 'estimate', 0.2, [cite('spark', 'estimate', 'a 4 cm wide coil', 0.04)], 'Estimate.'),
  wire: sv(0.0003, 'm', 'the copper wire’s diameter', 'estimate', 0.2, [cite('spark', 'estimate', 'winding wire of 0.3 mm', 0.0003)], 'Estimate.'),
} as const;
/** The milliammeter with its zero in the middle: ±50 mA, 2 mA a division, its own resistance. */
export const ZERO_METER = {
  max: sv(0.05, 'A', '±50 mA', 'estimate', 0, [cite('spark', 'estimate', 'a lab milliammeter with the zero in the middle', 0.05)], 'Estimate: the make is not fixed.'),
  division: sv(0.002, 'A', 'one division', 'estimate', 0, [cite('spark', 'estimate', '25 divisions each way', 0.002)], 'Estimate.'),
  resistance: sv(1, 'Ω', 'its own resistance', 'estimate', 0.5, [cite('spark', 'estimate', 'about an ohm for a milliammeter', 1)], 'Estimate.'),
} as const;
/** Where the magnet's middle starts (out of the coil) and ends (in its middle), m from the coil's middle. */
const OUT = 0.2;

export const inductCoilResistance = (turns: number): number => {
  const rho = COMPONENTS.copper.electrical!.resistivity!.value;
  const d = INDUCT_COIL.wire.value;
  return (rho * turns * 2 * Math.PI * INDUCT_COIL.radius.value) / ((Math.PI * d * d) / 4);
};

/**
 * The magnet in the coil, still; or pushed in, pulled out — with its north or south pole first — in so many seconds;
 * or the coil moved onto the magnet at rest. Read the milliammeter's largest swing.
 */
export interface InductCommand {
  readonly type: 'lab.induct';
  readonly move: 'still' | 'in' | 'out' | 'coil';
  readonly pole: 'N' | 'S';
  readonly time: number;
  readonly turns: number;
}

export const inductCommand: CommandHandler<InductCommand> = {
  type: 'lab.induct',
  apply(state, c) {
    if (!(Number.isInteger(c.turns) && c.turns >= 50 && c.turns <= 1000)) return err({ uk: 'Котушка має від 50 до 1000 витків.', en: 'The coil has 50 to 1000 turns.' });
    if (c.move !== 'still' && !(c.time >= 0.1 && c.time <= 5)) return err({ uk: 'Магніт рухають від 0,1 до 5 с.', en: 'The magnet moves for 0.1 to 5 s.' });
    const setup: CoilAndMagnet = { turns: c.turns, radius: INDUCT_COIL.radius.value, length: INDUCT_COIL.length.value, remanence: (c.pole === 'S' ? -1 : 1) * BAR_MAGNET.remanence.value, magnetRadius: BAR_MAGNET.radius.value, magnetLength: BAR_MAGNET.length.value };
    // Only the motion of one against the other counts: the coil onto the magnet is the magnet into the coil.
    const emf = c.move === 'still' ? 0 : c.move === 'out' ? peakEmf(setup, 0, OUT, c.time) : peakEmf(setup, OUT, 0, c.time);
    const R = inductCoilResistance(c.turns) + ZERO_METER.resistance.value;
    // (The meter is joined so that the north pole going in swings its needle right: +.)
    const I = -emf / R;
    const div = ZERO_METER.division.value;
    const value = Math.abs(I) > ZERO_METER.max.value ? null : Math.round(I / div) * div + 0;
    const record: MeasurementRecord = { kind: 'measurement', instrument: 'milliammeter', quantity: 'current', value, exact: I, entities: [], inputs: { emf, resistance: R, coil: inductCoilResistance(c.turns), time: c.time, turns: c.turns, division: div } };
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [record] });
  },
};

export const INDUCT_COMMANDS = [inductCommand] as const;

const s = (x: number, uk: boolean) => `${String(x).replace('.', uk ? ',' : '.')} ${uk ? 'с' : 's'}`;
const POLE = { N: { uk: 'північним', en: 'north' }, S: { uk: 'південним', en: 'south' } } as const;
export const INDUCT_TEXT: Record<InductCommand['type'], (c: InductCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.induct': (x) => {
    const c = x as InductCommand;
    const pace = (uk: boolean) => (c.time <= 0.5 ? (uk ? 'швидко' : 'fast') : uk ? 'повільно' : 'slowly');
    if (c.move === 'still')
      return {
        say: { uk: 'Магніт лежить усередині котушки й не рухається. Що показує міліамперметр?', en: 'The magnet lies inside the coil and does not move. What does the milliammeter show?' },
        button: { uk: '🧲 Магніт у котушці, нерухомий', en: '🧲 The magnet in the coil, still' },
        plan: { uk: 'магніт нерухомо в котушці', en: 'the magnet still in the coil' },
      };
    if (c.move === 'out')
      return {
        say: { uk: `Витягни магніт із котушки — ${pace(true)}, за ${s(c.time, true)}. Куди відхилилася стрілка й на скільки?`, en: `Pull the magnet out of the coil — ${pace(false)}, in ${s(c.time, false)}. Which way and how far did the needle swing?` },
        button: { uk: `⬅ Витягти магніт (${pace(true)})`, en: `⬅ Pull the magnet out (${pace(false)})` },
        plan: { uk: `витягти магніт ${pace(true)}`, en: `pull the magnet out ${pace(false)}` },
      };
    if (c.move === 'coil')
      return {
        say: { uk: `Тепер магніт лежить нерухомо, а ти ${pace(true)} надінь на нього котушку — за ${s(c.time, true)}. Що покаже міліамперметр?`, en: `Now the magnet lies still and you slip the coil onto it ${pace(false)} — in ${s(c.time, false)}. What will the milliammeter show?` },
        button: { uk: `➡ Надіти котушку на магніт (${pace(true)})`, en: `➡ Slip the coil onto the magnet (${pace(false)})` },
        plan: { uk: `надіти котушку на нерухомий магніт ${pace(true)}`, en: `slip the coil onto the still magnet ${pace(false)}` },
      };
    return {
      say: { uk: `Встав магніт ${POLE[c.pole].uk} полюсом у котушку — ${pace(true)}, за ${s(c.time, true)}. Куди відхилилася стрілка й на скільки?`, en: `Push the magnet into the coil, ${POLE[c.pole].en} pole first — ${pace(false)}, in ${s(c.time, false)}. Which way and how far did the needle swing?` },
      button: { uk: `➡ ${c.pole === 'N' ? 'Північним' : 'Південним'} полюсом у котушку (${pace(true)})`, en: `➡ ${c.pole === 'N' ? 'North' : 'South'} pole into the coil (${pace(false)})` },
      plan: { uk: `встромити магніт ${POLE[c.pole].uk} полюсом ${pace(true)}`, en: `push the magnet in, ${POLE[c.pole].en} pole first, ${pace(false)}` },
    };
  },
};
