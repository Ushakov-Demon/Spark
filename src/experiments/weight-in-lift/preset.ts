import { msg } from '../../knowledge/messages.js';
import { beaker, ch, INTERACTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { defineCard } from '../types.js';

export const preset_weight_in_lift: Preset = {
  ask: msg('weight-in-lift-ask'),
  id: 'weight-in-lift',
  grade: 7,
  topic: INTERACTION,
  title: msg('weight-in-lift-title'),
  question: msg('weight-in-lift-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'lift',
  plan: (['rest', 'up-start', 'up', 'up-stop', 'down-start', 'down', 'down-stop', 'fall'] as const).map((phase) => ({ kind: 'bench', command: { type: 'lab.lift', phase } }) as const),
  choices: [ch('accel', msg('weight-in-lift-choices')), ch('up', msg('weight-in-lift-choices-2')), ch('same', msg('weight-in-lift-choices-3'))],
  asides: [msg('weight-in-lift-aside-otis')],
  formulas: ['mechanics.weight'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'вимірювання: … ваги в ліфтах' },
    { program: 'ua-nus-2023-kreminskyi', grade: 7, topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'same', quote: 'Сили тяжіння та пружності. Вага та невагомість.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 25, дослідження «невагомість», с. 177' } },
  ],
  expect: 'reached',
};

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'lift', setup: msg('weight-in-lift-setup'), presets: [preset_weight_in_lift] });
