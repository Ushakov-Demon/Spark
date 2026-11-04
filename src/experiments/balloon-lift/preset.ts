import { msg } from '../../knowledge/messages.js';
import { beaker, ch, PRESSURE, room, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import type { LiftGas } from './bench.js';
import { massText, sizeText } from './shared.js';
import { defineCard } from '../types.js';

const GAS_OF: Record<string, { uk: string; en: string }> = { helium: msg('balloon-lift-gas-name-helium'), hydrogen: msg('balloon-lift-gas-name-hydrogen'), 'hot-air': msg('balloon-lift-gas-name-hot-air') };

export const preset_balloon_lift: Preset = varied(
  {
    id: 'balloon-lift',
    ask: msg('balloon-lift-ask'),
    grade: 7,
    topic: PRESSURE,
    title: msg('balloon-lift-title'),
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'balloon',
    choices: [
      ch('volume', msg('balloon-lift-choices')),
      ch('gas', msg('balloon-lift-choices-2')),
      ch('air', msg('balloon-lift-choices-3')),
    ],
    // The lifting forces are the answer: chalked in once a guess is made.
    answerOnBoard: ['bf:'],
    asides: [
      msg('balloon-lift-asides'),
    ],
    formulas: ['mechanics.lifting-force', 'mechanics.buoyant-force', 'mechanics.density'],
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 3. Тиск твердих тіл, рідин і газів', match: 'same', quote: 'дії виштовхувальної й піднімальної сили' }],
    expect: 'reached',
  },
  {
    // Any balloon: its gas, its size, its shell — a party balloon or an aerostat.
    controls: [
      { id: 'gas', label: msg('balloon-lift-gas-label'), kind: 'choice', value: 'helium', options: [ch('helium', msg('balloon-lift-gas-options')), ch('hydrogen', msg('balloon-lift-gas-options-2')), ch('hot-air', msg('balloon-lift-gas-options-3'))] },
      { id: 'diameter', label: msg('balloon-lift-diameter-label'), kind: 'number', unit: 'm', min: 0.01, max: 100, step: 0, value: 0.3, units: [{ id: 'cm', factor: 0.01 }, { id: 'm', factor: 1 }] },
      { id: 'shell', label: msg('balloon-lift-shell-label'), kind: 'number', unit: 'kg', min: 0.0001, max: 1e5, step: 0, value: 0.003, units: [{ id: 'g', factor: 0.001 }, { id: 'kg', factor: 1 }] },
      { id: 'hot', label: msg('balloon-lift-hot-label'), kind: 'number', unit: 'degC', min: 21, max: 399, step: 0, value: 100 },
    ],
    build: (v) => {
      const gas = String(v['gas']) as LiftGas;
      const diameter = Number(v['diameter']);
      const shell = Number(v['shell']);
      const hot = Number(v['hot']);
      const g = GAS_OF[gas] ?? GAS_OF['helium']!;
      return {
        question: msg('balloon-lift-question', { shell: (l) => massText(shell, l), gas: (l) => g[l], heated: gas === 'hot-air' ? String(hot) : 'no', size: (l) => sizeText(diameter, l) }),
        plan: [
          { kind: 'bench', command: { type: 'lab.balloon', step: 'shell', shell } },
          { kind: 'bench', command: { type: 'lab.balloon', step: 'size', diameter } },
          { kind: 'bench', command: { type: 'lab.balloon', step: 'lift', gas, diameter, shell, hot } },
          { kind: 'bench', command: { type: 'lab.balloon', step: 'lift', gas, diameter: diameter / 2, shell, hot } },
          { kind: 'bench', command: { type: 'lab.balloon', step: 'lift', gas: 'air', diameter, shell, hot } },
        ],
      };
    },
  },
);

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'balloon', setup: msg('balloon-lift-setup'), presets: [preset_balloon_lift] });
