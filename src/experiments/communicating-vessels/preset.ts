import { msg } from '../../knowledge/messages.js';
import { beaker, ch, PRESSURE, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { defineCard } from '../types.js';

export const preset_communicating_vessels: Preset = {
  id: 'communicating-vessels',
  ask: msg('communicating-vessels-ask'),
  grade: 7,
  topic: PRESSURE,
  title: msg('communicating-vessels-title'),
  question: msg('communicating-vessels-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'utube',
  plan: [0, 10, 20].map((poured) => ({ kind: 'bench', command: { type: 'lab.utube', poured, liquid: 'sunflower-oil' } }) as const),
  choices: [ch('oil', msg('communicating-vessels-choices')), ch('water', msg('communicating-vessels-choices-2')), ch('same', msg('communicating-vessels-choices-3'))],
  choicesAt: 'end',
  answerOnBoard: ['rhoU:'],
  asides: [msg('communicating-vessels-aside-pergamon')],
  formulas: ['mechanics.communicating-vessels', 'mechanics.hydrostatic-pressure'],
  programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 3. Тиск твердих тіл, рідин і газів', match: 'same', quote: 'Сполучені посудини. … моделювання: сполучених посудин' }],
  expect: 'reached',
};

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'utube', setup: msg('communicating-vessels-setup'), presets: [preset_communicating_vessels] });
