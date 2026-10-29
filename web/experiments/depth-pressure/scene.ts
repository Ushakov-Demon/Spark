import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { defineScene, type SceneContext } from '../types.js';

/** The pressure at a depth: the funnel's depth, m (0 — above the liquid), sideways; the manometer's Δh, m; the liquid's colour. */
export type DepthView = { readonly depth: number; readonly sideways: boolean; readonly dh: number; readonly color: string; readonly display?: string };

function view({ last, command, substance, locale }: SceneContext): DepthView {
  const r = last ? readingsOf([last])[0]?.record : undefined;
  const dc = command?.type === 'lab.depth' ? (command as unknown as { depth: number; sideways?: boolean }) : undefined;
  const liquid = substance;
  const color = liquid === 'sunflower-oil' ? 'rgba(232,190,60,0.6)' : liquid.startsWith('salt-water') ? 'rgba(150,190,225,0.6)' : 'rgba(120,170,230,0.55)';
  return { depth: dc?.depth ?? 0, sideways: !!dc?.sideways, dh: dc && r ? (r.value ?? 0) : 0, color, ...(dc && r ? { display: formatMeasured('length', r.value, 0.001, locale) } : {}) };
}

/**
 * A beaker of liquid (12 cm of it, 10 px to the centimetre) with a ruler beside it; the funnel with its film at the
 * depth (turned sideways — its mouth to the side); its tube up and over to a U-shaped manometer whose water stands
 * Δh higher in the open arm than in the arm the tube presses on.
 */
function depthSvg(d: DepthView): string {
  const k = 1000; // px per metre
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
  const h = d?.depth ?? 0;
  const fy = h > 0 ? surface + h * k : top - 30;
  const fx = bx + bw / 2;
  const funnel = d?.sideways
    ? `<path d="M${fx - 12},${fy - 4} L${fx + 6},${fy - 12} L${fx + 6},${fy + 12} L${fx - 12},${fy + 4} Z" style="fill:#d7dde3;stroke:#59636e"/><path d="M${fx + 6},${fy - 12} V${fy + 12}" style="stroke:#b03a2e;stroke-width:2.5"/>`
    : `<path d="M${fx - 4},${fy - 18} L${fx + 4},${fy - 18} L${fx + 12},${fy} L${fx - 12},${fy} Z" style="fill:#d7dde3;stroke:#59636e"/><path d="M${fx - 12},${fy} H${fx + 12}" style="stroke:#b03a2e;stroke-width:2.5"/>`;
  const tubeStart = d?.sideways ? `M${fx - 12},${fy}` : `M${fx},${fy - 18}`;
  // The manometer: a U of glass on a board, water in it; the arm the tube joins (left) goes down by Δh/2, the open one up.
  const mx = 430;
  const mTop = TABLE - 210;
  const mBot = TABLE - 40;
  const rest = (mTop + mBot) / 2 + 20;
  const half = Math.min(70, ((d?.dh ?? 0) * k) / 2);
  const left = rest + half;
  const right = rest - half;
  const tube = `<path d="${tubeStart} V${top - 40} H${mx} V${mTop}" style="fill:none;stroke:#7b8a99;stroke-width:3"/>`;
  const glass = (x: number) => `<rect x="${x - 5}" y="${mTop}" width="10" height="${mBot - mTop}" style="fill:rgba(220,235,250,0.35);stroke:#8fb8dd"/>`;
  const water = `<rect x="${mx - 4}" y="${left}" width="8" height="${mBot - left}" style="fill:#3b82c4"/><rect x="${mx + 46}" y="${right}" width="8" height="${mBot - right}" style="fill:#3b82c4"/><path d="M${mx - 5},${mBot} q0,18 30,18 q30,0 30,-18" style="fill:none;stroke:#3b82c4;stroke-width:9"/>`;
  const board = `<rect x="${mx - 22}" y="${mTop - 10}" width="98" height="${mBot - mTop + 34}" rx="4" style="fill:#e9dfc4;stroke:#a8945a"/>${Array.from({ length: 17 }, (_, i) => `<path d="M${mx + 14},${mTop + i * 10} h${i % 5 === 0 ? 22 : 12}" style="stroke:#7a6a45;stroke-width:0.8"/>`).join('')}`;
  const marks = half > 1 ? `<path class="bench-mark" d="M${mx - 14},${left} H${mx + 64} M${mx - 14},${right} H${mx + 64}"/><text class="bench-reading" x="${mx + 82}" y="${(left + right) / 2 + 4}">Δh = ${d?.display ?? ''}</text>` : '';
  return `${ruler}${beaker}${board}${tube}${glass(mx)}${glass(mx + 50)}${water}${funnel}${marks}`;
}

export const depthPressureScene = defineScene({ kind: 'depth', view, svg: depthSvg, motion: () => null });
