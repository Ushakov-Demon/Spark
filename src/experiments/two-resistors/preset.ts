import { msg, t, t as tl } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, ELECTRIC, room, varied } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import type { Locale } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';

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

export const answer_series_circuit = (run: PresetRun): PresetAnswer => {
  return pairAnswer(run, 'series');
};

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

export const answer_parallel_circuit = (run: PresetRun): PresetAnswer => {
  return pairAnswer(run, 'parallel');
};

/** The two connections answered alike: the readings at each place, the sum that holds, why. */
function pairAnswer(run: PresetRun, connection: 'series' | 'parallel'): PresetAnswer {
  const at = (where: string) => {
    const rs = (run.readings ?? []).filter((x) => x.command.type === 'lab.pair' && x.command['at'] === where).map((x) => x.record);
    const I = rs.find((x) => x.quantity === 'current')?.value;
    const U = rs.find((x) => x.quantity === 'voltage')?.value;
    return I != null && U != null ? { I, U } : null;
  };
  const [r1, r2, all] = [at('r1'), at('r2'), at('both')];
  const series = connection === 'series';
  const A = (x: number, l: Locale) => formatMeasured('current', x, 0.01, l);
  const V = (x: number, l: Locale) => formatMeasured('voltage', x, 0.1, l);
  // Within the instruments' divisions (two readings rounded each): the sum holds.
  const ok = !!(r1 && r2 && all);
  const sum = ok ? (series ? r1!.U + r2!.U : r1!.I + r2!.I) : 0;
  const total = ok ? (series ? all!.U : all!.I) : 0;
  const tol = series ? 0.3 : 0.12;
  const each = ok ? (series ? Math.abs(r1!.U - total) < tol && Math.abs(r2!.U - total) < tol : Math.abs(r1!.I - total) < tol && Math.abs(r2!.I - total) < tol) : false;
  const halves = ok ? (series ? Math.abs(r1!.U - r2!.U) < tol : Math.abs(r1!.I - r2!.I) < tol) : false;
  const correct = ok ? (Math.abs(sum - total) <= tol ? 'sum' : each ? 'equal' : halves ? 'half' : undefined) : undefined;
  return {
    ...(correct ? { correct } : {}),
    why: both((l) =>
      series
        ? t(l, 'two-resistors-pair-answer-why')
        : t(l, 'two-resistors-pair-answer-why-2'),
    ),
    say: both((l) => ((series ? tl(l, 'two-resistors-pair-answer-say') : tl(l, 'two-resistors-pair-answer-say-2')))),
    text: both((l) => {
      if (!ok) return t(l, 'two-resistors-pair-answer-text');
      return series
        ? t(l, 'two-resistors-pair-answer-text-2', { I: A(all!.I, l), U: V(r1!.U, l), U2: V(r2!.U, l), U3: V(all!.U, l), U4: V(r1!.U + r2!.U, l) })
        : t(l, 'two-resistors-pair-answer-text-3', { U: V(r1!.U, l), U2: V(all!.U, l), I: A(r1!.I, l), I2: A(r2!.I, l), I3: A(all!.I, l), I4: A(r1!.I + r2!.I, l) });
    }),
  };
}
