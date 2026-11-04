import { localized, msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, room, stepLine, STEPS_END, varied, WORK } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import type { Locale } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { sig } from '../../explain/format.js';
import { slopeLoad } from '../lever-moments/bench.js';

export const preset_slope_efficiency: Preset = varied(
  {
    id: 'slope-efficiency',
    ask: msg('slope-efficiency-ask'),
    grade: 8,
    topic: WORK,
    title: msg('slope-efficiency-title'),
    params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
    guided: true,
    bench: 'slope',
    choices: [ch('grows', msg('slope-efficiency-choices')), ch('falls', msg('slope-efficiency-choices-2')), ch('same', msg('slope-efficiency-choices-3'))],
    choicesAt: 'end',
    answerOnBoard: ['eta:'],
    formulas: ['mechanics.efficiency', 'mechanics.weight'],
    programs: [
      { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 4. Механічна робота, потужність, енергія', match: 'same', quote: 'визначення: … коефіцієнту корисної дії; ККД простого механізму' },
      { program: 'ua-nus-2023-kreminskyi', grade: 8, item: 'ЛР № 2', topic: 'Тема 1. Момент сили. Механічна робота та енергія', match: 'same', quote: '№ 2. Визначення ККД простого механізму.' },
    ],
    expect: 'reached',
  },
  {
    controls: [{ id: 'weights', label: msg('slope-efficiency-weights-label'), kind: 'number', unit: '', min: 1, max: 3, step: 1, value: 2 }],
    build: (v) => {
      const n = Number(v['weights']);
      const with_ = localized((l: Locale) => n === 1 ? t(l, 'slope-efficiency-with-uk') : n === 2 ? t(l, 'slope-efficiency-with-uk-2') : t(l, 'slope-efficiency-with-uk-3'));
      return {
        question: msg('slope-efficiency-build-question', { with_: (lang: Locale) => with_[lang] }),
        plan: [
          { kind: 'hang', substance: 'wood', mass: slopeLoad(n), into: 'air', label: msg('slope-efficiency-plan-label', { with_: (l: Locale) => with_[l] }) },
          ...[0.1, 0.2, 0.3].map((height) => ({ kind: 'bench', command: { type: 'lab.slope', height, weights: n } }) as const),
        ],
      };
    },
  },
);

export const answer_slope_efficiency = (run: PresetRun): PresetAnswer => {
  const R = run.readings ?? [];
  const P = R.find((x) => x.command.type === 'lab.hang')?.record.value ?? null;
  const rows = R.filter((x) => x.command.type === 'lab.slope' && x.record.value !== null).map((x) => ({ h: x.record.inputs?.['h'] ?? 0, l: x.record.inputs?.['l'] ?? 1, F: x.record.value! }));
  const eta = rows.map((x) => (P !== null ? (P * x.h) / (x.F * x.l) : 0));
  const trend = eta.length >= 2 ? eta[eta.length - 1]! - eta[0]! : 0;
  const correct = P !== null && rows.length >= 2 ? (trend > 0.03 ? 'grows' : trend < -0.03 ? 'falls' : 'same') : undefined;
  const N1 = (x: number, l: Locale) => formatMeasured('force', x, 0.1, l);
  const pct = (x: number, l: Locale) => `${sig(x * 100, 2, l)} %`;
  return {
    ...(correct ? { correct } : {}),
    why: msg('slope-efficiency-answer-why'),
    say: msg('slope-efficiency-answer-say'),
    text: both((l) => {
      const list = rows.map((x, k) => `h = ${Math.round(x.h * 100)} ${t(l, 'unit-sym-cm')}: F = ${N1(x.F, l)}, η ≈ ${pct(eta[k]!, l)}`).map(stepLine).join(';') + STEPS_END;
      return t(l, 'slope-efficiency-answer-text', { P: P !== null ? N1(P, l) : '—', list });
    }),
  };
};
