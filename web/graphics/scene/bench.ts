import { TABLE } from './constants.js';
import { CM, STEEL, DARK, THREAD, standSvg, blockSvg, dynamometerSvg, stopwatchSvg, ballSvg } from './kit.js';
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
  /** The block hanging on a dynamometer to be weighed: what it shows. */
  readonly hang?: string;
  /** The block's edges, m, and the spring's length unloaded, m. */
  readonly block: readonly [number, number, number];
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


export function benchSvg(v: BenchView): string {
  const scene = sceneOf(v.kind);
  // (A module's bench with a body weighed on the dynamometer: drawn here, as on every bench.)
  if (scene) return v.hang ? hangingBlock(v.hang, v.block) : v.scene === undefined ? '' : scene.svg(v.scene);
  // The stopwatch stands by the stand, on the side away from what hangs or rolls (on the table, beside the sheet for the circle).
  if (v.kind === 'incline' || v.kind === 'circle' || v.kind === 'pendulum') return `${motionSvg(v)}${v.stopwatch ? stopwatchSvg(v.stopwatch, v.kind === 'pendulum' ? 178 : v.kind === 'incline' ? 152 : 215) : ''}`;
  if (v.hang) return hangingBlock(v.hang, v.block);
  return '';
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




































