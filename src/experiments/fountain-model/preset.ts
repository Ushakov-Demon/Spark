import { msg } from '../../knowledge/messages.js';
import { beaker, ch, PRESSURE, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { defineCard } from '../types.js';

export const preset_fountain_model: Preset = {
  id: 'fountain-model',
  ask: msg('fountain-model-ask'),
  grade: 7,
  topic: PRESSURE,
  title: msg('fountain-model-title'),
  question: msg('fountain-model-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'fountain',
  plan: [-0.05, 0.1, 0.3, 0.5].map((head) => ({ kind: 'bench', command: { type: 'lab.fountain', head } }) as const),
  choices: [
    ch('level', msg('fountain-model-choices')),
    ch('above', msg('fountain-model-choices-2')),
    ch('low', msg('fountain-model-choices-3')),
  ],
  // The share of the head the jet reached is the answer: chalked in once a guess is made.
  answerOnBoard: ['fh:'],
  asides: [
    msg('fountain-model-asides'),
  ],
  formulas: ['mechanics.torricelli', 'mechanics.rise-height', 'mechanics.potential-energy'],
  programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 3. Тиск твердих тіл, рідин і газів', match: 'same', quote: 'конструювання: моделі фонтана' }],
  expect: 'reached',
};

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'fountain', setup: msg('fountain-model-setup'), presets: [preset_fountain_model] });
