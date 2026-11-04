import { msg } from '../../knowledge/messages.js';
import { beaker, ch, ELECTRIC, room, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { defineCard } from '../types.js';

export const preset_series_circuit: Preset = varied(
  {
    id: 'series-circuit',
    ask: msg('two-resistors-series-circuit-ask'),
    grade: 8,
    topic: ELECTRIC,
    title: msg('two-resistors-series-circuit-title'),
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'pair',
    choices: [ch('sum', msg('two-resistors-series-circuit-choices')), ch('equal', msg('two-resistors-series-circuit-choices-2')), ch('half', msg('two-resistors-series-circuit-choices-3'))],
    choicesAt: 'end',
    answerOnBoard: ['sum:'],
    formulas: ['electrical.series-voltage', 'electrical.ohm-resistance'],
    programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 8, item: 'ЛР № 7', topic: 'Тема 3. Електричні явища. Електричний струм', match: 'same', quote: '№ 7. Дослідження електричного кола з послідовним з’єднанням провідників.' }],
    expect: 'reached',
  },
  {
    // In series 6.1 Ω in all: 6 V drive ≈ 1 A (the ammeter takes 2 A), the voltmeter across both reads up to 6 V.
    controls: [{ id: 'source', label: msg('two-resistors-source-label'), kind: 'choice', options: [ch('2', msg('two-resistors-source-options')), ch('4', msg('two-resistors-source-options-2')), ch('6', msg('two-resistors-source-options-3'))], value: '4' }],
    build: (v) => {
      const source = Number(v['source']);
      return {
        question: msg('two-resistors-build-question', { source: String(source) }),
        plan: (['r1', 'r2', 'both'] as const).map((at) => ({ kind: 'bench', command: { type: 'lab.pair', source, connection: 'series', at } }) as const),
      };
    },
  },
);

export const preset_parallel_circuit: Preset = varied(
  {
    id: 'parallel-circuit',
    ask: msg('two-resistors-parallel-circuit-ask'),
    grade: 8,
    topic: ELECTRIC,
    title: msg('two-resistors-parallel-circuit-title'),
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'pair',
    choices: [ch('sum', msg('two-resistors-parallel-circuit-choices')), ch('equal', msg('two-resistors-parallel-circuit-choices-2')), ch('half', msg('two-resistors-parallel-circuit-choices-3'))],
    choicesAt: 'end',
    answerOnBoard: ['sum:'],
    formulas: ['electrical.parallel-current', 'electrical.ohm-resistance'],
    programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 8, item: 'ЛР № 8', topic: 'Тема 3. Електричні явища. Електричний струм', match: 'same', quote: '№ 8. Дослідження електричного кола з паралельним з’єднанням провідників.' }],
    expect: 'reached',
  },
  {
    // In parallel ≈ 1.33 Ω: before the fork 2.5 V drive ≈ 1.7 A, 3 V would be past the ammeter's 2 A.
    controls: [{ id: 'source', label: msg('two-resistors-source-label'), kind: 'choice', options: [ch('1', msg('two-resistors-source-options-4')), ch('1.5', msg('two-resistors-source-options-5')), ch('2', msg('two-resistors-source-options')), ch('2.5', msg('two-resistors-source-options-6'))], value: '2' }],
    build: (v) => {
      const source = Number(v['source']);
      return {
        question: msg('two-resistors-parallel-question', { source }),
        plan: (['r1', 'r2', 'both'] as const).map((at) => ({ kind: 'bench', command: { type: 'lab.pair', source, connection: 'parallel', at } }) as const),
      };
    },
  },
);

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'pair', setup: msg('two-resistors-setup'), presets: [preset_series_circuit, preset_parallel_circuit] });
