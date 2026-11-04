import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both, stepLine, STEPS_END } from '../../scenarios/preset-kit.js';
import type { Locale } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { sig } from '../../explain/format.js';

export const answer_atmospheric_pressure = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.atm' && x.record.value !== null);
  const len = R.find((x) => x.command['step'] === 'scale')?.record.value ?? 0;
  const p0 = R.find((x) => x.command['step'] === 'barometer')?.record.value ?? 0;
  const open = R.find((x) => x.command['step'] === 'open')?.record.value ?? 0;
  const pulls = R.filter((x) => x.command['step'] === 'sealed').map((x) => ({ v: Number(x.command['pulled']), F: x.record.value!, p: len > 0 ? (x.record.value! * len) / 1e-6 : 0 }));
  const last = pulls[pulls.length - 1];
  // Beyond the dynamometer's half division (as a share of the force), the syringe's pressure differs from the barometer's.
  const off = last && last.F > 0 ? 0.05 / last.F : 1;
  const correct = !last || !p0 ? undefined : Math.abs(last.p - p0) <= off * p0 ? 'same' : last.p < p0 ? 'less' : 'more';
  const hPa = (p: number, l: Locale) => formatMeasured('pressure', p, 100, l);
  const N = (x: number, l: Locale) => formatMeasured('force', x, 0.1, l);
  const mlT = (v: number, l: Locale) => `${sig(v, 2, l)} ${t(l, 'unit-sym-mL')}`;
  const list = (l: Locale) => pulls.map((x) => `${mlT(x.v, l)} — ${N(x.F, l)} → ${hPa(x.p, l)}`).map(stepLine).join(';') + STEPS_END;
  const short = last && p0 ? Math.round((1 - last.p / p0) * 100) : 0;
  return {
    ...(correct ? { correct } : {}),
    why: msg('atmospheric-pressure-answer-why'),
    say: both((l) => (last ? (t(l, 'atmospheric-pressure-answer-say', { p: hPa(last.p, l), p0: hPa(p0, l) })) : t(l, 'atmospheric-pressure-answer-say-2'))),
    text: both((l) =>
      t(l, 'atmospheric-pressure-answer-text-4', { len: sig(len * 100, 2, l), value: sig(1e-6 / Math.max(len, 1e-9) * 1e4, 3, l), open: N(open, l), l: list(l), p0: hPa(p0, l), value2: correct === 'same' ? t(l, 'atmospheric-pressure-answer-text') : correct === 'less' ? t(l, 'atmospheric-pressure-answer-text-2', { short: String(short) }) : t(l, 'atmospheric-pressure-answer-text-3') }),
    ),
  };
};
