import { msg } from '../../knowledge/messages.js';
import { beaker, ch, PRESSURE, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { defineCard } from '../types.js';

export const preset_cartesian_diver: Preset = {
  id: 'cartesian-diver',
  ask: msg('cartesian-diver-ask'),
  grade: 7,
  topic: PRESSURE,
  title: msg('cartesian-diver-title'),
  question: msg('cartesian-diver-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'diver',
  plan: [
    { kind: 'bench', command: { type: 'lab.diver', step: 'weigh' } },
    { kind: 'bench', command: { type: 'lab.diver', step: 'volume' } },
    { kind: 'bench', command: { type: 'lab.diver', step: 'squeeze', press: 4000 } },
    { kind: 'bench', command: { type: 'lab.diver', step: 'squeeze', press: 15000 } },
    { kind: 'bench', command: { type: 'lab.diver', step: 'release', press: 15000 } },
  ],
  choices: [
    ch('density', msg('cartesian-diver-choices')),
    ch('push', msg('cartesian-diver-choices-2')),
    ch('nothing', msg('cartesian-diver-choices-3')),
  ],
  // (Water ≈ 4.6·10⁻¹⁰ Pa⁻¹ at 20 °C, between the source's 5.1 at 0 °C and 4.4 at 45 °C; air, slowly, 1/p₀ ≈ 9.9·10⁻⁶ Pa⁻¹: ≈ 20 000 times.)
  asides: [
    msg('cartesian-diver-asides'),
  ],
  // The densities are the answer: chalked in once a guess is made.
  answerOnBoard: ['rho:'],
  formulas: ['mechanics.density', 'mechanics.buoyant-force', 'mechanics.submerged-share', 'mechanics.boyle'],
  programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 3. Тиск твердих тіл, рідин і газів', match: 'same', quote: 'моделювання: … занурення і спливання підводного човна, риб' }],
  expect: 'reached',
};

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'diver', setup: msg('cartesian-diver-setup'), presets: [preset_cartesian_diver] });
