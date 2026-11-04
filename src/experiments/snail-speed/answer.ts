import { msg, t as tl } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both, stepLine, STEPS_END } from '../../scenarios/preset-kit.js';
import { type Locale, tr } from '../../knowledge/i18n.js';
import { SNAIL_TIME, type SnailSurface, snailSurfaceName } from './bench.js';
import { sig } from '../../explain/format.js';

export const answer_snail_speed = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.snail' && x.record.value !== null).map((x) => ({ surface: String(x.command['surface']) as SnailSurface, l: x.record.value!, t: x.record.inputs?.['time'] ?? SNAIL_TIME }));
  const slowest = [...R].sort((a, b) => a.l - b.l)[0];
  const mm = (x: number) => Math.round(x * 1000);
  const v = (x: { l: number; t: number }, l: Locale) => `${sig((x.l * 1000) / x.t, 2, l)} ${tl(l, 'unit-sym-mm-per-s')}`;
  return {
    ...(slowest ? { correct: slowest.surface === 'sandpaper' ? 'sandpaper' : slowest.surface } : {}),
    why: msg('snail-speed-answer-why'),
    say: both((l) => (slowest ? (tl(l, 'snail-speed-answer-say', { surface: tr(snailSurfaceName(slowest.surface), l), l: String(mm(slowest.l)), slowest: v(slowest, l) })) : '')),
    text: both((l) => {
      const s = `${R.map((x) => `${tr(snailSurfaceName(x.surface), l)} — ${mm(x.l)} ${tl(l, 'snail-speed-text-s')}, ${v(x, l)}`).map(stepLine).join(';') + STEPS_END}.`;
      return s.charAt(0).toUpperCase() + s.slice(1) + tl(l, 'snail-speed-answer-text');
    }),
  };
};
