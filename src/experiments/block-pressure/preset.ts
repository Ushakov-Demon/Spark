import { msg } from '../../knowledge/messages.js';
import { BENCH_BLOCK } from '../../scenarios/bench-kit.js';
import { beaker, ch, PRESSURE, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { SUBSTANCES } from '../../substances/catalog.js';
import { defineCard } from '../types.js';

export const preset_block_pressure: Preset = {
  ask: msg('block-pressure-ask'),
  id: 'block-pressure',
  grade: 7,
  topic: PRESSURE,
  title: msg('block-pressure-title'),
  question: msg('block-pressure-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'pressure',
  plan: [
    { kind: 'hang', substance: 'wood', mass: BENCH_BLOCK.edges[0] * BENCH_BLOCK.edges[1] * BENCH_BLOCK.edges[2] * SUBSTANCES.wood.liquid.density.value, into: 'air', label: msg('block-pressure-plan-label'), box: BENCH_BLOCK.edges },
    ...([0, 1, 2] as const).map((edge) => ({ kind: 'bench', command: { type: 'lab.edge', edge } }) as const),
  ],
  choices: [ch('largest', msg('block-pressure-choices')), ch('smallest', msg('block-pressure-choices-2')), ch('same', msg('block-pressure-choices-3'))],
  choicesAt: 'end',
  answerOnBoard: ['pressure:'],
  asides: [msg('block-pressure-aside-holt')],
  formulas: ['mechanics.pressure', 'mechanics.weight'],
  programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 7, item: 'ЛР № 8', topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'same', quote: '№ 8. Вимірювання тиску тіла на опору.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 28, лабораторна робота № 8, с. 203' } }],
  expect: 'reached',
};

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'pressure', setup: msg('block-pressure-setup'), presets: [preset_block_pressure] });
