import { msg } from '../../knowledge/messages.js';
import { beaker, ch, MOTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { defineCard } from '../types.js';

export const preset_wind_speed: Preset = {
  ask: msg('wind-speed-ask'),
  id: 'wind-speed',
  grade: 7,
  topic: MOTION,
  title: msg('wind-speed-title'),
  question: msg('wind-speed-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'wind',
  plan: ([1, 2, 3] as const).map((day) => ({ kind: 'bench', command: { type: 'lab.wind', day } }) as const),
  choices: [ch('walk', msg('wind-speed-choices')), ch('slow', msg('wind-speed-choices-2')), ch('fast', msg('wind-speed-choices-3'))],
  asides: [msg('wind-speed-aside-beaufort')],
  formulas: ['mechanics.speed'],
  programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 1. Механічний рух', match: 'same', quote: 'вимірювання: середньої швидкості тіл, що здійснюють рівномірний і нерівномірний рухи; швидкості руху повітря' }],
  expect: 'reached',
};

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'wind', setup: msg('wind-speed-setup'), presets: [preset_wind_speed] });
