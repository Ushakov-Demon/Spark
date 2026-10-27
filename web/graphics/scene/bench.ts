import { TABLE } from './constants.js';

/**
 * The mechanics bench of grade 7, drawn on the table instead of the vessel: a stand with a spring, slotted
 * weights and a ruler (Hooke's law); a wooden block pulled along a board by a dynamometer (friction); the
 * block with a ruler at the edge being measured (pressure). Sizes follow the real ones: 1 cm of the
 * apparatus is 6 units of the drawing.
 */
export interface BenchView {
  readonly kind: 'spring' | 'friction' | 'pressure' | 'balance' | 'incline' | 'circle' | 'pendulum' | 'lever' | 'slope' | 'circuit' | 'series' | 'parallel' | 'box' | 'depth' | 'utube' | 'press';
  /** Weights hanging on the spring or lying on the block. */
  readonly weights: number;
  /** The spring's length now, m, and its stiffness, N/m. */
  readonly springLength?: number;
  readonly stiffness?: number;
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
  /** The lever (grade 8): weights on the left so far out, on the right weights or the dynamometer (what it shows); how it tips (−1 left down, 0 level, 1 right down). */
  readonly lever?: { readonly left: { readonly weights: number; readonly at: number }; readonly right: { readonly weights?: number; readonly at: number; readonly dynamometer?: string }; readonly tip: number };
  /** The inclined plane (grade 8): how high its end is, m, and the board's length; how far up the block is (0…1). */
  readonly slope?: { readonly height: number; readonly length: number; readonly up: number; readonly weights?: number };
  /** The circuit (grade 8): the source's volts; what the ammeter and the voltmeter show (their needles, 0…1 of the scale) — absent, the key is open. */
  readonly circuit?: { readonly source: number; readonly amps?: { readonly text: string; readonly share: number }; readonly volts?: { readonly text: string; readonly share: number } };
  /** Two resistors (grade 8): where the instruments are, and what they show. */
  /** The hydraulic machine: weights on the wide piston, the dynamometer's reading on the narrow one, how far the pistons moved (0…1 of the push), what the ruler read. */
  readonly press?: { readonly weights: number; readonly pull?: string; readonly pushed: number; readonly read?: string };
  /** The U-tube: water poured (or not yet), the oil's and the water's columns above their boundary, m; what the ruler read. */
  readonly utube?: { readonly water: boolean; readonly oil: number; readonly over: number; readonly read?: string };
  /** The pressure at a depth: the funnel's depth, m (0 — above the liquid), sideways; the manometer's Δh, m; the liquid's colour. */
  readonly depth?: { readonly depth: number; readonly sideways: boolean; readonly dh: number; readonly color: string; readonly display?: string };
  /** The black box: the source's volts, which way the box stands, what the milliammeter shows (once the key is closed). */
  readonly box?: { readonly source: number; readonly reversed: boolean; readonly display?: string };
  readonly pair?: { readonly source: number; readonly at: 'r1' | 'r2' | 'both'; readonly amps?: { readonly text: string; readonly share: number }; readonly volts?: { readonly text: string; readonly share: number } };
  /** A timed run to play (the ball rolling, the turns, the swings): how long it took, s; its period, s; how many; the swing, rad. */
  readonly run?: { readonly seconds: number; readonly period?: number; readonly count?: number; readonly amplitude?: number };
}

const CM = 6;
const WOOD = '#d8a86a';
const WOOD_EDGE = '#9a6b33';
const STEEL = '#8d949c';
const DARK = '#3a3f46';
/** Threads and hooks: light, so they show against the dark green board behind the table. */
const THREAD = '#efe9d6';

/** Slotted weights stacked: each a short cylinder. */
function weightsSvg(x: number, top: number, n: number, w = 22, h = 10): string {
  return Array.from({ length: n }, (_, i) => `<rect x="${x - w / 2}" y="${top + i * h}" width="${w}" height="${h - 1}" rx="2" style="fill:#b9a26b;stroke:#7a6533"/><path d="M${x - w / 2 + 2},${top + i * h + 3} h${w - 4}" style="stroke:rgba(255,255,255,0.45)"/>`).join('');
}

/** A coil spring from (x, top) down `len` units. */
function springSvg(x: number, top: number, len: number): string {
  const turns = 14;
  const hook = 6;
  const body = Math.max(8, len - 2 * hook);
  const pts = Array.from({ length: turns * 2 + 1 }, (_, i) => `${x + (i === 0 || i === turns * 2 ? 0 : i % 2 ? 7 : -7)},${top + hook + (body * i) / (turns * 2)}`).join(' ');
  return `<path d="M${x},${top} v${hook}" style="stroke:${THREAD};stroke-width:1.5;fill:none"/><polyline points="${pts}" style="stroke:${STEEL};stroke-width:1.8;fill:none"/><path d="M${x},${top + hook + body} v${hook}" style="stroke:${THREAD};stroke-width:1.5;fill:none"/>`;
}

/** A ruler with centimetre marks, vertical (from y0 down) or horizontal (from x0 right). */
function rulerSvg(x0: number, y0: number, cm: number, vertical: boolean, unit = CM): string {
  const len = cm * unit;
  const ticks = Array.from({ length: cm * 2 + 1 }, (_, i) => {
    const d = (i * unit) / 2;
    const long = i % 10 === 0 ? 7 : i % 2 === 0 ? 5 : 3;
    return vertical ? `<path d="M${x0},${y0 + d} h${long}"/>` : `<path d="M${x0 + d},${y0} v${long}"/>`;
  }).join('');
  const labels = Array.from({ length: Math.floor(cm / 5) + 1 }, (_, i) => (vertical ? `<text x="${x0 + 9}" y="${y0 + i * 5 * unit + 3}">${i * 5}</text>` : `<text x="${x0 + i * 5 * unit}" y="${y0 + 15}" text-anchor="middle">${i * 5}</text>`)).join('');
  const body = vertical ? `<rect x="${x0 - 2}" y="${y0 - 3}" width="22" height="${len + 6}" rx="2"/>` : `<rect x="${x0 - 3}" y="${y0 - 2}" width="${len + 6}" height="20" rx="2"/>`;
  return `<g class="bench-ruler">${body}<g class="ticks">${ticks}</g><g class="labels">${labels}</g></g>`;
}

/** A spring dynamometer, horizontal or hanging, with its reading. */
function dynamometerSvg(x: number, y: number, horizontal: boolean, display: string): string {
  return horizontal
    ? `<rect class="dyn-case" x="${x}" y="${y - 9}" width="86" height="18" rx="5"/><g class="dyn-ticks">${Array.from({ length: 11 }, (_, i) => `<path d="M${x + 10 + i * 6.5},${y - 6} v${i % 5 === 0 ? 7 : 4}"/>`).join('')}</g><text class="dyn-text" x="${x + 43}" y="${y - 14}" text-anchor="middle">${display}</text>`
    : `<rect class="dyn-case" x="${x - 9}" y="${y}" width="18" height="80" rx="5"/><g class="dyn-ticks">${Array.from({ length: 11 }, (_, i) => `<path d="M${x - 5},${y + 8 + i * 6.5} h${i % 5 === 0 ? 7 : 4}"/>`).join('')}</g><text class="dyn-text" x="${x + 14}" y="${y + 44}">${display}</text>`;
}

/** The block seen from the side (length × height), lying on y = base. */
function blockSvg(x: number, base: number, block: readonly [number, number, number]): string {
  const w = block[0] * 100 * CM;
  const h = block[2] * 100 * CM;
  return `<rect x="${x}" y="${base - h}" width="${w}" height="${h}" rx="1.5" style="fill:${WOOD};stroke:${WOOD_EDGE}"/><path d="M${x + 6},${base - h + 6} h${w - 20} M${x + 10},${base - h / 2} h${w - 26}" style="stroke:rgba(154,107,51,0.45)"/>`;
}

/** The stand: a heavy base on the table, a rod, a clamp arm reaching to x (to the right or to the left of the rod). */
function standSvg(rodX: number, armX: number, armY: number): string {
  return `<rect x="${rodX - 40}" y="${TABLE - 8}" width="80" height="8" rx="2" style="fill:${DARK}"/><rect x="${rodX - 3}" y="${armY - 20}" width="6" height="${TABLE - 8 - armY + 20}" style="fill:${STEEL}"/><rect x="${rodX - 7}" y="${armY - 6}" width="14" height="12" rx="2" style="fill:${DARK}"/><rect x="${Math.min(rodX, armX - 6)}" y="${armY - 3}" width="${Math.abs(armX - rodX) + 6}" height="6" rx="2" style="fill:${STEEL}"/>`;
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
  if (v.kind === 'balance') return balanceSvg(v.balance);
  if (v.kind === 'lever') return leverSvg(v.lever);
  if (v.kind === 'circuit') return circuitSvg(v.circuit);
  if (v.kind === 'series' || v.kind === 'parallel') return pairSvg(v.kind, v.pair);
  if (v.kind === 'box') return boxSvg(v.box);
  if (v.kind === 'depth') return depthSvg(v.depth);
  if (v.kind === 'utube') return utubeSvg(v.utube);
  if (v.kind === 'press') return pressSvg(v.press);
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
  if (v.kind === 'slope') return slopeSvg(v);
  if (v.kind === 'friction') {
    // The board lies on the table; the block on the board (slid along it so far).
    const base = TABLE - 12;
    const boardSvg = `<rect x="110" y="${base}" width="450" height="12" rx="2" style="fill:#e3bf86;stroke:${WOOD_EDGE}"/>`;
    const x = 130 + (v.slide ?? 0);
    const w = v.block[0] * 100 * CM;
    const h = v.block[2] * 100 * CM;
    const mid = base - h / 2;
    const pull = v.pull ? `<path d="M${x + w},${mid} H${x + w + 60}" style="stroke:${THREAD};stroke-width:1.5"/>${dynamometerSvg(x + w + 60, mid, true, v.pull)}<path d="M${x + w + 146},${mid} h22" style="stroke:${THREAD};stroke-width:1.5"/><path class="bench-arrow" d="M${x + w + 120},${mid - 26} h34 l-6,-4 m6,4 l-6,4"/><text class="bench-label" x="${x + w + 112}" y="${mid - 30}" text-anchor="end">v</text>` : '';
    return `${boardSvg}${blockSvg(x, base, v.block)}${weightsSvg(x + w / 2, base - h - v.weights * 10, v.weights)}${pull}`;
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

/** A stopwatch standing on the table at x, its bottom just above it: its display (and, when the drawing is sped up, by how much). */
function stopwatchSvg(sw: NonNullable<BenchView['stopwatch']>, x: number): string {
  const y = TABLE - 30;
  return `<g class="stopwatch"><rect x="${x - 3}" y="${y - 30}" width="6" height="8" rx="1" style="fill:${DARK}"/><circle cx="${x}" cy="${y}" r="24" style="fill:#f4f1e8;stroke:${DARK};stroke-width:3"/><rect x="${x - 19}" y="${y - 8}" width="38" height="16" rx="3" style="fill:#c9d8b6;stroke:#6f7f5c"/><text class="sw-text" x="${x}" y="${y + 4.5}" text-anchor="middle">${sw.display}</text>${sw.fast && sw.fast > 1.05 ? `<text class="bench-reading" x="${x}" y="${y - 38}" text-anchor="middle">⏩ ×${Math.round(sw.fast)}</text>` : ''}</g>`;
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

/** A steel ball with a highlight. */
function ballSvg(x: number, y: number, r: number, color = '#9aa3ad'): string {
  return `<circle cx="${x}" cy="${y}" r="${r}" style="fill:${color};stroke:${DARK}"/><circle cx="${x - r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.3}" style="fill:rgba(255,255,255,0.75)"/>`;
}

/**
 * The lever ruler on its axis in the stand: holes every 5 cm, the weights hanging on threads, the dynamometer
 * pulling down on the right. Tipped a few degrees to the heavier side when the moments differ.
 */
function leverSvg(lv: BenchView['lever']): string {
  const ax = 330;
  // Low on the stand: the board's writing stays clear above it.
  const ay = 200;
  const U = 7.5; // units per cm
  const half = 21 * U;
  const tilt = (lv?.tip ?? 0) * 8;
  const holes = Array.from({ length: 9 }, (_, i) => (i - 4) * 5 * U).map((x) => `<circle cx="${ax + x}" cy="${ay}" r="1.8" style="fill:${DARK}"/>`).join('');
  const marks = [5, 10, 15, 20].flatMap((c) => [-c, c]).map((c) => `<text class="lever-mark" x="${ax + c * U}" y="${ay - 7}" text-anchor="middle">${Math.abs(c)}</text>`).join('');
  const hang = (cmFromAxis: number, n: number) => {
    const x = ax + cmFromAxis * U;
    return `<path d="M${x},${ay + 3} v26" style="stroke:${THREAD};stroke-width:1.3"/>${weightsSvg(x, ay + 29, n, 18, 9)}`;
  };
  const left = lv ? hang(-lv.left.at * 100, lv.left.weights) : '';
  const r = lv?.right;
  const right = !r ? '' : r.dynamometer !== undefined
    ? (() => {
        const x = ax + r.at * 100 * U;
        return `<path d="M${x},${ay + 3} v12" style="stroke:${THREAD};stroke-width:1.3"/>${dynamometerSvg(x, ay + 15, false, r.dynamometer)}<path d="M${x},${ay + 95} v16" style="stroke:${THREAD};stroke-width:1.3"/><path class="bench-arrow" d="M${x + 22},${ay + 70} v30 l-4,-6 m4,6 l4,-6"/>`;
      })()
    : hang(r.at * 100, r.weights ?? 0);
  return `<rect x="${ax - 40}" y="${TABLE - 8}" width="80" height="8" rx="2" style="fill:${DARK}"/><rect x="${ax - 3}" y="${ay}" width="6" height="${TABLE - 8 - ay}" style="fill:${STEEL}"/><g transform="rotate(${tilt} ${ax} ${ay})"><rect x="${ax - half}" y="${ay - 5}" width="${2 * half}" height="10" rx="2" style="fill:#e9d9a8;stroke:#a8955a"/>${holes}${marks}${left}${right}</g><circle cx="${ax}" cy="${ay}" r="4.5" style="fill:${DARK}"/>`;
}

/**
 * The wooden board as a slope: its lower end on the table, the upper one on the stand's clamp at the height h;
 * the block with two weights on it, pulled up along it by the dynamometer (what it shows).
 */
function slopeSvg(v: BenchView): string {
  const sl = v.slope ?? { height: 0, length: 0.6, up: 0 };
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

/** A dial instrument (an ammeter, a voltmeter): its letter, the needle at a share of the scale, the reading under it. */
function meterSvg(x: number, y: number, letter: string, share: number | undefined, text: string | undefined): string {
  const a = Math.PI * (1.15 - 0.3 - 0.55 * Math.max(0, Math.min(1, share ?? 0)) * 1.6);
  const ticks = Array.from({ length: 11 }, (_, k) => {
    const t = Math.PI * (0.85 - 0.07 * k);
    return `<path d="M${x + 19 * Math.cos(t)},${y - 19 * Math.sin(t)} L${x + (k % 5 === 0 ? 14 : 16) * Math.cos(t)},${y - (k % 5 === 0 ? 14 : 16) * Math.sin(t)}" style="stroke:#333;stroke-width:0.8"/>`;
  }).join('');
  return `<g><rect x="${x - 26}" y="${y - 28}" width="52" height="40" rx="5" style="fill:#f4f1e8;stroke:${DARK};stroke-width:2"/>${ticks}<path d="M${x},${y + 2} L${x + 18 * Math.cos(a)},${y + 2 - 18 * Math.sin(a)}" style="stroke:#c0392b;stroke-width:1.6"/><circle cx="${x}" cy="${y + 2}" r="2" style="fill:${DARK}"/><text class="lever-mark" x="${x}" y="${y + 9}" text-anchor="middle" style="font-size:9px;font-weight:700">${letter}</text>${text ? `<text class="bench-reading" x="${x}" y="${y + 28}" text-anchor="middle">${text}</text>` : ''}</g>`;
}

/**
 * The circuit on the table: the source on the left, the key, the ammeter in series, the resistor; the voltmeter
 * across the resistor above it. Wires light up when the key is closed.
 */
function circuitSvg(c: BenchView['circuit']): string {
  const on = !!c?.amps;
  const wire = on ? '#e2b04a' : '#9aa3ad';
  const y = TABLE - 40;
  const top = TABLE - 130;
  const W = (d: string) => `<path d="${d}" style="fill:none;stroke:${wire};stroke-width:2.2"/>`;
  const source = `<rect x="140" y="${y - 30}" width="70" height="44" rx="5" style="fill:${DARK}"/><rect x="150" y="${y - 22}" width="50" height="16" rx="2" style="fill:#0f2a12"/><text class="sw-text" x="175" y="${y - 10}" text-anchor="middle" style="fill:#7CFC9a">${String(c?.source ?? 0).replace('.', ',')} V</text><circle cx="155" cy="${y + 4}" r="3" style="fill:#c0392b"/><circle cx="195" cy="${y + 4}" r="3" style="fill:#222"/>`;
  const key = `<circle cx="250" cy="${y + 4}" r="3" style="fill:${DARK}"/><circle cx="280" cy="${y + 4}" r="3" style="fill:${DARK}"/><path d="M250,${y + 4} L${on ? 280 : 276},${on ? y + 4 : y - 10}" style="stroke:${DARK};stroke-width:3;stroke-linecap:round"/>`;
  const resistor = `<rect x="430" y="${y - 6}" width="60" height="20" rx="3" style="fill:#d9c08a;stroke:#8a6d33"/>${[0, 1, 2].map((k) => `<rect x="${442 + k * 12}" y="${y - 6}" width="4" height="20" style="fill:${['#8b4513', '#222', '#c0392b'][k]}"/>`).join('')}`;
  const wires = W(`M195,${y + 4} H250`) + W(`M280,${y + 4} H340`) + W(`M392,${y + 4} H430`) + W(`M490,${y + 4} H540 V${y + 40} H150 V${y + 4} H155`) + W(`M410,${y + 4} V${top + 40} H${435}`) + W(`M485,${top + 40} H510 V${y + 4}`);
  return `${wires}${source}${key}${meterSvg(366, y + 6, 'A', c?.amps?.share, c?.amps?.text)}${resistor}${meterSvg(460, top + 40, 'V', c?.volts?.share, c?.volts?.text)}`;
}

/**
 * Two syringes standing on the table, their nozzles joined by a tube under them: the narrow one (left) with the
 * dynamometer pressing on its plunger, the wide one (right) with weights on its plunger. Pushed, the narrow plunger
 * goes 6 cm down (60 px) and the wide one comes up by the share of it the areas give.
 */
function pressSvg(p: BenchView['press']): string {
  const y0 = TABLE - 30;
  const k = 1000;
  const pushed = p?.pushed ?? 0;
  const syringe = (x: number, w: number, plunger: number) =>
    `<rect x="${x - w / 2}" y="${y0 - 130}" width="${w}" height="130" rx="3" style="fill:rgba(220,235,250,0.4);stroke:#8fb8dd;stroke-width:1.5"/>` +
    `<rect x="${x - w / 2 + 2}" y="${plunger}" width="${w - 4}" height="${y0 - plunger}" style="fill:#7fb3e0"/>` +
    `<rect x="${x - w / 2 + 1}" y="${plunger - 6}" width="${w - 2}" height="6" style="fill:#3d3d3d"/>` +
    `<rect x="${x - 2}" y="${plunger - 46}" width="4" height="40" style="fill:#d7dde3;stroke:#8a96a3"/>` +
    `<rect x="${x - w / 2 - 4}" y="${plunger - 52}" width="${w + 8}" height="6" rx="2" style="fill:#d7dde3;stroke:#8a96a3"/>`;
  const nx = 380;
  const wx = 500;
  const nTop = y0 - 100 + pushed * 0.06 * k;
  const wTop = y0 - 70 - pushed * 0.06 * k * (12 / 26) ** 2;
  const tube = `<path d="M${nx},${y0} V${y0 + 14} H${wx} V${y0}" style="fill:none;stroke:#7fb3e0;stroke-width:5"/><path d="M${nx},${y0} V${y0 + 14} H${wx} V${y0}" style="fill:none;stroke:#8fb8dd;stroke-width:1;opacity:0.6"/>`;
  const weights = p && p.weights > 0 ? weightsSvg(wx, wTop - 52 - p.weights * 9, p.weights, 30, 9) : '';
  // The dynamometer: a tube above the narrow plunger, pressing down, its reading beside it.
  const dyn = p?.pull ? `<rect x="${nx - 6}" y="${nTop - 108}" width="12" height="56" rx="3" style="fill:#f4f1e8;stroke:#555"/><path d="M${nx},${nTop - 52} V${nTop - 46}" style="stroke:#555;stroke-width:2"/><path d="M${nx - 10},${nTop - 116} l10,10 l10,-10" style="fill:none;stroke:#c0392b;stroke-width:2"/><text class="bench-reading" x="${nx - 14}" y="${nTop - 76}" text-anchor="end">F₁ = ${p.pull}</text>` : '';
  const read = p?.read ? `<text class="bench-reading" x="${wx + 34}" y="${wTop - 20}">${p.read}</text>` : '';
  return `${tube}${syringe(nx, 16, nTop)}${syringe(wx, 34, wTop)}${weights}${dyn}${read}`;
}

/**
 * A glass U-tube on a stand (8 px to the centimetre): water in its bend and arms; oil floating in the left arm as a
 * column `oil` high; the water in the right arm stands `over` above the boundary's level. A ruler beside it.
 */
function utubeSvg(u: BenchView['utube']): string {
  const k = 800;
  const lx = 390;
  const rx = 470;
  const w = 16;
  const bottom = TABLE - 40;
  const top = TABLE - 300;
  // Water alone fills each arm to the same level; oil pushes the boundary down in the left arm.
  const base = bottom - 90;
  const oil = u?.oil ?? 0;
  const over = u?.over ?? 0;
  // The water's volume stays: the boundary on the left goes down as far as the water on the right goes up, and the
  // right level is `over` above the boundary — so each moves by half of it.
  const b = oil > 0 ? base + (over * k) / 2 : base;
  const rightTop = oil > 0 ? b - over * k : base;
  const oilTop = b - oil * k;
  const glass = (x: number) => `<rect x="${x - w / 2}" y="${top}" width="${w}" height="${bottom - top}" style="fill:rgba(220,235,250,0.3);stroke:#8fb8dd;stroke-width:1.5"/>`;
  const bend = `<path d="M${lx - w / 2},${bottom} q0,30 ${(rx - lx) / 2 + w / 2},30 q${(rx - lx) / 2 + w / 2},0 ${(rx - lx) / 2 + w / 2},-30" style="fill:none;stroke:#8fb8dd;stroke-width:1.5"/>`;
  const water = u?.water
    ? `<rect x="${lx - w / 2 + 2}" y="${b}" width="${w - 4}" height="${bottom - b}" style="fill:#3b82c4"/><rect x="${rx - w / 2 + 2}" y="${rightTop}" width="${w - 4}" height="${bottom - rightTop}" style="fill:#3b82c4"/><path d="M${lx},${bottom} q0,22 ${(rx - lx) / 2},22 q${(rx - lx) / 2},0 ${(rx - lx) / 2},-22" style="fill:none;stroke:#3b82c4;stroke-width:${w - 4}"/>`
    : '';
  const oilCol = oil > 0 ? `<rect x="${lx - w / 2 + 2}" y="${oilTop}" width="${w - 4}" height="${b - oilTop}" style="fill:#e8be3c"/>` : '';
  const stand = `<rect x="${(lx + rx) / 2 - 50}" y="${TABLE - 8}" width="100" height="8" rx="2" style="fill:${DARK}"/><rect x="${(lx + rx) / 2 - 3}" y="${top - 10}" width="6" height="${TABLE - top + 2}" style="fill:#9aa3ad"/>`;
  const ticks = Array.from({ length: 31 }, (_, i) => `<path d="M${rx + 22},${bottom - i * 8} h${i % 5 === 0 ? 10 : 5}" style="stroke:#5b4a2a;stroke-width:0.8"/>`).join('');
  const ruler = `<rect x="${rx + 18}" y="${bottom - 248}" width="18" height="252" style="fill:#f1e3b0;stroke:#a8945a"/>${ticks}`;
  const marks = oil > 0
    ? `<path class="bench-mark" d="M${lx - 30},${b} H${rx + 18}"/><path class="bench-mark" d="M${lx - 30},${oilTop} H${lx + 10} M${rx - 10},${rightTop} H${rx + 18}"/><text class="bench-reading" x="${rx + 42}" y="${(b + oilTop) / 2 + 4}">${u?.read ?? ''}</text>`
    : u?.water && u.read ? `<path class="bench-mark" d="M${lx - 20},${base} H${rx + 18}"/><text class="bench-reading" x="${rx + 42}" y="${base + 4}">${u.read}</text>` : '';
  return `${stand}${ruler}${water}${oilCol}${glass(lx)}${glass(rx)}${bend}${marks}`;
}

/**
 * A beaker of liquid (12 cm of it, 10 px to the centimetre) with a ruler beside it; the funnel with its film at the
 * depth (turned sideways — its mouth to the side); its tube up and over to a U-shaped manometer whose water stands
 * Δh higher in the open arm than in the arm the tube presses on.
 */
function depthSvg(d: BenchView['depth']): string {
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

/**
 * The black box on the table: the source, the key, the box with its two terminals (turned round — its marks
 * the other way), the protective resistor and the multimeter as a milliammeter, all in one loop.
 */
function boxSvg(b: BenchView['box']): string {
  const on = b?.display !== undefined;
  const flows = on && b!.display !== '0,0' && b!.display !== '0.0';
  const wire = flows ? '#e2b04a' : '#9aa3ad';
  const y = TABLE - 40;
  const W = (d: string) => `<path d="${d}" style="fill:none;stroke:${wire};stroke-width:2.2"/>`;
  const source = `<rect x="120" y="${y - 30}" width="70" height="44" rx="5" style="fill:${DARK}"/><rect x="130" y="${y - 22}" width="50" height="16" rx="2" style="fill:#0f2a12"/><text class="sw-text" x="155" y="${y - 10}" text-anchor="middle" style="fill:#7CFC9a">${String(b?.source ?? 0).replace('.', ',')} V</text>`;
  const key = `<circle cx="225" cy="${y + 4}" r="3" style="fill:${DARK}"/><circle cx="255" cy="${y + 4}" r="3" style="fill:${DARK}"/><path d="M225,${y + 4} L${on ? 255 : 251},${on ? y + 4 : y - 10}" style="stroke:${DARK};stroke-width:3;stroke-linecap:round"/>`;
  // The box: black, a white «?», its terminals marked A and B — turned round, B comes first.
  const [l, r] = b?.reversed ? ['B', 'A'] : ['A', 'B'];
  const box = `<rect x="290" y="${y - 26}" width="74" height="44" rx="4" style="fill:#1b1b1f;stroke:#000"/><text x="327" y="${y + 4}" text-anchor="middle" style="font:700 22px system-ui;fill:#f4f4f4">?</text><circle cx="296" cy="${y + 4}" r="4" style="fill:#c9a227"/><circle cx="358" cy="${y + 4}" r="4" style="fill:#c9a227"/><text x="302" y="${y - 12}" text-anchor="middle" style="font:700 10px system-ui;fill:#e9e9e9">${l}</text><text x="352" y="${y - 12}" text-anchor="middle" style="font:700 10px system-ui;fill:#e9e9e9">${r}</text>`;
  const resistor = `<rect x="392" y="${y - 6}" width="50" height="20" rx="3" style="fill:#d9c08a;stroke:#8a6d33"/>${['#8b4513', '#222', '#8b4513'].map((c, k) => `<rect x="${402 + k * 11}" y="${y - 6}" width="4" height="20" style="fill:${c}"/>`).join('')}`;
  const mx = 470;
  const meter = `<rect x="${mx}" y="${y - 44}" width="58" height="70" rx="7" style="fill:#f1c40f;stroke:#7d6608;stroke-width:1.5"/><rect x="${mx + 5}" y="${y - 38}" width="48" height="19" rx="2" style="fill:#c9d6a3;stroke:#55603a"/><text class="mm-text" x="${mx + 49}" y="${y - 24}" text-anchor="end">${b?.display ?? '-.-'}</text><text x="${mx + 29}" y="${y - 6}" text-anchor="middle" style="font:700 8px system-ui;fill:#2d2d2d">mA</text><circle cx="${mx + 29}" cy="${y + 8}" r="8" style="fill:#2d2d2d"/>`;
  const wires = W(`M175,${y + 4} H225`) + W(`M255,${y + 4} H292`) + W(`M362,${y + 4} H392`) + W(`M442,${y + 4} H${mx}`) + W(`M${mx + 58},${y + 4} H545 V${y + 36} H140 V${y + 4} H135`);
  return `${wires}${source}${key}${box}${resistor}${meter}`;
}

/** A resistor seen from above: its body and colour bands (2 Ω — red-black-gold, 4 Ω — yellow-black-gold). */
function resistorSvg(x: number, y: number, ohms: number): string {
  const bands = ohms === 2 ? ['#c0392b', '#222', '#b8860b'] : ['#e6c229', '#222', '#b8860b'];
  return `<rect x="${x}" y="${y - 10}" width="56" height="20" rx="3" style="fill:#d9c08a;stroke:#8a6d33"/>${bands.map((b, k) => `<rect x="${x + 12 + k * 11}" y="${y - 10}" width="4" height="20" style="fill:${b}"/>`).join('')}<text class="lever-mark" x="${x + 28}" y="${y + 21}" text-anchor="middle">${ohms} Ом</text>`;
}

/**
 * Two resistors on the table, in series (one after the other) or in parallel (two branches); the ammeter and the
 * voltmeter where this step reads them.
 */
function pairSvg(kind: 'series' | 'parallel', p: BenchView['pair']): string {
  const on = !!p?.amps;
  const wire = on ? '#e2b04a' : '#9aa3ad';
  const W = (d: string) => `<path d="${d}" style="fill:none;stroke:${wire};stroke-width:2.2"/>`;
  const y = TABLE - 40;
  const at = p?.at ?? 'both';
  const source = `<rect x="110" y="${y - 30}" width="70" height="44" rx="5" style="fill:${DARK}"/><rect x="120" y="${y - 22}" width="50" height="16" rx="2" style="fill:#0f2a12"/><text class="sw-text" x="145" y="${y - 10}" text-anchor="middle" style="fill:#7CFC9a">${String(p?.source ?? 0).replace('.', ',')} V</text>`;
  const amm = (x: number, yy: number) => meterSvg(x, yy, 'A', p?.amps?.share, p?.amps?.text);
  const volt = (x: number, yy: number) => meterSvg(x, yy, 'V', p?.volts?.share, p?.volts?.text);
  if (kind === 'series') {
    // Source → ammeter → R1 → R2 → back; the voltmeter above R1, R2 or both.
    const r1x = 330;
    const r2x = 430;
    const vx = at === 'r1' ? r1x + 28 : at === 'r2' ? r2x + 28 : (r1x + r2x + 56) / 2;
    const [va, vb] = at === 'r1' ? [r1x, r1x + 56] : at === 'r2' ? [r2x, r2x + 56] : [r1x, r2x + 56];
    const vy = TABLE - 150;
    return `${W(`M180,${y} H244 M296,${y} H${r1x} M${r1x + 56},${y} H${r2x} M${r2x + 56},${y} H540 V${y + 34} H145 V${y + 14}`)}${W(`M${va},${y} V${vy + 14} H${vx - 26} M${vx + 26},${vy + 14} H${vb} V${y}`)}${source}${amm(270, y + 2)}${resistorSvg(r1x, y, 2)}${resistorSvg(r2x, y, 4)}${volt(vx, vy)}`;
  }
  // Parallel: a fork after the ammeter of the main line (or the ammeter in one branch); the voltmeter across the pair.
  const fx = 300;
  const jx = 500;
  const b1 = y - 50;
  const b2 = y + 10;
  const main = at === 'both';
  const ax = main ? 245 : 360;
  const ay = at === 'r1' ? b1 + 2 : at === 'r2' ? b2 + 2 : y + 2;
  const branch = (yy: number, ohms: number, metered: boolean) => (metered ? W(`M${fx},${yy} H${ax - 26} M${ax + 26},${yy} H410`) : W(`M${fx},${yy} H410`)) + resistorSvg(410, yy, ohms) + W(`M466,${yy} H${jx}`);
  const vy = TABLE - 175;
  return `${W(`M180,${y} H${main ? ax - 26 : fx}`)}${main ? W(`M${ax + 26},${y} H${fx}`) : ''}${W(`M${fx},${b1} V${b2} M${jx},${b1} V${b2} M${jx},${y} H560 V${y + 44} H145 V${y + 14}`)}${branch(b1, 2, at === 'r1')}${branch(b2, 4, at === 'r2')}${W(`M${fx},${b1} V${vy + 14} H${400 - 26} M${400 + 26},${vy + 14} H${jx} V${b1}`)}${source}${amm(ax, ay)}${volt(400, vy)}`;
}
