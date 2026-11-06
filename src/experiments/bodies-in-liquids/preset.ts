import { msg } from '../../knowledge/messages.js';
import { beaker, ch, INTERACTION, MOTION, room, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import type { Locale } from '../../knowledge/i18n.js';
import { defineCard } from '../types.js';

export const preset_bubble_speed: Preset = varied(
  {
    id: 'bubble-speed',
    ask: msg('bodies-in-liquids-bubble-speed-ask'),
    grade: 7,
    topic: MOTION,
    title: msg('bodies-in-liquids-bubble-speed-title'),
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'sink',
    benchSetup: msg('bodies-in-liquids-bubble-speed-bench-setup'),
    choices: [ch('bigger', msg('bodies-in-liquids-bubble-speed-choices')), ch('same', msg('bodies-in-liquids-bubble-speed-choices-2')), ch('smaller', msg('bodies-in-liquids-bubble-speed-choices-3'))],
    choicesAt: 'end',
    answerOnBoard: ['bv:'],
    asides: [msg('bodies-in-liquids-aside-thevenot')],
    formulas: ['mechanics.speed'],
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 1. Механічний рух', match: 'same', quote: 'Дослідження • виявлення пропорційної залежності між величинами, що описують прямолінійний рівномірний рух', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 8, дослідження: «Знайдіть швидкість її руху. Чи залежить швидкість руху бульбашки від її розмірів?»' } }],
    expect: 'reached',
  },
  {
    // The liquid: the textbook's washing-up liquid (its viscosity an estimate) or glycerol (a table's).
    controls: [{ id: 'liquid', label: msg('bodies-in-liquids-liquid-label'), kind: 'choice', options: [ch('washing-up', msg('bodies-in-liquids-liquid-options')), ch('glycerol', msg('bodies-in-liquids-liquid-options-2'))], value: 'washing-up' }],
    build: (v) => {
      const liquid = String(v['liquid']) as 'washing-up' | 'glycerol';
      const marks = [0.03, 0.06, 0.09, 0.12];
      const what = liquid === 'glycerol' ? msg('bodies-in-liquids-build-what') : msg('bodies-in-liquids-build-what-2');
      return {
        question: msg('bodies-in-liquids-build-question', { what: (l: Locale) => what[l] }),
        plan: [0.002, 0.004].map((diameter) => ({ kind: 'bench', command: { type: 'lab.sink', body: 'bubble', diameter, liquid, marks } }) as const),
      };
    },
  },
);

export const preset_ball_in_liquids: Preset = varied(
  {
    id: 'ball-in-liquids',
    ask: msg('bodies-in-liquids-ball-ask'),
    grade: 7,
    topic: INTERACTION,
    title: msg('bodies-in-liquids-ball-title'),
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'sink',
    choices: [ch('glycerol', msg('bodies-in-liquids-ball-choices')), ch('sunflower-oil', msg('bodies-in-liquids-ball-choices-2')), ch('water', msg('bodies-in-liquids-ball-choices-3'))],
    choicesAt: 'end',
    answerOnBoard: ['kv:'],
    asides: [msg('bodies-in-liquids-aside-pitch-drop')],
    formulas: ['mechanics.speed'],
    programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'вимірювання: … швидкості руху кульки у рідинах різної густини' }],
    expect: 'reached',
  },
  {
    // The ball's size: a smaller one goes slower in each liquid (in glycerol — as the square of its size).
    controls: [{ id: 'diameter', label: msg('bodies-in-liquids-diameter-label'), kind: 'choice', options: [ch('1', msg('bodies-in-liquids-diameter-options')), ch('1.5', msg('bodies-in-liquids-diameter-options-2'))], value: '1.5' }],
    build: (v) => {
      const diameter = Number(v['diameter']) / 1000;
      const marks = [0.05, 0.1, 0.15];
      const d = String(v['diameter']);
      return {
        question: msg('bodies-in-liquids-ball-question', { d: Number(d) }),
        plan: (['glycerol', 'sunflower-oil', 'water'] as const).map((liquid) => ({ kind: 'bench', command: { type: 'lab.sink', body: 'ball', diameter, liquid, marks } }) as const),
      };
    },
  },
);

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'sink', setup: msg('bodies-in-liquids-setup'), presets: [preset_bubble_speed, preset_ball_in_liquids] });
