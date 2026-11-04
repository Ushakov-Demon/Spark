import { msg } from '../../knowledge/messages.js';
import { beaker, ch, PRESSURE, room, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { defineCard } from '../types.js';

export const preset_atmospheric_pressure: Preset = varied(
  {
    id: 'atmospheric-pressure',
    ask: msg('atmospheric-pressure-ask'),
    grade: 7,
    topic: PRESSURE,
    title: msg('atmospheric-pressure-title'),
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'atm',
    choices: [ch('less', msg('atmospheric-pressure-choices')), ch('same', msg('atmospheric-pressure-choices-2')), ch('more', msg('atmospheric-pressure-choices-3'))],
    choicesAt: 'end',
    answerOnBoard: ['pa:'],
    formulas: ['mechanics.atmosphere-syringe', 'mechanics.pressure'],
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 3. Тиск твердих тіл, рідин і газів', match: 'same', quote: 'вимірювання й визначення: атмосферного й гідростатичного тиску' }],
    expect: 'reached',
  },
  {
    // The weather: the barometer, and so the force on the plunger, differ from day to day.
    controls: [{ id: 'air', label: msg('atmospheric-pressure-air-label'), kind: 'choice', options: [ch('99000', msg('atmospheric-pressure-air-options')), ch('101300', msg('atmospheric-pressure-air-options-2')), ch('103500', msg('atmospheric-pressure-air-options-3'))], value: '101300' }],
    build: (v) => {
      const air = Number(v['air']);
      return {
        question: msg('atmospheric-pressure-build-question'),
        plan: [
          { kind: 'bench', command: { type: 'lab.atm', step: 'scale', air } },
          { kind: 'bench', command: { type: 'lab.atm', step: 'barometer', air } },
          { kind: 'bench', command: { type: 'lab.atm', step: 'open', air } },
          ...[0.25, 0.5, 1].map((pulled) => ({ kind: 'bench', command: { type: 'lab.atm', step: 'sealed', air, pulled } }) as const),
        ],
      };
    },
  },
);

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'atm', setup: msg('atmospheric-pressure-setup'), presets: [preset_atmospheric_pressure] });
