/** What the experiment's card (its presets) and its run both use: light — no commands, no board. */
import { cite, sv } from '../../components/sourced.js';
import { NUMBER_LOCALE, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
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

export const wiki = (id: string, what: string, v: number) => cite(id, what, '—', v);
export type CalendarId = 'egypt' | 'julian' | 'gregorian';
/** The calendars' mean years, days. */
export const CALENDARS: Readonly<Record<CalendarId, { readonly name: LocalizedText; readonly year: SourcedValue }>> = {
  egypt: { name: msg('calendars-egypt-name'), year: sv(365, 'd', 'the Egyptian civil year', 'single-source', 0, [wiki('wikipedia-egyptian-calendar', 'The civil year comprised exactly 365 days … did not have any leap years', 365)]) },
  julian: { name: msg('calendars-julian-name'), year: sv(365.25, 'd', 'the Julian year', 'single-source', 0, [wiki('wikipedia-julian-calendar', 'an average year of 365.25 days; a leap day every fourth year (without exception)', 365.25)]) },
  gregorian: { name: msg('calendars-gregorian-name'), year: sv(365.2425, 'd', 'the Gregorian year', 'single-source', 0, [wiki('wikipedia-gregorian-calendar', '365.2425 days long rather than the Julian calendar’s 365+1⁄4 days', 365.2425)]) },
};
/** The equinox's date the model starts from: 21 March, as the day of March from its 1st (0). */
export const EQUINOX = 20;

/** «29,1 доби», «10 днів»… — days, in the form the number asks for: a day of 24 hours, or a calendar's day. */
export function daysText(n: number, l: Locale, word: 'доба' | 'день' = 'доба'): string {
  return t(l, word === 'доба' ? 'count-days' : 'count-days-calendar', { n: Math.round(n * 10) / 10 });
}
/** «19 квітня», «3 May»: a day of March counted from its 1st (0); or a month and a day. */
export function dateText(m: number, d: number, l: Locale): string {
  // The language's own month names, in the form a date takes («19 квітня»); a common year.
  return new Intl.DateTimeFormat(NUMBER_LOCALE[l], { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(Date.UTC(2001, m - 1, d));
}
/** The equinox's date from its day of March (0 — 1 March; past the 31st — April). */
export const equinoxDate = (day: number, l: Locale): string => {
  const d = Math.round(day) + 1;
  return d > 31 ? dateText(4, d - 31, l) : dateText(3, d, l);
};
