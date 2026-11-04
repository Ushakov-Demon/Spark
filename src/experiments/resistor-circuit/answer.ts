import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both, stepLine, STEPS_END } from '../../scenarios/preset-kit.js';
import { AMMETER, VOLTMETER } from './bench.js';
import type { Locale } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { sig } from '../../explain/format.js';

export const answer_conductor_resistance = (run: PresetRun): PresetAnswer => {
  const rows = (run.readings ?? [])
    .filter((x) => x.command.type === 'lab.circuit')
    .reduce<{ I?: number; U?: number }[]>((acc, x, k, all) => (x.record.quantity === 'current' ? [...acc, { I: x.record.value ?? 0, U: all[k + 1]?.record.value ?? 0 }] : acc), [])
    .filter((x) => (x.I ?? 0) > 0) as { I: number; U: number }[];
  const R = rows.map((x) => x.U / x.I);
  const mean = R.reduce((a, b) => a + b, 0) / Math.max(1, R.length);
  // The same, if the first and the last R differ by no more than the instruments allow: half a division of each,
  // relative to its reading (at a small current the ammeter's 0.05 A is a large share).
  const err = (x: { I: number; U: number }) => AMMETER.division.value / 2 / x.I + VOLTMETER.division.value / 2 / x.U;
  const first = rows[0];
  const last = rows[rows.length - 1];
  const apart = first && last ? Math.abs(R[R.length - 1]! - R[0]!) - (R[0]! * err(first) + R[R.length - 1]! * err(last)) : 0;
  const A = (x: number, l: Locale) => formatMeasured('current', x, 0.01, l);
  const V = (x: number, l: Locale) => formatMeasured('voltage', x, 0.1, l);
  return {
    ...(rows.length >= 2 ? { correct: apart <= 0 ? 'same' : R[R.length - 1]! > R[0]! ? 'grows' : 'falls' } : {}),
    why: msg('resistor-circuit-answer-conductor-resistance-why'),
    say: both((l) => t(l, 'resistor-circuit-answer-conductor-resistance-say', { mean: sig(mean, 2, l) })),
    text: both((l) => {
      const list = rows.map((x, k) => `I = ${A(x.I, l)}, U = ${V(x.U, l)} → R ≈ ${sig(R[k]!, 2, l)} ${t(l, 'unit-sym-ohm')}`).map(stepLine).join(';') + STEPS_END;
      return t(l, 'resistor-circuit-answer-conductor-resistance-text', { list, mean: sig(mean, 2, l) });
    }),
  };
};

export const answer_consumer_power = (run: PresetRun): PresetAnswer => {
  const rows = (run.readings ?? [])
    .filter((x) => x.command.type === 'lab.circuit')
    .reduce<{ I: number; U: number }[]>((acc, x, k, all) => (x.record.quantity === 'current' ? [...acc, { I: x.record.value ?? 0, U: all[k + 1]?.record.value ?? 0 }] : acc), [])
    .filter((x) => x.I > 0);
  const P = rows.map((x) => x.U * x.I);
  const ratio = P.length >= 2 ? P[1]! / P[0]! : 0;
  const A = (x: number, l: Locale) => formatMeasured('current', x, 0.01, l);
  const V = (x: number, l: Locale) => formatMeasured('voltage', x, 0.1, l);
  const W = (x: number, l: Locale) => `${sig(x, 2, l)} ${t(l, 'unit-sym-W')}`;
  return {
    ...(P.length >= 2 ? { correct: ratio > 3 ? 'four' : ratio > 1.4 ? 'two' : 'same' } : {}),
    why: msg('resistor-circuit-answer-consumer-power-why'),
    say: both((l) => t(l, 'resistor-circuit-answer-consumer-power-say', { ratio: sig(ratio, 2, l) })),
    text: both((l) => {
      const list = rows.map((x, k) => `U = ${V(x.U, l)}, I = ${A(x.I, l)} → P ≈ ${W(P[k]!, l)}`).map(stepLine).join(';') + STEPS_END;
      return t(l, 'resistor-circuit-answer-consumer-power-text', { list, ratio: sig(ratio, 2, l), P: sig(P.length >= 3 ? P[2]! / P[0]! : 0, 2, l) });
    }),
  };
};
