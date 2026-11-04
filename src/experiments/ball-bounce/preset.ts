import { msg } from '../../knowledge/messages.js';
import { beaker, ch, room, WORK } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { defineCard } from '../types.js';

export const preset_ball_bounce: Preset = {
  ask: msg('ball-bounce-ask'),
  id: 'ball-bounce',
  grade: 7,
  topic: WORK,
  title: msg('ball-bounce-title'),
  question: msg('ball-bounce-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'bounce',
  plan: ([['pingpong', 1], ['pingpong', 2], ['pingpong', 3], ['tennis', 1], ['clay', 1]] as const).map(([ball, bounce]) => ({ kind: 'bench', command: { type: 'lab.bounce', ball, bounce } }) as const),
  choices: [ch('heat', msg('ball-bounce-choices')), ch('gone', msg('ball-bounce-choices-2')), ch('gravity', msg('ball-bounce-choices-3'))],
  formulas: ['mechanics.potential-energy'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 4. Механічна робота, потужність, енергія', match: 'same', quote: 'виявлення зміни і перетворення механічної енергії' },
    { program: 'ua-nus-2023-kreminskyi', grade: 8, topic: 'Тема 1. Момент сили. Механічна робота та енергія', match: 'related', quote: 'Механічна енергія та її види. Закон збереження та перетворення енергії.' },
  ],
  expect: 'reached',
};

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'bounce', setup: msg('ball-bounce-setup'), presets: [preset_ball_bounce] });
