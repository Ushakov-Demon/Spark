import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { cite, sv } from '../../components/sourced.js';
import { diodeLoop, type DiodeParams } from '../../domains/electrical/diode.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import type { SourcedValue } from '../../knowledge/types.js';

/**
 * The "black box" (grade 9, lab work 2 — the resistance of a circuit with a semiconductor diode): a closed box
 * with two terminals, a silicon diode inside. In series with it a protective resistor, a digital multimeter as a
 * milliammeter and the regulated source; the source is set to 1, 2, 3 V, then the box is turned round (its
 * terminals swapped) and the same again. The current comes from the Shockley equation (domains/electrical/diode.ts);
 * the circuit's resistance R = U / I is what the lab work finds, one way and the other.
 */

/** A small silicon signal diode: the parameters of the 1N4148 model widely used in circuit simulators. */
export const BOX_DIODE: { readonly saturation: SourcedValue; readonly ideality: SourcedValue } = {
  saturation: sv(2.52e-9, 'A', '1N4148, 27 °C', 'estimate', 0.5, [cite('spark', 'estimate', 'the 1N4148 SPICE model of the LTspice standard library: IS = 2.52n', 2.52e-9)], 'Estimate: one simulator model; real diodes of a type differ several times.'),
  ideality: sv(1.752, '', '1N4148', 'estimate', 0.2, [cite('spark', 'estimate', 'the same model: N = 1.752', 1.752)], 'Estimate.'),
};
/** The protective resistor in series (it keeps the current small when the diode conducts), Ω. */
export const BOX_RESISTOR: SourcedValue = sv(100, 'Ω', 'protective resistor', 'estimate', 0.05, [cite('spark', 'estimate', 'a 100 Ω resistor of the school set limits a few volts to tens of milliamperes', 100)], 'Estimate.');
/** The multimeter as a milliammeter: its 200 mA range, a tenth of a milliampere; its own resistance (the shunt). */
export const MILLIAMMETER = {
  max: sv(0.2, 'A', 'the 200 mA range', 'estimate', 0, [cite('spark', 'estimate', 'the usual current ranges of a school multimeter: 20 mA, 200 mA, 10 A', 0.2)], 'Estimate.'),
  division: sv(0.0001, 'A', 'the last digit on the 200 mA range', 'estimate', 0, [cite('spark', 'estimate', 'a 3½-digit display on 200 mA shows 0.1 mA', 0.0001)], 'Estimate.'),
  resistance: sv(1, 'Ω', 'its shunt on the 200 mA range', 'estimate', 0.5, [cite('spark', 'estimate', 'about an ohm on the 200 mA range', 1)], 'Estimate: small against the protective resistor.'),
} as const;
/** The box at room temperature, K. */
const ROOM = 293.15;

const diode = (): DiodeParams => ({ saturation: BOX_DIODE.saturation.value, ideality: BOX_DIODE.ideality.value });

/** Set the source, connect the box one way or turned round, read the milliammeter. */
export interface BoxCommand {
  readonly type: 'lab.box';
  readonly source: number;
  /** The box turned round: its terminals swapped. */
  readonly reversed: boolean;
}

export const boxCommand: CommandHandler<BoxCommand> = {
  type: 'lab.box',
  apply(state, c) {
    if (!(c.source > 0 && c.source <= 6)) return err({ uk: 'Джерело дає від 0 до 6 В.', en: 'The source gives 0 to 6 V.' });
    const r = BOX_RESISTOR.value + MILLIAMMETER.resistance.value;
    const { current, diodeVoltage } = diodeLoop(diode(), c.source, r, ROOM, c.reversed);
    const div = MILLIAMMETER.division.value;
    // (The meter shows the size of the current: turned round, the box lets through nanoamperes — zeros.)
    const I = Math.abs(current);
    const value = I > MILLIAMMETER.max.value ? null : Math.round(I / div) * div;
    const record: MeasurementRecord = { kind: 'measurement', instrument: 'milliammeter', quantity: 'current', value, exact: I, entities: [], inputs: { source: c.source, reversed: c.reversed ? 1 : 0, division: div, box: Math.abs(diodeVoltage) } };
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [record] });
  },
};

export const BOX_COMMANDS = [boxCommand] as const;

const volts = (x: number, uk: boolean) => `${String(x).replace('.', uk ? ',' : '.')} ${uk ? 'В' : 'V'}`;
export const BOX_TEXT: Record<BoxCommand['type'], (c: BoxCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.box': (x) => {
    const c = x as BoxCommand;
    const way = { uk: c.reversed ? 'скринька перевернута' : 'скринька — як стоїть', en: c.reversed ? 'the box turned round' : 'the box as it stands' };
    return {
      say: { uk: `Постав на джерелі ${volts(c.source, true)} (${way.uk}), замкни коло й подивись на міліамперметр.`, en: `Set the source to ${volts(c.source, false)} (${way.en}), close the circuit and look at the milliammeter.` },
      button: { uk: `${c.reversed ? '⇄' : '→'} ${volts(c.source, true)}: виміряти струм`, en: `${c.reversed ? '⇄' : '→'} ${volts(c.source, false)}: measure the current` },
      plan: { uk: `виміряти струм за ${volts(c.source, true)}${c.reversed ? ', скринька перевернута' : ''}`, en: `measure the current at ${volts(c.source, false)}${c.reversed ? ', the box turned round' : ''}` },
    };
  },
};
