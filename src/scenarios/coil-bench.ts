import type { CommandHandler } from '../core/commands.js';
import { err, ok } from '../core/result.js';
import type { MeasurementRecord } from '../core/trace.js';
import { ZERO_CELSIUS_IN_KELVIN } from '../core/units.js';
import { cite, sv } from '../components/sourced.js';
import { COMPONENTS } from '../components/index.js';
import type { LocalizedText } from '../knowledge/i18n.js';
import type { SourcedValue } from '../knowledge/types.js';
import { sampleOf } from './thermal-lab.js';

/**
 * The resistance of a conductor and its temperature (grade 9, lab work 1): a coil of copper winding wire lies in
 * the beaker of water, its ends led out to a digital multimeter set to measure resistance; the water is heated,
 * and at each temperature the multimeter is read. The coil is at the water's temperature; its resistance follows
 * copper's resistivity: R = R₂₀·(1 + α·(t − 20 °C)), α from the copper component.
 */

/** The coil: so many metres of thin winding wire that it has about 10 Ω at 20 °C. */
export const COIL_R20: SourcedValue = sv(10, 'Ω', 'copper coil at 20 °C', 'estimate', 0.3, [cite('spark', 'estimate', 'a coil of ~6 m of 0.1 mm winding wire: R = ρ·L/S ≈ 16.8 nΩ·m · 6 m / 7.9·10⁻³ mm² ≈ 13 Ω', 10)], 'Estimate: its resistance is what the lab work measures.');
/** A school digital multimeter on its 200 Ω range: hundredths of an ohm on the display. */
export const MULTIMETER = {
  max: sv(200, 'Ω', 'the 200 Ω range', 'estimate', 0, [cite('spark', 'estimate', 'the usual ranges of a school multimeter: 200 Ω, 2 kΩ…', 200)], 'Estimate.'),
  division: sv(0.01, 'Ω', 'the last digit on the 200 Ω range', 'estimate', 0, [cite('spark', 'estimate', 'a 3½-digit display on its 200 Ω range shows 0.1 Ω; 4½-digit — 0.01 Ω', 0.01)], 'Estimate: a 4½-digit display.'),
} as const;

/** Copper's temperature coefficient of resistance, 1/K (the component's data). */
const alpha = () => COMPONENTS.copper.electrical?.temperatureCoefficient?.value ?? 0;
/** The coil's resistance at t °C. */
export const coilResistance = (t: number): number => COIL_R20.value * (1 + alpha() * (t - 20));

/** Read the coil's resistance on the multimeter (the water's temperature on the thermometer beside it). */
export interface OhmCommand {
  readonly type: 'lab.ohm';
}

export const ohmCommand: CommandHandler<OhmCommand> = {
  type: 'lab.ohm',
  apply(state) {
    let t: number;
    try {
      t = sampleOf(state).state.temperature - ZERO_CELSIUS_IN_KELVIN;
    } catch {
      return err({ uk: 'Котушка лежить у склянці з водою — а склянки немає.', en: 'The coil lies in a beaker of water — and there is no beaker.' });
    }
    const R = coilResistance(t);
    const div = MULTIMETER.division.value;
    const shown = R > MULTIMETER.max.value ? null : Math.round(R / div) * div;
    const record: MeasurementRecord = { kind: 'measurement', instrument: 'multimeter', quantity: 'resistance', value: shown, exact: R, entities: [], inputs: { temperature: t, r20: COIL_R20.value, alpha: alpha(), division: div } };
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [record] });
  },
};

export const COIL_COMMANDS = [ohmCommand] as const;

export const COIL_TEXT: Record<OhmCommand['type'], () => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.ohm': () => ({
    say: { uk: 'Подивись на термометр і на мультиметр: яка температура води й який опір котушки?', en: 'Look at the thermometer and the multimeter: what is the water’s temperature and the coil’s resistance?' },
    button: { uk: 'Ω Виміряти опір котушки', en: 'Ω Measure the coil’s resistance' },
    plan: { uk: 'виміряти опір котушки', en: 'measure the coil’s resistance' },
  }),
};
