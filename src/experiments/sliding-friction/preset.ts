import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, INTERACTION, room, stepLine, STEPS_END } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import type { Locale } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { sig } from '../../explain/format.js';
import { SUBSTANCES } from '../../substances/catalog.js';

export const preset_friction_factors: Preset = {
  ask: msg('sliding-friction-factors-ask'),
  id: 'friction-factors',
  grade: 7,
  topic: INTERACTION,
  title: msg('sliding-friction-factors-title'),
  question: msg('sliding-friction-factors-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'friction',
  plan: [
    { kind: 'hang', substance: 'wood', mass: 0.12 * 0.06 * 0.04 * SUBSTANCES.wood.liquid.density.value, into: 'air', label: msg('sliding-friction-plan-label') },
    { kind: 'bench', command: { type: 'lab.pull', weights: 1, face: 'wide' } },
    { kind: 'bench', command: { type: 'lab.pull', weights: 1, face: 'narrow' } },
    { kind: 'bench', command: { type: 'lab.pull', weights: 1, surface: 'paper' } },
    { kind: 'bench', command: { type: 'lab.pull', weights: 3, face: 'wide' } },
  ],
  choices: [ch('same', msg('sliding-friction-factors-choices')), ch('less', msg('sliding-friction-factors-choices-2')), ch('more', msg('sliding-friction-factors-choices-3'))],
  trick: msg('sliding-friction-factors-trick'),
  formulas: ['mechanics.friction', 'mechanics.weight'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'між площею і якістю поверхонь рухомих тіл, масою рухомого тіла і силою тертя ковзання' },
    { program: 'ua-nus-2023-kreminskyi', grade: 7, topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'same', quote: 'Сили тертя. Тертя в природі й техніці.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 26, рис. 26.5–26.7: брусок по дереву й по склу, на більшій і меншій грані, з тягарцями; закон Амонтона — Кулона' } },
  ],
  expect: 'reached',
};

export const answer_friction_factors = (run: PresetRun): PresetAnswer => {
  const pulls = (run.readings ?? []).filter((x) => x.command.type === 'lab.pull' && x.record.value !== null);
  const at = (f: (c: Record<string, unknown>) => boolean) => pulls.find((x) => f(x.command as Record<string, unknown>))?.record ?? null;
  const wide = at((c) => c['weights'] === 1 && c['face'] !== 'narrow' && c['surface'] !== 'paper');
  const narrow = at((c) => c['face'] === 'narrow');
  const paper = at((c) => c['surface'] === 'paper');
  const heavy = at((c) => Number(c['weights']) === 3);
  const correct = wide && narrow ? (Math.abs(narrow.value! - wide.value!) < 0.05 ? 'same' : narrow.value! < wide.value! ? 'less' : 'more') : undefined;
  const N1 = (x: { value: number | null } | null, l: Locale) => (x ? formatMeasured('force', x.value!, 0.1, l) : '—');
  const Nof = (x: { inputs?: Record<string, number> } | null) => x?.inputs?.['N'] ?? 0;
  return {
    ...(correct ? { correct } : {}),
    why: msg('sliding-friction-answer-factors-why'),
    say: msg('sliding-friction-answer-factors-say'),
    text: both((l) =>
      t(l, 'sliding-friction-answer-factors-text', { wide: N1(wide, l), narrow: N1(narrow, l), paper: N1(paper, l), value: paper ? sig(paper.value! / Nof(paper), 2, l) : '—', heavy: N1(heavy, l), wide2: sig(Nof(wide), 2, l), heavy2: sig(Nof(heavy), 2, l), heavy3: sig(Nof(heavy) / Math.max(1e-9, Nof(wide)), 2, l) }),
    ),
  };
};

export const preset_friction_coefficient: Preset = {
  ask: msg('sliding-friction-coefficient-ask'),
  id: 'friction-coefficient',
  grade: 7,
  topic: INTERACTION,
  title: msg('sliding-friction-coefficient-title'),
  question: msg('sliding-friction-coefficient-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'friction',
  plan: [
    { kind: 'hang', substance: 'wood', mass: 0.12 * 0.06 * 0.04 * SUBSTANCES.wood.liquid.density.value, into: 'air', label: msg('sliding-friction-plan-label') },
    ...[0, 1, 2, 3].map((weights) => ({ kind: 'bench', command: { type: 'lab.pull', weights } }) as const),
  ],
  choices: [ch('same', msg('sliding-friction-coefficient-choices')), ch('grows', msg('sliding-friction-coefficient-choices-2')), ch('falls', msg('sliding-friction-coefficient-choices-3'))],
  formulas: ['mechanics.friction', 'mechanics.weight'],
  programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 7, item: 'ЛР № 7', topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'same', quote: '№ 7. Визначення коефіцієнта тертя ковзання.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 27, лабораторна робота № 7, с. 191' } }],
  expect: 'reached',
};

export const answer_friction_coefficient = (run: PresetRun): PresetAnswer => {
  const rows = (run.readings ?? []).filter((x) => x.command.type === 'lab.pull' && x.record.value !== null).map((x) => ({ n: Number(x.command['weights']), F: x.record.value!, N: x.record.inputs?.['N'] ?? 1 }));
  const P = (run.readings ?? []).find((x) => x.command.type === 'lab.hang')?.record.value ?? null;
  const mus = rows.map((x) => x.F / x.N);
  const mean = mus.reduce((a, b) => a + b, 0) / Math.max(1, mus.length);
  const trend = rows.length >= 2 ? (mus[mus.length - 1]! - mus[0]!) / mean : 0;
  const correct = rows.length < 2 ? undefined : Math.abs(trend) < 0.25 ? 'same' : trend > 0 ? 'grows' : 'falls';
  const N1 = (x: number, l: Locale) => formatMeasured('force', x, 0.1, l);
  return {
    ...(correct ? { correct } : {}),
    why: msg('sliding-friction-answer-coefficient-why'),
    say: both((l) => t(l, 'sliding-friction-answer-coefficient-say', { mean: sig(mean, 2, l) })),
    text: both((l) =>
      t(l, 'sliding-friction-answer-coefficient-text-3', { mean: sig(mean, 2, l), P: P !== null ? N1(P, l) : t(l, 'sliding-friction-answer-coefficient-text'), steps: rows.map((x) => t(l, 'sliding-friction-answer-coefficient-text-2', { N: sig(x.N, 2, l), F: N1(x.F, l), F2: sig(x.F / x.N, 2, l) })).map(stepLine).join(';') + STEPS_END }),
    ),
  };
};
