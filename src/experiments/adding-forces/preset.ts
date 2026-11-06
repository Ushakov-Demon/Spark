import type { Locale } from '../../knowledge/i18n.js';
import { msg } from '../../knowledge/messages.js';
import { beaker, ch, INTERACTION, room, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { massText } from '../pulley/shared.js';
import { defineCard } from '../types.js';

export const preset_adding_forces: Preset = varied(
  {
  ask: msg('adding-forces-ask'),
  id: 'adding-forces',
  grade: 7,
  topic: INTERACTION,
  title: msg('adding-forces-title'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'forces',
  choices: [ch('same', msg('adding-forces-choices')), ch('more', msg('adding-forces-choices-2')), ch('less', msg('adding-forces-choices-3'))],
  answerOnBoard: ['rs:'],
  asides: [msg('adding-forces-aside-stevin')],
  formulas: ['mechanics.resultant', 'mechanics.resultant-opposite', 'mechanics.weight'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'вимірювання: … рівнодійної сил' },
    { program: 'ua-nus-2023-kreminskyi', grade: 7, topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'same', quote: 'Додавання сил, спрямованих уздовж однієї прямої. Визначення рівнодійної кількох сил.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 22, с. 155–156' } },
  ],
  expect: 'reached',
  },
  {
    // (Any load: beyond its 5 N the dynamometer gives way to a force gauge. Up to what a wooden ruler holds.)
    controls: [{ id: 'mass', label: msg('adding-forces-mass'), kind: 'number', unit: 'kg', min: 0.01, max: 2, step: 0, value: 0.2, units: [{ id: 'g', factor: 0.001 }, { id: 'kg', factor: 1 }] }],
    build: (v) => {
      const mass = Number(v['mass']);
      return {
        question: msg('adding-forces-question', { mass: (l: Locale) => massText(mass, l) }),
        plan: [
          { kind: 'bench', command: { type: 'lab.forces', hold: 'one', mass } },
          { kind: 'bench', command: { type: 'lab.forces', hold: 'two', at: 0.15, mass } },
          { kind: 'bench', command: { type: 'lab.forces', hold: 'two', at: 0.06, mass } },
          // The «what if…»: the weights moved along the ruler by hand, to any place.
          { kind: 'bench', command: { type: 'lab.forces', hold: 'two', at: 0.06, mass, again: true }, optional: msg('adding-forces-optional') },
          { kind: 'bench', command: { type: 'lab.forces', hold: 'down', down: 1, mass } },
        ],
      };
    },
  },
);

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'forces', setup: msg('adding-forces-setup'), presets: [preset_adding_forces] });
