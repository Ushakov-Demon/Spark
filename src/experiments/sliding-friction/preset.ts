import { msg } from '../../knowledge/messages.js';
import { beaker, ch, INTERACTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { SUBSTANCES } from '../../substances/catalog.js';
import { defineCard } from '../types.js';

export const preset_friction_factors: Preset = {
  ask: msg('sliding-friction-factors-ask'),
  id: 'friction-factors',
  grade: 7,
  topic: INTERACTION,
  title: msg('sliding-friction-factors-title'),
  question: msg('sliding-friction-factors-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'friction',
  plan: [
    { kind: 'hang', substance: 'wood', mass: 0.12 * 0.06 * 0.04 * SUBSTANCES.wood.liquid.density.value, into: 'air', label: msg('sliding-friction-plan-label') },
    { kind: 'bench', command: { type: 'lab.pull', weights: 1, face: 'wide' } },
    { kind: 'bench', command: { type: 'lab.pull', weights: 1, face: 'narrow' } },
    { kind: 'bench', command: { type: 'lab.pull', weights: 1, surface: 'paper' } },
    { kind: 'bench', command: { type: 'lab.pull', weights: 3, face: 'wide' } },
  ],
  choices: [ch('same', msg('sliding-friction-factors-choices')), ch('less', msg('sliding-friction-factors-choices-2')), ch('more', msg('sliding-friction-factors-choices-3'))],
  trick: msg('sliding-friction-factors-trick'),
  asides: [msg('sliding-friction-aside-egypt-sand')],
  formulas: ['mechanics.friction', 'mechanics.weight'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'між площею і якістю поверхонь рухомих тіл, масою рухомого тіла і силою тертя ковзання' },
    { program: 'ua-nus-2023-kreminskyi', grade: 7, topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'same', quote: 'Сили тертя. Тертя в природі й техніці.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 26, рис. 26.5–26.7: брусок по дереву й по склу, на більшій і меншій грані, з тягарцями; закон Амонтона — Кулона' } },
  ],
  expect: 'reached',
};

export const preset_friction_coefficient: Preset = {
  ask: msg('sliding-friction-coefficient-ask'),
  id: 'friction-coefficient',
  grade: 7,
  topic: INTERACTION,
  title: msg('sliding-friction-coefficient-title'),
  question: msg('sliding-friction-coefficient-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'friction',
  plan: [
    { kind: 'hang', substance: 'wood', mass: 0.12 * 0.06 * 0.04 * SUBSTANCES.wood.liquid.density.value, into: 'air', label: msg('sliding-friction-plan-label') },
    ...[0, 1, 2, 3].map((weights) => ({ kind: 'bench', command: { type: 'lab.pull', weights } }) as const),
  ],
  choices: [ch('same', msg('sliding-friction-coefficient-choices')), ch('grows', msg('sliding-friction-coefficient-choices-2')), ch('falls', msg('sliding-friction-coefficient-choices-3'))],
  asides: [msg('sliding-friction-aside-leonardo-scribbles')],
  formulas: ['mechanics.friction', 'mechanics.weight'],
  programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 7, item: 'ЛР № 7', topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'same', quote: '№ 7. Визначення коефіцієнта тертя ковзання.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 27, лабораторна робота № 7, с. 191' } }],
  expect: 'reached',
};

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'friction', setup: msg('sliding-friction-setup'), presets: [preset_friction_factors, preset_friction_coefficient] });
