import { msg } from '../../knowledge/messages.js';
import { beaker, ch, INTERACTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { defineCard } from '../types.js';

/** The root knows which way is down: the question, the steps, the stories — and the answer from the photos. */
export const preset: Preset = {
  ask: msg('roots-gravity-ask'),
  id: 'roots-gravity',
  grade: 7,
  topic: INTERACTION,
  title: msg('roots-gravity-title'),
  question: msg('roots-gravity-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'gravi',
  plan: (['upright', 'side', 'clino'] as const).map((step) => ({ kind: 'bench', command: { type: 'lab.gravi', step } }) as const),
  choices: [ch('down', msg('roots-gravity-choices')), ch('straight', msg('roots-gravity-choices-2')), ch('up', msg('roots-gravity-choices-3'))],
  answerOnBoard: ['gr:'],
  asides: [
    msg('roots-gravity-asides'),
    msg('roots-gravity-asides-2'),
    msg('roots-gravity-asides-3'),
  ],
  formulas: ['mechanics.density', 'mechanics.weight'],
  programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'впливу земного тяжіння на організми' }],
  expect: 'reached',
};

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'gravi', setup: msg('roots-gravity-setup'), presets: [preset] });
