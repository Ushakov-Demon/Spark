import { msg } from '../../knowledge/messages.js';
import { beaker, ch, INTERACTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { defineCard } from '../types.js';

export const preset_adding_forces: Preset = {
  ask: msg('adding-forces-ask'),
  id: 'adding-forces',
  grade: 7,
  topic: INTERACTION,
  title: msg('adding-forces-title'),
  question: msg('adding-forces-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'forces',
  plan: [
    { kind: 'bench', command: { type: 'lab.forces', hold: 'one' } },
    { kind: 'bench', command: { type: 'lab.forces', hold: 'two', at: 0.15 } },
    { kind: 'bench', command: { type: 'lab.forces', hold: 'two', at: 0.06 } },
    { kind: 'bench', command: { type: 'lab.forces', hold: 'down', down: 1 } },
  ],
  choices: [ch('same', msg('adding-forces-choices')), ch('more', msg('adding-forces-choices-2')), ch('less', msg('adding-forces-choices-3'))],
  answerOnBoard: ['rs:'],
  formulas: ['mechanics.resultant', 'mechanics.resultant-opposite', 'mechanics.weight'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'вимірювання: … рівнодійної сил' },
    { program: 'ua-nus-2023-kreminskyi', grade: 7, topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'same', quote: 'Додавання сил, спрямованих уздовж однієї прямої. Визначення рівнодійної кількох сил.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 22, с. 155–156' } },
  ],
  expect: 'reached',
};

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'forces', setup: msg('adding-forces-setup'), presets: [preset_adding_forces] });
