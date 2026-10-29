import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import { parsePlace, type Place } from '../../scenarios/place.js';
import { zoneOffset } from '../../scenarios/place-time.js';

/**
 * The Sun's motion and the keeping of time (grade 7): on 20 March 2026 — the spring equinox — a 1 m stick (a gnomon)
 * stands upright in a school yard, and its shadow is measured with a tape every half hour by the local clock. The
 * shortest shadow is the true noon: the Sun stands highest, due south (south of the tropics in the north; due north
 * in the south). Equal shadows in the morning and the afternoon lie symmetric about it, so the noon is the middle of
 * their times (the method of equal altitudes). By the clock it is not 12:00: the zone's clock keeps the time of one
 * meridian (15° an hour from Greenwich), the town lies east or west of it (4 minutes a degree), summer time moves the
 * clock an hour on, and the Earth's uneven motion round the Sun adds the equation of time. From the noon shadow, the
 * Sun's height h = arctan(H/L) and the latitude: φ = 90° − h + δ when the shadow points north, φ = δ − (90° − h) when
 * south. The Sun's place: NOAA's general solar position formulas; the clock: the place's time zone.
 */

/** The stick's height above the ground, m. */
export const GNOMON_HEIGHT = 1;
/** The tape: centimetres (the shadow's edge is blurred more than that anyway). */
export const GNOMON_DIVISION = 0.01;
/** The day: 20 March 2026, day 79 of a common year. */
export const GNOMON_DAY = 79;
const DAY_UTC_NOON = Date.UTC(2026, 2, 20, 12);
/** Without a place: Kyiv (Wikipedia: 50°27′N 30°31′E). */
const KYIV: Place = { name: 'Київ', lat: 50.45, lon: 30.5233, elevation: 179, zone: 'Europe/Kyiv' };

export const gnomonPlace = (value: string | undefined): Place => parsePlace(value) ?? KYIV;
/** The place's clock on the day, hours from UTC; and whether that is summer time (more than in January). */
export function gnomonClock(place: Place): { zone: number; summer: boolean } {
  const zone = zoneOffset(place, DAY_UTC_NOON);
  return { zone, summer: zone > zoneOffset(place, Date.UTC(2026, 0, 15, 12)) };
}

const rad = Math.PI / 180;
/** NOAA: the equation of time (min) and the Sun's declination (°) at a moment of the day (clock minutes, the zone). */
export function sunOf(clock: number, zone: number): { eqtime: number; decl: number } {
  const utcHour = clock / 60 - zone;
  const g = ((2 * Math.PI) / 365) * (GNOMON_DAY - 1 + (utcHour - 12) / 24);
  const eqtime = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  return { eqtime, decl: decl / rad };
}
/** The Sun's height above the horizon (°) at a clock time. */
export function sunHeight(place: Place, clock: number): number {
  const { zone } = gnomonClock(place);
  const { eqtime, decl } = sunOf(clock, zone);
  const tst = clock + eqtime + 4 * place.lon - 60 * zone;
  const ha = (tst / 4 - 180) * rad;
  const lat = place.lat * rad;
  const cz = Math.sin(lat) * Math.sin(decl * rad) + Math.cos(lat) * Math.cos(decl * rad) * Math.cos(ha);
  return 90 - Math.acos(cz) / rad;
}
/** The stick's shadow, m (none while the Sun is down). */
export const shadowOf = (place: Place, clock: number): number | null => {
  const h = sunHeight(place, clock);
  return h > 1 ? GNOMON_HEIGHT / Math.tan(h * rad) : null;
};
/** The true (solar) noon by the clock, minutes: NOAA's snoon, in the zone's time. */
export function solarNoon(place: Place): number {
  const { zone } = gnomonClock(place);
  return 720 - 4 * place.lon - sunOf(720, zone).eqtime + 60 * zone;
}

export type GnomonSeries = 'morning' | 'noon' | 'afternoon';
/** The times of the three series, clock minutes: every half hour from two hours before the noon's half hour to three after. */
export function gnomonTimes(place: Place): Record<GnomonSeries, number[]> {
  const start = Math.floor(solarNoon(place) / 30) * 30 - 120;
  const t = Array.from({ length: 11 }, (_, i) => start + 30 * i);
  return { morning: t.slice(0, 4), noon: t.slice(4, 7), afternoon: t.slice(7) };
}

/** The noon found from the readings: each morning shadow's twin in the afternoon (interpolated), the middle of their times. */
export function equalShadowsNoon(readings: readonly { time: number; length: number }[]): { noon: number; pairs: { t1: number; t2: number; length: number }[] } | null {
  const sorted = [...readings].sort((a, b) => a.time - b.time);
  const min = Math.min(...sorted.map((r) => r.length));
  const pairs: { t1: number; t2: number; length: number }[] = [];
  for (const [i, r] of sorted.entries()) {
    // Only shadows well longer than the shortest: near noon they hardly change, and a centimetre is minutes there.
    if (r.length - min < 0.05) continue;
    const after = sorted.slice(i + 1);
    const k = after.findIndex((x, j) => j > 0 && after[j - 1]!.length < r.length && x.length >= r.length);
    if (k < 0) continue;
    const a = after[k - 1]!;
    const b = after[k]!;
    if (a.length === b.length) continue;
    const t2 = a.time + ((r.length - a.length) / (b.length - a.length)) * (b.time - a.time);
    pairs.push({ t1: r.time, t2, length: r.length });
  }
  if (!pairs.length) return null;
  return { noon: pairs.reduce((s, p) => s + (p.t1 + p.t2) / 2, 0) / pairs.length, pairs };
}
/** The latitude from the noon Sun: the shadow to the north — φ = 90° − h + δ; to the south — φ = δ − (90° − h). */
export const latitudeFrom = (h: number, decl: number, south: boolean): number => (south ? decl - (90 - h) : 90 - h + decl);

/** Measure the shadow at the series' times, in the place (a place control's value). */
export interface GnomonCommand {
  readonly type: 'lab.gnomon';
  readonly place: string;
  readonly series: GnomonSeries;
}

export const gnomonCommand: CommandHandler<GnomonCommand> = {
  type: 'lab.gnomon',
  apply(state, c) {
    if (!(c.series in { morning: 1, noon: 1, afternoon: 1 })) return err({ uk: 'Такої серії в досліді немає.', en: 'No such series in the experiment.' });
    const place = gnomonPlace(c.place);
    const { zone } = gnomonClock(place);
    const trace: MeasurementRecord[] = gnomonTimes(place)[c.series].map((time) => {
      const L = shadowOf(place, time);
      // (The shadow points away from the Sun: north while the Sun is south of the zenith at noon.)
      const south = place.lat < sunOf(time, zone).decl ? 1 : 0;
      return { kind: 'measurement', instrument: 'tape', quantity: 'length', value: L === null ? null : Math.round(L / GNOMON_DIVISION) * GNOMON_DIVISION, exact: L ?? 0, entities: [], inputs: { time, height: GNOMON_HEIGHT, sun: sunHeight(place, time), zone, south, division: GNOMON_DIVISION } };
    });
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace });
  },
};

export const GNOMON_COMMANDS = [gnomonCommand] as const;

/** «10:30». */
export const clockText = (minutes: number): string => {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
};

export const GNOMON_TEXT: Record<GnomonCommand['type'], (c: GnomonCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.gnomon': (x) => {
    const c = x as GnomonCommand;
    const times = gnomonTimes(gnomonPlace(c.place))[c.series].map(clockText).join(', ');
    const what: Record<GnomonSeries, { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
      morning: {
        say: { uk: `Ранок. Рулеткою міряємо тінь метрової палиці від її основи до кінця тіні — о ${times}.`, en: `Morning. With a tape we measure the metre stick's shadow from its foot to the shadow's end — at ${times}.` },
        button: { uk: '🌅 Тінь уранці', en: '🌅 The shadow in the morning' },
        plan: { uk: `тінь о ${times}`, en: `the shadow at ${times}` },
      },
      noon: {
        say: { uk: `Далі — о ${times}.`, en: `Then — at ${times}.` },
        button: { uk: '☀ Тінь опівдні', en: '☀ The shadow about noon' },
        plan: { uk: `тінь о ${times}`, en: `the shadow at ${times}` },
      },
      afternoon: {
        say: { uk: `Після полудня — ще чотири заміри: о ${times}.`, en: `After noon — four more: at ${times}.` },
        button: { uk: '🌇 Тінь після полудня', en: '🌇 The shadow in the afternoon' },
        plan: { uk: `тінь о ${times}`, en: `the shadow at ${times}` },
      },
    };
    return what[c.series];
  },
};
