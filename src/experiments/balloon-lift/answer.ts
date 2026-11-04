import { sig } from '../../explain/format.js';
import type { Locale } from '../../knowledge/i18n.js';
import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both, STEPS_END, stepLine } from '../../scenarios/preset-kit.js';
import { sizeText } from './bench.js';
import { liftText } from './words.js';

export const answer_balloon_lift = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.balloon' && x.command['step'] === 'lift' && x.record.value !== null);
  const rows = R.map((x) => ({ gas: String(x.command['gas']), d: Number(x.command['diameter']), F: x.record.value!, rec: x.record }));
  const big = rows[0];
  const air = rows.find((x) => x.gas === 'air');
  const correct = !rows.length ? undefined : air && air.F >= 0 ? 'air' : 'volume';
  const name = (gas: string, l: Locale) => ({ helium: t(l, 'balloon-lift-name-helium'), hydrogen: t(l, 'balloon-lift-name-hydrogen'), 'hot-air': t(l, 'balloon-lift-name-hot-air'), air: t(l, 'balloon-lift-name-air') })[gas as 'air'];
  return {
    ...(correct ? { correct } : {}),
    why: msg('balloon-lift-answer-why'),
    say: both((l) => (big ? (t(l, 'balloon-lift-answer-say-5', { gas: name(big.gas, l), value: big.F > 0 ? t(l, 'balloon-lift-answer-say') : t(l, 'balloon-lift-answer-say-2'), value2: rows[1] && rows[1].F <= 0 ? t(l, 'balloon-lift-answer-say-3') : t(l, 'balloon-lift-answer-say-4') })) : '')),
    text: both((l) => {
      if (!rows.length) return '';
      const list = rows.map((x) => t(l, 'balloon-lift-text-list-2', { d: sizeText(x.d, l), gas: name(x.gas, l), gasDensity: sig(x.rec.inputs?.['gasDensity'] ?? 0, 3, l), rec: liftText(x.rec, l), F: sig(x.F, 3, l), value: x.F > 0 ? t(l, 'balloon-lift-text-list') : t(l, 'balloon-lift-answer-say-2') }));
      const air = rows[0]?.rec.inputs?.['airDensity'] ?? 0;
      return t(l, 'balloon-lift-answer-text', { air: sig(air, 3, l), steps: list.map(stepLine).join(';') + STEPS_END });
    }),
  };
};
