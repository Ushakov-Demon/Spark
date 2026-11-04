import { msg } from '../../knowledge/messages.js';
import { beaker, ch, INTERACTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { defineCard } from '../types.js';

export const preset_scales_diy: Preset = {
  ask: msg('scales-diy-ask'),
  id: 'scales-diy',
  grade: 7,
  topic: INTERACTION,
  title: msg('scales-diy-title'),
  question: msg('scales-diy-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'scales',
  plan: (['zero', 'check', 'egg'] as const).map((step) => ({ kind: 'bench', command: { type: 'lab.scales', step } }) as const),
  choices: [ch('known', msg('scales-diy-choices')), ch('cant', msg('scales-diy-choices-2')), ch('size', msg('scales-diy-choices-3'))],
  answerOnBoard: ['sg:'],
  formulas: ['mechanics.density', 'mechanics.weight'],
  programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'конструювання: терез' }],
  expect: 'reached',
};

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'scales', setup: msg('scales-diy-setup'), presets: [preset_scales_diy] });
