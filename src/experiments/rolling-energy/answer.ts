import { kineticEnergy, potentialEnergy } from '../../domains/mechanics/formulas.js';
import { sig } from '../../explain/format.js';
import type { Locale } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both, stepLine, STEPS_END } from '../../scenarios/preset-kit.js';

export const answer_rolling_energy = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.energy' && x.record.value !== null);
  const m = R.find((x) => x.command['step'] === 'weigh')?.record.value ?? 0;
  const rolls = R.filter((x) => x.record.inputs?.['which'] === 2).map((x) => {
    const i = x.record.inputs ?? {};
    const h = R.find((y) => y.record.inputs?.['which'] === 1 && y.record.inputs?.['height'] === i['height'])?.record.value ?? i['height'] ?? 0;
    const v = (i['path'] ?? 0.5) / x.record.value!;
    const Ek = kineticEnergy(m, v);
    const Ep = potentialEnergy(m, i['g'] ?? 9.81, h);
    return { h, v, Ek, Ep, share: Ep > 0 ? Ek / Ep : 0, frames: i['frames'] ?? 0 };
  });
  const mean = rolls.length ? rolls.reduce((a, b) => a + b.share, 0) / rolls.length : 0;
  const correct = !rolls.length || !m ? undefined : mean > 0.92 ? 'all' : mean > 0.5 ? 'most' : 'tiny';
  const mJ = (x: number, l: Locale) => `${sig(x * 1000, 3, l)} ${t(l, 'unit-sym-mJ')}`;
  return {
    ...(correct ? { correct } : {}),
    why: msg('rolling-energy-answer-why'),
    say: both((l) => (correct === 'most' ? (t(l, 'rolling-energy-answer-say', { mean: String(Math.round(mean * 100)) })) : t(l, 'rolling-energy-answer-say-2'))),
    text: both((l) => {
      if (!rolls.length || !m) return '';
      const list = rolls.map((x) => t(l, 'rolling-energy-text-list', { h: String(Math.round(x.h * 100)), frames: String(x.frames), v: sig(x.v, 3, l), Ek: mJ(x.Ek, l), Ep: mJ(x.Ep, l), share: sig(x.share, 2, l) })).map(stepLine).join(';') + STEPS_END;
      return t(l, 'rolling-energy-answer-text', { m: sig(m * 1000, 3, l), list, mean: sig(mean, 2, l) });
    }),
  };
};
