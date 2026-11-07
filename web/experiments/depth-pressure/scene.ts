import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { uManometerSvg } from '../../graphics/scene/kit.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/** px per metre of the beaker's drawing; the funnel before the first step hangs this far above the surface (m, as a depth). */
const K = 1000;
const ABOVE = -0.052;

/** The pressure at a depth: the funnel's depth, m (below 0 — above the liquid); how far it is turned sideways, 0…1; the manometer's Δh, m; the liquid's colour. */
export type DepthView = { readonly depth: number; readonly turn: number; readonly dh: number; readonly color: string; readonly display?: string };

function view({ last, command, substance, locale }: SceneContext): DepthView {
  const r = last ? readingsOf([last])[0]?.record : undefined;
  const dc = command?.type === 'lab.depth' ? (command as unknown as { depth: number; sideways?: boolean }) : undefined;
  const liquid = substance;
  const color = liquid === 'sunflower-oil' ? 'rgba(232,190,60,0.6)' : liquid.startsWith('salt-water') ? 'rgba(150,190,225,0.6)' : 'rgba(120,170,230,0.55)';
  return { depth: dc?.depth ?? ABOVE, turn: dc?.sideways ? 1 : 0, dh: dc && r ? (r.value ?? 0) : 0, color, ...(dc && r ? { display: formatMeasured('length', r.value, 0.001, locale) } : {}) };
}

/**
 * A beaker of liquid (12 cm of it, 10 px to the centimetre) with a ruler beside it; the funnel with its film at the
 * depth (turned sideways — its mouth to the side); its tube up and over to a U-shaped manometer whose water stands
 * Δh higher in the open arm than in the arm the tube presses on.
 */
function depthSvg(d: DepthView): string {
  const k = K;
  const bx = 240;
  const bw = 130;
  const bottom = TABLE - 6;
  const surface = bottom - 0.12 * k;
  const top = surface - 22;
  const color = d?.color ?? 'rgba(120,170,230,0.55)';
  const beaker = `<rect x="${bx}" y="${surface}" width="${bw}" height="${bottom - surface}" style="fill:${color}"/><path d="M${bx},${top} V${bottom} H${bx + bw} V${top}" style="fill:none;stroke:#8fb8dd;stroke-width:2.5"/>`;
  const ticks = Array.from({ length: 13 }, (_, i) => `<path d="M${bx - 14},${surface + i * 10} h${i % 5 === 0 ? 8 : 5}" style="stroke:#5b4a2a;stroke-width:1"/>`).join('');
  const ruler = `<rect x="${bx - 18}" y="${surface - 4}" width="12" height="${bottom - surface + 4}" style="fill:#f1e3b0;stroke:#a8945a"/>${ticks}`;
  // The funnel: its film at the depth; down — mouth facing down, sideways — facing right.
  const fy = surface + d.depth * k;
  const fx = bx + bw / 2;
  // Turned about its film's middle, a quarter turn at most: the mouth from facing down to facing right.
  const a = (-Math.PI / 2) * d.turn;
  const funnel = `<g transform="rotate(${(a * 180) / Math.PI} ${fx} ${fy})"><path d="M${fx - 4},${fy - 18} L${fx + 4},${fy - 18} L${fx + 12},${fy} L${fx - 12},${fy} Z" style="fill:#d7dde3;stroke:#59636e"/><path d="M${fx - 12},${fy} H${fx + 12}" style="stroke:#b03a2e;stroke-width:2.5"/></g>`;
  // The tube leaves the funnel's neck, wherever the turn has put it.
  const tubeStart = `M${fx + 18 * Math.sin(a)},${fy - 18 * Math.cos(a)}`;
  // The manometer: a U of glass on a board, water in it; the arm the tube joins (left) goes down by Δh/2, the open one up.
  const mx = 430;
  const mTop = TABLE - 210;
  const mBot = TABLE - 40;
  const rest = (mTop + mBot) / 2 + 20;
  const half = Math.min(70, ((d?.dh ?? 0) * k) / 2);
  const left = rest + half;
  const right = rest - half;
  const tube = `<path d="${tubeStart} V${top - 40} H${mx} V${mTop}" style="fill:none;stroke:#7b8a99;stroke-width:3"/>`;
  const water = uManometerSvg(mx, 50, mTop, mBot, left, right);
  const board = `<rect x="${mx - 22}" y="${mTop - 10}" width="98" height="${mBot - mTop + 42}" rx="4" style="fill:#e9dfc4;stroke:#a8945a"/>${Array.from({ length: 17 }, (_, i) => `<path d="M${mx + 14},${mTop + i * 10} h${i % 5 === 0 ? 22 : 12}" style="stroke:#7a6a45;stroke-width:0.8"/>`).join('')}`;
  const marks = half > 1 && d.display ? `<path class="bench-mark" d="M${mx - 14},${left} H${mx + 64} M${mx - 14},${right} H${mx + 64}"/><text class="bench-reading" x="${mx + 82}" y="${(left + right) / 2 + 4}">Δh = ${d?.display ?? ''}</text>` : '';
  return `${ruler}${beaker}${board}${tube}${water}${funnel}${marks}`;
}

/**
 * The funnel goes smoothly to its new depth (from above the beaker at first), or turns sideways where it is (1.6 s,
 * easing in and out); the manometer's water follows: Δh grows with the depth below the surface, nothing above it.
 * The reading comes at the end.
 */
function depthRun(next: DepthView, draw: (v: DepthView) => void, prev: DepthView | null): Motion | null {
  if (!next.display) return null;
  const from = prev ?? { ...next, depth: ABOVE, turn: 0, dh: 0 };
  const clock = new Channel(0, 1, { kind: 'steady', speed: 1 / 1.6 }, 1e-4);
  const { display: _d, ...still } = next;
  void _d;
  return {
    channels: [clock],
    frame: (done) => {
      if (done) return draw(next);
      const u = Number.isFinite(clock.value) ? clock.value : 0;
      const e = u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2;
      const depth = from.depth + (next.depth - from.depth) * e;
      // Going down, Δh in step with the depth under the surface; turned in place, from the last one to the new.
      const dh = next.depth !== from.depth && next.depth > 0 ? (next.dh * Math.max(0, depth)) / next.depth : from.dh + (next.dh - from.dh) * e;
      draw({ ...still, depth, dh, turn: from.turn + (next.turn - from.turn) * e });
    },
  };
}

export const depthPressureScene = defineScene({ kind: 'depth', view, svg: depthSvg, motion: depthRun });
