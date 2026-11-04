import { msg, t, t as tl } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, PRESSURE, room, stepLine, STEPS_END } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import type { Locale } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { sig } from '../../explain/format.js';

export const preset_hydraulic_press: Preset = {
  id: 'hydraulic-press',
  ask: msg('hydraulic-press-ask'),
  grade: 7,
  topic: PRESSURE,
  title: msg('hydraulic-press-title'),
  question: msg('hydraulic-press-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'press',
  plan: [
    { kind: 'bench', command: { type: 'lab.press', step: 'diameters' } },
    ...[2, 4, 6].map((weights) => ({ kind: 'bench', command: { type: 'lab.press', step: 'lift', weights } }) as const),
    { kind: 'bench', command: { type: 'lab.press', step: 'travel', weights: 6 } },
    // The «what if…»: the same machine with air — one may skip it.
    ...[2, 6, 8].map(
      (weights, k) =>
        ({
          kind: 'bench',
          command: { type: 'lab.pneumatic', step: 'push', medium: 'air', weights },
          ...(k === 0 ? { optional: msg('hydraulic-press-plan-optional') } : {}),
        }) as const,
    ),
    // And back: the water poured in again, under the heaviest load — side by side with the air.
    {
      kind: 'bench',
      command: { type: 'lab.pneumatic', step: 'push', medium: 'water', weights: 8 },
      optional: msg('hydraulic-press-plan-optional-2'),
      followUp: true,
    },
  ],
  choices: [ch('areas', msg('hydraulic-press-choices')), ch('diameters', msg('hydraulic-press-choices-2')), ch('none', msg('hydraulic-press-choices-3'))],
  choicesAt: 'end',
  answerOnBoard: ['gain:'],
  asides: [
    msg('hydraulic-press-asides'),
  ],
  formulas: ['mechanics.hydraulic', 'mechanics.pressure', 'mechanics.boyle'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 3. Тиск твердих тіл, рідин і газів', match: 'same', quote: 'Закон Паскаля. … Гідравлічна машина. … Дослідження: … передавання тиску рідинами й газами' },
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 3. Тиск твердих тіл, рідин і газів', match: 'same', quote: 'конструювання: … пневматичного механізму' },
  ],
  expect: 'reached',
};

export const answer_hydraulic_press = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.press' && x.record.value !== null);
  const d1 = R.find((x) => x.record.inputs?.['which'] === 1)?.record.value ?? 0;
  const d2 = R.find((x) => x.record.inputs?.['which'] === 2)?.record.value ?? 0;
  const lifts = R.filter((x) => x.command['step'] === 'lift').map((x) => ({ n: Number(x.command['weights']), F1: x.record.value!, F2: x.record.inputs?.['load'] ?? 0 }));
  const travel = R.find((x) => x.command['step'] === 'travel')?.record;
  const areas = d1 > 0 ? (d2 / d1) ** 2 : 0;
  const diam = d1 > 0 ? d2 / d1 : 0;
  const gains = lifts.filter((x) => x.F1 > 0).map((x) => x.F2 / x.F1);
  const gain = gains.length ? gains.reduce((a, b) => a + b, 0) / gains.length : 0;
  // Closer to the ratio of the areas or of the diameters (or none at all)?
  const correct = !gains.length ? undefined : Math.abs(gain - areas) < Math.abs(gain - diam) && Math.abs(gain - areas) < Math.abs(gain - 1) ? 'areas' : Math.abs(gain - diam) < Math.abs(gain - 1) ? 'diameters' : 'none';
  const N = (x: number, l: Locale) => formatMeasured('force', x, 0.1, l);
  const cm = (m: number, l: Locale) => `${sig(m * 100, 3, l)} ${t(l, 'unit-sym-cm')}`;
  const lastLift = lifts[lifts.length - 1];
  const push = travel?.inputs?.['push'] ?? 0.06;
  const rise = travel?.value ?? 0;
  const list = (l: Locale) => lifts.map((x) => `F₂ = ${N(x.F2, l)} — F₁ = ${N(x.F1, l)}`).map(stepLine).join(';') + STEPS_END;
  // The «what if…» with air, if it was done: each push reads the idle travel (4), then the rise (3).
  const P = (run.readings ?? []).filter((x) => x.command.type === 'lab.pneumatic' && x.record.value !== null);
  const A = P.filter((x) => x.record.inputs?.['medium'] === 0);
  // The water poured back in, if it was: its load moved at once.
  const back = P.filter((x) => x.record.inputs?.['medium'] === 1);
  const backRise = back.find((x) => x.record.inputs?.['which'] === 3)?.record.value ?? undefined;
  const backWeights = back[0]?.record.inputs?.['weights'];
  const air = A.flatMap((x, k) => (x.record.inputs?.['which'] === 4 ? [{ weights: x.record.inputs?.['weights'] ?? 0, dead: x.record.value!, rise: A[k + 1]?.record.inputs?.['which'] === 3 ? A[k + 1]!.record.value! : 0, extra: x.record.inputs?.['extra'] ?? 0, squeezed: x.record.inputs?.['squeezed'] ?? 0 }] : []));
  const mm = (x: number, l: Locale) => `${Math.round(x * 1000)} ${t(l, 'unit-sym-mm')}`;
  const airWhy = (l: Locale) =>
    !air.length
      ? ''
      : t(l, 'hydraulic-press-answer-air-why');
  const airText = (l: Locale) =>
    !air.length
      ? ''
      : tl(l, 'hydraulic-press-answer-air-text-3', { rise: mm(rise, l), steps: air.map((x) => tl(l, 'hydraulic-press-answer-air-text', { l: t(l, 'count-weights', { n: x.weights }), extra: sig(x.extra / 1000, 2, l), squeezed: sig(x.squeezed * 1e6, 2, l), dead: mm(x.dead, l), rise: mm(x.rise, l) })).map(stepLine).join(';') + STEPS_END, backWeights: backRise !== undefined ? tl(l, 'hydraulic-press-answer-air-text-2', { backWeights, backRise: mm(backRise, l) }) : '' });
  return {
    ...(correct ? { correct } : {}),
    why: both((l) =>
      t(l, 'hydraulic-press-answer-why') + airWhy(l),
    ),
    say: both((l) => (correct === 'areas' ? (t(l, 'hydraulic-press-answer-say', { gain: sig(gain, 2, l) })) : t(l, 'hydraulic-press-answer-say-2'))),
    text: both((l) =>
      t(l, 'hydraulic-press-answer-text', { d1: cm(d1, l), d2: cm(d2, l), diam: sig(diam, 2, l), areas: sig(areas, 2, l), l: list(l), gain: sig(gain, 2, l), push: cm(push, l), rise: cm(rise, l), F1: sig((lastLift?.F1 ?? 0) * push, 2, l), F2: sig((lastLift?.F2 ?? 0) * rise, 2, l) }) + airText(l),
    ),
  };
};
