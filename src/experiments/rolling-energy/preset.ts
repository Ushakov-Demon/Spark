import { msg } from '../../knowledge/messages.js';
import { beaker, ch, room, WORK } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { defineCard } from '../types.js';

export const preset_rolling_energy: Preset = {
  id: 'rolling-energy',
  ask: msg('rolling-energy-ask'),
  grade: 7,
  topic: WORK,
  title: msg('rolling-energy-title'),
  question: msg('rolling-energy-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'energy',
  plan: [{ kind: 'bench', command: { type: 'lab.energy', step: 'weigh' } }, ...[0.05, 0.1, 0.2].map((height) => ({ kind: 'bench', command: { type: 'lab.energy', step: 'roll', height } }) as const)],
  choices: [
    ch('all', msg('rolling-energy-choices')),
    ch('most', msg('rolling-energy-choices-2')),
    ch('tiny', msg('rolling-energy-choices-3')),
  ],
  // The share is the answer: chalked in once a guess is made.
  answerOnBoard: ['er:'],
  asides: [
    msg('rolling-energy-asides'),
  ],
  formulas: ['mechanics.kinetic-energy', 'mechanics.potential-energy', 'mechanics.speed'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 4. Механічна робота, потужність, енергія', match: 'same', quote: 'визначення: кінетичної та потенціальної енергії тіл' },
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 4. Механічна робота, потужність, енергія', match: 'same', quote: 'виявлення зміни і перетворення механічної енергії' },
  ],
  expect: 'reached',
};

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'energy', setup: msg('rolling-energy-setup'), presets: [preset_rolling_energy] });
