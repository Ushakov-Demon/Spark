import { msg } from '../../knowledge/messages.js';
import { beaker, ch, MOTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { defineCard } from '../types.js';

export const preset_snail_speed: Preset = {
  ask: msg('snail-speed-ask'),
  id: 'snail-speed',
  grade: 7,
  topic: MOTION,
  title: msg('snail-speed-title'),
  question: msg('snail-speed-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'snail',
  plan: (['flat', 'wall', 'wet', 'sandpaper'] as const).map((surface) => ({ kind: 'bench', command: { type: 'lab.snail', surface } }) as const),
  choices: [ch('sandpaper', msg('snail-speed-choices')), ch('wall', msg('snail-speed-choices-2')), ch('wet', msg('snail-speed-choices-3'))],
  formulas: ['mechanics.speed'],
  programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 1. Механічний рух', match: 'related', quote: 'моделювання: відносності руху; реальних природних рухів; рухів тварин і рослин' }],
  expect: 'reached',
};

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'snail', setup: msg('snail-speed-setup'), presets: [preset_snail_speed] });
