import { msg } from '../../knowledge/messages.js';
import { beaker, ch, INTERACTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { defineCard } from '../types.js';

export const preset_dyno_diy: Preset = {
  ask: msg('dyno-diy-ask'),
  id: 'dyno-diy',
  grade: 7,
  topic: INTERACTION,
  title: msg('dyno-diy-title'),
  question: msg('dyno-diy-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'dyno',
  plan: (['marks', 'scale', 'apple', 'egg'] as const).map((step) => ({ kind: 'bench', command: { type: 'lab.dyno', step } }) as const),
  choices: [ch('one', msg('dyno-diy-choices')), ch('hundred', msg('dyno-diy-choices-2')), ch('tenth', msg('dyno-diy-choices-3'))],
  trick: msg('dyno-diy-trick'),
  answerOnBoard: ['da:'],
  formulas: ['mechanics.weight', 'mechanics.hooke'],
  programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'конструювання: терез; динамометра' }],
  expect: 'reached',
};

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'dyno', setup: msg('dyno-diy-setup'), presets: [preset_dyno_diy] });
