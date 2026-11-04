import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both, stepLine, STEPS_END } from '../../scenarios/preset-kit.js';
import { type Locale, tr } from '../../knowledge/i18n.js';
import { type PascalVessel, vesselName } from './bench.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { sig } from '../../explain/format.js';

export const answer_hydrostatic_paradox = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.vessel' && x.record.value !== null);
  const d = R.find((x) => x.command['step'] === 'bottom')?.record.value ?? 0;
  const S = Math.PI * (d / 2) ** 2;
  const shapes = (['straight', 'wide', 'narrow'] as const).flatMap((shape) => {
    const recs = R.filter((x) => x.command['shape'] === shape);
    const V = recs.find((x) => x.record.quantity === 'volume')?.record;
    const M = recs.find((x) => x.record.quantity === 'length')?.record;
    if (!V || !M) return [];
    const rho = M.inputs?.['rho'] ?? 1000;
    const g = M.inputs?.['g'] ?? 9.81;
    return [{ shape, V: V.value!, dh: M.value!, F: rho * g * M.value! * S, P: rho * g * V.value! }];
  });
  // Alike if the manometer's readings differ by no more than half its division.
  const dhs = shapes.map((x) => x.dh);
  const top = [...shapes].sort((a, b) => b.dh - a.dh)[0];
  const correct = !shapes.length ? undefined : Math.max(...dhs) - Math.min(...dhs) <= 0.0005 ? 'same' : top!.shape === 'straight' ? undefined : top!.shape;
  const N = (x: number, l: Locale) => `${sig(x, 2, l)} ${t(l, 'unit-sym-N')}`;
  const ml = (x: number, l: Locale) => formatMeasured('volume', x, 5e-6, l);
  const name = (s: string, l: Locale) => tr(vesselName(s as PascalVessel), l);
  const list = (l: Locale) => shapes.map((x) => t(l, 'hydrostatic-paradox-answer-list', { shape: name(x.shape, l), V: ml(x.V, l), P: N(x.P, l), value: formatMeasured('length', x.dh, 0.001, l) })).map(stepLine).join(';') + STEPS_END.replace(/^./, (x) => x.toUpperCase());
  const F = shapes[0]?.F ?? 0;
  return {
    ...(correct ? { correct } : {}),
    why: msg('hydrostatic-paradox-answer-why'),
    say: both((l) => (correct === 'same' ? (t(l, 'hydrostatic-paradox-answer-say', { F: N(F, l) })) : t(l, 'hydrostatic-paradox-answer-say-2'))),
    text: both((l) =>
      t(l, 'hydrostatic-paradox-answer-text-3', { value: formatMeasured('length', d, 0.001, l), S: sig(S * 1e4, 3, l), l: list(l), F: N(F, l), value2: correct === 'same' ? t(l, 'hydrostatic-paradox-answer-text') : '', value3: correct === 'same' ? t(l, 'hydrostatic-paradox-answer-text-2') : '' }),
    ),
  };
};
