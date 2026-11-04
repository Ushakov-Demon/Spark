import { msg } from '../../knowledge/messages.js';
import { beaker, ch, INTERACTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { defineCard } from '../types.js';

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

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'calendar', setup: msg('calendars-setup'), presets: [preset] });
