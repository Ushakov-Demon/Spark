import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, INTERACTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { CALENDARS, daysText, dateText, equinoxDate, EQUINOX } from './bench.js';
import { tr } from '../../knowledge/i18n.js';
import { sig } from '../../explain/format.js';

/** Calendars old and new: the question, the steps — and the answer from what the run measured. */
export const preset: Preset = {
  ask: msg('calendars-ask'),
  id: 'calendars',
  grade: 7,
  topic: INTERACTION,
  title: msg('calendars-title'),
  question: msg('calendars-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'calendar',
  plan: (['egypt', 'julian', 'gregorian', 'bard'] as const).map((step) => ({ kind: 'bench', command: { type: 'lab.calendar', step } }) as const),
  choices: [ch('same', msg('calendars-choices')), ch('hours', msg('calendars-choices-2')), ch('days', msg('calendars-choices-3'))],
  trick: msg('calendars-trick'),
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
    why: msg('calendars-answer-why'),
    say: both((l) => (gap === null ? '' : t(l, 'calendars-answer-say', { gap: daysText(gap, l) }))),
    text: both((l) => {
      const parts: string[] = [];
      if (egypt) parts.push(t(l, 'calendars-answer-text', { name: tr(CALENDARS.egypt.name, l), years: egypt.inputs?.['years'], value: daysText(egypt.value!, l), EQUINOX: equinoxDate(EQUINOX + egypt.value!, l) }));
      if (julian) parts.push(t(l, 'calendars-answer-text-2', { value: daysText(-julian.value!, l), EQUINOX: equinoxDate(EQUINOX + julian.value!, l) }));
      if (skip && gregorian) parts.push(t(l, 'calendars-answer-reform', { skip: daysText(skip.value!, l, 'день'), years: gregorian.inputs?.['years'], drift: daysText(-gregorian.value!, l), oneDay: Math.round((gregorian.inputs?.['oneDay'] ?? 0) / 100) * 100 }));
      if (bard && gap !== null) parts.push(t(l, 'calendars-answer-bard', { date: dateText(bard.inputs?.['month'] ?? 5, bard.inputs?.['day'] ?? 3, l), gap: daysText(gap, l), Gap: daysText(gap, l).replace(/^./, (x) => x.toUpperCase()) }));
      return parts.join(' ');
    }),
  };
};
