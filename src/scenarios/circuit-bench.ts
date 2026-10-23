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

/** The two resistors of the series and parallel lab works (from the same school set), Ω. */
export const LAB_PAIR: readonly [SourcedValue, SourcedValue] = [
  sv(2, 'Ω', 'wire resistor of the school set', 'estimate', 0.05, [cite('spark', 'estimate', 'school sets have 1–10 Ω wire resistors', 2)], 'Estimate.'),
  sv(4, 'Ω', 'wire resistor of the school set', 'estimate', 0.05, [cite('spark', 'estimate', 'school sets have 1–10 Ω wire resistors', 4)], 'Estimate.'),
];

/**
 * Two resistors in series or in parallel; the ammeter goes where the current is measured (in the main line or
 * in a branch), the voltmeter across one resistor or across both. The ammeter's own resistance is in its place.
 */
export interface PairCommand {
  readonly type: 'lab.pair';
  readonly source: number;
  readonly connection: 'series' | 'parallel';
  /** Where the instruments are: at the first resistor, the second, or the whole pair. */
  readonly at: 'r1' | 'r2' | 'both';
}

export const pairCommand: CommandHandler<PairCommand> = {
  type: 'lab.pair',
  apply(state, c) {
    if (!(c.source > 0 && c.source <= VOLTMETER.max.value)) return err({ uk: 'Джерело дає від 0 до 6 В.', en: 'The source gives 0 to 6 V.' });
    const [r1, r2] = [LAB_PAIR[0].value, LAB_PAIR[1].value];
    const ra = AMMETER.resistance.value;
    let I: number;
    let U: number;
    if (c.connection === 'series') {
      // One path: the same current everywhere; the ammeter is in it wherever it stands.
      const i = c.source / (r1 + r2 + ra);
      I = i;
      U = c.at === 'r1' ? i * r1 : c.at === 'r2' ? i * r2 : i * (r1 + r2);
    } else if (c.at === 'both') {
      // The ammeter in the main line, before the fork.
      const rp = (r1 * r2) / (r1 + r2);
      I = c.source / (rp + ra);
      U = I * rp;
    } else {
      // The ammeter in one branch: that branch is its resistor and the ammeter; the other branch is its resistor alone.
      const [rm, ro] = c.at === 'r1' ? [r1 + ra, r2] : [r2 + ra, r1];
      void ro;
      I = c.source / rm;
      U = I * (c.at === 'r1' ? r1 : r2);
    }
    if (I > AMMETER.max.value) return err({ uk: 'Струм більший за 2 А — амперметр зашкалить. Зменш напругу.', en: 'The current is over 2 A — the ammeter would go off scale. Lower the voltage.' });
    const rec = (instrument: string, quantity: 'current' | 'voltage', exact: number, div: number): MeasurementRecord => ({ kind: 'measurement', instrument, quantity, value: read(exact, div), exact, entities: [], inputs: { source: c.source, division: div } });
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [rec('ammeter', 'current', I, AMMETER.division.value), rec('voltmeter', 'voltage', U, VOLTMETER.division.value)] });
  },
};

export const CIRCUIT_COMMANDS = [circuitCommand, pairCommand] as const;

const v = (x: number, uk: boolean) => `${String(x).replace('.', uk ? ',' : '.')} ${uk ? 'В' : 'V'}`;

const where = (c: PairCommand, uk: boolean) =>
  c.connection === 'series'
    ? c.at === 'both' ? (uk ? 'вольтметр — на обох резисторах разом' : 'the voltmeter across both resistors') : uk ? `вольтметр — на резисторі ${c.at === 'r1' ? 1 : 2}` : `the voltmeter across resistor ${c.at === 'r1' ? 1 : 2}`
    : c.at === 'both' ? (uk ? 'амперметр — до розгалуження' : 'the ammeter before the fork') : uk ? `амперметр — у гілці з резистором ${c.at === 'r1' ? 1 : 2}` : `the ammeter in the branch of resistor ${c.at === 'r1' ? 1 : 2}`;

export const CIRCUIT_TEXT: Record<CircuitCommand['type'] | PairCommand['type'], (c: CircuitCommand | PairCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.pair': (x) => {
    const c = x as PairCommand;
    return {
      say: { uk: `${where(c, true)[0]!.toUpperCase()}${where(c, true).slice(1)}. Замкни ключ і запиши покази амперметра й вольтметра.`, en: `${where(c, false)[0]!.toUpperCase()}${where(c, false).slice(1)}. Close the key and write down the ammeter and the voltmeter.` },
      button: { uk: `⚡ ${where(c, true)}`, en: `⚡ ${where(c, false)}` },
      plan: { uk: where(c, true), en: where(c, false) },
    };
  },
  'lab.circuit': (x) => {
    const c = x as CircuitCommand;
    return ({
    say: { uk: `Постав на джерелі ${v(c.source, true)}, замкни ключ і запиши покази амперметра й вольтметра.`, en: `Set the source to ${v(c.source, false)}, close the key and write down the ammeter and the voltmeter.` },
    button: { uk: `⚡ Джерело ${v(c.source, true)}: виміряти I та U`, en: `⚡ Source ${v(c.source, false)}: measure I and U` },
    plan: { uk: `джерело ${v(c.source, true)} — виміряти I та U`, en: `source ${v(c.source, false)} — measure I and U` },
  });
  },
};
