import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both, stepLine, STEPS_END } from '../../scenarios/preset-kit.js';
import type { Locale } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { sig } from '../../explain/format.js';

export const answer_slope_efficiency = (run: PresetRun): PresetAnswer => {
  const R = run.readings ?? [];
  const P = R.find((x) => x.command.type === 'lab.hang')?.record.value ?? null;
  const rows = R.filter((x) => x.command.type === 'lab.slope' && x.record.value !== null).map((x) => ({ h: x.record.inputs?.['h'] ?? 0, l: x.record.inputs?.['l'] ?? 1, F: x.record.value! }));
  const eta = rows.map((x) => (P !== null ? (P * x.h) / (x.F * x.l) : 0));
  const trend = eta.length >= 2 ? eta[eta.length - 1]! - eta[0]! : 0;
  const correct = P !== null && rows.length >= 2 ? (trend > 0.03 ? 'grows' : trend < -0.03 ? 'falls' : 'same') : undefined;
  const N1 = (x: number, l: Locale) => formatMeasured('force', x, 0.1, l);
  const pct = (x: number, l: Locale) => `${sig(x * 100, 2, l)} %`;
  return {
    ...(correct ? { correct } : {}),
    why: msg('slope-efficiency-answer-why'),
    say: msg('slope-efficiency-answer-say'),
    text: both((l) => {
      const list = rows.map((x, k) => `h = ${Math.round(x.h * 100)} ${t(l, 'unit-sym-cm')}: F = ${N1(x.F, l)}, η ≈ ${pct(eta[k]!, l)}`).map(stepLine).join(';') + STEPS_END;
      return t(l, 'slope-efficiency-answer-text', { P: P !== null ? N1(P, l) : '—', list });
    }),
  };
};
