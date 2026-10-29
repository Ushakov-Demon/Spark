import { CALENDARS, daysText, EQUINOX, gregorianDay, julianDay, NICAEA, REFORM } from '../../../src/experiments/calendars/bench.js';
import { tr } from '../../../src/knowledge/i18n.js';
import { readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/**
 * Calendars: the equinox's slide — a tape of days from 1 March to 30 April, the Sun on its date, the years counting
 * (`year`, written `yearFmt[0]` + year + `yearFmt[1]`; `sun`, `start` — days of March from its 1st); October 1582 —
 * the days 5–14 struck out one by one (`cut` 0…1; 2 — the month as it was, without them); 1616 — April's sheets of
 * Madrid and London, and one tape of the Gregorian calendar the London date moves over to (`shift` 0…1).
 */
export type CalendarView = { readonly view: 'drift' | 'october' | 'bard'; readonly title: string; readonly sub?: string; /** October's sheet's title. */ readonly month?: string; readonly months: readonly string[]; readonly weekdays: readonly string[]; readonly year?: number; readonly yearFmt?: readonly [string, string]; readonly sun?: number; readonly start?: number; readonly startNote?: string; readonly cut?: number; readonly shift?: number; readonly names?: readonly [string, string]; readonly sheets?: readonly [string, string]; readonly strip?: string; readonly read?: string; /** The step just done, to be played. */ readonly anim?: 'egypt' | 'julian' | 'gregorian' | 'bard' };

/** The calendar of this step (or the next one) running on; October 1582; Shakespeare and Cervantes. */
function view({ command, last, plan, locale }: SceneContext): CalendarView {
  const uk = locale === 'uk';
  type Step = 'egypt' | 'julian' | 'gregorian' | 'bard';
  const cc = command?.type === 'lab.calendar' ? (command as unknown as { step: Step }).step : undefined;
  const next = plan.find((s) => s.kind === 'bench' && s.command.type === 'lab.calendar');
  const step: Step = cc ?? (next?.kind === 'bench' ? (next.command as unknown as { step: Step }).step : 'egypt');
  const recs = cc && last ? readingsOf([last]).map((x) => x.record) : [];
  const months = uk ? ['січ.', 'лют.', 'бер.', 'квіт.', 'трав.', 'черв.', 'лип.', 'серп.', 'вер.', 'жовт.', 'лист.', 'груд.'] : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const weekdays = uk ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'] : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  const anim = cc ? { anim: cc } : {};
  if (step === 'bard') {
    return { view: 'bard', title: '', months, weekdays, names: uk ? ['Сервантес', 'Шекспір'] : ['Cervantes', 'Shakespeare'], sheets: uk ? ['Мадрид · григоріанський', 'Лондон · юліанський'] : ['Madrid · Gregorian', 'London · Julian'], strip: uk ? '1616 рік за григоріанським календарем' : '1616 by the Gregorian calendar', shift: cc ? 1 : 0, ...(recs[0] ? { read: daysText(recs[0].value ?? 0, uk) } : {}), ...anim };
  }
  const id = step;
  const r = id === 'gregorian' ? recs[1] : recs[0];
  const from = id === 'egypt' ? 0 : id === 'julian' ? NICAEA : REFORM;
  const years = r?.inputs?.['years'] ?? 0;
  const yearFmt: [string, string] = id === 'egypt' ? [uk ? 'рік ' : 'year ', ''] : uk ? ['', ' р.'] : ['', ''];
  const Y = CALENDARS[id].year.value;
  const title = tr(CALENDARS[id].name, locale);
  const sub = `${uk ? 'рік —' : 'a year of'} ${new Intl.NumberFormat(uk ? 'uk-UA' : 'en-GB', { maximumFractionDigits: 4 }).format(Y)} ${uk ? (Number.isInteger(Y) ? 'діб' : 'доби') : 'days'}`;
  const startNote = `21 ${months[2]} · ${yearFmt[0]}${from}${yearFmt[1]}`;
  return { view: 'drift', title, sub, month: uk ? 'Жовтень 1582 року' : 'October 1582', months, weekdays, year: from + years, yearFmt, start: EQUINOX, sun: EQUINOX + (r?.value ?? 0), startNote, ...(id === 'gregorian' ? { cut: 2 } : {}), ...(r ? { read: `${(r.value ?? 0) >= 0 ? '+' : '−'}${daysText(Math.abs(r.value ?? 0), uk)}` } : {}), ...anim };
}

/** Paper and ink of the calendar sheets; the Sun; the two men's colours. */
const PAPER = '#f7f2e4';
const INK = '#2b2f36';
const RED_INK = '#c0392b';
const BLUE_INK = '#2e6fb5';
const ink = (x: number, y: number, t: string | number, size = 11, extra = '') => `<text x="${x}" y="${y}" text-anchor="middle" style="font:${size}px system-ui,sans-serif;fill:${INK};${extra}">${t}</text>`;
const sunAt = (x: number, y: number) => `${Array.from({ length: 8 }, (_, k) => { const a = (k * Math.PI) / 4; return `<path d="M${x + 13 * Math.cos(a)},${y + 13 * Math.sin(a)} L${x + 18 * Math.cos(a)},${y + 18 * Math.sin(a)}" style="stroke:#f0a500;stroke-width:2"/>`; }).join('')}<circle cx="${x}" cy="${y}" r="10" style="fill:#ffd54a;stroke:#f0a500;stroke-width:1.5"/>`;
/** A month's sheet: `days` of it from weekday `first` (0 — Monday), cells `w`×`h` from (x, y); `mark` — the cell to ring. */
function monthGrid(x: number, y: number, w: number, h: number, weekdays: readonly string[], cells: readonly { day: number; at: number; style?: string }[]): string {
  const head = weekdays.map((d, k) => ink(x + w * k + w / 2, y, d, 9, k >= 5 ? `fill:${RED_INK}` : '')).join('');
  return head + cells.map((c) => ink(x + w * (c.at % 7) + w / 2, y + h * (1 + Math.floor(c.at / 7)), c.day, Math.min(12, h * 0.6), c.style ?? '')).join('');
}

/**
 * Calendars, on the right half of the board (its left half keeps the board's lines). The slide: a tape of the days of
 * March and April, a dashed mark where the equinox was, the Sun where it is now, the years running on, a bracket with
 * the slide. October 1582: its sheet, the days 5–14 crossed out, then the month without them. 1616: April in Madrid
 * (Gregorian) and in London (Julian), each with its day ringed; below, one Gregorian tape.
 */
function calendarSvg(c: CalendarView): string {
  const sheet = (x: number, y: number, w: number, h: number) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" style="fill:${PAPER};stroke:#b9ae92;stroke-width:1"/>`;
  const cx = 464;
  if (c.view === 'drift') {
    const x0 = 326;
    const dx = 276 / 61;
    const at = (day: number) => x0 + (day + 0.5) * dx;
    const y = 212;
    const tape = `<rect x="${x0}" y="${y}" width="${31 * dx}" height="12" style="fill:#dcebc9"/><rect x="${x0 + 31 * dx}" y="${y}" width="${30 * dx}" height="12" style="fill:#cfe0f0"/>${Array.from({ length: 62 }, (_, d) => `<path d="M${x0 + d * dx},${y} v${d === 0 || d === 31 || d === 61 ? 18 : d % 5 === 0 ? 8 : 4}" style="stroke:#55606b;stroke-width:${d === 31 ? 1.4 : 0.6}"/>`).join('')}`;
    const nums = [0, 10, 20, 31, 41, 51].map((d) => ink(at(d), y + 28, d < 31 ? d + 1 : d - 30, 10)).join('');
    const months = ink(x0 + 15.5 * dx, y + 43, c.months[2]!, 10, 'font-weight:600') + ink(x0 + 46 * dx, y + 43, c.months[3]!, 10, 'font-weight:600');
    const start = c.start ?? 20;
    const ghost = `<path d="M${at(start)},${y - 62} V${y}" style="stroke:#8a7f66;stroke-width:1.2;stroke-dasharray:3 3"/>${c.startNote ? ink(at(start), y - 66, c.startNote, 10, 'fill:#6b6250') : ''}`;
    const sun = c.sun ?? start;
    const d = Math.round(sun) + 1;
    const date = d > 31 ? `${d - 31} ${c.months[3]}` : d >= 1 ? `${d} ${c.months[2]}` : '';
    const year = c.year === undefined ? '' : ink(cx, 122, `${c.yearFmt?.[0] ?? ''}${Math.round(c.year)}${c.yearFmt?.[1] ?? ''}`, 22, 'font-weight:700');
    const bracket = c.read ? `<path d="M${at(start)},${y + 50} v6 H${at(sun)} v-6" style="fill:none;stroke:${INK};stroke-width:1.2"/>${ink(cx, y + 70, c.read, 11, 'font-weight:700')}` : '';
    return `${sheet(316, 50, 296, 240)}${ink(cx, 72, c.title, 13, 'font-weight:700')}${c.sub ? ink(cx, 89, c.sub, 11) : ''}${year}${tape}${nums}${months}${ghost}${sunAt(at(sun), y - 24)}${ink(at(sun), y - 46, date, 11, 'font-weight:600')}${bracket}`;
  }
  if (c.view === 'october') {
    const x = 338;
    const w = 36;
    const h = 30;
    const top = 106;
    const cut = c.cut ?? 0;
    const cell = (i: number) => [x + w * (i % 7) + w / 2, top + h * (1 + Math.floor(i / 7)) - 4] as const;
    // (1 October 1582 was a Monday.) Before the cut, the whole month; after — 15 straight after 4.
    const cells = cut >= 2
      ? Array.from({ length: 31 }, (_, i) => i + 1).filter((d) => d < 5 || d > 14).map((d, i) => ({ day: d, at: i, style: d === 4 || d === 15 ? 'font-weight:700' : '' }))
      : Array.from({ length: 31 }, (_, i) => ({ day: i + 1, at: i, style: i + 1 >= 5 && i + 1 <= 14 && i + 1 - 5 < cut * 10 ? 'fill:#a39c8c' : '' }));
    const crosses = cut >= 2 ? '' : Array.from({ length: 10 }, (_, k) => k).filter((k) => k < cut * 10).map((k) => { const [px, py] = cell(4 + k); return `<path d="M${px - 10},${py - 8} L${px + 10},${py + 6} M${px + 10},${py - 8} L${px - 10},${py + 6}" style="stroke:${RED_INK};stroke-width:2"/>`; }).join('');
    const ring = (i: number) => { const [px, py] = cell(i); return `<circle cx="${px}" cy="${py}" r="12" style="fill:none;stroke:${BLUE_INK};stroke-width:1.6"/>`; };
    const jump = cut >= 2 ? `${ring(3)}${ring(4)}` : '';
    return `${sheet(326, 50, 276, 236)}${ink(cx, 78, c.month ?? '', 14, 'font-weight:700')}${monthGrid(x, top, w, h, c.weekdays, cells)}${crosses}${jump}`;
  }
  // 1616: the two Aprils (1 April: a Friday in Madrid's calendar, a Monday in London's), then the one tape.
  const w = 19;
  const h = 17;
  const april = (x: number, gregorian: boolean, mark: number, color: string, title: string) => {
    const first = (gregorian ? gregorianDay(1616, 4, 1) : julianDay(1616, 4, 1)) % 7;
    const cells = Array.from({ length: 30 }, (_, i) => ({ day: i + 1, at: first + i, style: i + 1 === mark ? `font-weight:700;fill:${color}` : '' }));
    const i = first + mark - 1;
    return `${sheet(x - 6, 34, 7 * w + 12, 162)}${ink(x + 3.5 * w, 52, title, 10, 'font-weight:700')}${monthGrid(x, 70, w, h, c.weekdays, cells)}<circle cx="${x + w * (i % 7) + w / 2}" cy="${70 + h * (1 + Math.floor(i / 7)) - 4}" r="9" style="fill:none;stroke:${color};stroke-width:1.6"/>`;
  };
  const names = c.names ?? ['', ''];
  const sheets = c.sheets ?? ['', ''];
  const x0 = 326;
  const dx = 276 / 20;
  // The tape: 18 April … 7 May, Gregorian.
  const at = (k: number) => x0 + (k + 0.5) * dx;
  const y = 250;
  const tape = `<rect x="${x0}" y="${y}" width="${13 * dx}" height="12" style="fill:#dcebc9"/><rect x="${x0 + 13 * dx}" y="${y}" width="${7 * dx}" height="12" style="fill:#f3e3c4"/>${Array.from({ length: 20 }, (_, k) => ink(at(k), y + 24, k < 13 ? 18 + k : k - 12, 9)).join('')}`;
  const shift = c.shift ?? 0;
  const s = 5 + 10 * shift;
  const marks = `<circle cx="${at(4)}" cy="${y + 6}" r="5.5" style="fill:${RED_INK}"/><text x="${at(4) + 2}" y="${y - 6}" text-anchor="end" style="font:700 10px system-ui,sans-serif;fill:${RED_INK}">${names[0]}</text><circle cx="${at(s)}" cy="${y + 6}" r="5.5" style="fill:${BLUE_INK}"/><text x="${at(s) - 2}" y="${y - 6}" style="font:700 10px system-ui,sans-serif;fill:${BLUE_INK}">${names[1]}</text>`;
  const gap = shift >= 1 && c.read ? `<path d="M${at(4)},${y + 30} v5 H${at(15)} v-5" style="fill:none;stroke:${INK};stroke-width:1.2"/>${ink((at(4) + at(15)) / 2, y + 48, c.read, 11, 'font-weight:700')}` : '';
  return `${april(322, true, 22, RED_INK, sheets[0])}${april(470, false, 23, BLUE_INK, sheets[1])}${sheet(316, 206, 296, 108)}${c.strip ? ink(cx, 224, c.strip, 10, 'fill:#6b6250') : ''}${tape}${marks}${gap}`;
}

/**
 * Calendars: the years running on and the Sun sliding over the days (4 s); the reform — October's days crossed out
 * one by one, the month closing up, then the Sun back to 21 March and the new calendar's years; 1616 — a pause on the
 * two sheets, then the London date carried along the Gregorian tape.
 */
function calendarRun(c: CalendarView, draw: (v: CalendarView) => void): Motion | null {
  if (!c.anim) return null;
  const anim = c.anim;
  const length = anim === 'gregorian' ? 8 : 4;
  const clock = new Channel(0, length, { kind: 'steady', speed: 1 }, 1e-4);
  const { anim: _a, read: _r, ...rest } = c;
  const from = c.yearFmt && c.year !== undefined ? (anim === 'gregorian' ? 1582 : anim === 'julian' ? 325 : 0) : 0;
  const start = c.start ?? 20;
  return {
    channels: [clock],
    frame: (done) => {
      if (done) return draw({ ...rest, ...(c.read ? { read: c.read } : {}) });
      const t = Number.isFinite(clock.value) ? clock.value : 0;
      if (anim === 'bard') return draw({ ...rest, shift: Math.max(0, Math.min(1, (t - 1) / 2.5)) });
      if (anim === 'gregorian' && t < 4) return draw({ ...rest, view: 'october', cut: t < 3 ? t / 3 : 2 });
      // (The reform: 1 s for the Sun back to its place, then the years.)
      const u = anim === 'gregorian' ? t - 4 : t;
      const back = anim === 'gregorian' ? Math.min(1, u) : 1;
      const run = anim === 'gregorian' ? Math.max(0, Math.min(1, (u - 1) / 3)) : Math.min(1, u / 4);
      const year = from + run * ((c.year ?? 0) - from);
      const sun = (anim === 'gregorian' ? start - 10 + 10 * back : start) + run * ((c.sun ?? start) - start);
      draw({ ...rest, year, sun });
    },
  };
}

export const calendarScene = defineScene({ kind: 'calendar', view, svg: calendarSvg, motion: calendarRun });
