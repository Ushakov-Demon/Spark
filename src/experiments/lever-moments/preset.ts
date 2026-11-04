import { msg } from '../../knowledge/messages.js';
import { beaker, ch, room, WORK } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { defineCard } from '../types.js';

export const preset_lever_moments: Preset = {
  id: 'lever-moments',
  ask: msg('lever-moments-ask'),
  grade: 8,
  topic: WORK,
  title: msg('lever-moments-title'),
  question: msg('lever-moments-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'lever',
  plan: [
    { kind: 'bench', command: { type: 'lab.lever', left: { weights: 2, at: 0.1 }, right: { weights: 1, at: 0.2 } } },
    { kind: 'bench', command: { type: 'lab.lever', left: { weights: 2, at: 0.15 }, right: { weights: 3, at: 0.1 } } },
    { kind: 'bench', command: { type: 'lab.lever', left: { weights: 3, at: 0.1 }, right: { dynamometer: true, at: 0.2 } } },
    { kind: 'bench', command: { type: 'lab.lever', left: { weights: 2, at: 0.2 }, right: { dynamometer: true, at: 0.1 } } },
  ],
  choices: [ch('moments', msg('lever-moments-choices')), ch('forces', msg('lever-moments-choices-2')), ch('arms', msg('lever-moments-choices-3'))],
  choicesAt: 'end',
  answerOnBoard: ['M1:', 'M2:'],
  formulas: ['mechanics.moment', 'mechanics.weight'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 4. Механічна робота, потужність, енергія', match: 'same', quote: 'Прості механізми. Важіль. Умова рівноваги важеля.' },
    { program: 'ua-nus-2023-kreminskyi', grade: 8, item: 'ЛР № 1', topic: 'Тема 1. Момент сили. Механічна робота та енергія', match: 'same', quote: '№ 1. Вивчення умови рівноваги важеля.' },
  ],
  expect: 'reached',
};

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'lever', setup: msg('lever-moments-setup'), presets: [preset_lever_moments] });
