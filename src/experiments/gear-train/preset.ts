import { msg } from '../../knowledge/messages.js';
import { beaker, ch, room, WORK } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { defineCard } from '../types.js';

export const preset_gear_train: Preset = {
  id: 'gear-train',
  ask: msg('gear-train-ask'),
  grade: 7,
  topic: WORK,
  title: msg('gear-train-title'),
  question: msg('gear-train-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'gears',
  plan: [
    { kind: 'bench', command: { type: 'lab.gears', step: 'count' } },
    { kind: 'bench', command: { type: 'lab.gears', step: 'turn', train: [24, 8], turns: 1 } },
    { kind: 'bench', command: { type: 'lab.gears', step: 'turn', train: [8, 40], turns: 5 } },
    { kind: 'bench', command: { type: 'lab.gears', step: 'turn', train: [24, 40, 8], turns: 1 } },
  ],
  choices: [
    ch('teeth', msg('gear-train-choices')),
    ch('same', msg('gear-train-choices-2')),
    ch('big', msg('gear-train-choices-3')),
  ],
  // The ratios and the directions are the answer: chalked in once a guess is made.
  answerOnBoard: ['gr:'],
  asides: [
    msg('gear-train-asides'),
  ],
  formulas: ['mechanics.gear-ratio'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 4. Механічна робота, потужність, енергія', match: 'same', quote: 'зміни швидкості й напряму руху ведучої частини механізму, що містить зубчасту передачу' },
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 4. Механічна робота, потужність, енергія', match: 'same', quote: 'моделювання й конструювання: простих механізмів; зубчастих передач' },
  ],
  expect: 'reached',
};

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'gears', setup: msg('gear-train-setup'), presets: [preset_gear_train] });
