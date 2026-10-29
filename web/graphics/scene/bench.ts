import { TABLE } from './constants.js';
import { CM, WOOD_EDGE, STEEL, DARK, THREAD, weightsSvg, springSvg, standSvg, blockSvg, rulerSvg, dynamometerSvg, stopwatchSvg, ballSvg } from './kit.js';
import type { ExperimentKind } from '../../../src/experiments/index.js';
import { sceneOf } from '../../experiments/index.js';

/**
 * The mechanics bench of grade 7, drawn on the table instead of the vessel: a stand with a spring, slotted
 * weights and a ruler (Hooke's law); a wooden block pulled along a board by a dynamometer (friction); the
 * block with a ruler at the edge being measured (pressure). Sizes follow the real ones: 1 cm of the
 * apparatus is 6 units of the drawing.
 */
export interface BenchView {
  readonly kind: 'spring' | 'friction' | 'pressure' | 'balance' | 'incline' | 'circle' | 'pendulum' | ExperimentKind;
  /** Weights hanging on the spring or lying on the block. */
  readonly weights: number;
  /** The spring's length now, m, and its stiffness, N/m. */
  readonly springLength?: number;
  readonly stiffness?: number;
  /** A sheet of paper laid on the board, the block sliding over it (friction): its label. */
  readonly paper?: string;
  /** The dynamometer pulling the block (friction): what it shows; absent — at rest. */
  readonly pull?: string;
  /** How far the block has slid along the board, units of the drawing. */
  readonly slide?: number;
  /** The block hanging on a dynamometer to be weighed: what it shows. */
  readonly hang?: string;
  /** The edge being measured (pressure): 0 — length, 1 — width, 2 — height, and the reading. */
  readonly edge?: { readonly index: 0 | 1 | 2; readonly display: string };
  /** The block's edges, m, and the spring's length unloaded, m. */
  readonly block: readonly [number, number, number];
  /** On the lever balance: what lies on the left pan, the weights on the right one (kg), and the sum. */
  readonly balance?: { readonly load: 'body' | 'empty' | 'full'; readonly color: string; readonly weights: readonly number[]; readonly display: string; readonly mass?: number; readonly tilt?: number };
  /** What the ruler at the spring shows. */
  readonly reading?: string;
  /**
   * The groove (lab work 1): where the cylinder stands and where the ball is, as shares of the path from the
   * chalk mark (0 — at the mark, 1 — at the cylinder); `stop` — the cylinder at this share of the full path.
   */
  readonly incline?: { readonly stop: number; readonly ball: number; /** The upper end's height, m (0.1 if not said). */ readonly raise?: number };
  /** A body on a thread going round the circle (lab work 2): the thread, m; where it is on its round, rad. */
  readonly circle?: { readonly thread: number; readonly angle: number };
  /** The thread pendulum (lab work 3): its length, m; how far it is swung now, rad; the ball's mass, kg. */
  readonly pendulum?: { readonly length: number; readonly angle: number; readonly mass: number };
  /** What the stopwatch shows, and how much faster than real time the drawing goes (many turns, many swings). */
  readonly stopwatch?: { readonly display: string; readonly fast?: number };
  /** The measuring tape along what was measured, and what it shows. */
  readonly tape?: string;
  /** Two resistors (grade 8): where the instruments are, and what they show. */
  /** The electromagnet: the current (0 — the key open) and what the ammeter shows; the nail in the coil or not; the compass needle's turn, degrees. */
  /** Adding forces: how the load is held, where the weights hang on the ruler (m from its left end), the two dynamometers' forces, N, and what they show; `loaded` — the load is on them (else it lies on the table). */
  /** An experiment module's own view (web/experiments), drawn by its scene. */
  readonly scene?: unknown;
  /** A timed run to play (the ball rolling, the turns, the swings): how long it took, s; its period, s; how many; the swing, rad. */
  readonly run?: { readonly seconds: number; readonly period?: number; readonly count?: number; readonly amplitude?: number };
}




/** A dynamometer hanging from the stand with the block on its hook (weighing the block). */
function hangingBlock(display: string, block: readonly [number, number, number]): string {
  const rodX = 230;
  const armX = 330;
  const armY = 40;
  const w = block[0] * 100 * CM;
  const h = block[2] * 100 * CM;
  return `${standSvg(rodX, armX, armY)}${dynamometerSvg(armX, armY + 6, false, display)}<path d="M${armX},${armY + 86} v24" style="stroke:${THREAD};stroke-width:1.5"/>${blockSvg(armX - w / 2, armY + 110 + h, block)}`;
}

/**
 * A school lever balance: a column, a beam on a pivot, two pans hanging from its ends; the load on the left,
 * the weights on the right. `tilt`, degrees: positive — the left (load) side is down.
 */
function balanceSvg(b: BenchView['balance']): string {
  const cx = 330;
  const top = 190;
  const arm = 90;
  const drop = 70;
  const th = ((b?.tilt ?? 0) * Math.PI) / 180;
  const L = { x: cx - arm * Math.cos(th), y: top + arm * Math.sin(th) };
  const R = { x: cx + arm * Math.cos(th), y: top - arm * Math.sin(th) };
  // A pan hangs straight down from its end of the beam, whatever the tilt.
  const pan = (e: { x: number; y: number }) => `<path d="M${e.x},${e.y} L${e.x - 26},${e.y + drop} M${e.x},${e.y} L${e.x + 26},${e.y + drop}" style="stroke:${THREAD};stroke-width:1"/><path d="M${e.x - 32},${e.y + drop} q32,14 64,0 z" style="fill:#c9ced4;stroke:#6d7177"/>`;
  const ly = L.y + drop;
  const load = !b ? '' : b.load === 'body' ? `<rect x="${L.x - 14}" y="${ly - 22}" width="28" height="22" rx="3" style="fill:${b.color};stroke:rgba(0,0,0,0.35)"/>` : `<path d="M${L.x - 16},${ly - 40} v38 h32 v-38" style="fill:rgba(210,232,255,0.35);stroke:#8fb8dd;stroke-width:1.5"/>${b.load === 'full' ? `<rect x="${L.x - 15}" y="${ly - 22}" width="30" height="20" style="fill:rgba(240,200,80,0.55)"/>` : ''}`;
  // The weights: brass cylinders for grams in a row, milligram plates in a little pile at the right.
  const ry = R.y + drop;
  let x = R.x - 28;
  let pile = 0;
  const weights = (b?.weights ?? [])
    .map((w) => {
      const g = w * 1000;
      if (g < 1) {
        pile += 2.5;
        return `<rect x="${R.x + 18}" y="${ry - pile}" width="9" height="2.2" rx="0.8" style="fill:#d7dde6;stroke:#6d7177;stroke-width:0.5"/>`;
      }
      const h = 6 + Math.cbrt(g) * 3;
      const wd = 5 + Math.cbrt(g) * 1.9;
      const out = `<rect x="${x}" y="${ry - h}" width="${wd}" height="${h}" rx="1.5" style="fill:#c9a43a;stroke:#7a6533"/>`;
      x += wd + 1;
      return out;
    })
    .join('');
  const beam = `<g transform="rotate(${-(b?.tilt ?? 0)} ${cx} ${top})"><rect x="${cx - arm}" y="${top - 3}" width="${arm * 2}" height="6" rx="2" style="fill:${STEEL}"/><path d="M${cx},${top} v-22" style="stroke:#b11;stroke-width:2"/></g>`;
  return `<rect x="${cx - 50}" y="${TABLE - 8}" width="100" height="8" rx="2" style="fill:${DARK}"/><rect x="${cx - 3}" y="${top}" width="6" height="${TABLE - 8 - top}" style="fill:${STEEL}"/><path d="M${cx - 10},${top - 26} h20" style="stroke:${THREAD};stroke-width:1"/>${beam}<circle cx="${cx}" cy="${top}" r="3.5" style="fill:${DARK}"/>${pan(L)}${pan(R)}${load}${weights}${b?.display ? `<text class="bench-reading" x="${cx}" y="${TABLE - 14}" text-anchor="middle">${b.display}</text>` : ''}`;
}

export function benchSvg(v: BenchView): string {
  const scene = sceneOf(v.kind);
  // (A module's bench with a body weighed on the dynamometer: drawn here, as on every bench.)
  if (scene) return v.hang ? hangingBlock(v.hang, v.block) : v.scene === undefined ? '' : scene.svg(v.scene);
  if (v.kind === 'balance') return balanceSvg(v.balance);
  // The stopwatch stands by the stand, on the side away from what hangs or rolls (on the table, beside the sheet for the circle).
  if (v.kind === 'incline' || v.kind === 'circle' || v.kind === 'pendulum') return `${motionSvg(v)}${v.stopwatch ? stopwatchSvg(v.stopwatch, v.kind === 'pendulum' ? 178 : v.kind === 'incline' ? 152 : 215) : ''}`;
  if (v.kind === 'spring') {
    // A smaller scale here (4 units per cm): the stand with a 30 cm ruler fits under the board's writing.
    const S = 4;
    const rodX = 270;
    const armX = 340;
    const armY = 120;
    const len = (v.springLength ?? 0.08) * 100 * S;
    const bottom = armY + 3 + len;
    return `${standSvg(rodX, armX, armY)}${springSvg(armX, armY + 3, len)}${weightsSvg(armX, bottom + 2, v.weights, 18, 8)}${rulerSvg(armX + 20, armY + 3, 40, true, S)}<path class="bench-mark" d="M${armX + 4},${bottom} H${armX + 22}"/>${v.reading ? `<text class="bench-reading" x="${armX + 46}" y="${bottom + 4}">${v.reading}</text>` : ''}`;
  }
  if (v.hang) return hangingBlock(v.hang, v.block);
  if (v.kind === 'friction') {
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
  // Pressure: the block on the table, the ruler at the edge being measured.
  const base = TABLE;
  const x = 250;
  const w = v.block[0] * 100 * CM;
  const h = v.block[2] * 100 * CM;
  const e = v.edge;
  const ruler = !e ? '' : e.index === 2 ? rulerSvg(x + w + 6, base - h, 5, true) : rulerSvg(x, base - h - 30, 15, false);
  const label = e ? `<text class="bench-reading" x="${x + w / 2}" y="${base - h - (e.index === 2 ? 14 : 40)}" text-anchor="middle">${['a', 'b', 'c'][e.index]} = ${e.display}</text>` : '';
  // The width is the depth of the block: drawn as its top face, slanted.
  const depth = v.block[1] * 100 * CM * 0.45;
  const top = `<path d="M${x},${base - h} l${depth},${-depth * 0.6} h${w} l${-depth},${depth * 0.6} z" style="fill:#e6be86;stroke:${WOOD_EDGE}"/><path d="M${x + w},${base} l${depth},${-depth * 0.6} v${-h} l${-depth},${depth * 0.6} z" style="fill:#c4914f;stroke:${WOOD_EDGE}"/>`;
  return `${top}${blockSvg(x, base, v.block)}${e?.index === 1 ? `<path class="bench-mark" d="M${x + w + 2},${base - h} l${depth},${-depth * 0.6}"/>` : ''}${ruler}${label}`;
}


/** Units of the drawing per metre for the motion benches: the 1 m pendulum fits between the board's top and the table. */
const M = 230;

function motionSvg(v: BenchView): string {
  if (v.kind === 'incline') {
    // The groove: its upper end in the stand's clamp, the lower end on the table; the chalk mark, the cylinder, the ball.
    const x0 = 230;
    const x1 = 560;
    const y1 = TABLE - 6;
    // 64 px for the 10 cm the upper end is raised by default: steeper drawn steeper.
    const y0 = y1 - 64 * ((v.incline?.raise ?? 0.1) / 0.1);
    const at = (k: number) => [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k] as const;
    // The path from the mark (1/6 of the groove from its top: 1 m of 1.2 m) to the cylinder.
    const mark = 0.2 / 1.2;
    const along = (share: number) => at(mark + (1 - mark) * share);
    const inc = v.incline ?? { stop: 1, ball: 0 };
    const [mx, my] = along(0);
    const [cx, cy] = along(inc.stop);
    const [bx, by] = along(inc.ball * inc.stop);
    const ang = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
    const r = 7;
    const nx = Math.sin((ang * Math.PI) / 180);
    const ny = -Math.cos((ang * Math.PI) / 180);
    const tape = v.tape ? `<path class="bench-mark" d="M${mx + nx * 22},${my + ny * 22} L${cx + nx * 22},${cy + ny * 22}"/><text class="bench-reading" x="${(mx + cx) / 2 + nx * 30}" y="${(my + cy) / 2 + ny * 30}" text-anchor="middle">l = ${v.tape}</text>` : '';
    return `${standSvg(x0 - 10, x0 + 4, y0)}<path d="M${x0},${y0} L${x1},${y1}" style="stroke:#b88a52;stroke-width:9;stroke-linecap:round"/><path d="M${x0},${y0 - 2} L${x1},${y1 - 2}" style="stroke:#e3bf86;stroke-width:3;stroke-linecap:round"/><path d="M${mx - nx * 2},${my - ny * 2} l${nx * 12},${ny * 12}" style="stroke:#fff;stroke-width:2.5"/><g transform="translate(${cx},${cy}) rotate(${ang})"><rect x="0" y="-22" width="14" height="18" rx="3" style="fill:${STEEL};stroke:${DARK}"/></g>${ballSvg(bx + nx * r, by + ny * r, r)}${tape}`;
  }
  if (v.kind === 'circle') {
    // Side view: the hand above the circle drawn on a sheet; the body goes round a horizontal circle below the hand.
    const c = v.circle ?? { thread: 0.5, angle: 0 };
    const R = 0.15;
    const h = Math.sqrt(c.thread ** 2 - R ** 2);
    const cx = 340;
    const sheetY = TABLE - 4;
    const planeY = sheetY - 26;
    const handY = planeY - h * M;
    const rx = R * M;
    const ry = rx * 0.28;
    const bx = cx + rx * Math.cos(c.angle);
    const by = planeY + ry * Math.sin(c.angle);
    const behind = Math.sin(c.angle) < 0;
    const body = `<path d="M${cx},${handY} L${bx},${by}" style="stroke:${THREAD};stroke-width:1.5"/>${ballSvg(bx, by, 7, '#c0453a')}`;
    const sheet = `<path d="M${cx - 95},${sheetY + 4} l30,-16 h130 l-30,16 z" style="fill:#f6f4ee;stroke:#c9c4b5"/><ellipse cx="${cx}" cy="${sheetY - 4}" rx="${rx}" ry="${ry * 0.6}" style="fill:none;stroke:#3a5fa8;stroke-width:1.2"/>`;
    const orbit = `<ellipse cx="${cx}" cy="${planeY}" rx="${rx}" ry="${ry}" style="fill:none;stroke:rgba(255,255,255,0.25);stroke-dasharray:3 4"/>`;
    const hand = `<circle cx="${cx}" cy="${handY - 8}" r="10" style="fill:#f1c9a5;stroke:#b98a64"/><path d="M${cx},${handY - 2} v4" style="stroke:${THREAD};stroke-width:2"/>`;
    return `${sheet}${orbit}${behind ? body + hand : hand + body}`;
  }
  // The pendulum: a stand with a ring at its top, the thread, the ball swung so far.
  const p = v.pendulum ?? { length: 1, angle: 0, mass: 0.03 };
  const pivotX = 330;
  const pivotY = TABLE - 10 - 1.05 * M;
  const L = p.length * M;
  const bx = pivotX + L * Math.sin(p.angle);
  const by = pivotY + L * Math.cos(p.angle);
  const r = p.mass > 0.05 ? 9 : 6;
  const tape = v.tape ? `<path class="bench-mark" d="M${pivotX + 22},${pivotY} V${pivotY + L}"/><text class="bench-reading" x="${pivotX + 28}" y="${pivotY + L / 2}">l = ${v.tape}</text>` : '';
  return `${standSvg(pivotX - 80, pivotX, pivotY)}<circle cx="${pivotX}" cy="${pivotY + 4}" r="5" style="fill:none;stroke:${STEEL};stroke-width:2"/><path d="M${pivotX},${pivotY + 8} L${bx},${by}" style="stroke:${THREAD};stroke-width:1.2"/>${ballSvg(bx, by + r, r)}${tape}`;
}




































