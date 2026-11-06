import { msg } from '../../knowledge/messages.js';
import { beaker, ch, INTERACTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { defineCard } from '../types.js';

export const preset_coin_inertia: Preset = {
  ask: msg('coin-inertia-ask'),
  id: 'coin-inertia',
  grade: 7,
  topic: INTERACTION,
  title: msg('coin-inertia-title'),
  question: msg('coin-inertia-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'coin',
  plan: (['slow', 'push', 'flick', 'snap'] as const).map((pull) => ({ kind: 'bench', command: { type: 'lab.coin', pull } }) as const),
  choices: [ch('inertia', msg('coin-inertia-choices')), ch('heavy', msg('coin-inertia-choices-2')), ch('air', msg('coin-inertia-choices-3'))],
  asides: [msg('coin-inertia-aside-descartes')],
  formulas: ['mechanics.speed'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'Дослідження • інерції' },
    { program: 'ua-nus-2023-kreminskyi', grade: 7, topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'related', quote: 'Явище інерції. Інертність і маса тіла', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 15 «Явище інерції»: «Інерція — це явище зберігання швидкості руху тіла за відсутності або скомпенсованості дії на нього інших тіл»' } },
  ],
  expect: 'reached',
};

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'coin', setup: msg('coin-inertia-setup'), presets: [preset_coin_inertia] });
