import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { cite, sv } from '../../components/sourced.js';
import { COMPONENTS } from '../../components/index.js';
import { peakEmf, type CoilAndMagnet } from '../../domains/electrical/induction.js';
import type { LocalizedText, Locale } from '../../knowledge/i18n.js';
import { BAR_MAGNET } from '../../scenarios/bench-kit.js';
import { msg, t } from '../../knowledge/messages.js';
import type { SourcedValue } from '../../knowledge/types.js';

/**
 * Electromagnetic induction (grade 9, lab work 5 — «Дослідження явища електромагнітної індукції»): a coil joined to a
 * milliammeter with its zero in the middle; a bar magnet is pushed into the coil and pulled out, fast or slowly, with
 * its north or its south pole; at last the coil is moved onto the magnet at rest. The meter's needle swings as far as
 * the largest current: I = ε / (R_coil + R_meter), ε from Faraday's law (domains/electrical/induction.ts). The needle
 * is taken as quick enough to follow; the coil's own inductance is left out (L/R ≪ the motion's time).
 */

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
    if (!(Number.isInteger(c.turns) && c.turns >= 50 && c.turns <= 1000)) return err(msg('electromagnetic-induction-induct-command-apply'));
    if (c.move !== 'still' && !(c.time >= 0.1 && c.time <= 5)) return err(msg('electromagnetic-induction-induct-command-apply-2'));
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

const s = (x: number, l: Locale) => `${String(x).replace('.', t(l, 'electromagnetic-induction-s'))} ${t(l, 'unit-sym-s')}`;
const POLE = { N: msg('electromagnetic-induction-pole-n'), S: msg('electromagnetic-induction-pole-s') } as const;
export const INDUCT_TEXT: Record<InductCommand['type'], (c: InductCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.induct': (x) => {
    const c = x as InductCommand;
    const pace = (l: Locale) => (c.time <= 0.5 ? t(l, 'electromagnetic-induction-labinduct-pace') : t(l, 'electromagnetic-induction-labinduct-pace-2'));
    if (c.move === 'still')
      return {
        say: msg('electromagnetic-induction-labinduct-say'),
        button: msg('electromagnetic-induction-labinduct-button'),
        plan: msg('electromagnetic-induction-labinduct-plan'),
      };
    if (c.move === 'out')
      return {
        say: msg('electromagnetic-induction-labinduct-say-2', { value: (l: Locale) => pace(l), time: (l: Locale) => s(c.time, l) }),
        button: msg('electromagnetic-induction-labinduct-button-2', { value: (l: Locale) => pace(l) }),
        plan: msg('electromagnetic-induction-labinduct-plan-2', { value: (l: Locale) => pace(l) }),
      };
    if (c.move === 'coil')
      return {
        say: msg('electromagnetic-induction-labinduct-say-3', { value: (l: Locale) => pace(l), time: (l: Locale) => s(c.time, l) }),
        button: msg('electromagnetic-induction-labinduct-button-3', { value: (l: Locale) => pace(l) }),
        plan: msg('electromagnetic-induction-labinduct-plan-3', { value: (l: Locale) => pace(l) }),
      };
    return {
      say: msg('electromagnetic-induction-labinduct-say-4', { POLE: (l: Locale) => POLE[c.pole][l], value: (l: Locale) => pace(l), time: (l: Locale) => s(c.time, l) }),
      button: msg('electromagnetic-induction-labinduct-button-4', { value: (l: Locale) => pace(l), value2: (l: Locale) => c.pole === 'N' ? t(l, 'electromagnetic-induction-button-uk') : t(l, 'electromagnetic-induction-button-uk-2') }),
      plan: msg('electromagnetic-induction-labinduct-plan-4', { POLE: (l: Locale) => POLE[c.pole][l], value: (l: Locale) => pace(l) }),
    };
  },
};
