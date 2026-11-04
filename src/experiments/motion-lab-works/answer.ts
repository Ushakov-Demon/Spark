import { msg, t as tl } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both, times } from '../../scenarios/preset-kit.js';
import { G } from '../../domains/mechanics/constants.js';
import type { Locale } from '../../knowledge/i18n.js';
import { formatMeasured } from '../../scenarios/measuring.js';
import { sig } from '../../explain/format.js';

export const answer_average_speed = (run: PresetRun): PresetAnswer => {
  const R = run.readings ?? [];
  const l = R.find((x) => x.command.type === 'lab.tape')?.record.value ?? null;
  const rolls = R.filter((x) => x.command.type === 'lab.roll' && x.record.value !== null);
  const whole = rolls.find((x) => Number(x.command['path']) >= (l ?? 1) - 1e-9)?.record.value ?? null;
  const half = rolls.find((x) => Number(x.command['path']) < (l ?? 1) - 1e-9)?.record.value ?? null;
  const ok = l !== null && whole !== null && half !== null;
  const v1 = ok ? l! / whole! : 0;
  const v2 = ok ? l! / 2 / half! : 0;
  const correct = ok ? (v1 > v2 * 1.03 ? 'whole' : v2 > v1 * 1.03 ? 'half' : 'same') : undefined;
  const s = (x: number, l: Locale) => formatMeasured('time', x, 0.01, l);
  const v = (x: number, l: Locale) => `${sig(x, 2, l)} ${tl(l, 'unit-sym-m-per-s')}`;
  return {
    ...(correct ? { correct } : {}),
    why: msg('motion-lab-works-answer-average-speed-why'),
    say: msg('motion-lab-works-answer-average-speed-say'),
    text: both((lc) =>
      tl(lc, 'motion-lab-works-answer-average-speed-text', { value: ok ? formatMeasured('length', l!, 0.001, lc) : '—', whole: ok ? s(whole!, lc) : '—', v1: v(v1, lc), half: ok ? s(half!, lc) : '—', v2: v(v2, lc), v12: times(v1 / Math.max(v2, 1e-9), lc) }),
    ),
  };
};

export const answer_rotation_period = (run: PresetRun): PresetAnswer => {
  const rows = (run.readings ?? []).filter((x) => x.command.type === 'lab.whirl' && x.record.value !== null).map((x) => ({ L: Number(x.command['thread']), N: Number(x.command['turns']), t: x.record.value!, R: x.record.inputs?.['radius'] ?? 0.15 }));
  const [a, b] = rows;
  const Ta = a ? a.t / a.N : 0;
  const Tb = b ? b.t / b.N : 0;
  const correct = a && b ? (Tb < Ta * 0.97 ? 'shorter' : Tb > Ta * 1.03 ? 'longer' : 'same') : undefined;
  const cm = (m: number, l: Locale) => formatMeasured('length', m, 0.01, l);
  const s = (x: number, l: Locale) => formatMeasured('time', x, 0.01, l);
  return {
    ...(correct ? { correct } : {}),
    why: msg('motion-lab-works-answer-rotation-period-why'),
    say: msg('motion-lab-works-answer-rotation-period-say'),
    text: both((l) =>
      tl(l, 'motion-lab-works-answer-rotation-period-text-3', { L: a ? tl(l, 'motion-lab-works-answer-rotation-period-text', { L: cm(a.L, l), N: String(a.N), t: s(a.t, l), value: formatMeasured('time', Ta, 0.01, l), value2: sig(1 / Ta, 2, l), value3: sig((2 * Math.PI * a.R) / Ta, 2, l) }) : '', L2: b ? tl(l, 'motion-lab-works-answer-rotation-period-text-2', { L: cm(b.L, l), t: s(b.t, l), value: formatMeasured('time', Tb, 0.01, l) }) : '' }),
    ),
  };
};

export const answer_pendulum = (run: PresetRun): PresetAnswer => {
  const rows = (run.readings ?? []).filter((x) => x.command.type === 'lab.swing' && x.record.value !== null).map((x) => ({ L: Number(x.command['length']), A: Number(x.command['amplitude']), m: Number(x.command['mass']), T: x.record.value! / Number(x.command['count']) }));
  const [base, wide, heavy, short] = rows;
  const close = (x?: { T: number }, y?: { T: number }) => !!x && !!y && Math.abs(x.T - y.T) / y.T < 0.02;
  const ok = !!base && !!wide && !!heavy && !!short;
  const correct = ok ? (close(wide, base) && close(heavy, base) && !close(short, base) ? 'length' : !close(wide, base) ? 'amplitude' : 'mass') : undefined;
  const sT = (x: number, l: Locale) => formatMeasured('time', x, 0.01, l);
  return {
    ...(correct ? { correct } : {}),
    why: msg('motion-lab-works-answer-pendulum-why'),
    say: msg('motion-lab-works-answer-pendulum-say'),
    text: both((l) =>
      ok
          ? tl(l, 'motion-lab-works-answer-pendulum-text', { T: sT(base!.T, l), T2: sT(wide!.T, l), T3: sT(heavy!.T, l), T4: sT(short!.T, l), value: sT(2 * Math.PI * Math.sqrt(1 / G), l) })
          : tl(l, 'motion-lab-works-answer-pendulum-text-2'),
    ),
  };
};
