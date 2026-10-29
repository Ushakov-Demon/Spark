import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { cite, sv } from '../../components/sourced.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import type { SourcedValue } from '../../knowledge/types.js';

/**
 * A model of calendars, old and new (grade 7, «моделювання: … календарів»): a calendar counts whole days, and the
 * seasons go by the Sun — from one spring equinox to the next 365.24219 days pass. The model runs a calendar on for
 * years and watches the equinox's date slide by N·(T − T☉) days: the Egyptian one of 365 days, for 120 years — a
 * month later; the Julian one of 365¼, from 325 (the equinox on 21 March) to 1582 — ten days earlier. The Gregorian
 * reform strikes out ten days (Thursday 4 October 1582 is followed by Friday 15 October) and drops three leap years
 * in four hundred: 365.2425 days, a day off in some 3200 years. At last, the same date is not the same day:
 * Cervantes died on 22 April 1616 in Spain, by the new calendar; Shakespeare on 23 April in England, by the old.
 */

const wiki = (id: string, what: string, v: number) => cite(id, what, '—', v);
/** The Sun's year: from one spring equinox to the next, days. */
export const SUN_YEAR: SourcedValue = sv(365.24219, 'd', 'the mean tropical year', 'single-source', 0, [wiki('wikipedia-gregorian-calendar', 'The mean tropical year is 365.24219 days long', 365.24219)]);
export type CalendarId = 'egypt' | 'julian' | 'gregorian';
/** The calendars' mean years, days. */
export const CALENDARS: Readonly<Record<CalendarId, { readonly name: LocalizedText; readonly year: SourcedValue }>> = {
  egypt: { name: { uk: 'Єгипетський календар', en: 'The Egyptian calendar' }, year: sv(365, 'd', 'the Egyptian civil year', 'single-source', 0, [wiki('wikipedia-egyptian-calendar', 'The civil year comprised exactly 365 days … did not have any leap years', 365)]) },
  julian: { name: { uk: 'Юліанський календар', en: 'The Julian calendar' }, year: sv(365.25, 'd', 'the Julian year', 'single-source', 0, [wiki('wikipedia-julian-calendar', 'an average year of 365.25 days; a leap day every fourth year (without exception)', 365.25)]) },
  gregorian: { name: { uk: 'Григоріанський календар', en: 'The Gregorian calendar' }, year: sv(365.2425, 'd', 'the Gregorian year', 'single-source', 0, [wiki('wikipedia-gregorian-calendar', '365.2425 days long rather than the Julian calendar’s 365+1⁄4 days', 365.2425)]) },
};
/** The Egyptian calendar runs this long in the model (four generations). */
export const EGYPT_YEARS = 120;
/** The Julian calendar: from the Council of Nicaea, when the equinox was reckoned on 21 March, to the reform. */
export const NICAEA = 325;
export const REFORM = 1582;
/** The equinox's date the model starts from: 21 March, as the day of March from its 1st (0). */
export const EQUINOX = 20;

/** The day's number (Julian day number) of a date in the Gregorian calendar, and in the Julian. */
const pre = (y: number, m: number) => {
  const a = Math.floor((14 - m) / 12);
  return [y + 4800 - a, m + 12 * a - 3] as const;
};
export function gregorianDay(y: number, m: number, d: number): number {
  const [Y, M] = pre(y, m);
  return d + Math.floor((153 * M + 2) / 5) + 365 * Y + Math.floor(Y / 4) - Math.floor(Y / 100) + Math.floor(Y / 400) - 32045;
}
export function julianDay(y: number, m: number, d: number): number {
  const [Y, M] = pre(y, m);
  return d + Math.floor((153 * M + 2) / 5) + 365 * Y + Math.floor(Y / 4) - 32083;
}
/** The Gregorian date of a day's number. */
export function gregorianDate(n: number): { y: number; m: number; d: number } {
  const a = n + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  return { y: 100 * b + d - 4800 + Math.floor(m / 10), m: m + 3 - 12 * Math.floor(m / 10), d: e - Math.floor((153 * m + 2) / 5) + 1 };
}
/** The day of the week of a day's number: 0 — Monday … 6 — Sunday. */
export const weekday = (n: number): number => n % 7;
/** How far a calendar moves the equinox's date in N years, days: later (+) if its year is short of the Sun's. */
export const drift = (c: CalendarId, years: number): number => years * (SUN_YEAR.value - CALENDARS[c].year.value);

/** A step of the model: run the Egyptian, the Julian calendar on; the Gregorian reform; Shakespeare and Cervantes. */
export interface CalendarCommand {
  readonly type: 'lab.calendar';
  readonly step: 'egypt' | 'julian' | 'gregorian' | 'bard';
}

/** Tenths of a day (the equinox's slide); whole days (dates). */
const TENTH = 0.1;

export const calendarCommand: CommandHandler<CalendarCommand> = {
  type: 'lab.calendar',
  apply(state, c) {
    const rec = (value: number, division: number, inputs: Record<string, number>): MeasurementRecord => ({ kind: 'measurement', instrument: 'calculation', quantity: 'days', value: Math.round(value / division) * division, exact: value, entities: [], inputs: { ...inputs, division } });
    switch (c.step) {
      case 'egypt':
        return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [rec(drift('egypt', EGYPT_YEARS), TENTH, { years: EGYPT_YEARS, from: 0, year: CALENDARS.egypt.year.value })] });
      case 'julian':
        return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [rec(drift('julian', REFORM - NICAEA), TENTH, { years: REFORM - NICAEA, from: NICAEA, year: CALENDARS.julian.year.value })] });
      case 'gregorian': {
        // The day after Thursday 4 October (Julian) — its date in the new calendar; the days between are struck out.
        const next = gregorianDate(julianDay(REFORM, 10, 4) + 1);
        const years = REFORM - NICAEA;
        return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [rec(next.d - 5, 1, { next: next.d, weekday: weekday(julianDay(REFORM, 10, 4) + 1) }), rec(drift('gregorian', years), TENTH, { years, from: REFORM, year: CALENDARS.gregorian.year.value, oneDay: 1 / (CALENDARS.gregorian.year.value - SUN_YEAR.value) })] });
      }
      case 'bard': {
        const cervantes = gregorianDay(1616, 4, 22);
        const shakespeare = julianDay(1616, 4, 23);
        const s = gregorianDate(shakespeare);
        return ok({ state, kind: 'measurement', externalEnergy: 0, trace: [rec(shakespeare - cervantes, 1, { cervantes, shakespeare, month: s.m, day: s.d })] });
      }
      default:
        return err({ uk: 'Такого кроку в моделі немає.', en: 'No such step in the model.' });
    }
  },
};

/** «29,1 доби», «10 днів»… — days, the Ukrainian forms by the number. */
export function daysText(n: number, uk: boolean, word: 'доба' | 'день' = 'доба'): string {
  const v = new Intl.NumberFormat(uk ? 'uk-UA' : 'en-GB', { maximumFractionDigits: 1 }).format(n);
  if (!uk) return `${v} ${Math.abs(n) === 1 ? 'day' : 'days'}`;
  const a = Math.abs(n);
  const forms = word === 'доба' ? ['доба', 'доби', 'діб'] : ['день', 'дні', 'днів'];
  if (!Number.isInteger(a)) return `${v} ${word === 'доба' ? 'доби' : 'дня'}`;
  const k = a % 100 >= 11 && a % 100 <= 14 ? 2 : a % 10 === 1 ? 0 : a % 10 >= 2 && a % 10 <= 4 ? 1 : 2;
  return `${v} ${forms[k]}`;
}
/** «19 квітня», «3 May»: a day of March counted from its 1st (0); or a month and a day. */
export function dateText(m: number, d: number, uk: boolean): string {
  const ukm = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];
  const enm = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return uk ? `${d} ${ukm[m - 1]}` : `${d} ${enm[m - 1]}`;
}
/** The equinox's date from its day of March (0 — 1 March; past the 31st — April). */
export const equinoxDate = (day: number, uk: boolean): string => {
  const d = Math.round(day) + 1;
  return d > 31 ? dateText(4, d - 31, uk) : dateText(3, d, uk);
};
