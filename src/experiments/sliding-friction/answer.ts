import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both, stepLine, STEPS_END } from '../../scenarios/preset-kit.js';
import type { Locale } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { sig } from '../../explain/format.js';

export const answer_friction_factors = (run: PresetRun): PresetAnswer => {
  const pulls = (run.readings ?? []).filter((x) => x.command.type === 'lab.pull' && x.record.value !== null);
  const at = (f: (c: Record<string, unknown>) => boolean) => pulls.find((x) => f(x.command as Record<string, unknown>))?.record ?? null;
  const wide = at((c) => c['weights'] === 1 && c['face'] !== 'narrow' && c['surface'] !== 'paper');
  const narrow = at((c) => c['face'] === 'narrow');
  const paper = at((c) => c['surface'] === 'paper');
  const heavy = at((c) => Number(c['weights']) === 3);
  const correct = wide && narrow ? (Math.abs(narrow.value! - wide.value!) < 0.05 ? 'same' : narrow.value! < wide.value! ? 'less' : 'more') : undefined;
  const N1 = (x: { value: number | null } | null, l: Locale) => (x ? formatMeasured('force', x.value!, 0.1, l) : '—');
  const Nof = (x: { inputs?: Record<string, number> } | null) => x?.inputs?.['N'] ?? 0;
  return {
    ...(correct ? { correct } : {}),
    why: msg('sliding-friction-answer-factors-why'),
    say: msg('sliding-friction-answer-factors-say'),
    text: both((l) =>
      t(l, 'sliding-friction-answer-factors-text', { wide: N1(wide, l), narrow: N1(narrow, l), paper: N1(paper, l), value: paper ? sig(paper.value! / Nof(paper), 2, l) : '—', heavy: N1(heavy, l), wide2: sig(Nof(wide), 2, l), heavy2: sig(Nof(heavy), 2, l), heavy3: sig(Nof(heavy) / Math.max(1e-9, Nof(wide)), 2, l) }),
    ),
  };
};

export const answer_friction_coefficient = (run: PresetRun): PresetAnswer => {
  const rows = (run.readings ?? []).filter((x) => x.command.type === 'lab.pull' && x.record.value !== null).map((x) => ({ n: Number(x.command['weights']), F: x.record.value!, N: x.record.inputs?.['N'] ?? 1 }));
  const P = (run.readings ?? []).find((x) => x.command.type === 'lab.hang')?.record.value ?? null;
  const mus = rows.map((x) => x.F / x.N);
  const mean = mus.reduce((a, b) => a + b, 0) / Math.max(1, mus.length);
  const trend = rows.length >= 2 ? (mus[mus.length - 1]! - mus[0]!) / mean : 0;
  const correct = rows.length < 2 ? undefined : Math.abs(trend) < 0.25 ? 'same' : trend > 0 ? 'grows' : 'falls';
  const N1 = (x: number, l: Locale) => formatMeasured('force', x, 0.1, l);
  return {
    ...(correct ? { correct } : {}),
    why: msg('sliding-friction-answer-coefficient-why'),
    say: both((l) => t(l, 'sliding-friction-answer-coefficient-say', { mean: sig(mean, 2, l) })),
    text: both((l) =>
      t(l, 'sliding-friction-answer-coefficient-text-3', { mean: sig(mean, 2, l), P: P !== null ? N1(P, l) : t(l, 'sliding-friction-answer-coefficient-text'), steps: rows.map((x) => t(l, 'sliding-friction-answer-coefficient-text-2', { N: sig(x.N, 2, l), F: N1(x.F, l), F2: sig(x.F / x.N, 2, l) })).map(stepLine).join(';') + STEPS_END }),
    ),
  };
};
