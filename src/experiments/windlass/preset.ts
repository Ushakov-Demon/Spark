import { msg } from '../../knowledge/messages.js';
import { beaker, ch, MOTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { defineCard } from '../types.js';

export const preset_windlass: Preset = {
  ask: msg('windlass-ask'),
  id: 'windlass',
  grade: 7,
  topic: MOTION,
  title: msg('windlass-title'),
  question: msg('windlass-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'winch',
  plan: [
    { kind: 'bench', command: { type: 'lab.winch', spool: 'reel', mode: 'lower', amount: 0.3 } },
    { kind: 'bench', command: { type: 'lab.winch', spool: 'pencil', mode: 'lower', amount: 0.3 } },
    { kind: 'bench', command: { type: 'lab.winch', spool: 'reel', mode: 'turn', amount: 5 } },
    { kind: 'bench', command: { type: 'lab.winch', spool: 'pencil', mode: 'turn', amount: 5 } },
  ],
  choices: [ch('circle', msg('windlass-choices')), ch('diameter', msg('windlass-choices-2')), ch('same', msg('windlass-choices-3'))],
  answerOnBoard: ['wc:'],
  asides: [msg('windlass-aside-herodotus')],
  formulas: ['mechanics.wound-length'],
  programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 1. Механічний рух', match: 'same', quote: 'конструювання механізмів, що перетворюють прямолінійний рух на обертальний і навпаки' }],
  expect: 'reached',
};

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'winch', setup: msg('windlass-setup'), presets: [preset_windlass] });
