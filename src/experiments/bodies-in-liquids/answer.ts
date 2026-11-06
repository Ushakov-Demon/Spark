import { localized, msg, t as tl } from '../../knowledge/messages.js';
import type { PresetAnswer, PresetRun } from '../../scenarios/preset-answers.js';
import { both, stepLine, STEPS_END } from '../../scenarios/preset-kit.js';
import { type Locale, tr } from '../../knowledge/i18n.js';
import { type SinkLiquid, sinkLiquidName } from './bench.js';
import { sig } from '../../explain/format.js';

export const answer_bubble_speed = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.sink' && x.record.value !== null);
  const sizes = [...new Set(R.map((x) => Number(x.command['diameter'])))].sort((a, b) => a - b);
  const per = sizes.map((d) => {
    const laps = R.filter((x) => Number(x.command['diameter']) === d && x.record.quantity === 'time').map((x) => ({ s: x.record.inputs?.['mark'] ?? 0, t: x.record.value! }));
    const vs = laps.filter((x) => x.t > 0).map((x) => x.s / x.t);
    const v = vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : 0;
    return { d, laps, v, spread: vs.length ? (Math.max(...vs) - Math.min(...vs)) / v : 0 };
  });
  const [small, big] = [per[0], per[per.length - 1]];
  const correct = !small || !big || small === big ? undefined : big.v > small.v * 1.05 ? 'bigger' : small.v > big.v * 1.05 ? 'smaller' : 'same';
  const cmS = (v: number, l: Locale) => `${sig(v * 100, 2, l)} ${tl(l, 'unit-sym-cm-per-s')}`;
  const s = (x: number, l: Locale) => `${sig(x, 3, l)} ${tl(l, 'unit-sym-s')}`;
  const lapList = (p: (typeof per)[number], l: Locale) => p.laps.map((x) => `${Math.round(x.s * 100)} ${tl(l, 'unit-sym-cm')} — ${s(x.t, l)}`).join(', ');
  const liquid = String(R[0]?.command['liquid'] ?? 'washing-up');
  const ratio = small && big && small.v > 0 ? big.v / small.v : 0;
  return {
    ...(correct ? { correct } : {}),
    why: msg('bodies-in-liquids-answer-bubble-speed-why'),
    say: both((l) => (correct === 'bigger' ? (tl(l, 'bodies-in-liquids-answer-bubble-speed-say', { ratio: sig(ratio, 2, l) })) : tl(l, 'bodies-in-liquids-answer-bubble-speed-say-2'))),
    text: both((l) =>
      tl(l, 'bodies-in-liquids-answer-bubble-speed-text-3', { value: sig(Math.max(...per.map((p) => p.spread)) * 100, 2, l), v: small ? cmS(small.v, l) : '', v2: big ? cmS(big.v, l) : '', ratio: sig(ratio, 2, l), value2: per.map((p) => stepLine(tl(l, 'bodies-in-liquids-answer-bubble-speed-text', { d: sig(p.d * 1000, 2, l), p: lapList(p, l) }))).join(';') + STEPS_END, value3: liquid === 'washing-up' ? tl(l, 'bodies-in-liquids-answer-bubble-speed-text-2') : '' }),
    ),
  };
};

export const answer_ball_in_liquids = (run: PresetRun): PresetAnswer => {
  const R = (run.readings ?? []).filter((x) => x.command.type === 'lab.sink' && x.record.value !== null);
  const liquids = ['glycerol', 'sunflower-oil', 'water'] as const;
  const per = liquids.flatMap((liquid) => {
    const laps = R.filter((x) => x.command['liquid'] === liquid).map((x) => ({ s: x.record.inputs?.['mark'] ?? 0, t: x.record.value!, rho: x.record.inputs?.['density'] ?? 0, mu: x.record.inputs?.['viscosity'] ?? 0 }));
    const last = laps[laps.length - 1];
    return last && last.t > 0 ? [{ liquid, v: last.s / last.t, t: last.t, s: last.s, rho: last.rho, mu: last.mu }] : [];
  });
  const slowest = [...per].sort((a, b) => a.v - b.v)[0];
  const correct = slowest?.liquid;
  const name = (x: string, l: Locale) => tr(localized((l: Locale) => sinkLiquidName(x as SinkLiquid).in[l]), l);
  const v = (x: number, l: Locale) => (x < 0.1 ? `${sig(x * 100, 2, l)} ${tl(l, 'unit-sym-cm-per-s')}` : `${sig(x, 2, l)} ${tl(l, 'unit-sym-m-per-s')}`);
  const water = per.find((x) => x.liquid === 'water');
  return {
    ...(correct ? { correct } : {}),
    why: msg('bodies-in-liquids-answer-ball-why'),
    say: both((l) => (slowest ? (tl(l, 'bodies-in-liquids-answer-ball-say', { liquid: name(slowest.liquid, l), v: v(slowest.v, l) })) : '')),
    text: both((l) =>
      tl(l, 'bodies-in-liquids-answer-ball-text-3', { steps: per.map((x, k) => tl(l, 'bodies-in-liquids-answer-ball-text', { liquid: k ? name(x.liquid, l) : name(x.liquid, l).replace(/^./, (c) => c.toUpperCase()), rho: String(Math.round(x.rho)), s: String(Math.round(x.s * 100)), t: sig(x.t, 3, l), v: v(x.v, l) })).map(stepLine).join(';') + STEPS_END, s: water && water.t < 1 ? tl(l, 'bodies-in-liquids-answer-ball-text-2', { s: String(Math.round(water.s * 100)) }) : '' }),
    ),
  };
};
