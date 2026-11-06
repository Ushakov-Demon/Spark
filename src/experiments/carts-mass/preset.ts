import { msg } from '../../knowledge/messages.js';
import { beaker, ch, INTERACTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { defineCard } from '../types.js';

export const preset_carts_mass: Preset = {
  ask: msg('carts-mass-ask'),
  id: 'carts-mass',
  grade: 7,
  topic: INTERACTION,
  title: msg('carts-mass-title'),
  question: msg('carts-mass-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'carts',
  plan: [
    ...[0, 1, 2].map((weights) => ({ kind: 'bench', command: { type: 'lab.carts', mode: 'push', weights } }) as const),
    { kind: 'bench', command: { type: 'lab.carts', mode: 'weigh', weights: 2, cart: 1 } },
    { kind: 'bench', command: { type: 'lab.carts', mode: 'weigh', weights: 2, cart: 2 } },
  ],
  choices: [ch('speeds', msg('carts-mass-choices')), ch('same', msg('carts-mass-choices-2')), ch('faster', msg('carts-mass-choices-3'))],
  answerOnBoard: ['cr:'],
  asides: [msg('carts-mass-aside-slammd')],
  formulas: ['mechanics.speed', 'mechanics.weight'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'залежності між масою тіла та його інертними та гравітаційними властивостями; … між масою і силою тяжіння' },
    { program: 'ua-nus-2023-kreminskyi', grade: 7, topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'related', quote: 'Явище інерції. Інертність і маса тіла', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 16 «Інертність тіла. Маса»: візки зі стиснутими пружинами, m₂ / m₁ = v₁ / v₂' } },
  ],
  expect: 'reached',
};

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'carts', setup: msg('carts-mass-setup'), presets: [preset_carts_mass] });
