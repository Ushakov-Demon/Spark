import { msg } from '../../knowledge/messages.js';
import { beaker, ch, PRESSURE, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import { defineCard } from '../types.js';

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

/** The experiment's card: its bench, what stands on it, its presets (all the lab needs before it is opened). */
export const card = defineCard({ kind: 'press', setup: msg('hydraulic-press-setup'), presets: [preset_hydraulic_press] });
