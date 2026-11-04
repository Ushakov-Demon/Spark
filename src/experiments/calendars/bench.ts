import type { CommandHandler } from '../../core/commands.js';
import { err, ok } from '../../core/result.js';
import type { MeasurementRecord } from '../../core/trace.js';
import { sv } from '../../components/sourced.js';
import { msg } from '../../knowledge/messages.js';
import type { SourcedValue } from '../../knowledge/types.js';
import { wiki, type CalendarId, CALENDARS } from './shared.js';
export { type CalendarId, CALENDARS, EQUINOX, daysText, dateText, equinoxDate } from './shared.js';

/** The Sun's year: from one spring equinox to the next, days. */
export const SUN_YEAR: SourcedValue = sv(365.24219, 'd', 'the mean tropical year', 'single-source', 0, [wiki('wikipedia-gregorian-calendar', 'The mean tropical year is 365.24219 days long', 365.24219)]);
/** The Egyptian calendar runs this long in the model (four generations). */
export const EGYPT_YEARS = 120;
/** The Julian calendar: from the Council of Nicaea, when the equinox was reckoned on 21 March, to the reform. */
export const NICAEA = 325;
export const REFORM = 1582;

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
        return err(msg('calendars-calendar-command-apply'));
    }
  },
};
