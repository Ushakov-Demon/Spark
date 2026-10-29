import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { cite, sv } from '../../components/sourced.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
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
    if (!(c.where === 'ground' || c.where === 'ninth' || c.where === 'airship' || c.where === 'high')) return err({ uk: 'Такого місця в досліді немає.', en: 'No such place in the experiment.' });
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
    say: { uk: 'Перший поверх багатоповерхівки. Відкриваємо в телефоні барометр: що він показує?', en: 'The ground floor of a block of flats. We open the barometer on a phone: what does it show?' },
    button: { uk: '📱 Барометр на 1-му поверсі', en: '📱 The barometer on the ground floor' },
    plan: { uk: 'барометр на 1-му поверсі', en: 'the barometer on the ground floor' },
    name: { uk: '1-й поверх', en: 'the ground floor' },
  },
  ninth: {
    say: { uk: 'Їдемо ліфтом на 9-й поверх — на 8 поверхів вище, по 2,8 м — і знову дивимося на барометр.', en: 'Up in the lift to the ninth floor — 8 storeys of 2.8 m higher — and look at the barometer again.' },
    button: { uk: '🛗 Барометр на 9-му поверсі', en: '🛗 The barometer on the ninth floor' },
    plan: { uk: 'барометр на 9-му поверсі', en: 'the barometer on the ninth floor' },
    name: { uk: '9-й поверх', en: 'the ninth floor' },
  },
  airship: {
    say: { uk: 'А тепер — політ на дирижаблі над містом. Сучасні дирижаблі наповнюють негорючим гелієм. Не воднем, як «Гінденбург»: 6 травня 1937 року він спалахнув під час посадки в Лейкгерсті й згорів приблизно за пів хвилини. Фото палаючого «Гінденбурга» згодом стало обкладинкою першого альбому Led Zeppelin (1969). Дирижабль зазвичай летить на висоті 300 м — що показує барометр?', en: 'And now — a flight in an airship over the town. Airships today are filled with non-flammable helium. Not with hydrogen, as the Hindenburg was: on 6 May 1937 it caught fire landing at Lakehurst and burned in about half a minute. A photograph of the burning Hindenburg later became the cover of Led Zeppelin’s first album (1969). An airship usually flies 300 m up — what does the barometer show?' },
    button: { uk: '🎈 Дирижабль, 300 м', en: '🎈 The airship, 300 m' },
    plan: { uk: 'барометр у дирижаблі на 300 м', en: 'the barometer in the airship at 300 m' },
    name: { uk: 'дирижабль на 300 м', en: 'the airship at 300 m' },
  },
  high: {
    say: { uk: 'Дирижабль набирає висоту — до 2 км над містом.', en: 'The airship climbs — to 2 km over the town.' },
    button: { uk: '🎈 Дирижабль, 2 км', en: '🎈 The airship, 2 km' },
    plan: { uk: 'барометр у дирижаблі на 2 км', en: 'the barometer in the airship at 2 km' },
    name: { uk: 'дирижабль на 2 км', en: 'the airship at 2 km' },
  },
};
export const airPlaceName = (w: AirWhere) => WHERE[w].name;

export const AIR_TEXT: Record<AirCommand['type'], (c: AirCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.air': (x) => WHERE[(x as AirCommand).where],
};
