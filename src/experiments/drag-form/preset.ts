import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, INTERACTION, room, stepLine, STEPS_END } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { DRAG_COEFFICIENTS, DRAG_MASS, DRAG_START, DRAG_TRACK, dragBody, type DragShape, dragShapeName, framesText, mediumDensity } from './bench.js';
import { G } from '../../domains/mechanics/constants.js';
import type { Locale } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { sig } from '../../explain/format.js';

export const preset_drag_form: Preset = {
  ask: msg('drag-form-ask'),
  id: 'drag-form',
  grade: 7,
  topic: INTERACTION,
  title: msg('drag-form-title'),
  question: msg('drag-form-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'drag',
  plan: [
    ...(['ball', 'cube', 'plate'] as const).map((shape) => ({ kind: 'bench', command: { type: 'lab.drag', shape, medium: 'water' } }) as const),
    { kind: 'bench', command: { type: 'lab.drag', shape: 'ball', medium: 'air' } },
  ],
  choices: [ch('plate', msg('drag-form-choices')), ch('ball', msg('drag-form-choices-2')), ch('same', msg('drag-form-choices-3'))],
  formulas: ['mechanics.speed'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'між формою тіла, густиною середовища і силою опору середовища' },
  ],
  expect: 'reached',
};

export const answer_drag_form = (run: PresetRun): PresetAnswer => {
  const recs = (run.readings ?? []).filter((x) => x.command.type === 'lab.drag' && x.record.value !== null);
  const of = (shape: DragShape, medium: 'water' | 'air') => recs.find((x) => x.command['shape'] === shape && x.command['medium'] === medium)?.record ?? null;
  const water = (['ball', 'cube', 'plate'] as const).map((shape) => ({ shape, r: of(shape, 'water') })).filter((x) => x.r !== null);
  const air = of('ball', 'air');
  const slowest = water.length === 3 ? water.reduce((a, b) => (b.r!.value! > a.r!.value! ? b : a)).shape : undefined;
  const fr = (r: { value: number | null; inputs?: Record<string, number> }, l: Locale) => `${framesText(r.inputs?.['frames'] ?? 0, l)} (${formatMeasured('time', r.value!, 0.01, l)}, v ≈ ${sig(DRAG_TRACK / r.value!, 2, l)} ${t(l, 'unit-sym-m-per-s')})`;
  const { volume } = dragBody('ball');
  const rhoW = mediumDensity('water');
  const Fd = DRAG_MASS * G - rhoW * G * volume;
  const free = Math.sqrt((2 * (DRAG_START + DRAG_TRACK)) / G) - Math.sqrt((2 * DRAG_START) / G);
  const ratio = rhoW / mediumDensity('air');
  const cd = (s: DragShape, l: Locale) => sig(DRAG_COEFFICIENTS[s].value, 3, l);
  return {
    ...(slowest === 'plate' ? { correct: 'plate' } : slowest === 'ball' ? { correct: 'ball' } : {}),
    why: both((l) =>
      t(l, 'drag-form-answer-why', { ratio: sig(ratio, 2, l) }),
    ),
    say: msg('drag-form-answer-say'),
    text: both((l) => {
      const parts = water.map((x) => `${dragShapeName(x.shape)[l]} — ${fr(x.r!, l)}`).map(stepLine).join(';') + STEPS_END;
      const a = air ? (t(l, 'drag-form-text-a', { air: fr(air, l), value: formatMeasured('time', free, 0.001, l) })) : '';
      return t(l, 'drag-form-answer-text', { parts, Fd: sig(Fd, 2, l), a, value: cd('ball', l), value2: cd('cube', l), value3: cd('plate', l) });
    }),
  };
};
