import { BENCH_SPRING_K, BENCH_SPRING_L0, BENCH_WEIGHT } from '../../../src/scenarios/bench-kit.js';
import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { rulerSvg, springSvg, standSvg, weightsSvg } from '../../graphics/scene/kit.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/** The spring on the stand: so many weights on it; its length now, m, and its stiffness, N/m; what the ruler shows. */
export type SpringView = { readonly weights: number; readonly springLength: number; readonly stiffness?: number; readonly reading?: string };

function view({ last, command, locale }: SceneContext): SpringView {
  const r = last ? readingsOf([last])[0]?.record : undefined;
  const c = command;
  const show = (q: 'force' | 'length', v: number | null | undefined) => formatMeasured(q, v ?? 0, q === 'force' ? 0.1 : 0.001, locale);
  const n = c?.type === 'lab.stretch' ? Number(c['weights']) : 0;
  return { weights: n, springLength: r?.exact ?? BENCH_SPRING_L0, ...(r?.inputs?.['k'] ? { stiffness: r.inputs['k'] } : {}), ...(r ? { reading: `l = ${show('length', r.value)}` } : {}) };
}

/** The stand with the spring, its weights and a 30 cm ruler beside. */
function springBenchSvg(v: SpringView): string {
  // A smaller scale here (4 units per cm): the stand with a 30 cm ruler fits under the board's writing.
  const S = 4;
  const rodX = 270;
  const armX = 340;
  const armY = 120;
  const len = (v.springLength ?? 0.08) * 100 * S;
  const bottom = armY + 3 + len;
  return `${standSvg(rodX, armX, armY)}${springSvg(armX, armY + 3, len)}${weightsSvg(armX, bottom + 2, v.weights, 18, 8)}${rulerSvg(armX + 20, armY + 3, 40, true, S)}<path class="bench-mark" d="M${armX + 4},${bottom} H${armX + 22}"/>${v.reading ? `<text class="bench-reading" x="${armX + 46}" y="${bottom + 4}">${v.reading}</text>` : ''}`;
}

/** A spring with a load: it drops to its new length and bounces about it — period 2π√(m/k), a little damping. */
function spring(prev: SpringView, next: SpringView, draw: (v: SpringView) => void): Motion {
  const m = next.weights * BENCH_WEIGHT.value;
  const period = 2 * Math.PI * Math.sqrt(m / (next.stiffness ?? BENCH_SPRING_K.value));
  const length = new Channel(prev.springLength ?? next.springLength, next.springLength, { kind: 'damped', period, damping: 0.12 }, 0.0004);
  return {
    channels: [length],
    frame: (done) => {
      const { reading: _r, ...rest } = next;
      draw(done ? next : { ...rest, springLength: length.value });
    },
  };
}

export const hookeSpringScene = defineScene({ kind: 'spring', view, svg: springBenchSvg, motion: (next, draw, prev) => (prev && next.weights > 0 ? spring(prev, next, draw) : null) });
