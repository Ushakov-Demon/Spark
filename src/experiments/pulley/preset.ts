import type { Locale } from '../../knowledge/i18n.js';
import { msg } from '../../knowledge/messages.js';
import { beaker, ch, room, varied, WORK } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { heightText, massText } from './shared.js';
import { defineCard } from '../types.js';

export const preset_pulley: Preset = varied(
  {
    id: 'pulley',
    ask: msg('pulley-ask'),
    grade: 7,
    topic: WORK,
    title: msg('pulley-title'),
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'pulley',
    choices: [
      ch('force', msg('pulley-choices')),
      ch('work', msg('pulley-choices-2')),
      ch('none', msg('pulley-choices-3')),
    ],
    // The works and the efficiency are the answer: chalked in once a guess is made.
    answerOnBoard: ['pw:'],
    asides: [
      msg('pulley-asides'),
    ],
    formulas: ['mechanics.pulley', 'mechanics.work', 'mechanics.efficiency'],
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 4. Механічна робота, потужність, енергія', match: 'same', quote: 'моделювання й конструювання: простих механізмів' }],
    expect: 'reached',
  },
  {
    // The load and the height: any of them — the force halves on the movable pulley, the rope goes twice as far.
    controls: [
      {
        id: 'mass',
        label: msg('pulley-mass-label'),
        kind: 'number',
        unit: 'kg',
        min: 0.001,
        max: 1e6,
        step: 0,
        value: 0.3,
        units: [
          { id: 'g', factor: 0.001 },
          { id: 'kg', factor: 1 },
          { id: 't', factor: 1000 },
        ],
      },
      {
        id: 'lift',
        label: msg('pulley-lift-label'),
        kind: 'number',
        unit: 'm',
        min: 0.001,
        max: 1e4,
        step: 0,
        value: 0.1,
        units: [
          { id: 'cm', factor: 0.01 },
          { id: 'm', factor: 1 },
        ],
      },
    ],
    build: (v) => {
      const mass = Number(v['mass']);
      const lift = Number(v['lift']);
      return {
        question: msg('pulley-build-question', { mass: (l: Locale) => massText(mass, l), lift: (l: Locale) => heightText(lift, l) }),
        plan: (['straight', 'fixed', 'movable'] as const).map((how) => ({ kind: 'bench', command: { type: 'lab.pulley', how, mass, lift } }) as const),
      };
    },
  },
);

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'pulley', setup: msg('pulley-setup'), presets: [preset_pulley] });
