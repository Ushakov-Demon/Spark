import type { Locale } from '../../knowledge/i18n.js';
import { localized, msg } from '../../knowledge/messages.js';
import { beaker, ch, MOTION, room, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { massText } from '../pulley/shared.js';
import { BODY_MASS, CIRCLE_RADIUS, MOTION_SETUP, PENDULUM_BALLS, PENDULUM_LONGEST, PENDULUM_SHORTEST, pendulumLength, ROLL_PATH, SHORT_PENDULUM, SHORT_THREAD, SWING, THREAD_LENGTH, WIDEST_CIRCLE } from './shared.js';
import { defineCard } from '../types.js';

const LENGTH_UNITS = [{ id: 'cm', factor: 0.01 }, { id: 'm', factor: 1 }];
const BALL_UNITS = [{ id: 'g', factor: 0.001 }, { id: 'kg', factor: 1 }];

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
    controls: [
      { id: 'thread', label: msg('motion-lab-works-length-label'), kind: 'number', unit: 'm', min: 0.1, max: PENDULUM_LONGEST, step: 0, value: THREAD_LENGTH.value, units: LENGTH_UNITS },
      { id: 'radius', label: msg('motion-lab-works-radius-label'), kind: 'number', unit: 'm', min: 0.01, max: PENDULUM_LONGEST * SHORT_THREAD * WIDEST_CIRCLE, step: 0, value: CIRCLE_RADIUS.value, units: LENGTH_UNITS },
      { id: 'mass', label: msg('motion-lab-works-body-label'), kind: 'number', unit: 'kg', min: 0.001, max: 1000, step: 0, value: BODY_MASS, units: BALL_UNITS },
      { id: 'turns', label: msg('motion-lab-works-turns-label'), kind: 'choice', options: [ch('10', msg('motion-lab-works-turns-options')), ch('20', msg('motion-lab-works-turns-options-2'))], value: '10' },
    ],
    build: (v) => {
      const turns = Number(v['turns']);
      const thread = Number(v['thread']);
      const mass = Number(v['mass']);
      // (The same circle for both threads: it stops short of what the shorter one can reach.)
      const radius = Math.min(Number(v['radius']), thread * SHORT_THREAD * WIDEST_CIRCLE);
      return {
        question: msg('motion-lab-works-build-question-2', { turns: String(turns), L: (l: Locale) => pendulumLength(thread, l), m: (l: Locale) => massText(mass, l), R: (l: Locale) => pendulumLength(radius, l) }),
        plan: [
          { kind: 'bench', command: { type: 'lab.whirl', thread, radius, mass, turns } },
          { kind: 'bench', command: { type: 'lab.whirl', thread: thread * SHORT_THREAD, radius, mass, turns } },
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
    controls: [
      { id: 'length', label: msg('motion-lab-works-length-label'), kind: 'number', unit: 'm', min: PENDULUM_SHORTEST / SHORT_PENDULUM, max: PENDULUM_LONGEST, step: 0, value: 1, units: LENGTH_UNITS },
      { id: 'swing', label: msg('motion-lab-works-swing-label'), kind: 'number', unit: 'm', min: 0.001, max: PENDULUM_LONGEST * SWING.widest, step: 0, value: SWING.narrow, units: LENGTH_UNITS },
      { id: 'swing2', label: msg('motion-lab-works-swing2-label'), kind: 'number', unit: 'm', min: 0.001, max: PENDULUM_LONGEST * SWING.widest, step: 0, value: SWING.wide, units: LENGTH_UNITS },
      { id: 'mass', label: msg('motion-lab-works-mass-label'), kind: 'number', unit: 'kg', min: 0.001, max: 1000, step: 0, value: PENDULUM_BALLS.light, units: BALL_UNITS },
      { id: 'mass2', label: msg('motion-lab-works-mass2-label'), kind: 'number', unit: 'kg', min: 0.001, max: 1000, step: 0, value: PENDULUM_BALLS.heavy, units: BALL_UNITS },
      { id: 'count', label: msg('motion-lab-works-count-label'), kind: 'choice', options: [ch('10', msg('motion-lab-works-turns-options')), ch('20', msg('motion-lab-works-turns-options-2')), ch('30', msg('motion-lab-works-count-options'))], value: '20' },
    ],
    build: (v) => {
      const count = Number(v['count']);
      const length = Number(v['length']);
      const [mass, mass2] = [Number(v['mass']), Number(v['mass2'])];
      // (Small swings only: a pull past that share of the thread stops there.)
      const narrow = Math.min(Number(v['swing']), length * SWING.widest);
      const wide = Math.min(Number(v['swing2']), length * SWING.widest);
      const short = length * SHORT_PENDULUM;
      const lengthOf = (m: number) => (l: Locale) => pendulumLength(m, l);
      const massOf = (kg: number) => (l: Locale) => massText(kg, l);
      return {
        given: [{ id: 'given:l', title: msg('motion-lab-works-pendulum-given'), formula: localized((l) => `l = ${pendulumLength(length, l)}`) }],
        question: msg('motion-lab-works-build-question-3', { count: String(count), L: lengthOf(length), m1: massOf(mass), m2: massOf(mass2), a1: lengthOf(narrow), a2: lengthOf(wide), short: lengthOf(short) }),
        plan: [
          { kind: 'bench', command: { type: 'lab.swing', length, amplitude: narrow, mass, count } },
          { kind: 'bench', command: { type: 'lab.swing', length, amplitude: wide, mass, count } },
          { kind: 'bench', command: { type: 'lab.swing', length, amplitude: narrow, mass: mass2, count } },
          { kind: 'bench', command: { type: 'lab.swing', length: short, amplitude: narrow * SHORT_PENDULUM, mass, count } },
        ],
      };
    },
  },
);

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'motion', setup: MOTION_SETUP.incline, presets: [preset_average_speed, preset_rotation_period, preset_pendulum] });
