import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { beaker, both, ch, MOTION, room } from '../../scenarios/preset-kit.js';
import type { Preset } from '../../scenarios/presets.js';
import type { Locale } from '../../knowledge/i18n.js';
import { STROBE_INTERVAL, STROBE_SCALE } from './bench.js';
import { sig } from '../../explain/format.js';

export const preset_strobe_photo: Preset = {
  ask: msg('strobe-photo-ask'),
  id: 'strobe-photo',
  grade: 7,
  topic: MOTION,
  title: msg('strobe-photo-title'),
  question: msg('strobe-photo-question'),
  params: { ...room, ...beaker, action: 'settle', substance: 'water', startTemp: 20 },
  guided: true,
  bench: 'strobe',
  plan: (['table', 'groove'] as const).map((photo) => ({ kind: 'bench', command: { type: 'lab.strobe', photo } }) as const),
  choices: [ch('gaps', msg('strobe-photo-choices')), ch('size', msg('strobe-photo-choices-2')), ch('cant', msg('strobe-photo-choices-3'))],
  answerOnBoard: ['sv:'],
  formulas: ['mechanics.speed'],
  programs: [{ program: 'ua-nus-2023-holovko', grade: 7, topic: 'Тема 1. Механічний рух', match: 'same', quote: 'вимірювання: … відстаней на планах і картах та стробоскопічних фотографіях' }],
  expect: 'reached',
};

export const answer_strobe_photo = (run: PresetRun): PresetAnswer => {
  const gaps = (photo: string) => (run.readings ?? []).filter((x) => x.command.type === 'lab.strobe' && x.command['photo'] === photo && x.record.value !== null).map((x) => x.record.value!);
  const table = gaps('table');
  const groove = gaps('groove');
  const mm = (x: number) => Math.round(x * 1000);
  const real = (x: number, l: Locale) => `${sig(x * STROBE_SCALE * 100, 3, l)} ${t(l, 'unit-sym-cm')}`;
  const ms = (x: number, l: Locale) => `${sig((x * STROBE_SCALE) / STROBE_INTERVAL, 2, l)} ${t(l, 'unit-sym-m-per-s')}`;
  const equal = table.length > 1 && table.every((x) => Math.abs(x - table[0]!) < 0.0015);
  const growing = groove.length > 1 && groove.every((x, i) => i === 0 || x > groove[i - 1]!);
  return {
    ...(equal && growing ? { correct: 'gaps' } : {}),
    why: msg('strobe-photo-answer-why'),
    say: both((l) => (table.length ? (t(l, 'strobe-photo-answer-say', { table: String(mm(table[0]!)), table2: real(table[0]!, l), table3: ms(table[0]!, l) })) : '')),
    text: both((l) => {
      const list = (g: number[]) => g.map((x) => `${mm(x)}`).join(', ') + t(l, 'strobe-photo-text-list');
      return t(l, 'strobe-photo-answer-text', { table: list(table), table2: real(table[0] ?? 0, l), table3: ms(table[0] ?? 0, l), groove: list(groove), value: groove.map((x) => real(x, l)).join(', '), value2: groove.map((x) => ms(x, l)).join(', ') });
    }),
  };
};
