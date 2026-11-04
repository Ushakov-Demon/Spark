import { efficiency, work } from '../../domains/mechanics/formulas.js';
import { NUMBER_LOCALE, type Locale } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both, STEPS_END, stepLine } from '../../scenarios/preset-kit.js';
import { forceDivision } from './bench.js';
import { lengthText } from './words.js';

export const answer_pulley = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.pulley' && x.record.value !== null);
  const of = (how: string, which: number) => R.find((x) => x.command['how'] === how && x.record.inputs?.['which'] === which)?.record;
  const P = of('straight', 1)?.value ?? 0;
  const h = of('straight', 1)?.inputs?.['lift'] ?? 0.1;
  const rows = (['straight', 'fixed', 'movable'] as const).map((how) => ({ how, F: of(how, 1)?.value ?? 0, s: of(how, 2)?.value ?? 0 })).filter((x) => x.F > 0);
  const mov = rows.find((x) => x.how === 'movable');
  const eta = mov && P ? efficiency(work(P, h), work(mov.F, mov.s)) : 0;
  const correct = !mov || !P ? undefined : mov.F < 0.7 * P && mov.s > 1.5 * h && eta <= 1 ? 'force' : mov.F < 0.7 * P ? 'work' : 'none';
  const N = (x: number, l: Locale) => formatMeasured('force', x, forceDivision(x), l);
  const cm = lengthText;
  const J = (x: number, l: Locale) => `${new Intl.NumberFormat(NUMBER_LOCALE[l], { maximumFractionDigits: 3 }).format(x)} ${t(l, 'unit-sym-J')}`;
  const name = (how: string, l: Locale) => ({ straight: t(l, 'pulley-name-straight'), fixed: t(l, 'pulley-name-fixed'), movable: t(l, 'pulley-name-movable') })[how as 'straight'];
  return {
    ...(correct ? { correct } : {}),
    why: msg('pulley-answer-why'),
    say: both((l) => (mov && mov.F >= P ? (t(l, 'pulley-answer-say', { F: N(mov.F, l), P: N(P, l) })) : correct === 'force' && mov ? (t(l, 'pulley-answer-say-2', { F: N(mov.F, l), P: N(P, l), s: cm(mov.s, l) })) : t(l, 'pulley-answer-say-3'))),
    text: both((l) => {
      if (!rows.length || !P) return '';
      const list = rows.map((x) => (`${name(x.how, l)}: F = ${N(x.F, l)}, s = ${cm(x.s, l)}, A = F·s ≈ ${J(work(x.F, x.s), l)}`));
      return t(l, 'pulley-answer-text-4', { P: N(P, l), h: cm(h, l), P2: J(work(P, h), l), steps: list.map(stepLine).join(';') + STEPS_END, eta: mov ? t(l, 'pulley-answer-text-3', { eta: String(Math.round(eta * 100)), value: eta < 0.995 ? t(l, 'pulley-answer-text') : t(l, 'pulley-answer-text-2') }) : '' });
    }),
  };
};
