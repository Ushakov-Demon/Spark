import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both, stepLine, STEPS_END } from '../../scenarios/preset-kit.js';
import { type Locale, tr } from '../../knowledge/i18n.js';
import { type RowBody, rowName } from './bench.js';
import { sig } from '../../explain/format.js';

export const answer_small_bodies = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.rows' && x.record.value !== null).map((x) => ({ body: String(x.command['body']), n: Number(x.command['count']), L: x.record.value! }));
  const mm = (x: number, l: Locale, d = 3) => `${sig(x * 1000, d, l)} ${t(l, 'unit-sym-mm')}`;
  // The size of one: to hundredths of a millimetre (0,40 — not 0,4).
  const d2 = (x: number, l: Locale) => `${(x * 1000).toFixed(2).replace('.', t(l, 'small-bodies-answer-d2'))} ${t(l, 'unit-sym-mm')}`;
  const one = R.find((x) => x.n === 1);
  const rows = R.filter((x) => x.n > 1);
  const name = (b: string, n: number, l: Locale) => tr(rowName(b as RowBody, n), l);
  return {
    correct: 'row',
    why: msg('small-bodies-answer-why'),
    say: both((l) => {
      const millet = rows.find((x) => x.body === 'millet');
      return millet ? (t(l, 'small-bodies-answer-say', { L: d2(millet.L / millet.n, l), n: String(millet.n) })) : '';
    }),
    text: both((l) => {
      const parts = [
        ...(one ? [t(l, 'small-bodies-text-parts', { L: mm(one.L, l, 2), value: String(Math.round((0.0005 / one.L) * 100)) })] : []),
        ...rows.map((x) => t(l, 'small-bodies-text-parts-2', { body: name(x.body, x.n, l), L: mm(x.L, l, 3), n: String(x.n), L2: d2(x.L / x.n, l), value: sig(0.5 / x.n, 1, l) })),
      ];
      return `${parts.map(stepLine).join(';') + STEPS_END}.${t(l, 'small-bodies-answer-text')}`.replace(/^./, (ch) => ch.toUpperCase());
    }),
  };
};
