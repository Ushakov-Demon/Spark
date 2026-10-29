import type { MeasurementRecord } from '../../core/trace.js';
import { sig } from '../../explain/format.js';
import { tr, type Locale, type LocalizedText } from '../../knowledge/i18n.js';
import type { BoardLine } from '../../scenarios/lab-board.js';
import type { BoardAt, StepText } from '../types.js';
import { CALENDARS, daysText, dateText, equinoxDate, EQUINOX, SUN_YEAR, type CalendarCommand } from './bench.js';

/** The calendars' words: the steps' buttons and lines, the outcomes, the board. */

export const setup: LocalizedText = { uk: 'Таблиця календарів (тривалість року в кожному), довжина року за Сонцем — від рівнодення до рівнодення, лічильник років; аркуші календарів 1582 і 1616 років', en: 'A table of calendars (the length of the year in each), the length of the year by the Sun — from equinox to equinox, a counter of years; calendar sheets of 1582 and 1616' };

const STEP: Record<CalendarCommand['step'], StepText> = {
  egypt: {
    say: { uk: 'Давні єгиптяни мали календар із 365 діб — без високосних років. А Сонце повертається до весняного рівнодення за 365,24219 доби. Запустимо такий календар на 120 років: куди переїде рівнодення?', en: 'The ancient Egyptians had a calendar of 365 days — with no leap years. And the Sun comes back to the spring equinox in 365.24219 days. We run such a calendar for 120 years: where will the equinox move?' },
    button: { uk: '🏺 Єгипетський календар: 365 діб', en: '🏺 The Egyptian calendar: 365 days' },
    plan: { uk: 'єгипетський календар на 120 років', en: 'the Egyptian calendar for 120 years' },
  },
  julian: {
    say: { uk: 'Юлій Цезар 46 року до н. е. запровадив календар (він діяв із 45 року), у якому кожен четвертий рік — високосний: у середньому 365,25 доби. 325 року весняне рівнодення вважали 21 березня. Запустимо юліанський календар до 1582 року.', en: 'In 46 BC Julius Caesar brought in a calendar (in force from 45 BC) in which every fourth year is a leap year: 365.25 days on average. In 325 the spring equinox was reckoned on 21 March. We run the Julian calendar on to 1582.' },
    button: { uk: '🏛 Юліанський календар: 365¼ доби', en: '🏛 The Julian calendar: 365¼ days' },
    plan: { uk: 'юліанський календар із 325 по 1582 рік', en: 'the Julian calendar from 325 to 1582' },
  },
  gregorian: {
    say: { uk: '1582 року календар виправили — за папи Григорія XIII. Спершу викреслили зайві дні: після четверга, 4 жовтня, настала п’ятниця, 15 жовтня. А тоді змінили правило: рік, що ділиться на 100, — не високосний, хіба що ділиться й на 400. Тож 1900 рік — не високосний, а 2000 — високосний. Скільки набіжить за ті самі 1257 років?', en: 'In 1582 the calendar was mended — under Pope Gregory XIII. First the extra days were struck out: Thursday 4 October was followed by Friday 15 October. Then the rule changed: a year divisible by 100 is not a leap year unless it is divisible by 400 too. So 1900 was not a leap year, and 2000 was. How much builds up over the same 1257 years?' },
    button: { uk: '✂ Григоріанська реформа', en: '✂ The Gregorian reform' },
    plan: { uk: 'григоріанська реформа', en: 'the Gregorian reform' },
  },
  bard: {
    say: { uk: 'Мігель де Сервантес помер 22 квітня 1616 року, а 23-го його поховали — цю дату й пам’ятають. Вільям Шекспір помер 23 квітня 1616 року. Але Іспанія вже жила за новим календарем, а Англія — ще за юліанським: на новий вона перейшла аж 1752 року. Переведемо обидві дати в один календар.', en: 'Miguel de Cervantes died on 22 April 1616 and was buried on the 23rd — the date that is remembered. William Shakespeare died on 23 April 1616. But Spain already lived by the new calendar, and England still by the Julian: it changed over only in 1752. We put both dates into one calendar.' },
    button: { uk: '✒ Шекспір і Сервантес', en: '✒ Shakespeare and Cervantes' },
    plan: { uk: 'Шекспір і Сервантес: в один календар', en: 'Shakespeare and Cervantes: into one calendar' },
  },
};


export const text = (c: CalendarCommand): StepText => STEP[c.step];

/** While the step plays: the years running; the days struck out; the London date carried over. */
export const busy = (c: CalendarCommand): LocalizedText =>
  c.step === 'gregorian'
    ? { uk: 'Викреслюємо дні з жовтня 1582 року…', en: 'Striking the days out of October 1582…' }
    : c.step === 'bard'
      ? { uk: 'Переводимо лондонську дату в григоріанський календар…', en: 'Carrying the London date over to the Gregorian calendar…' }
      : { uk: 'Роки біжать — стежимо, де рівнодення…', en: 'The years run on — watching where the equinox falls…' };

/** A step in words: «за 120 років рівнодення — на 29,1 доби пізніше, 19 квітня», the struck-out days, the two deaths. */
export function shown(c: CalendarCommand, recs: readonly MeasurementRecord[], locale: Locale): string {
  const uk = locale === 'uk';
  const slide = (r: MeasurementRecord | undefined) => {
    if (!r) return '';
    const v = r.value ?? 0;
    const when = v >= 0 ? (uk ? 'пізніше' : 'later') : uk ? 'раніше' : 'earlier';
    return uk ? `за ${r.inputs?.['years']} років рівнодення — на ${daysText(Math.abs(v), true)} ${when}, ${equinoxDate(EQUINOX + v, true)}` : `in ${r.inputs?.['years']} years the equinox — ${daysText(Math.abs(v), false)} ${when}, ${equinoxDate(EQUINOX + v, false)}`;
  };
  if (c.step === 'gregorian') return uk ? `викреслено ${daysText(recs[0]?.value ?? 0, true, 'день')}; ${slide(recs[1])}` : `${daysText(recs[0]?.value ?? 0, false)} struck out; ${slide(recs[1])}`;
  if (c.step === 'bard') {
    const r = recs[0];
    if (!r) return '';
    return uk ? `Сервантес — 22 квітня, Шекспір — ${dateText(r.inputs?.['month'] ?? 5, r.inputs?.['day'] ?? 3, true)} за григоріанським: ${daysText(r.value ?? 0, true)}` : `Cervantes — 22 April, Shakespeare — ${dateText(r.inputs?.['month'] ?? 5, r.inputs?.['day'] ?? 3, false)} by the Gregorian: ${daysText(r.value ?? 0, false)}`;
  }
  return slide(recs[0]);
}

/** The board: each calendar's slide of the equinox, Δ = N·(T☉ − T); the struck-out days; Shakespeare and Cervantes. */
export function board(c: CalendarCommand, recs: readonly MeasurementRecord[], at: BoardAt): BoardLine[] {
  const { index: i, locale } = at;
  const uk = locale === 'uk';
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const T = (x: number) => n(x, 9);
  const out: BoardLine[] = [];
  const drift = (id: 'egypt' | 'julian' | 'gregorian', r: MeasurementRecord | undefined, key: string) => {
    if (!r) return;
    const N = r.inputs?.['years'] ?? 0;
    out.push({ id: `${key}:${i}`, title: uk ? `${tr(CALENDARS[id].name, locale)}, ${N} років` : `${tr(CALENDARS[id].name, locale)}, ${N} years`, formula: `Δ = N·(${T(SUN_YEAR.value)} − ${T(CALENDARS[id].year.value)})`, numbers: `${N} · ${T(SUN_YEAR.value - CALENDARS[id].year.value)} ≈ ${r.value! > 0 ? '+' : '−'}${daysText(Math.abs(r.value!), uk)}` });
  };
  if (c.step === 'egypt') drift('egypt', recs[0], 'ce');
  else if (c.step === 'julian') drift('julian', recs[0], 'cj');
  else if (c.step === 'gregorian') {
    out.push({ id: `cs:${i}`, title: uk ? '1582: чт 4 жовтня → пт 15 жовтня' : '1582: Thu 4 October → Fri 15 October', formula: uk ? 'викреслено 5 … 14 жовтня' : 'struck out 5 … 14 October', numbers: daysText(recs[0]!.value!, uk, 'день') });
    drift('gregorian', recs[1], 'cg');
  } else if (c.step === 'bard') {
    out.push({ id: `cb:${i}`, title: uk ? 'Сервантес — 22.04 (григ.), Шекспір — 23.04 (юл.)' : 'Cervantes — 22.04 (Greg.), Shakespeare — 23.04 (Jul.)', formula: `${uk ? 'Шекспір' : 'Shakespeare'} = ${[recs[0]!.inputs?.['day'] ?? 0, recs[0]!.inputs?.['month'] ?? 0].map((x) => String(x).padStart(2, '0')).join('.')}.1616 (${uk ? 'григоріанський' : 'Gregorian'})`, numbers: `Δ = ${daysText(recs[0]!.value!, uk)}` });
  }
  return out;
}
