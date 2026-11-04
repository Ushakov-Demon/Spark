import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both } from '../../scenarios/preset-kit.js';
import type { Locale } from '../../knowledge/i18n.js';
import { STROBE_INTERVAL, STROBE_SCALE } from './bench.js';
import { sig } from '../../explain/format.js';

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
