import { msg } from '../../knowledge/messages.js';
import { beaker, ch, PRESSURE, room, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { defineCard } from '../types.js';
import { mmText, saltText, sizeText } from './shared.js';

export const preset_mandarin_float: Preset = varied(
  {
    id: 'mandarin-float',
    ask: msg('mandarin-float-ask'),
    grade: 7,
    topic: PRESSURE,
    title: msg('mandarin-float-title'),
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'mandarin',
    choices: [
      ch('peel', msg('mandarin-float-choice-peel')),
      ch('flesh', msg('mandarin-float-choice-flesh')),
      ch('shape', msg('mandarin-float-choice-shape')),
    ],
    // The densities are the answer: chalked in once a guess is made.
    answerOnBoard: ['md:'],
    asides: [msg('mandarin-float-asides')],
    formulas: ['mechanics.density', 'mechanics.buoyant-force', 'mechanics.submerged-share'],
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 3. Тиск твердих тіл, рідин і газів', match: 'same', quote: 'Робота в групі для розв’язання проблем … Чому не тоне мандарин із шкуринкою?' }],
    expect: 'reached',
  },
  {
    // Any mandarin (or orange, or pomelo): its size and its peel; any salt for the peeled one.
    controls: [
      { id: 'diameter', label: msg('mandarin-float-diameter-label'), kind: 'number', unit: 'm', min: 0.005, max: 1, step: 0, value: 0.07, units: [{ id: 'cm', factor: 0.01 }, { id: 'm', factor: 1 }] },
      { id: 'peel', label: msg('mandarin-float-peel-label'), kind: 'number', unit: 'm', min: 0.0001, max: 0.45, step: 0, value: 0.004, units: [{ id: 'mm', factor: 0.001 }, { id: 'cm', factor: 0.01 }], maxBy: (v) => 0.45 * Number(v['diameter']) },
      { id: 'salt', label: msg('mandarin-float-salt-label'), kind: 'number', unit: 'kg', min: 0.001, max: 1, step: 0, value: 0.1, units: [{ id: 'g', factor: 0.001 }, { id: 'kg', factor: 1 }] },
    ],
    build: (v) => {
      const diameter = Number(v['diameter']);
      const peel = Math.min(Number(v['peel']), 0.45 * diameter);
      const salt = Number(v['salt']);
      const at = { diameter, peel };
      return {
        question: msg('mandarin-float-question', { d: (l) => sizeText(diameter, l), peel: (l) => mmText(peel, l), salt: (l) => saltText(salt, l) }),
        plan: [
          { kind: 'bench', command: { type: 'lab.mandarin', step: 'weigh', ...at } },
          { kind: 'bench', command: { type: 'lab.mandarin', step: 'dunk', part: 'whole', ...at, salt: 0 } },
          { kind: 'bench', command: { type: 'lab.mandarin', step: 'peel', ...at } },
          { kind: 'bench', command: { type: 'lab.mandarin', step: 'dunk', part: 'flesh', ...at, salt: 0 } },
          { kind: 'bench', command: { type: 'lab.mandarin', step: 'dunk', part: 'peel', ...at, salt: 0 } },
          { kind: 'bench', command: { type: 'lab.mandarin', step: 'dunk', part: 'flesh', ...at, salt }, optional: msg('mandarin-float-optional-salt') },
        ],
      };
    },
  },
);

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'mandarin', setup: msg('mandarin-float-setup'), presets: [preset_mandarin_float] });
