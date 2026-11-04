import { msg } from '../../knowledge/messages.js';
import { ch, PRESSURE, room, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import type { Locale } from '../../knowledge/i18n.js';
import { defineCard } from '../types.js';

export const preset_depth_pressure: Preset = varied(
  {
    id: 'depth-pressure',
    ask: msg('depth-pressure-ask'),
    grade: 7,
    topic: PRESSURE,
    title: msg('depth-pressure-title'),
    guided: true,
    bench: 'depth',
    choices: [ch('proportional', msg('depth-pressure-choices')), ch('same', msg('depth-pressure-choices-2')), ch('slower', msg('depth-pressure-choices-3'))],
    choicesAt: 'end',
    answerOnBoard: ['rhoD:'],
    formulas: ['mechanics.hydrostatic-pressure'],
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 3. Тиск твердих тіл, рідин і газів', match: 'same', quote: 'Дослідження: … зміни тиску в рідині з глибиною; … вимірювання й визначення: атмосферного й гідростатичного тиску' }],
    expect: 'reached',
  },
  {
    // Liquids of different densities: the manometer's water tells them apart (salt water deeper, oil less).
    controls: [{ id: 'liquid', label: msg('depth-pressure-liquid-label'), kind: 'choice', options: [ch('water', msg('depth-pressure-liquid-options')), ch('salt-water-20', msg('depth-pressure-liquid-options-2')), ch('sunflower-oil', msg('depth-pressure-liquid-options-3'))], value: 'water' }],
    build: (v) => {
      const liquid = String(v['liquid']) as 'water' | 'salt-water-20' | 'sunflower-oil';
      const name = { water: msg('depth-pressure-name-water'), 'salt-water-20': msg('depth-pressure-name-salt-water-20'), 'sunflower-oil': msg('depth-pressure-name-sunflower-oil') }[liquid];
      return {
        question: msg('depth-pressure-build-question', { name: (l: Locale) => name[l] }),
        params: { ...room, vessel: 'beaker', size: 1, material: 'glass', liters: 0.9, action: 'settle', substance: liquid, startTemp: 20 },
        plan: [
          ...[0.03, 0.06, 0.09].map((depth) => ({ kind: 'bench', command: { type: 'lab.depth', depth } }) as const),
          { kind: 'bench', command: { type: 'lab.depth', depth: 0.09, sideways: true } },
        ],
      };
    },
  },
);

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'depth', setup: msg('depth-pressure-setup'), presets: [preset_depth_pressure] });
