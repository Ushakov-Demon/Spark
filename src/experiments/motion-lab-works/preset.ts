import { msg } from '../../knowledge/messages.js';
import { beaker, ch, MOTION, room, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { MOTION_SETUP, PENDULUM_BALLS, ROLL_PATH, THREAD_LENGTH } from './shared.js';
import { defineCard } from '../types.js';

export const preset_average_speed: Preset = varied(
  {
    id: 'average-speed',
    ask: msg('motion-lab-works-average-speed-ask'),
    grade: 7,
    topic: MOTION,
    title: msg('motion-lab-works-average-speed-title'),
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'motion',
  benchSetup: MOTION_SETUP.incline,
    choices: [ch('whole', msg('motion-lab-works-average-speed-choices')), ch('half', msg('motion-lab-works-average-speed-choices-2')), ch('same', msg('motion-lab-works-average-speed-choices-3'))],
    choicesAt: 'end',
    answerOnBoard: ['roll:'],
    asides: [msg('motion-lab-works-aside-arnold')],
    formulas: ['mechanics.average-speed'],
    programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 7, item: 'ЛР № 1', topic: 'Тема 2. Механічний рух', match: 'same', quote: '№ 1. Визначення середньої швидкості руху тіла.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: 'лабораторна робота № 1, с. 75' } }],
    expect: 'reached',
  },
  {
    // «At a small angle»: the upper end of the 1.2 m groove raised 5, 10 or 15 cm.
    controls: [{ id: 'raise', label: msg('motion-lab-works-raise-label'), kind: 'choice', options: [ch('5', msg('motion-lab-works-raise-options')), ch('10', msg('motion-lab-works-raise-options-2')), ch('15', msg('motion-lab-works-raise-options-3'))], value: '10' }],
    build: (v) => {
      const cm = Number(v['raise']);
      const raise = cm / 100;
      return {
        question: msg('motion-lab-works-build-question', { cm: String(cm) }),
        plan: [
          { kind: 'bench', command: { type: 'lab.tape', what: 'path', length: ROLL_PATH } },
          { kind: 'bench', command: { type: 'lab.roll', path: ROLL_PATH, raise } },
          { kind: 'bench', command: { type: 'lab.roll', path: ROLL_PATH / 2, raise } },
        ],
      };
    },
  },
);

export const preset_rotation_period: Preset = varied(
  {
    id: 'rotation-period',
    ask: msg('motion-lab-works-rotation-period-ask'),
    grade: 7,
    topic: MOTION,
    title: msg('motion-lab-works-rotation-period-title'),
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'motion',
  benchSetup: MOTION_SETUP.circle,
    choices: [ch('shorter', msg('motion-lab-works-rotation-period-choices')), ch('longer', msg('motion-lab-works-rotation-period-choices-2')), ch('same', msg('motion-lab-works-rotation-period-choices-3'))],
    choicesAt: 'end',
    asides: [msg('motion-lab-works-aside-hooke-conical')],
    formulas: ['mechanics.period'],
    programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 7, item: 'ЛР № 2', topic: 'Тема 2. Механічний рух', match: 'same', quote: '№ 2. Визначення періоду обертання тіла.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: 'лабораторна робота № 2, с. 87' } }],
    expect: 'reached',
  },
  {
    // More turns timed — the same slip of the stopwatch shared among more of them: a truer period.
    controls: [{ id: 'turns', label: msg('motion-lab-works-turns-label'), kind: 'choice', options: [ch('10', msg('motion-lab-works-turns-options')), ch('20', msg('motion-lab-works-turns-options-2'))], value: '10' }],
    build: (v) => {
      const turns = Number(v['turns']);
      return {
        question: msg('motion-lab-works-build-question-2', { turns: String(turns) }),
        plan: [
          { kind: 'bench', command: { type: 'lab.whirl', thread: THREAD_LENGTH.value, turns } },
          { kind: 'bench', command: { type: 'lab.whirl', thread: 0.3, turns } },
        ],
      };
    },
  },
);

export const preset_pendulum: Preset = varied(
  {
    id: 'pendulum',
    ask: msg('motion-lab-works-pendulum-ask'),
    grade: 7,
    topic: MOTION,
    title: msg('motion-lab-works-pendulum-title'),
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'motion',
  benchSetup: MOTION_SETUP.pendulum,
    choices: [ch('length', msg('motion-lab-works-pendulum-choices')), ch('amplitude', msg('motion-lab-works-pendulum-choices-2')), ch('mass', msg('motion-lab-works-pendulum-choices-3'))],
    choicesAt: 'end',
    answerOnBoard: ['Tp:'],
    asides: [msg('motion-lab-works-aside-foucault')],
    formulas: ['mechanics.pendulum', 'mechanics.period'],
    programs: [
      { program: 'ua-nus-2023-kreminskyi', grade: 7, item: 'ЛР № 3', topic: 'Тема 2. Механічний рух', match: 'same', quote: '№ 3. Дослідження коливань нитяного маятника.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: 'лабораторна робота № 3, с. 99' } },
      { program: 'ua-nus-2023-holovko', grade: 9, match: 'same', quote: 'коливань математичного маятника' },
    ],
    expect: 'reached',
  },
  {
    // More swings timed — the same slip of the stopwatch shared among more of them: a truer period.
    controls: [{ id: 'count', label: msg('motion-lab-works-count-label'), kind: 'choice', options: [ch('10', msg('motion-lab-works-turns-options')), ch('20', msg('motion-lab-works-turns-options-2')), ch('30', msg('motion-lab-works-count-options'))], value: '20' }],
    build: (v) => {
      const count = Number(v['count']);
      return {
        question: msg('motion-lab-works-build-question-3', { count: String(count) }),
        plan: [
          { kind: 'bench', command: { type: 'lab.tape', what: 'length', length: 1 } },
          { kind: 'bench', command: { type: 'lab.swing', length: 1, amplitude: 0.025, mass: PENDULUM_BALLS.light, count } },
          { kind: 'bench', command: { type: 'lab.swing', length: 1, amplitude: 0.055, mass: PENDULUM_BALLS.light, count } },
          { kind: 'bench', command: { type: 'lab.swing', length: 1, amplitude: 0.025, mass: PENDULUM_BALLS.heavy, count } },
          { kind: 'bench', command: { type: 'lab.swing', length: 0.25, amplitude: 0.025, mass: PENDULUM_BALLS.light, count } },
        ],
      };
    },
  },
);

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'motion', setup: MOTION_SETUP.incline, presets: [preset_average_speed, preset_rotation_period, preset_pendulum] });
