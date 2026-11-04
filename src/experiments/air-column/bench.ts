import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { cite, sv } from '../../components/sourced.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import { msg } from '../../knowledge/messages.js';
import type { SourcedValue } from '../../knowledge/types.js';
import { parsePlace, type Place } from '../../scenarios/place.js';

/**
 * Gravity holds the air (grade 7): a phone's barometer read on the ground floor of a block of flats in a town, then
 * on the ninth floor, and from an airship over the town — at its usual 300 m and at 2 km. The air is pulled down by
 * the Earth, so each layer presses on the ones beneath: the pressure is the weight of the air above each square metre,
 * p = m·g / S — about ten tonnes of it at the sea. Up the stairs there is less air above: Δp = ρ·g·Δh gives the air's
 * density; from the airship, how much of the air is already below. The pressure is the U.S. Standard Atmosphere's
 * (layer 0: 101325 Pa at sea level, 288.15 K, −6.5 K/km) — a day of average weather; on a real day the readings shift
 * by the weather, their differences hardly. The town's height above the sea comes with it (the geocoder's).
 */

const G0 = 9.80665;
/** U.S. Standard Atmosphere, layer 0. */
const P0 = 101325;
const T0 = 288.15;
const LAPSE = -0.0065;
const EXPONENT = -5.25588;

/** The pressure at a height above the sea, Pa. */
export const airPressure = (h: number): number => P0 * (T0 / (T0 + LAPSE * h)) ** EXPONENT;

/** Without a place: Kyiv, 179 m above the sea (Вікіпедія). */
const KYIV: Place = { name: 'Київ', lat: 50.45, lon: 30.5233, elevation: 179, zone: 'Europe/Kyiv' };
export const airPlace = (value: string | undefined): Place => parsePlace(value) ?? KYIV;
/** A storey of a block of flats, floor to floor. */
export const STOREY: SourcedValue = sv(2.8, 'm', 'a storey of a block of flats', 'estimate', 0.1, [cite('spark', 'estimate', 'a 2.5 m ceiling and the floor slab', 2.8)], 'Estimate: it sets the climb, and the density follows from it.');
/** The airship: its usual height over the ground, and a climb to 2 km over the town (a Zeppelin NT is allowed up to 2600 m above the sea: a town high in the mountains would be beyond it). */
export const AIRSHIP: { readonly usual: SourcedValue; readonly high: number; readonly volume: SourcedValue } = {
  usual: sv(300, 'm', 'a Zeppelin NT, standard operational altitude', 'single-source', 0, [cite('wikipedia-zeppelin-nt', 'standard operational altitude of 300 m', '—', 300)]),
  high: 2000,
  volume: sv(8255, 'm³', 'a Zeppelin NT’s envelope', 'single-source', 0.005, [cite('wikipedia-zeppelin-nt', 'Specifications: volume 8,255 m³ (overview: 8,225)', '—', 8255)]),
};
/** The phone's barometer shows hundredths of a hectopascal. */
export const BARO_DIVISION = 1;

export type AirWhere = 'ground' | 'ninth' | 'airship' | 'high';
/** How high the reading is taken above the town's ground, m. */
export const airClimb = (w: AirWhere): number => (w === 'ninth' ? 8 * STOREY.value : w === 'airship' ? AIRSHIP.usual.value : w === 'high' ? AIRSHIP.high : 0);

/** Read the phone's barometer: in the town (a place control's value), on the ground floor, the ninth, in the airship. */
export interface AirCommand {
  readonly type: 'lab.air';
  readonly place: string;
  readonly where: AirWhere;
}

export const airCommand: CommandHandler<AirCommand> = {
  type: 'lab.air',
  apply(state, c) {
    if (!(c.where === 'ground' || c.where === 'ninth' || c.where === 'airship' || c.where === 'high')) return err(msg('air-column-command-apply'));
    const town = airPlace(c.place);
    const climb = airClimb(c.where);
    const h = (town.elevation ?? 0) + climb;
    const p = airPressure(h);
    const record: MeasurementRecord = { kind: 'measurement', instrument: 'barometer', quantity: 'pressure', value: Math.round(p / BARO_DIVISION) * BARO_DIVISION, exact: p, entities: [], inputs: { height: h, climb, ground: town.elevation ?? 0, g: G0, division: BARO_DIVISION } };
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [record] });
  },
};

export const AIR_COMMANDS = [airCommand] as const;

const WHERE: Record<AirWhere, { say: LocalizedText; button: LocalizedText; plan: LocalizedText; name: LocalizedText }> = {
  ground: {
    say: msg('air-column-ground-say'),
    button: msg('air-column-ground-button'),
    plan: msg('air-column-ground-plan'),
    name: msg('air-column-ground-name'),
  },
  ninth: {
    say: msg('air-column-ninth-say'),
    button: msg('air-column-ninth-button'),
    plan: msg('air-column-ninth-plan'),
    name: msg('air-column-ninth-name'),
  },
  airship: {
    say: msg('air-column-airship-say'),
    button: msg('air-column-airship-button'),
    plan: msg('air-column-airship-plan'),
    name: msg('air-column-airship-name'),
  },
  high: {
    say: msg('air-column-high-say'),
    button: msg('air-column-high-button'),
    plan: msg('air-column-high-plan'),
    name: msg('air-column-high-name'),
  },
};
export const airPlaceName = (w: AirWhere) => WHERE[w].name;

export const AIR_TEXT: Record<AirCommand['type'], (c: AirCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.air': (x) => WHERE[(x as AirCommand).where],
};
