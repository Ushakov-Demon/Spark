import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import { tr, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import type { BoardAt, StepText } from '../types.js';
import { CALENDARS, daysText, dateText, equinoxDate, EQUINOX, SUN_YEAR, type CalendarCommand } from './bench.js';

/** The calendars' words: the steps' buttons and lines, the outcomes, the board. */


const STEP: Record<CalendarCommand['step'], StepText> = {
  egypt: {
    say: msg('calendars-egypt-say'),
    button: msg('calendars-egypt-button'),
    plan: msg('calendars-egypt-plan'),
  },
  julian: {
    say: msg('calendars-julian-say'),
    button: msg('calendars-julian-button'),
    plan: msg('calendars-julian-plan'),
  },
  gregorian: {
    say: msg('calendars-gregorian-say'),
    button: msg('calendars-gregorian-button'),
    plan: msg('calendars-gregorian-plan'),
  },
  bard: {
    say: msg('calendars-bard-say'),
    button: msg('calendars-bard-button'),
    plan: msg('calendars-bard-plan'),
  },
};


export const text = (c: CalendarCommand): StepText => STEP[c.step];

/** While the step plays: the years running; the days struck out; the London date carried over. */
export const busy = (c: CalendarCommand): LocalizedText =>
  c.step === 'gregorian'
    ? msg('calendars-busy')
    : c.step === 'bard'
      ? msg('calendars-busy-2')
      : msg('calendars-busy-3');

/** A step in words: «за 120 років рівнодення — на 29,1 доби пізніше, 19 квітня», the struck-out days, the two deaths. */
export function shown(c: CalendarCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const slide = (r: MeasurementRecord | undefined) => {
    if (!r) return '';
    const v = r.value ?? 0;
    const when = v >= 0 ? t(locale, 'calendars-slide-when') : t(locale, 'calendars-slide-when-2');
    return t(locale, 'calendars-shown-slide', { years: r.inputs?.['years'], v: daysText(Math.abs(v), locale), when, EQUINOX: equinoxDate(EQUINOX + v, locale) });
  };
  if (c.step === 'gregorian') return t(locale, 'calendars-shown-gregorian', { skip: daysText(recs[0]?.value ?? 0, locale, 'день'), slide: slide(recs[1]) });
  if (c.step === 'bard') {
    const r = recs[0];
    if (!r) return '';
    return t(locale, 'calendars-shown', { month: dateText(r.inputs?.['month'] ?? 5, r.inputs?.['day'] ?? 3, locale), value: daysText(r.value ?? 0, locale) });
  }
  return slide(recs[0]);
}

/** The board: each calendar's slide of the equinox, Δ = N·(T☉ − T); the struck-out days; Shakespeare and Cervantes. */
export function board(c: CalendarCommand, recs: readonly MeasurementRecord[], at: BoardAt): BoardLine[] {
  const { index: i, locale } = at;
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const T = (x: number) => n(x, 9);
  const out: BoardLine[] = [];
  const drift = (id: 'egypt' | 'julian' | 'gregorian', r: MeasurementRecord | undefined, key: string) => {
    if (!r) return;
    const N = r.inputs?.['years'] ?? 0;
    out.push({ id: `${key}:${i}`, title: t(locale, 'calendars-drift-title', { name: tr(CALENDARS[id].name, locale), N: String(N) }), formula: `Δ = N·(${T(SUN_YEAR.value)} − ${T(CALENDARS[id].year.value)})`, numbers: `${N} · ${T(SUN_YEAR.value - CALENDARS[id].year.value)} ≈ ${r.value! > 0 ? '+' : '−'}${daysText(Math.abs(r.value!), locale)}` });
  };
  if (c.step === 'egypt') drift('egypt', recs[0], 'ce');
  else if (c.step === 'julian') drift('julian', recs[0], 'cj');
  else if (c.step === 'gregorian') {
    out.push({ id: `cs:${i}`, title: t(locale, 'calendars-board-title'), formula: t(locale, 'calendars-board-formula'), numbers: daysText(recs[0]!.value!, locale, 'день') });
    drift('gregorian', recs[1], 'cg');
  } else if (c.step === 'bard') {
    out.push({ id: `cb:${i}`, title: t(locale, 'calendars-board-title-2'), formula: `${t(locale, 'calendars-board-formula-2')} = ${[recs[0]!.inputs?.['day'] ?? 0, recs[0]!.inputs?.['month'] ?? 0].map((x) => String(x).padStart(2, '0')).join('.')}.1616 (${t(locale, 'calendars-board-formula-3')})`, numbers: `Δ = ${daysText(recs[0]!.value!, locale)}` });
  }
  return out;
}
