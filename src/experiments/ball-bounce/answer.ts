import { msg, t } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both, stepLine, STEPS_END } from '../../scenarios/preset-kit.js';
import { BOUNCE_FROM, type BounceBall, bounceBallName } from './bench.js';
import { G } from '../../domains/mechanics/constants.js';
import { type Locale, tr } from '../../knowledge/i18n.js';
import { sig } from '../../explain/format.js';

export const answer_ball_bounce = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.bounce' && x.record.value !== null).map((x) => ({ ball: String(x.command['ball']) as BounceBall, n: Number(x.command['bounce']), h: x.record.value!, m: x.record.inputs?.['mass'] ?? 0 }));
  const cm = (h: number) => Math.round(h * 100);
  const pp = R.filter((x) => x.ball === 'pingpong').sort((a, b) => a.n - b.n);
  const lower = pp.length > 1 && pp.every((x, i) => x.h < (i === 0 ? BOUNCE_FROM : pp[i - 1]!.h));
  // The energy at a top, millijoules: Eп = m·g·h.
  const mJ = (m: number, h: number, l: Locale) => `${sig(m * G * h * 1000, 2, l)} ${t(l, 'unit-sym-mJ')}`;
  return {
    ...(lower ? { correct: 'heat' } : {}),
    why: msg('ball-bounce-answer-why'),
    say: both((l) => {
      const a = pp[0];
      return a ? (t(l, 'ball-bounce-answer-say', { h: String(cm(a.h)) })) : '';
    }),
    text: both((l) => {
      const parts = [
        ...(pp.length ? [t(l, 'ball-bounce-text-parts-2', { m: mJ(pp[0]!.m, BOUNCE_FROM, l), value: pp.map((x) => mJ(x.m, x.h, l)).join(', '), value2: pp.map((x) => t(l, 'ball-bounce-text-parts', { h: String(cm(x.h)) })).join(', ') })] : []),
        ...R.filter((x) => x.ball !== 'pingpong').map((x) => `${tr(bounceBallName(x.ball), l)} — ${cm(x.h)} ${t(l, 'unit-sym-cm')}${x.h > 0 ? (t(l, 'ball-bounce-text-parts-3', { h: String(cm(x.h)) })) : t(l, 'ball-bounce-text-parts-4')}`),
      ];
      const s = `${parts.map(stepLine).join(';') + STEPS_END}.`;
      return s.charAt(0).toUpperCase() + s.slice(1) + t(l, 'ball-bounce-answer-text');
    }),
  };
};
