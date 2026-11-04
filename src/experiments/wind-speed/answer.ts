import { msg, t as tl } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both, stepLine, STEPS_END } from '../../scenarios/preset-kit.js';
import { BEAUFORT, beaufortOf, WIND_TRACK } from './bench.js';
import { type Locale, tr } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { sig } from '../../explain/format.js';

export const answer_wind_speed = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.wind' && x.record.value !== null).map((x) => ({ day: Number(x.command['day']) as 1 | 2 | 3, t: x.record.value!, l: x.record.inputs?.['track'] ?? WIND_TRACK }));
  const v = (x: { t: number; l: number }) => x.l / x.t;
  const ms = (x: number, l: Locale) => `${sig(x, 2, l)} ${tl(l, 'unit-sym-m-per-s')}`;
  const leaves = R.find((x) => x.day === 2);
  return {
    ...(leaves && v(leaves) >= 2 && v(leaves) <= 3 ? { correct: 'walk' } : {}),
    why: msg('wind-speed-answer-why'),
    say: both((l) => (leaves ? (tl(l, 'wind-speed-answer-say', { leaves: ms(v(leaves), l) })) : '')),
    text: both((l) => {
      const parts = R.map((x) => {
        const b = BEAUFORT[x.day];
        const f = beaufortOf(v(x));
        return tl(l, 'wind-speed-answer-day', { signs: tr(b.signs, l), time: formatMeasured('time', x.t, 0.01, l), v: ms(v(x), l), f, name: tr(BEAUFORT[f as 1 | 2 | 3]?.name ?? b.name, l) });
      });
      const s = `${parts.map(stepLine).join(';') + STEPS_END}.`;
      return s.charAt(0).toUpperCase() + s.slice(1) + tl(l, 'wind-speed-answer-text');
    }),
  };
};
