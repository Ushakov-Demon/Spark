import { sig } from '../../explain/format.js';
import type { Locale } from '../../knowledge/i18n.js';
import { msg, t, t as tl } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, room, STEPS_END, stepLine, WORK } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';

export const preset_gear_train: Preset = {
  id: 'gear-train',
  ask: msg('gear-train-ask'),
  grade: 7,
  topic: WORK,
  title: msg('gear-train-title'),
  question: msg('gear-train-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'gears',
  plan: [
    { kind: 'bench', command: { type: 'lab.gears', step: 'count' } },
    { kind: 'bench', command: { type: 'lab.gears', step: 'turn', train: [24, 8], turns: 1 } },
    { kind: 'bench', command: { type: 'lab.gears', step: 'turn', train: [8, 40], turns: 5 } },
    { kind: 'bench', command: { type: 'lab.gears', step: 'turn', train: [24, 40, 8], turns: 1 } },
  ],
  choices: [
    ch('teeth', msg('gear-train-choices')),
    ch('same', msg('gear-train-choices-2')),
    ch('big', msg('gear-train-choices-3')),
  ],
  // The ratios and the directions are the answer: chalked in once a guess is made.
  answerOnBoard: ['gr:'],
  asides: [
    msg('gear-train-asides'),
  ],
  formulas: ['mechanics.gear-ratio'],
  programs: [
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 4. Механічна робота, потужність, енергія', match: 'same', quote: 'зміни швидкості й напряму руху ведучої частини механізму, що містить зубчасту передачу' },
    { program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 4. Механічна робота, потужність, енергія', match: 'same', quote: 'моделювання й конструювання: простих механізмів; зубчастих передач' },
  ],
  expect: 'reached',
};

export const answer_gear_train = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.gears' && x.command['step'] === 'turn' && x.record.value !== null);
  const rows = R.map((x) => {
    const i = x.record.inputs ?? {};
    return { train: (x.command['train'] as number[]) ?? [], n1: i['driver'] ?? 1, n2: x.record.value!, z1: i['first'] ?? 0, z2: i['last'] ?? 0, same: i['same'] === 1 };
  });
  const fits = rows.every((x) => Math.abs(x.n2 / x.n1 - x.z1 / x.z2) < 0.05);
  const pairsReverse = rows.filter((x) => x.train.length === 2).every((x) => !x.same);
  const correct = !rows.length ? undefined : fits && pairsReverse ? 'teeth' : 'same';
  const way = (same: boolean, l: Locale) => ((same ? tl(l, 'gear-train-way') : tl(l, 'gear-train-answer-way')));
  return {
    ...(correct ? { correct } : {}),
    why: msg('gear-train-answer-why'),
    say: both((l) => (correct === 'teeth' ? t(l, 'gear-train-answer-say') : t(l, 'gear-train-answer-say-2'))),
    text: both((l) => {
      if (!rows.length) return '';
      const list = rows.map((x) => t(l, 'gear-train-text-list', { train: x.train.join(' → '), n1: sig(x.n1, 3, l), n2: sig(x.n2, 3, l), z1: String(x.z1), z2: String(x.z2), z12: sig(x.z1 / x.z2, 3, l), same: way(x.same, l) }));
      return t(l, 'gear-train-answer-text', { steps: list.map(stepLine).join(';') + STEPS_END });
    }),
  };
};
