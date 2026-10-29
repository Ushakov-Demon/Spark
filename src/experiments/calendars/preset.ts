import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, INTERACTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { CALENDARS, daysText, dateText, equinoxDate, EQUINOX } from './bench.js';
import { tr } from '../../knowledge/i18n.js';
import { sig } from '../../explain/format.js';

/** Calendars old and new: the question, the steps — and the answer from what the run measured. */
export const preset: Preset = {
  ask: { uk: 'Шекспір і Сервантес померли 23 квітня 1616 року. Чи в один день?', en: 'Shakespeare and Cervantes died on 23 April 1616. On the same day?' },
  id: 'calendars',
  grade: 7,
  topic: INTERACTION,
  title: { uk: 'Давні й сучасні календарі', en: 'Calendars old and new' },
  question: {
    uk: 'Календар лічить цілі доби, а пори року задає Сонце: від весняного рівнодення до наступного минає 365,24219 доби — не ціле число. Змоделюємо давні й сучасні календарі й подивимося, як вони встигають за Сонцем. А наостанок загадка: Вільям Шекспір і Мігель де Сервантес обидва померли 23 квітня 1616 року. Чи в один день?',
    en: 'A calendar counts whole days, and the seasons go by the Sun: from one spring equinox to the next 365.24219 days pass — not a whole number. We model calendars old and new and see how they keep up with the Sun. And at the end, a riddle: William Shakespeare and Miguel de Cervantes both died on 23 April 1616. On the same day?',
  },
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'calendar',
  plan: (['egypt', 'julian', 'gregorian', 'bard'] as const).map((step) => ({ kind: 'bench', command: { type: 'lab.calendar', step } }) as const),
  choices: [ch('same', 'Так, в один день — дата ж однакова', 'Yes, on the same day — the date is the same'), ch('hours', 'Майже: різниця — кілька годин, через часові пояси', 'Nearly: a few hours apart, by the time zones'), ch('days', 'Ні, між ними понад десять днів', 'No, more than ten days apart')],
  trick: { uk: 'Більшість думає, що однакова дата — це той самий день.', en: 'Most people think the same date is the same day.' },
  answerOnBoard: ['cb:'],
  formulas: ['mechanics.calendar-drift'],
  programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'моделювання: руху планет; календарів' }],
  expect: 'reached',
};

export const answer = (run: PresetRun): PresetAnswer => {
  const recs = (run.readings ?? []).filter((x) => x.command.type === 'lab.calendar' && x.record.value !== null);
  const of = (step: string) => recs.filter((x) => x.command['step'] === step).map((x) => x.record);
  const egypt = of('egypt')[0];
  const julian = of('julian')[0];
  const [skip, gregorian] = of('gregorian');
  const bard = of('bard')[0];
  const gap = bard?.value ?? null;
  const correct = gap === null ? undefined : gap > 5 ? 'days' : gap > 0 ? 'hours' : 'same';
  return {
    ...(correct ? { correct } : {}),
    why: both((l) =>
      l === 'uk'
        ? 'Сонце не підлаштовується під календар: його рік — 365,24219 доби, а календар лічить цілі доби. Календар із 365 діб щороку не дораховує чверть доби — і пори року поволі пливуть його місяцями. Юліанський додає добу раз на чотири роки й трохи перебирає: на 11 хвилин щороку, на добу за 128 років. Григоріанський прибирає три високосні роки з чотирьох сотень — і помиляється на добу лише за понад три тисячі років.\n\nТому однакова дата в різних календарях — різні дні. 1616 року Іспанія вже жила за григоріанським календарем, а Англія — за юліанським, тож Шекспір помер на 11 днів пізніше за Сервантеса. Саме 23 квітня ЮНЕСКО 1995 року зробило Всесвітнім днем книги. А календарі змінюють і досі: Православна церква України 1 вересня 2023 року перейшла з юліанського на новоюліанський календар — у ньому рік 365,242 доби.'
        : 'The Sun does not fit itself to a calendar: its year is 365.24219 days, and a calendar counts whole days. A 365-day calendar falls a quarter of a day short each year — and the seasons slowly float through its months. The Julian one adds a day every four years and overshoots a little: by 11 minutes a year, a day in 128 years. The Gregorian one drops three leap years in four hundred — and is a day off only in over three thousand years.\n\nSo the same date in different calendars is a different day. In 1616 Spain already lived by the Gregorian calendar and England by the Julian, so Shakespeare died 11 days after Cervantes. It is 23 April that UNESCO made World Book Day in 1995. And calendars still change: the Orthodox Church of Ukraine moved from the Julian to the Revised Julian calendar on 1 September 2023 — with a year of 365.242 days.',
    ),
    say: both((l) => (gap === null ? '' : l === 'uk' ? `Однакова дата — ще не той самий день: між Сервантесом і Шекспіром — ${daysText(gap, true)}.` : `The same date is not the same day: ${daysText(gap, false)} between Cervantes and Shakespeare.`)),
    text: both((l) => {
      const uk = l === 'uk';
      const parts: string[] = [];
      if (egypt) parts.push(uk ? `${tr(CALENDARS.egypt.name, l)}: за ${egypt.inputs?.['years']} років весняне рівнодення переїхало на ${daysText(egypt.value!, true)} пізніше — з 21 березня на ${equinoxDate(EQUINOX + egypt.value!, true)}.` : `${tr(CALENDARS.egypt.name, l)}: in ${egypt.inputs?.['years']} years the spring equinox moved ${daysText(egypt.value!, false)} later — from 21 March to ${equinoxDate(EQUINOX + egypt.value!, false)}.`);
      if (julian) parts.push(uk ? `Юліанський: із 325 по 1582 рік — на ${daysText(-julian.value!, true)} раніше, на ${equinoxDate(EQUINOX + julian.value!, true)}.` : `The Julian: from 325 to 1582 — ${daysText(-julian.value!, false)} earlier, to ${equinoxDate(EQUINOX + julian.value!, false)}.`);
      if (skip && gregorian) parts.push(uk ? `Реформа 1582 року викреслила ${daysText(skip.value!, true, 'день')}; за ті самі ${gregorian.inputs?.['years']} років григоріанський календар зсуває рівнодення лише на ${daysText(-gregorian.value!, true)}, а на цілу добу — приблизно за ${Math.round((gregorian.inputs?.['oneDay'] ?? 0) / 100) * 100} років.` : `The 1582 reform struck out ${daysText(skip.value!, false)}; over the same ${gregorian.inputs?.['years']} years the Gregorian calendar moves the equinox only ${daysText(-gregorian.value!, false)}, and a whole day — in about ${Math.round((gregorian.inputs?.['oneDay'] ?? 0) / 100) * 100} years.`);
      if (bard && gap !== null) parts.push(uk ? `Сервантес помер 22 квітня за григоріанським календарем; Шекспір — 23 квітня за юліанським, а це ${dateText(bard.inputs?.['month'] ?? 5, bard.inputs?.['day'] ?? 3, true)} за григоріанським. Між ними — ${daysText(gap, true)}.` : `Cervantes died on 22 April by the Gregorian calendar; Shakespeare on 23 April by the Julian, which is ${dateText(bard.inputs?.['month'] ?? 5, bard.inputs?.['day'] ?? 3, false)} by the Gregorian. ${daysText(gap, false).replace(/^./, (x) => x.toUpperCase())} between them.`);
      return parts.join(' ');
    }),
  };
};
