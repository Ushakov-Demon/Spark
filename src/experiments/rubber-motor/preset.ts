import { msg } from '../../knowledge/messages.js';
import { beaker, ch, INTERACTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { RUBBER_TURNS } from './shared.js';
import { defineCard } from '../types.js';

export const preset_rubber_motor: Preset = {
  ask: msg('rubber-motor-ask'),
  id: 'rubber-motor',
  grade: 7,
  topic: INTERACTION,
  title: msg('rubber-motor-title'),
  question: msg('rubber-motor-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'rubber',
  plan: [{ kind: 'bench', command: { type: 'lab.rubber', step: 'band' } }, ...RUBBER_TURNS.map((turns) => ({ kind: 'bench', command: { type: 'lab.rubber', step: 'run', turns } }) as const)],
  choices: [ch('twice', msg('rubber-motor-choices')), ch('four', msg('rubber-motor-choices-2')), ch('same', msg('rubber-motor-choices-3'))],
  trick: msg('rubber-motor-trick'),
  answerOnBoard: ['rr:'],
  asides: [msg('rubber-motor-aside-penaud')],
  formulas: ['mechanics.hooke'],
  programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'конструювання: терез; динамометра; механізму на «гумовому двигуні»' }],
  expect: 'reached',
};

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'rubber', setup: msg('rubber-motor-setup'), presets: [preset_rubber_motor] });
