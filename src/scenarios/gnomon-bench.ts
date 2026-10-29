import type { CommandHandler } from '../core/commands.js';
import { err, ok } from '../core/result.js';
import type { MeasurementRecord } from '../core/trace.js';
import { cite, sv } from '../components/sourced.js';
import type { LocalizedText } from '../knowledge/i18n.js';
import type { SourcedValue } from '../knowledge/types.js';

/**
 * The Sun's motion and the keeping of time (grade 7): on 20 March 2026 — the spring equinox, before the clocks went
 * to summer time on 29 March — a 1 m stick (a gnomon) stands upright in the school yard, and its shadow is measured
 * with a tape every half hour from 10:00 to 15:00 by the clock (Kyiv time, UTC+2). The shortest shadow is the true
 * noon: the Sun stands due south, highest. Equal shadows in the morning and the afternoon lie symmetric about it, so
 * the noon is the middle of their times (the method of equal altitudes). By the clock it is not 12:00: the zone's
 * clock keeps the time of the 30° meridian, the city lies east or west of it (4 minutes a degree), and the Earth's
 * uneven motion round the Sun adds the equation of time. From the noon shadow, the Sun's height h = arctan(H/L) and
 * the latitude φ = 90° − h + δ. The Sun's place: NOAA's general solar position formulas.
 */

/** The stick's height above the ground, m. */
export const GNOMON_HEIGHT = 1;
/** The tape: centimetres (the shadow's edge is blurred more than that anyway). */
export const GNOMON_DIVISION = 0.01;
/** The day: 20 March 2026, day 79 of a common year; the clocks keep Kyiv time, UTC+2. */
export const GNOMON_DAY = 79;
export const GNOMON_ZONE: SourcedValue = sv(2, 'h', 'Kyiv time on 20 March 2026', 'cross-checked', 0, [cite('wikipedia-time-in-ukraine', 'Eastern European Time (UTC+02:00), Kyiv Time', '—', 2), cite('zn-dst-2026', 'summer time from 03:00, 29 March 2026', '2026', 2)], 'Summer time (UTC+3) began only on 29 March.');

export type GnomonCity = 'kyiv' | 'lviv' | 'kharkiv';
export const GNOMON_CITIES: Readonly<Record<GnomonCity, { readonly lat: SourcedValue; readonly lon: SourcedValue; readonly name: LocalizedText; readonly in: LocalizedText }>> = {
  kyiv: { lat: sv(50.45, '°', 'Kyiv', 'single-source', 0, [cite('wikipedia-kyiv', '50°27′00″N', '—', 50.45)]), lon: sv(30.52333, '°', 'Kyiv', 'single-source', 0, [cite('wikipedia-kyiv', '30°31′24″E', '—', 30.52333)]), name: { uk: 'Київ', en: 'Kyiv' }, in: { uk: 'у Києві', en: 'in Kyiv' } },
  lviv: { lat: sv(49.8425, '°', 'Lviv', 'single-source', 0, [cite('wikipedia-lviv', '49°50′33″N', '—', 49.8425)]), lon: sv(24.03222, '°', 'Lviv', 'single-source', 0, [cite('wikipedia-lviv', '24°01′56″E', '—', 24.03222)]), name: { uk: 'Львів', en: 'Lviv' }, in: { uk: 'у Львові', en: 'in Lviv' } },
  kharkiv: { lat: sv(49.9925, '°', 'Kharkiv', 'single-source', 0, [cite('wikipedia-kharkiv', '49°59′33″N', '—', 49.9925)]), lon: sv(36.23111, '°', 'Kharkiv', 'single-source', 0, [cite('wikipedia-kharkiv', '36°13′52″E', '—', 36.23111)]), name: { uk: 'Харків', en: 'Kharkiv' }, in: { uk: 'у Харкові', en: 'in Kharkiv' } },
};

/** The three series of measurements, minutes after midnight by the clock. */
export const GNOMON_SERIES: Readonly<Record<'morning' | 'noon' | 'afternoon', readonly number[]>> = {
  morning: [600, 630, 660, 690],
  noon: [720, 750, 780],
  afternoon: [810, 840, 870, 900],
};

const rad = Math.PI / 180;
/** NOAA: the equation of time (min) and the Sun's declination (°) at a moment of the day (clock minutes). */
export function sunOf(clock: number): { eqtime: number; decl: number } {
  const utcHour = clock / 60 - GNOMON_ZONE.value;
  const g = ((2 * Math.PI) / 365) * (GNOMON_DAY - 1 + (utcHour - 12) / 24);
  const eqtime = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  return { eqtime, decl: decl / rad };
}
/** The Sun's height above the horizon (°) in the city at a clock time. */
export function sunHeight(city: GnomonCity, clock: number): number {
  const c = GNOMON_CITIES[city];
  const { eqtime, decl } = sunOf(clock);
  const tst = clock + eqtime + 4 * c.lon.value - 60 * GNOMON_ZONE.value;
  const ha = (tst / 4 - 180) * rad;
  const lat = c.lat.value * rad;
  const cz = Math.sin(lat) * Math.sin(decl * rad) + Math.cos(lat) * Math.cos(decl * rad) * Math.cos(ha);
  return 90 - Math.acos(cz) / rad;
}
/** The shadow of the stick, m. */
export const shadowOf = (city: GnomonCity, clock: number): number => GNOMON_HEIGHT / Math.tan(sunHeight(city, clock) * rad);
/** The true (solar) noon by the clock, minutes: NOAA's snoon, in the zone's time. */
export function solarNoon(city: GnomonCity): number {
  const lon = GNOMON_CITIES[city].lon.value;
  return 720 - 4 * lon - sunOf(720).eqtime + 60 * GNOMON_ZONE.value;
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

/** Measure the shadow at these clock times. */
export interface GnomonCommand {
  readonly type: 'lab.gnomon';
  readonly city: GnomonCity;
  readonly series: 'morning' | 'noon' | 'afternoon';
}

export const gnomonCommand: CommandHandler<GnomonCommand> = {
  type: 'lab.gnomon',
  apply(state, c) {
    if (!(c.city in GNOMON_CITIES) || !(c.series in GNOMON_SERIES)) return err({ uk: 'Такого міста чи серії в досліді немає.', en: 'No such city or series in the experiment.' });
    const trace: MeasurementRecord[] = GNOMON_SERIES[c.series].map((time) => {
      const L = shadowOf(c.city, time);
      return { kind: 'measurement', instrument: 'tape', quantity: 'length', value: Math.round(L / GNOMON_DIVISION) * GNOMON_DIVISION, exact: L, entities: [], inputs: { time, height: GNOMON_HEIGHT, sun: sunHeight(c.city, time), division: GNOMON_DIVISION } };
    });
    return ok({ state, kind: 'measurement', externalEnergy: 0, trace });
  },
};

export const GNOMON_COMMANDS = [gnomonCommand] as const;

/** «10:30». */
export const clockText = (minutes: number): string => {
  const m = Math.round(minutes);
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
};

export const GNOMON_TEXT: Record<GnomonCommand['type'], (c: GnomonCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  'lab.gnomon': (x) => {
    const c = x as GnomonCommand;
    const times = GNOMON_SERIES[c.series].map(clockText).join(', ');
    const what: Record<GnomonCommand['series'], { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
      morning: {
        say: { uk: `Ранок. Рулеткою міряємо тінь метрової палиці від її основи до кінця тіні — о ${times}.`, en: `Morning. With a tape we measure the metre stick's shadow from its foot to the shadow's end — at ${times}.` },
        button: { uk: '🌅 Тінь уранці', en: '🌅 The shadow in the morning' },
        plan: { uk: `тінь о ${times}`, en: `the shadow at ${times}` },
      },
      noon: {
        say: { uk: `Близько полудня: міряємо тінь о ${times}.`, en: `About noon: we measure the shadow at ${times}.` },
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
