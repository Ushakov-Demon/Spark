import { msg, t as tl } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, MOTION, room, times, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { MOTION_SETUP, PENDULUM_BALLS, ROLL_PATH, THREAD_LENGTH } from './bench.js';
import { G } from '../../domains/mechanics/constants.js';
import type { Locale } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { sig } from '../../explain/format.js';

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

export const answer_average_speed = (run: PresetRun): PresetAnswer => {
  const R = run.readings ?? [];
  const l = R.find((x) => x.command.type === 'lab.tape')?.record.value ?? null;
  const rolls = R.filter((x) => x.command.type === 'lab.roll' && x.record.value !== null);
  const whole = rolls.find((x) => Number(x.command['path']) >= (l ?? 1) - 1e-9)?.record.value ?? null;
  const half = rolls.find((x) => Number(x.command['path']) < (l ?? 1) - 1e-9)?.record.value ?? null;
  const ok = l !== null && whole !== null && half !== null;
  const v1 = ok ? l! / whole! : 0;
  const v2 = ok ? l! / 2 / half! : 0;
  const correct = ok ? (v1 > v2 * 1.03 ? 'whole' : v2 > v1 * 1.03 ? 'half' : 'same') : undefined;
  const s = (x: number, l: Locale) => formatMeasured('time', x, 0.01, l);
  const v = (x: number, l: Locale) => `${sig(x, 2, l)} ${tl(l, 'unit-sym-m-per-s')}`;
  return {
    ...(correct ? { correct } : {}),
    why: msg('motion-lab-works-answer-average-speed-why'),
    say: msg('motion-lab-works-answer-average-speed-say'),
    text: both((lc) =>
      tl(lc, 'motion-lab-works-answer-average-speed-text', { value: ok ? formatMeasured('length', l!, 0.001, lc) : '—', whole: ok ? s(whole!, lc) : '—', v1: v(v1, lc), half: ok ? s(half!, lc) : '—', v2: v(v2, lc), v12: times(v1 / Math.max(v2, 1e-9), lc) }),
    ),
  };
};

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

export const answer_rotation_period = (run: PresetRun): PresetAnswer => {
  const rows = (run.readings ?? []).filter((x) => x.command.type === 'lab.whirl' && x.record.value !== null).map((x) => ({ L: Number(x.command['thread']), N: Number(x.command['turns']), t: x.record.value!, R: x.record.inputs?.['radius'] ?? 0.15 }));
  const [a, b] = rows;
  const Ta = a ? a.t / a.N : 0;
  const Tb = b ? b.t / b.N : 0;
  const correct = a && b ? (Tb < Ta * 0.97 ? 'shorter' : Tb > Ta * 1.03 ? 'longer' : 'same') : undefined;
  const cm = (m: number, l: Locale) => formatMeasured('length', m, 0.01, l);
  const s = (x: number, l: Locale) => formatMeasured('time', x, 0.01, l);
  return {
    ...(correct ? { correct } : {}),
    why: msg('motion-lab-works-answer-rotation-period-why'),
    say: msg('motion-lab-works-answer-rotation-period-say'),
    text: both((l) =>
      tl(l, 'motion-lab-works-answer-rotation-period-text-3', { L: a ? tl(l, 'motion-lab-works-answer-rotation-period-text', { L: cm(a.L, l), N: String(a.N), t: s(a.t, l), value: formatMeasured('time', Ta, 0.01, l), value2: sig(1 / Ta, 2, l), value3: sig((2 * Math.PI * a.R) / Ta, 2, l) }) : '', L2: b ? tl(l, 'motion-lab-works-answer-rotation-period-text-2', { L: cm(b.L, l), t: s(b.t, l), value: formatMeasured('time', Tb, 0.01, l) }) : '' }),
    ),
  };
};

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

export const answer_pendulum = (run: PresetRun): PresetAnswer => {
  const rows = (run.readings ?? []).filter((x) => x.command.type === 'lab.swing' && x.record.value !== null).map((x) => ({ L: Number(x.command['length']), A: Number(x.command['amplitude']), m: Number(x.command['mass']), T: x.record.value! / Number(x.command['count']) }));
  const [base, wide, heavy, short] = rows;
  const close = (x?: { T: number }, y?: { T: number }) => !!x && !!y && Math.abs(x.T - y.T) / y.T < 0.02;
  const ok = !!base && !!wide && !!heavy && !!short;
  const correct = ok ? (close(wide, base) && close(heavy, base) && !close(short, base) ? 'length' : !close(wide, base) ? 'amplitude' : 'mass') : undefined;
  const sT = (x: number, l: Locale) => formatMeasured('time', x, 0.01, l);
  return {
    ...(correct ? { correct } : {}),
    why: msg('motion-lab-works-answer-pendulum-why'),
    say: msg('motion-lab-works-answer-pendulum-say'),
    text: both((l) =>
      ok
          ? tl(l, 'motion-lab-works-answer-pendulum-text', { T: sT(base!.T, l), T2: sT(wide!.T, l), T3: sT(heavy!.T, l), T4: sT(short!.T, l), value: sT(2 * Math.PI * Math.sqrt(1 / G), l) })
          : tl(l, 'motion-lab-works-answer-pendulum-text-2'),
    ),
  };
};
