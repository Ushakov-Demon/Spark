import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, INTERACTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import type { Locale } from '../../knowledge/i18n.js';
import { sig } from '../../explain/format.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { SHEET } from './bench.js';

export const preset_scales_diy: Preset = {
  ask: msg('scales-diy-ask'),
  id: 'scales-diy',
  grade: 7,
  topic: INTERACTION,
  title: msg('scales-diy-title'),
  question: msg('scales-diy-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'scales',
  plan: (['zero', 'check', 'egg'] as const).map((step) => ({ kind: 'bench', command: { type: 'lab.scales', step } }) as const),
  choices: [ch('known', msg('scales-diy-choices')), ch('cant', msg('scales-diy-choices-2')), ch('size', msg('scales-diy-choices-3'))],
  answerOnBoard: ['sg:'],
  formulas: ['mechanics.density', 'mechanics.weight'],
  programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 2. Взаємодія тіл. Сила', match: 'same', quote: 'конструювання: терез' }],
  expect: 'reached',
};

export const answer_scales_diy = (run: PresetRun): PresetAnswer => {
  const recs = (run.readings ?? []).filter((x) => x.command.type === 'lab.scales' && x.record.value !== null);
  const at = (step: string) => recs.find((x) => x.command['step'] === step)?.record;
  const check = at('check');
  const egg = at('egg');
  const g = (x: number, l: Locale) => `${sig(x * 1000, 3, l)} ${t(l, 'unit-sym-g')}`;
  return {
    ...(egg ? { correct: 'known' } : {}),
    why: msg('scales-diy-answer-why'),
    say: both((l) => (egg ? (t(l, 'scales-diy-answer-say', { value: g(egg.value!, l) })) : '')),
    text: both((l) => {
      const parts: string[] = [t(l, 'scales-diy-text-parts')];
      if (check) parts.push(t(l, 'scales-diy-answer-text', { water: check.inputs?.['water'], value: g(check.value!, l), value2: g(SHEET.value, l) }));
      if (egg) parts.push(t(l, 'scales-diy-answer-text-2', { sheets: egg.inputs?.['sheets'], water: egg.inputs?.['water'], value: g(egg.value!, l) }));
      return parts.join(' ');
    }),
  };
};
