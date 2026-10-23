import type { CommandHandler } from '../core/commands.js';
import { err, ok } from '../core/result.js';
import type { MeasurementRecord } from '../core/trace.js';
import { cite, sv } from '../components/sourced.js';
import type { LocalizedText } from '../knowledge/i18n.js';
import type { SourcedValue } from '../knowledge/types.js';

/**
 * The circuit of grade 8 (lab work 6, the resistance of a conductor): a regulated source, a key, a resistor from
 * the school set, an ammeter in series and a voltmeter across the resistor. The ammeter has a small resistance of
 * its own, the voltmeter draws almost no current; what they show is rounded to their divisions.
 */

/** A school lab ammeter: up to 2 A, one division 0.05 A; its own resistance. */
export const AMMETER = {
  max: sv(2, 'A', 'school lab ammeter', 'estimate', 0, [cite('spark', 'estimate', 'school DC lab ammeters read up to 2 A', 2)], 'Estimate: the make is not fixed.'),
  division: sv(0.05, 'A', 'one division', 'estimate', 0, [cite('spark', 'estimate', '40 divisions on a 2 A scale', 0.05)], 'Estimate.'),
  resistance: sv(0.1, 'Ω', 'its own resistance', 'estimate', 0.5, [cite('spark', 'estimate', 'tenths of an ohm for a lab ammeter', 0.1)], 'Estimate: small against the resistor.'),
} as const;
/** A school lab voltmeter: up to 6 V, one division 0.2 V (it draws next to no current). */
export const VOLTMETER = {
  max: sv(6, 'V', 'school lab voltmeter', 'estimate', 0, [cite('spark', 'estimate', 'school DC lab voltmeters read up to 6 V', 6)], 'Estimate: the make is not fixed.'),
  division: sv(0.2, 'V', 'one division', 'estimate', 0, [cite('spark', 'estimate', '30 divisions on a 6 V scale', 0.2)], 'Estimate.'),
} as const;
/** The resistor of the lab work (a wire resistor of the school set), Ω. */
export const LAB_RESISTOR: SourcedValue = sv(5, 'Ω', 'wire resistor of the school set', 'estimate', 0.05, [cite('spark', 'estimate', 'school sets have 1–10 Ω wire resistors', 5)], 'Estimate: its value is what the lab work finds.');

/** Set the source to so many volts, close the key; read the ammeter and the voltmeter. */
export interface CircuitCommand {
  readonly type: 'lab.circuit';
  readonly source: number;
  readonly resistor: number;
}

const read = (x: number, div: number) => Math.round(x / div) * div;

export const circuitCommand: CommandHandler<CircuitCommand> = {
  type: 'lab.circuit',
  apply(state, c) {
    if (!(c.source > 0 && c.source <= VOLTMETER.max.value)) return err({ uk: 'Джерело дає від 0 до 6 В — не більше, ніж показує вольтметр.', en: 'The source gives 0 to 6 V — no more than the voltmeter reads.' });
    if (!(c.resistor > 0)) return err({ uk: 'Який резистор?', en: 'Which resistor?' });
    // In series: the source drives the current through the resistor and the ammeter.
    const I = c.source / (c.resistor + AMMETER.resistance.value);
    if (I > AMMETER.max.value) return err({ uk: 'Струм більший за 2 А — амперметр зашкалить. Зменш напругу.', en: 'The current is over 2 A — the ammeter would go off scale. Lower the voltage.' });
    const U = I * c.resistor;
    const rec = (instrument: string, quantity: 'current' | 'voltage', exact: number, div: number): MeasurementRecord => ({ kind: 'measurement', instrument, quantity, value: read(exact, div), exact, entities: [], inputs: { source: c.source, resistor: c.resistor, division: div } });
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [rec('ammeter', 'current', I, AMMETER.division.value), rec('voltmeter', 'voltage', U, VOLTMETER.division.value)] });
  },
};

export const CIRCUIT_COMMANDS = [circuitCommand] as const;

const v = (x: number, uk: boolean) => `${String(x).replace('.', uk ? ',' : '.')} ${uk ? 'В' : 'V'}`;

export const CIRCUIT_TEXT: Record<CircuitCommand['type'], (c: CircuitCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.circuit': (c) => ({
    say: { uk: `Постав на джерелі ${v(c.source, true)}, замкни ключ і запиши покази амперметра й вольтметра.`, en: `Set the source to ${v(c.source, false)}, close the key and write down the ammeter and the voltmeter.` },
    button: { uk: `⚡ Джерело ${v(c.source, true)}: виміряти I та U`, en: `⚡ Source ${v(c.source, false)}: measure I and U` },
    plan: { uk: `джерело ${v(c.source, true)} — виміряти I та U`, en: `source ${v(c.source, false)} — measure I and U` },
  }),
};
