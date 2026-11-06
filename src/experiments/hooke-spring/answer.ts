import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both, stepLine, STEPS_END } from '../../scenarios/preset-kit.js';
import type { Locale } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { sig } from '../../explain/format.js';
import { massText } from './shared.js';

export const answer_hooke_spring = (run: PresetRun): PresetAnswer => {
  const r = (run.readings ?? []).filter((x) => x.command.type === 'lab.stretch' && x.record.value !== null);
  const l0 = r.find((x) => x.command['weights'] === 0)?.record.value ?? null;
  const rows = r.filter((x) => Number(x.command['weights']) > 0).map((x) => ({ n: Number(x.command['weights']), F: x.record.inputs?.['F'] ?? 0, x: x.record.value! - (l0 ?? 0) }));
  const ks = rows.map((x) => x.F / x.x);
  const kMean = ks.reduce((a, b) => a + b, 0) / Math.max(1, ks.length);
  const spread = ks.length ? (Math.max(...ks) - Math.min(...ks)) / kMean : 0;
  const first = rows[0];
  const last = rows[rows.length - 1];
  const ratio = first && last ? last.x / first.x / (last.F / first.F) : 1;
  const correct = l0 === null || rows.length < 2 ? undefined : Math.abs(ratio - 1) < 0.08 ? 'proportional' : ratio > 1 ? 'faster' : 'slower';
  const cm = (x: number, l: Locale) => formatMeasured('length', x, 0.001, l);
  const mass = r[0]?.record.inputs?.['mass'] ?? 0.1;
  const one = first ? first.F / first.n : 0;
  return {
    ...(correct ? { correct } : {}),
    why: msg('hooke-spring-answer-why'),
    say: both((l) => t(l, 'hooke-spring-answer-say', { kMean: sig(kMean, 2, l) })),
    text: both((l) =>
      t(l, 'hooke-spring-answer-text-2', { m: massText(mass, l), one: formatMeasured('force', one, 0.01, l), kMean: sig(kMean, 2, l), spread: sig(spread * 100, 2, l), l0: l0 !== null ? cm(l0, l) : 'l₀', steps: rows.map((x) => t(l, 'hooke-spring-answer-text', { n: String(x.n), m: massText(mass, l), x: cm(x.x, l) })).map(stepLine).join(';') + STEPS_END }),
    ),
  };
};
