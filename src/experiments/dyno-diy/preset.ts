import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, INTERACTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import type { Locale } from '../../knowledge/i18n.js';
import { sig } from '../../explain/format.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { DYNO_DIVISION } from './bench.js';
import { scalesSequence } from '../scales-diy/bench.js';

export const preset_dyno_diy: Preset = {
  ask: msg('dyno-diy-ask'),
  id: 'dyno-diy',
  grade: 7,
  topic: INTERACTION,
  title: msg('dyno-diy-title'),
  question: msg('dyno-diy-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'dyno',
  plan: (['marks', 'scale', 'apple', 'egg'] as const).map((step) => ({ kind: 'bench', command: { type: 'lab.dyno', step } }) as const),
  choices: [ch('one', msg('dyno-diy-choices')), ch('hundred', msg('dyno-diy-choices-2')), ch('tenth', msg('dyno-diy-choices-3'))],
  trick: msg('dyno-diy-trick'),
  answerOnBoard: ['da:'],
  formulas: ['mechanics.weight', 'mechanics.hooke'],
  programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'конструювання: терез; динамометра' }],
  expect: 'reached',
};

export const answer_dyno_diy = (run: PresetRun): PresetAnswer => {
  const recs = (run.readings ?? []).filter((x) => x.command.type === 'lab.dyno' && x.record.value !== null);
  const of = (step: string) => recs.filter((x) => x.command['step'] === step).map((x) => x.record);
  const marks = of('marks');
  const L = of('scale')[0];
  const apple = of('apple')[0];
  const egg = of('egg')[0];
  const correct = apple ? (apple.value! > 0.5 && apple.value! < 2 ? 'one' : apple.value! >= 2 ? 'hundred' : 'tenth') : undefined;
  const N = (x: number, l: Locale) => formatMeasured('force', x, DYNO_DIVISION, l);
  const mm = (x: number, l: Locale) => `${Math.round(x * 1000)} ${t(l, 'unit-sym-mm')}`;
  return {
    ...(correct ? { correct } : {}),
    why: msg('dyno-diy-answer-why'),
    say: both((l) => (apple ? (t(l, 'dyno-diy-answer-say', { value: N(apple.value!, l) })) : '')),
    text: both((l) => {
      const parts: string[] = [];
      if (marks.length) parts.push(t(l, 'dyno-diy-answer-text', { value: marks.map((r) => mm(r.value!, l)).join(', ') }));
      if (L) parts.push(t(l, 'dyno-diy-answer-text-2', { value: mm(L.value!, l), value2: sig(L.value! * 100, 2, l) }));
      if (apple) parts.push(t(l, 'dyno-diy-answer-text-3', { value: N(apple.value!, l), exact: sig(apple.exact, 2, l) }));
      if (egg) {
        // (What the home-made scales made of it: sheets of 5 g and millilitres of water.)
        const s = scalesSequence('egg').at(-1)!;
        const m = (s.sheets * 5 + s.water) / 1000;
        const F = sig(m * (egg.inputs?.['g'] ?? 9.81), 2, l);
        parts.push(t(l, 'dyno-diy-answer-text-4', { value: N(egg.value!, l), m: sig(m * 1000, 3, l), m2: sig(m, 2, l), F }));
      }
      return parts.join(' ');
    }),
  };
};
