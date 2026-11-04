import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, INTERACTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';

/** The root knows which way is down: the question, the steps, the stories — and the answer from the photos. */
export const preset: Preset = {
  ask: msg('roots-gravity-ask'),
  id: 'roots-gravity',
  grade: 7,
  topic: INTERACTION,
  title: msg('roots-gravity-title'),
  question: msg('roots-gravity-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'gravi',
  plan: (['upright', 'side', 'clino'] as const).map((step) => ({ kind: 'bench', command: { type: 'lab.gravi', step } }) as const),
  choices: [ch('down', msg('roots-gravity-choices')), ch('straight', msg('roots-gravity-choices-2')), ch('up', msg('roots-gravity-choices-3'))],
  answerOnBoard: ['gr:'],
  asides: [
    msg('roots-gravity-asides'),
    msg('roots-gravity-asides-2'),
    msg('roots-gravity-asides-3'),
  ],
  formulas: ['mechanics.density', 'mechanics.weight'],
  programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'впливу земного тяжіння на організми' }],
  expect: 'reached',
};

export const answer = (run: PresetRun): PresetAnswer => {
  const recs = (run.readings ?? []).filter((x) => x.command.type === 'lab.gravi' && x.record.value !== null);
  const of = (step: string) => recs.filter((x) => x.command['step'] === step).map((x) => x.record);
  const side = of('side');
  const clino = of('clino');
  const end = side.at(-1)?.value ?? null;
  const correct = end === null ? undefined : end >= 45 ? 'down' : end <= -45 ? 'up' : 'straight';
  const deg = (x: number) => `${x}°`;
  const first = side.find((r) => (r.value ?? 0) > 0);
  return {
    ...(correct ? { correct } : {}),
    why: msg('roots-gravity-answer-why'),
    say: both((l) => (end === null ? '' : t(l, 'roots-gravity-answer-say', { end: deg(end) }))),
    text: both((l) => {
      const parts: string[] = [];
      if (side.length) parts.push(t(l, 'roots-gravity-answer-text-2', { value: side.map((r) => t(l, 'roots-gravity-answer-text', { time: r.inputs?.['time'], value: deg(r.value!) })).join(', ') }));
      if (first) parts.push(t(l, 'roots-gravity-answer-text-3'));
      if (clino.length) parts.push(t(l, 'roots-gravity-answer-text-4', { value: deg(Math.max(...clino.map((r) => r.value!))) }));
      return parts.join(' ');
    }),
  };
};
