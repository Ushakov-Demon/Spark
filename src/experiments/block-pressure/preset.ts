import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, PRESSURE, room, times } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import type { Locale } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { sig } from '../../explain/format.js';
import { SUBSTANCES } from '../../substances/catalog.js';

export const preset_block_pressure: Preset = {
  ask: msg('block-pressure-ask'),
  id: 'block-pressure',
  grade: 7,
  topic: PRESSURE,
  title: msg('block-pressure-title'),
  question: msg('block-pressure-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'pressure',
  plan: [
    { kind: 'hang', substance: 'wood', mass: 0.12 * 0.06 * 0.04 * SUBSTANCES.wood.liquid.density.value, into: 'air', label: msg('block-pressure-plan-label') },
    ...([0, 1, 2] as const).map((edge) => ({ kind: 'bench', command: { type: 'lab.edge', edge } }) as const),
  ],
  choices: [ch('largest', msg('block-pressure-choices')), ch('smallest', msg('block-pressure-choices-2')), ch('same', msg('block-pressure-choices-3'))],
  choicesAt: 'end',
  answerOnBoard: ['pressure:'],
  formulas: ['mechanics.pressure', 'mechanics.weight'],
  programs: [{ program: 'ua-nus-2023-kreminskyi', grade: 7, item: 'ЛР № 8', topic: 'Тема 3. Взаємодія тіл. Сили в природі', match: 'same', quote: '№ 8. Вимірювання тиску тіла на опору.', textbook: { source: 'ua-textbook-2024-bariakhtar-physics-7', at: '§ 28, лабораторна робота № 8, с. 203' } }],
  expect: 'reached',
};

export const answer_block_pressure = (run: PresetRun): PresetAnswer => {
  const P = (run.readings ?? []).find((x) => x.command.type === 'lab.hang')?.record.value ?? null;
  const e = [0, 1, 2].map((k) => (run.readings ?? []).find((x) => x.command.type === 'lab.edge' && x.command['edge'] === k)?.record.value ?? null);
  const [a, b, c] = e;
  const ok = P !== null && a !== null && b !== null && c !== null;
  const faces = ok ? [a! * b!, a! * c!, b! * c!] : [];
  const p = faces.map((S) => P! / S);
  const correct = ok ? (p[2]! > p[0]! * 1.05 ? 'smallest' : p[0]! > p[2]! * 1.05 ? 'largest' : 'same') : undefined;
  const cm = (x: number, l: Locale) => formatMeasured('length', x, 0.001, l);
  return {
    ...(correct ? { correct } : {}),
    why: msg('block-pressure-answer-why'),
    say: msg('block-pressure-answer-say'),
    text: both((l) =>
      !ok
        ? '—'
        : t(l, 'block-pressure-answer-text', { value: formatMeasured('force', P!, 0.1, l), a: cm(a!, l), b: cm(b!, l), c: cm(c!, l), faces: sig(faces[0]! * 1e4, 3, l), faces2: sig(faces[1]! * 1e4, 3, l), faces3: sig(faces[2]! * 1e4, 3, l), p: sig(p[0]!, 3, l), p2: sig(p[1]!, 3, l), p3: sig(p[2]!, 3, l), p4: times(p[2]! / p[0]!, l) }),
    ),
  };
};
