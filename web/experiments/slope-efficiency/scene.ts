import { readingsOf, formatMeasured } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { blockSvg, dynamometerSvg, standSvg, THREAD, weightsSvg, WOOD_EDGE } from '../../graphics/scene/kit.js';
import { Channel, type Motion } from '../../motion.js';
import { BENCH_BLOCK } from '../../../src/scenarios/bench-kit.js';
import { defineScene, type SceneContext } from '../types.js';
import { SLOPE_LENGTH } from '../../../src/experiments/lever-moments/bench.js';

/** The inclined plane (grade 8): how high its end is, m, and the board's length; how far up the block is (0…1). */
type Slope = { readonly height: number; readonly length: number; readonly up: number; readonly weights?: number };
/** The slope, the dynamometer's reading on the block, the block's edges (m). */
export type SlopeView = { readonly slope: Slope; readonly pull?: string; readonly block: readonly [number, number, number] };

function view({ last, command, plan, locale }: SceneContext): SlopeView {
  const r = last ? readingsOf([last])[0]?.record : undefined;
  const show = (q: 'force' | 'length', v: number | null | undefined) => formatMeasured(q, v ?? 0, q === 'force' ? 0.1 : 0.001, locale);
  const sc = command?.type === 'lab.slope' && r ? (command as unknown as { height: number; weights?: number }) : undefined;
  // So many weights on the block as the experiment puts there (before the first pull too).
  const planned = plan.find((s) => s.kind === 'bench' && s.command.type === 'lab.slope');
  const weights = sc?.weights ?? (planned?.kind === 'bench' ? (planned.command as { weights?: number }).weights : undefined) ?? 2;
  return { block: BENCH_BLOCK.edges, slope: { height: sc?.height ?? 0, length: SLOPE_LENGTH.value, up: sc ? 1 : 0, weights }, ...(sc ? { pull: show('force', r!.value) } : {}) };
}

/**
 * The wooden board as a slope: its lower end on the table, the upper one on the stand's clamp at the height h;
 * the block with two weights on it, pulled up along it by the dynamometer (what it shows).
 */
function slopeSvg(v: SlopeView): string {
  const sl = v.slope;
  const S = 600; // units per metre
  const x0 = 140;
  const y0 = TABLE - 4;
  const L = sl.length * S;
  const sin = sl.height / sl.length;
  const cos = Math.sqrt(1 - sin * sin);
  const x1 = x0 + L * cos;
  const y1 = y0 - L * sin;
  const ang = (-Math.asin(sin) * 180) / Math.PI;
  const w = v.block[0] * 100 * 5;
  const h = v.block[2] * 100 * 5;
  // The block slides from near the bottom to near the top.
  const at = 20 + (L - w - 150) * sl.up;
  const pull = v.pull ? `<path d="M${at + w},${-h / 2} H${at + w + 40}" style="stroke:${THREAD};stroke-width:1.5"/>${dynamometerSvg(at + w + 40, -h / 2, true, v.pull)}` : '';
  const stand = sl.height > 0 ? standSvg(x1 + 26, x1 + 2, y1) : '';
  return `${stand}<g transform="translate(${x0},${y0}) rotate(${ang})"><rect x="0" y="0" width="${L}" height="10" rx="2" style="fill:#e3bf86;stroke:${WOOD_EDGE}"/>${blockSvg(at, 0, [v.block[0] * 5 / 6, 0, v.block[2] * 5 / 6])}${(sl.weights ?? 2) > 0 ? weightsSvg(at + w / 2, -h - 9 * (sl.weights ?? 2), sl.weights ?? 2, 18, 9) : ''}${pull}</g>${sl.height > 0 ? `<path class="bench-mark" d="M${x1 + 6},${y1} V${y0}"/><text class="bench-reading" x="${x1 + 10}" y="${(y1 + y0) / 2}">h = ${Math.round(sl.height * 100)} см</text>` : ''}`;
}

/** The block pulled up the slope at a steady speed; the dynamometer is read on the way. */
function slopeUp(next: SlopeView, draw: (v: SlopeView) => void): Motion {
  const up = new Channel(0, 1, { kind: 'steady', speed: 0.35 }, 0.005);
  return {
    channels: [up],
    frame: (done) => draw({ ...next, slope: { ...next.slope, up: up.value }, pull: done || up.value > 0.2 ? next.pull! : '…' }),
  };
}

export const slopeEfficiencyScene = defineScene({ kind: 'slope', view, svg: slopeSvg, motion: (next, draw) => (next.pull ? slopeUp(next, draw) : null) });
