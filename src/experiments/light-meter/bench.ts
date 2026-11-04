import { cite, sv } from '../../components/sourced.js';
import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { isotropicIntensity, pointIlluminance } from '../../domains/optics/formulas.js';
import type { LampKind } from '../../equipment/lamps.js';
import { msg } from '../../knowledge/messages.js';
import type { SourcedValue } from '../../knowledge/types.js';
import { lengthText } from './words.js';
import { lampFlux } from './shared.js';
export { lampFlux } from './shared.js';

/**
 * Measuring illuminance (grade 7, the introduction: «вимірювання … освітленості»). A frosted lamp with no shade
 * (a filament or an LED one, of any power) hangs on a stand over a light meter lying on the table, in a room with the curtains drawn; the lamp is raised, and
 * the meter is read at each height — then tilted. A frosted bulb glows evenly all over, and from such a sphere the
 * light thins exactly as from a point at its centre: E = I·cos α / r², I = Φ/4π, Φ = η·P (the optics domain; the
 * lamps' efficacy η — the equipment's). Here — only the lamp's bulb and the meter.
 */

/** The frosted bulb, its radius: the meter cannot come nearer to the lamp's centre than that. */
export const BULB_RADIUS: SourcedValue = sv(0.03, 'm', 'a usual pear-shaped household bulb, its glass', 'estimate', 0.2, [cite('spark', 'estimate', 'a household bulb is about 6 cm across', 0.03)], 'Estimate: household bulbs are 5–7 cm across.');
/** The meter shows three figures and switches its range itself (a digital light meter). */
export const METER_FIGURES = 3;

/** The meter `r` metres from the lamp's centre, tilted `tilt` degrees (0 — face to the lamp); the lamp — of its kind, `power` W. */
export type LuxmeterCommand = { readonly type: 'lab.luxmeter'; readonly lamp: LampKind; readonly power: number; readonly r: number; readonly tilt?: number };

/** The meter's division at a reading: three figures, the range chosen by itself (1 lx at hundreds, 10 lx at thousands…). */
export const meterDivision = (E: number): number => (E > 0 ? 10 ** (Math.floor(Math.log10(E)) - (METER_FIGURES - 1)) : 1);

/** What falls on the meter, lx. */
export const illuminanceAt = (flux: number, r: number, tilt = 0): number => pointIlluminance(isotropicIntensity(flux), r, (tilt * Math.PI) / 180);

export const luxmeterCommand: CommandHandler<LuxmeterCommand> = {
  type: 'lab.luxmeter',
  apply(state, c) {
    if (!(c.power > 0 && Number.isFinite(c.power))) return err(msg('light-meter-bad-power'));
    const flux = lampFlux(c.lamp, c.power);
    // The meter cannot be inside the bulb; and turned edge-on (90°) or away it catches no light from it.
    if (!(c.r > BULB_RADIUS.value && Number.isFinite(c.r))) return err(msg('light-meter-bad-r', { min: (l) => lengthText(BULB_RADIUS.value, l) }));
    const tilt = c.tilt ?? 0;
    if (!(tilt >= 0 && tilt < 90)) return err(msg('light-meter-bad-tilt'));
    const E = illuminanceAt(flux, c.r, tilt);
    const d = meterDivision(E);
    const record: MeasurementRecord = { kind: 'measurement', instrument: 'luxmeter', quantity: 'illuminance', value: Math.round(E / d) * d, exact: E, entities: [], inputs: { division: d, flux, power: c.power, r: c.r, tilt, I: isotropicIntensity(flux) } };
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [record] });
  },
};
