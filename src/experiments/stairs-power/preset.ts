import { msg } from '../../knowledge/messages.js';
import { beaker, ch, room, varied, WORK } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { defineCard } from '../types.js';

export const preset_stairs_power: Preset = varied(
  {
    id: 'stairs-power',
    ask: msg('stairs-power-ask'),
    grade: 7,
    topic: WORK,
    title: msg('stairs-power-title'),
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'stairs',
    choices: [
      ch('less', msg('stairs-power-choices')),
      ch('more', msg('stairs-power-choices-2')),
      ch('same', msg('stairs-power-choices-3')),
    ],
    // The powers are the answer: chalked in once a guess is made.
    answerOnBoard: ['sN:'],
    asides: [
      msg('stairs-power-asides'),
    ],
    formulas: ['mechanics.work', 'mechanics.power', 'mechanics.potential-energy'],
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 4. Механічна робота, потужність, енергія', match: 'same', quote: 'визначення: … механічної роботи, коли сила діє вздовж напрямку руху; потужності' }],
    expect: 'reached',
  },
  {
    // The pupil's own measurements (an example by default): their mass, the stairs, the two times.
    controls: [
      { id: 'mass', label: msg('stairs-power-mass-label'), kind: 'number', unit: 'kg', min: 20, max: 150, step: 0, value: 50 },
      { id: 'steps', label: msg('stairs-power-steps-label'), kind: 'number', unit: '', min: 3, max: 100, step: 1, value: 18 },
      { id: 'rise', label: msg('stairs-power-rise-label'), kind: 'number', unit: 'cm', min: 10, max: 22, step: 0, value: 16 },
      { id: 'walk', label: msg('stairs-power-walk-label'), kind: 'number', unit: 's', min: 1, max: 600, step: 0, value: 12 },
      { id: 'run', label: msg('stairs-power-run-label'), kind: 'number', unit: 's', min: 1, max: 600, step: 0, value: 4 },
    ],
    build: (v) => {
      const mass = Number(v['mass']);
      const steps = Number(v['steps']);
      const rise = Number(v['rise']) / 100;
      const all = { mass, steps, rise };
      return {
        question: msg('stairs-power-build-question'),
        plan: [
          { kind: 'bench', command: { type: 'lab.stairs', step: 'weigh', mass } },
          { kind: 'bench', command: { type: 'lab.stairs', step: 'measure', steps, rise } },
          { kind: 'bench', command: { type: 'lab.stairs', step: 'climb', pace: 'walk', ...all, time: Number(v['walk']) } },
          { kind: 'bench', command: { type: 'lab.stairs', step: 'climb', pace: 'run', ...all, time: Number(v['run']) } },
        ],
      };
    },
  },
);

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'stairs', setup: msg('stairs-power-setup'), presets: [preset_stairs_power] });
