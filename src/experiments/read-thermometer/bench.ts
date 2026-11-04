import { COMPONENTS } from '../../components/index.js';
import { cite, sv } from '../../components/sourced.js';
import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { celsius, heatCapacity, kilograms, meters, seconds, specificHeat, squareMeters, thermalConductivity, ZERO_CELSIUS_IN_KELVIN } from '../../core/units.js';
import { scaleDivision } from '../../domains/mechanics/formulas.js';
import { conductionConductance, convectionConductance, heatCapacityOf, newtonCooling, seriesConductance, timeConstant } from '../../domains/thermal/formulas.js';
import { CONVECTION } from '../../domains/thermal/materials.js';
import { msg } from '../../knowledge/messages.js';
import type { SourcedValue } from '../../knowledge/types.js';

/**
 * Reading a thermometer (grade 7, the introduction: «вимірювання … температури»). A thermometer shows its own
 * temperature — that of its bulb — and the bulb takes the water's only as heat flows into it: Newton's law, the
 * bulb's excess falling as e^(−t/τ), τ = C/G (its heat capacity — the alcohol and the glass — over the conductance of
 * the glass wall and the water beyond it, one after the other). So it is read when the column has stopped. Stirred,
 * the water carries heat to the bulb faster (a larger h), and the column gets there sooner. The physics is the
 * thermal domain's; here — only the thermometer.
 */

/** The bulb: a glass cylinder filled with coloured alcohol (a school liquid thermometer). */
export const BULB_DIAMETER: SourcedValue = sv(0.006, 'm', 'the bulb of a school liquid thermometer, outside', 'estimate', 0.3, [cite('spark', 'estimate', 'a bulb a little thicker than the tube, about 5–7 mm', 0.006)], 'Estimate: a bulb is a few millimetres across; thermometers differ.');
export const BULB_LENGTH: SourcedValue = sv(0.012, 'm', 'the bulb, its length', 'estimate', 0.3, [cite('spark', 'estimate', 'a bulb is about 1–1.5 cm long', 0.012)], 'Estimate.');
export const BULB_WALL: SourcedValue = sv(0.0005, 'm', 'the bulb’s glass wall', 'estimate', 0.4, [cite('spark', 'estimate', 'a thin glass wall, a few tenths of a millimetre', 0.0005)], 'Estimate: thin enough to let heat in quickly, thick enough not to break.');
/** The scale: 0…100 °C, a division of 1 °C, the marks numbered every 10 °C. */
export const SCALE_LOW = 0;
export const SCALE_HIGH = 100;
export const SCALE_NUMBERED = 10;
export const SCALE_MARKS_BETWEEN = 10;
/** How much the water cools while the thermometer warms: a glass of it (the answer says how little). */
export const GLASS_WATER: SourcedValue = sv(0.2, 'kg', 'water in a glass', 'estimate', 0.3, [cite('spark', 'estimate', 'a glass holds about 200 ml', 0.2)], 'Estimate: a usual glass.');

export type ThermoStep = 'scale' | 'dip';
/** The scale read (and the room's temperature on it), or the thermometer in the water `t` seconds after it went in. */
export type ThermometerCommand =
  | { readonly type: 'lab.thermometer'; readonly step: 'scale'; readonly room: number }
  | { readonly type: 'lab.thermometer'; readonly step: 'dip'; readonly room: number; readonly water: number; readonly t: number; readonly stir?: boolean };

/** The division: two numbered marks and the divisions between them, c = (a − b)/n. */
export const division = (): number => scaleDivision(SCALE_NUMBERED, 0, SCALE_MARKS_BETWEEN);

/** The bulb's time constant τ = C/G in still or stirred water, s; with its parts for the answer. */
export function bulb(stir = false) {
  const d = BULB_DIAMETER.value;
  const L = BULB_LENGTH.value;
  const w = BULB_WALL.value;
  const glass = COMPONENTS.glass.phases.solid!;
  const alcohol = COMPONENTS.ethanol.phases.liquid!;
  // The alcohol fills the inside, the glass is the shell; heat comes in through the side and the bottom.
  const inside = Math.PI * ((d - 2 * w) / 2) ** 2 * (L - w);
  const shell = Math.PI * (d / 2) ** 2 * L - inside;
  const area = squareMeters(Math.PI * d * L + Math.PI * (d / 2) ** 2);
  const C = heatCapacity(heatCapacityOf(kilograms(inside * alcohol.density!.value), specificHeat(alcohol.specificHeat!.value)) + heatCapacityOf(kilograms(shell * glass.density!.value), specificHeat(glass.specificHeat!.value)));
  const G = seriesConductance(conductionConductance(thermalConductivity(glass.conductivity!.value), area, meters(w)), convectionConductance((stir ? CONVECTION.stirredWater : CONVECTION.stillWater).value, area));
  return { C, G, tau: timeConstant(C, G) as number };
}

/** What the bulb is at, °C, `t` s after going from the room into the water. */
export const bulbAt = (room: number, water: number, t: number, stir = false): number => newtonCooling(celsius(room), celsius(water), seconds(bulb(stir).tau), seconds(t)) - ZERO_CELSIUS_IN_KELVIN;

export const thermometerCommand: CommandHandler<ThermometerCommand> = {
  type: 'lab.thermometer',
  apply(state, c) {
    // Only what the thermometer's scale holds — and water stays water between 0 and 100 °C (at 1 atm).
    const inScale = (x: number) => Number.isFinite(x) && x >= SCALE_LOW && x <= SCALE_HIGH;
    if (!inScale(c.room)) return err(msg('read-thermometer-bad-room'));
    const c0 = division();
    const read = (x: number) => Math.round(x / c0) * c0;
    if (c.step === 'scale') {
      const record: MeasurementRecord = { kind: 'measurement', instrument: 'thermometer', quantity: 'temperature', value: celsius(read(c.room)), exact: celsius(c.room), entities: [], inputs: { division: c0, room: c.room } };
      return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [record] });
    }
    if (!(c.water > 0 && c.water < 100)) return err(msg('read-thermometer-bad-water'));
    if (!(c.t >= 0)) return err(msg('read-thermometer-bad-time'));
    const T = bulbAt(c.room, c.water, c.t, c.stir);
    const { tau } = bulb(c.stir);
    const record: MeasurementRecord = { kind: 'measurement', instrument: 'thermometer', quantity: 'temperature', value: celsius(read(T)), exact: celsius(T), entities: [], inputs: { division: c0, room: c.room, water: c.water, t: c.t, tau, stir: c.stir ? 1 : 0 } };
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [record] });
  },
};
