import { msg } from '../../knowledge/messages.js';
import { beaker, ch, PRESSURE, room, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { defineCard } from '../types.js';
import { massText } from './shared.js';

export const preset_paper_cups: Preset = varied(
  {
    id: 'paper-cups',
    ask: msg('paper-cups-ask'),
    grade: 7,
    topic: PRESSURE,
    title: msg('paper-cups-title'),
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'cups',
    choices: [
      ch('upright', msg('paper-cups-choice-upright')),
      ch('side', msg('paper-cups-choice-side')),
      ch('none', msg('paper-cups-choice-none')),
    ],
    // What each cup bears on the board is the answer: chalked in once a guess is made.
    answerOnBoard: ['cs:'],
    asides: [msg('paper-cups-asides')],
    formulas: ['mechanics.weight', 'mechanics.pressure', 'mechanics.moment'],
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 3. Тиск твердих тіл, рідин і газів', match: 'same', quote: 'Робота в групі для розв’язання проблем Як розташувати 8 паперових стаканів, щоб вони витримали вагу дитини?' }],
    expect: 'reached',
  },
  {
    // Anyone on the cups (the Professor by default), and any number of cups.
    controls: [
      { id: 'mass', label: msg('paper-cups-mass-label'), kind: 'number', unit: 'kg', min: 1, max: 1000, step: 0, value: 75, units: [{ id: 'kg', factor: 1 }, { id: 't', factor: 1000 }] },
      { id: 'cups', label: msg('paper-cups-cups-label'), kind: 'number', unit: '', min: 1, max: 200, step: 1, value: 8 },
    ],
    build: (v) => {
      const mass = Number(v['mass']);
      const cups = Math.max(1, Math.round(Number(v['cups'])));
      const on = { mass, cups };
      return {
        question: msg('paper-cups-question', { m: (l) => massText(mass, l), cups: String(cups) }),
        plan: [
          { kind: 'bench', command: { type: 'lab.cups', step: 'press', way: 'upright' } },
          { kind: 'bench', command: { type: 'lab.cups', step: 'press', way: 'side' } },
          { kind: 'bench', command: { type: 'lab.cups', step: 'weigh', mass } },
          { kind: 'bench', command: { type: 'lab.cups', step: 'stand', way: 'upright', at: 'middle', ...on } },
          { kind: 'bench', command: { type: 'lab.cups', step: 'stand', way: 'side', at: 'middle', ...on } },
          { kind: 'bench', command: { type: 'lab.cups', step: 'stand', way: 'upright', at: 'end', ...on }, optional: msg('paper-cups-optional-end') },
        ],
      };
    },
  },
);

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'cups', setup: msg('paper-cups-setup'), presets: [preset_paper_cups] });
