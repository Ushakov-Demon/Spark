import { BENCH_BLOCK } from '../../../src/scenarios/bench-kit.js';
import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { blockSvg, CM, dynamometerSvg, THREAD, weightsSvg, WOOD_EDGE } from '../../graphics/scene/kit.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/** The full length of the board the block is pulled along, units of the drawing. */
export const SLIDE = 150;

/** The block on the board: the weights on it, its edges as it lies (m); the dynamometer's reading; how far it has slid; the paper under it. */
export type FrictionView = { readonly weights: number; readonly block: readonly [number, number, number]; readonly pull?: string; readonly slide?: number; readonly paper?: string };

function view({ last, command, locale }: SceneContext): FrictionView {
  const r = last ? readingsOf([last])[0]?.record : undefined;
  const c = command;
  const show = (q: 'force' | 'length', v: number | null | undefined) => formatMeasured(q, v ?? 0, q === 'force' ? 0.1 : 0.001, locale);
  if (!(c?.type === 'lab.pull' && r)) return { weights: 0, block: BENCH_BLOCK.edges };
  // Stood on its narrower face: as tall as it was wide.
  const [a, b, h] = BENCH_BLOCK.edges;
  return { block: BENCH_BLOCK.edges, weights: Number(c['weights']), pull: show('force', r.value), slide: SLIDE, ...(c['face'] === 'narrow' ? { block: [a, h, b] as const } : {}), ...(c['surface'] === 'paper' ? { paper: locale === 'uk' ? 'аркуш паперу' : 'a sheet of paper' } : {}) };
}

/** The board on the table, the block on it (slid along so far), the dynamometer pulling it. */
function frictionSvg(v: FrictionView): string {
  // The board lies on the table; the block on the board (slid along it so far).
  const base = TABLE - 12;
  const boardSvg = `<rect x="110" y="${base}" width="450" height="12" rx="2" style="fill:#e3bf86;stroke:${WOOD_EDGE}"/>`;
  const x = 130 + (v.slide ?? 0);
  const w = v.block[0] * 100 * CM;
  const h = v.block[2] * 100 * CM;
  const mid = base - h / 2;
  const pull = v.pull ? `<path d="M${x + w},${mid} H${x + w + 60}" style="stroke:${THREAD};stroke-width:1.5"/>${dynamometerSvg(x + w + 60, mid, true, v.pull)}<path d="M${x + w + 146},${mid} h22" style="stroke:${THREAD};stroke-width:1.5"/><path class="bench-arrow" d="M${x + w + 120},${mid - 26} h34 l-6,-4 m6,4 l-6,4"/><text class="bench-label" x="${x + w + 112}" y="${mid - 30}" text-anchor="end">v</text>` : '';
  const paper = v.paper ? `<rect x="122" y="${base - 4}" width="380" height="5" rx="1" style="fill:#fdfcf6;stroke:#9c978a;stroke-width:0.8"/><text class="bench-label" x="134" y="${base - 10}">${v.paper}</text>` : '';
  return `${boardSvg}${paper}${blockSvg(x, base, v.block)}${weightsSvg(x + w / 2, base - h - v.weights * 10, v.weights)}${pull}`;
}

/** The block pulled along the board at a steady speed; the dynamometer is read on the way. */
function pull(next: FrictionView, draw: (v: FrictionView) => void): Motion {
  const slide = new Channel(0, SLIDE, { kind: 'steady', speed: 45 }, 0.5);
  return {
    channels: [slide],
    // The reading is taken while it slides steadily, after the start.
    frame: (done) => draw({ ...next, slide: slide.value, pull: done || slide.value > 25 ? next.pull! : '…' }),
  };
}

export const slidingFrictionScene = defineScene({ kind: 'friction', view, svg: frictionSvg, motion: (next, draw) => (next.pull ? pull(next, draw) : null) });
