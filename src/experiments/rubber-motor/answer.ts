import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both } from '../../scenarios/preset-kit.js';
import type { Locale } from '../../knowledge/i18n.js';
import { sig } from '../../explain/format.js';
import { BAND_STRETCH, turnsText } from './bench.js';

export const answer_rubber_motor = (run: PresetRun): PresetAnswer => {
  const recs = (run.readings ?? []).filter((x) => x.command.type === 'lab.rubber' && x.record.value !== null);
  const band = recs.find((x) => x.command['step'] === 'band')?.record;
  const runs = recs.filter((x) => x.command['step'] === 'run').map((x) => ({ n: Number(x.command['turns']), s: x.record.value! }));
  const at = (n: number) => runs.find((r) => r.n === n)?.s;
  const s3 = at(3);
  const s6 = at(6);
  const ratio = s3 && s6 ? s6 / s3 : null;
  const correct = ratio === null ? undefined : ratio > 3 ? 'four' : ratio > 1.4 ? 'twice' : 'same';
  const m = (x: number, l: Locale) => `${sig(x, 3, l)} ${t(l, 'unit-sym-m')}`;
  // «у 4 рази», «у 8,9 раза», «у 5 разів».
  const times = (x: number, l: Locale) => t(l, 'rubber-motor-times', { v: sig(x, 2, l), k: Number(sig(x, 2, 'en')) });
  return {
    ...(correct ? { correct } : {}),
    why: msg('rubber-motor-answer-why'),
    say: both((l) => (ratio === null ? '' : t(l, 'rubber-motor-answer-say', { ratio: times(ratio, l) }))),
    text: both((l) => {
      const parts: string[] = [];
      if (band) parts.push(t(l, 'rubber-motor-answer-text', { BAND_STRETCH: sig(BAND_STRETCH * 100, 2, l), value: sig(band.value!, 2, l), value2: sig(band.value! / BAND_STRETCH, 2, l) }));
      if (runs.length) parts.push(t(l, 'rubber-motor-answer-text-2', { value: runs.map((r) => `${turnsText(r.n, l)} — ${m(r.s, l)}`).join(', ') }));
      if (ratio !== null) parts.push(t(l, 'rubber-motor-answer-text-4', { ratio: times(ratio, l), value: at(9) ? t(l, 'rubber-motor-answer-text-3', { value: times(at(9)! / s3!, l) }) : '' }));
      return parts.join(' ');
    }),
  };
};
