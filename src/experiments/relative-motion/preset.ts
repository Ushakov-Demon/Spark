import { msg } from '../../knowledge/messages.js';
import { beaker, ch, MOTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { defineCard } from '../types.js';

export const preset_relative_motion: Preset = {
  ask: msg('relative-motion-ask'),
  id: 'relative-motion',
  grade: 7,
  topic: MOTION,
  title: msg('relative-motion-title'),
  question: msg('relative-motion-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'carry',
  plan: [0, 0.005, 0.01].map((speed) => ({ kind: 'bench', command: { type: 'lab.carry', speed } }) as const),
  choices: [ch('depends', msg('relative-motion-choices')), ch('same', msg('relative-motion-choices-2')), ch('slower', msg('relative-motion-choices-3'))],
  asides: [msg('relative-motion-aside-galileo-ship')],
  formulas: ['mechanics.speed'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 1. Механічний рух', match: 'same', quote: 'моделювання: відносності руху' },
    { program: 'ua-nus-2023-kreminskyi', grade: 7, topic: 'Тема 2. Механічний рух', match: 'related', quote: 'Механічний рух. Відносність руху та спокою. Система відліку.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 7, «Чому механічний рух є відносним?»: «Форма траєкторії руху, шлях і переміщення тіла залежать від того, відносно якої системи відліку розглядають рух»' } },
  ],
  expect: 'reached',
};

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'carry', setup: msg('relative-motion-setup'), presets: [preset_relative_motion] });
