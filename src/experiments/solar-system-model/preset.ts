import { msg } from '../../knowledge/messages.js';
import { beaker, ch, INTERACTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { defineCard } from '../types.js';

export const preset_solar_system_model: Preset = {
  ask: msg('solar-system-model-ask'),
  id: 'solar-system-model',
  grade: 7,
  topic: INTERACTION,
  title: msg('solar-system-model-title'),
  question: msg('solar-system-model-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'planets',
  plan: (['ball', 'inner', 'outer', 'kepler', 'voyager'] as const).map((step) => ({ kind: 'bench', command: { type: 'lab.planets', step } }) as const),
  choices: [ch('ball', msg('solar-system-model-choices')), ch('grain', msg('solar-system-model-choices-2')), ch('near', msg('solar-system-model-choices-3'))],
  answerOnBoard: ['pe:'],
  formulas: ['mechanics.kepler-third'],
  programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'моделювання: руху планет' }],
  expect: 'reached',
};

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'planets', setup: msg('solar-system-model-setup'), presets: [preset_solar_system_model] });
