import { t, t as tl } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both } from '../../scenarios/preset-kit.js';
import type { Locale } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';

export const answer_series_circuit = (run: PresetRun): PresetAnswer => {
  return pairAnswer(run, 'series');
};

export const answer_parallel_circuit = (run: PresetRun): PresetAnswer => {
  return pairAnswer(run, 'parallel');
};

/** The two connections answered alike: the readings at each place, the sum that holds, why. */
function pairAnswer(run: PresetRun, connection: 'series' | 'parallel'): PresetAnswer {
  const at = (where: string) => {
    const rs = (run.readings ?? []).filter((x) => x.command.type === 'lab.pair' && x.command['at'] === where).map((x) => x.record);
    const I = rs.find((x) => x.quantity === 'current')?.value;
    const U = rs.find((x) => x.quantity === 'voltage')?.value;
    return I != null && U != null ? { I, U } : null;
  };
  const [r1, r2, all] = [at('r1'), at('r2'), at('both')];
  const series = connection === 'series';
  const A = (x: number, l: Locale) => formatMeasured('current', x, 0.01, l);
  const V = (x: number, l: Locale) => formatMeasured('voltage', x, 0.1, l);
  // Within the instruments' divisions (two readings rounded each): the sum holds.
  const ok = !!(r1 && r2 && all);
  const sum = ok ? (series ? r1!.U + r2!.U : r1!.I + r2!.I) : 0;
  const total = ok ? (series ? all!.U : all!.I) : 0;
  const tol = series ? 0.3 : 0.12;
  const each = ok ? (series ? Math.abs(r1!.U - total) < tol && Math.abs(r2!.U - total) < tol : Math.abs(r1!.I - total) < tol && Math.abs(r2!.I - total) < tol) : false;
  const halves = ok ? (series ? Math.abs(r1!.U - r2!.U) < tol : Math.abs(r1!.I - r2!.I) < tol) : false;
  const correct = ok ? (Math.abs(sum - total) <= tol ? 'sum' : each ? 'equal' : halves ? 'half' : undefined) : undefined;
  return {
    ...(correct ? { correct } : {}),
    why: both((l) =>
      series
        ? t(l, 'two-resistors-pair-answer-why')
        : t(l, 'two-resistors-pair-answer-why-2'),
    ),
    say: both((l) => ((series ? tl(l, 'two-resistors-pair-answer-say') : tl(l, 'two-resistors-pair-answer-say-2')))),
    text: both((l) => {
      if (!ok) return t(l, 'two-resistors-pair-answer-text');
      return series
        ? t(l, 'two-resistors-pair-answer-text-2', { I: A(all!.I, l), U: V(r1!.U, l), U2: V(r2!.U, l), U3: V(all!.U, l), U4: V(r1!.U + r2!.U, l) })
        : t(l, 'two-resistors-pair-answer-text-3', { U: V(r1!.U, l), U2: V(all!.U, l), I: A(r1!.I, l), I2: A(r2!.I, l), I3: A(all!.I, l), I4: A(r1!.I + r2!.I, l) });
    }),
  };
}
