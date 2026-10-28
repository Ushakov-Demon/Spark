import { TABLE } from './constants.js';

/**
 * The mechanics bench of grade 7, drawn on the table instead of the vessel: a stand with a spring, slotted
 * weights and a ruler (Hooke's law); a wooden block pulled along a board by a dynamometer (friction); the
 * block with a ruler at the edge being measured (pressure). Sizes follow the real ones: 1 cm of the
 * apparatus is 6 units of the drawing.
 */
export interface BenchView {
  readonly kind: 'spring' | 'friction' | 'pressure' | 'balance' | 'incline' | 'circle' | 'pendulum' | 'lever' | 'slope' | 'circuit' | 'series' | 'parallel' | 'box' | 'depth' | 'utube' | 'press' | 'atm' | 'vessels' | 'magnet' | 'induct' | 'bubble' | 'sink' | 'forces' | 'rows';
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
  /** The syringe and the barometer: the plunger out by so many mL (0…1), the nozzle shut; the dynamometer's reading, the ruler's; the day's pressure, Pa, and its reading once looked at. */
  readonly atm?: { readonly pulled: number; readonly sealed: boolean; readonly pull?: string; readonly read?: string; readonly air: number; readonly baro?: string };
  /** A body in a liquid: a bubble in the bottle or a ball in the cylinder; the liquid's colour; its marks (m from the zero one) and where the body is now (m past the zero mark; none — not let go yet); its size, m. */
  readonly sink?: { readonly body: 'bubble' | 'ball'; readonly color: string; readonly marks: readonly number[]; readonly at?: number; readonly diameter: number; readonly label?: string; readonly speed?: number; readonly turn?: number };
  /** Induction: how the magnet (or the coil) moved and which pole faces the coil; the meter's swing (−1…1 of its scale) and reading. */
  readonly induct?: { readonly move: 'still' | 'in' | 'out' | 'coil' | 'none'; readonly pole: 'N' | 'S'; readonly swing: number; readonly read?: string };
  /** The electromagnet: the current (0 — the key open) and what the ammeter shows; the nail in the coil or not; the compass needle's turn, degrees. */
  /** Adding forces: how the load is held, where the weights hang on the ruler (m from its left end), the two dynamometers' forces, N, and what they show; `loaded` — the load is on them (else it lies on the table). */
  /** The method of rows: the bodies (their sizes, m, in the row's order), how many are laid so far (a fraction — the next one falling), what the ruler shows. */
  readonly rows?: { readonly body: 'pea' | 'millet' | 'thread'; readonly sizes: readonly number[]; readonly placed: number; readonly read?: string };
  readonly forces?: { readonly hold: 'one' | 'two' | 'down'; readonly at: number; readonly a: number; readonly b: number; readonly loaded: boolean; readonly readA?: string; readonly readB?: string };
  readonly magnet?: { readonly current: number; readonly amps?: string; readonly core: boolean; readonly angle: number; readonly read?: string; /** The nail being pulled out of the coil: 0 — in, 1 — out (the straw stays). */ readonly pull?: number };
  /** Pascal's device: the vessel screwed on (none yet), the water's height in it, m; the manometer's Δh, m, and what was read. */
  readonly vessels?: { readonly shape?: 'straight' | 'wide' | 'narrow'; readonly height: number; readonly dh: number; readonly read?: string; readonly poured?: string };
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
  if (v.kind === 'atm') return atmSvg(v.atm);
  if (v.kind === 'vessels') return vesselsSvg(v.vessels);
  if (v.kind === 'magnet') return magnetSvg(v.magnet);
  if (v.kind === 'forces') return forcesSvg(v.forces);
  if (v.kind === 'rows') return rowsSvg(v.rows);
  if (v.kind === 'bubble' || v.kind === 'sink') return `${sinkSvg(v.sink)}${v.stopwatch ? stopwatchSvg(v.stopwatch, 520) : ''}`;
  if (v.kind === 'induct') return inductSvg(v.induct);
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
 * A body moving through a liquid: a tall vessel (a bottle turned upside down, or a measuring cylinder) with marks every
 * few centimetres (8 px to the centimetre, the zero mark near the start); the bubble rises from below, the ball sinks
 * from above; it stands where the step left it — at the last mark.
 */
/** How far before the zero mark the body starts (the bottle's neck, the liquid's surface), m: it has its steady speed by the zero mark. */
export const SINK_LEAD = 30 / 800;

function sinkSvg(s: BenchView['sink']): string {
  const k = 800;
  const x = 400;
  const bubble = s?.body === 'bubble';
  const w = bubble ? 60 : 40;
  const bottom = TABLE - 8;
  const top = bottom - 200;
  const zero = bubble ? bottom - 30 : top + 30;
  const dir = bubble ? -1 : 1;
  const glass = bubble
    ? `<path d="M${x - w / 2},${top + 10} V${bottom - 6} q0,6 6,6 H${x + w / 2 - 6} q6,0 6,-6 V${top + 10} q0,-10 -10,-10 H${x - w / 2 + 10} q-10,0 -10,10 Z" style="fill:${s?.color ?? 'rgba(120,200,120,0.5)'};stroke:#8fb8dd;stroke-width:2"/><rect x="${x - 8}" y="${bottom}" width="16" height="6" style="fill:#c0392b"/>`
    : `<rect x="${x - w / 2}" y="${top}" width="${w}" height="${bottom - top}" style="fill:${s?.color ?? 'rgba(120,170,230,0.5)'};stroke:#8fb8dd;stroke-width:2"/><rect x="${x - w / 2 - 8}" y="${bottom - 4}" width="${w + 16}" height="6" rx="2" style="fill:#8fb8dd"/>`;
  const marks = [0, ...(s?.marks ?? [])].map((m) => `<path d="M${x + w / 2 - 10},${zero + dir * m * k} h14" style="stroke:#3d3d3d;stroke-width:1.2"/><text x="${x + w / 2 + 8}" y="${zero + dir * m * k + 3}" style="font:600 10px system-ui,sans-serif;fill:#efe9d2">${Math.round(m * 100)}</text>`).join('');
  const at = s?.at;
  // (Not to scale: a millimetre ball would be a dot.)
  const r = Math.max(bubble ? 2.5 : 4.5, (s?.diameter ?? 0.002) * 1000 * (bubble ? 1.6 : 3));
  // A steel ball: dark, with a highlight (it must not melt into the liquid).
  const steel = `<defs><radialGradient id="sink-steel" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#ffffff"/><stop offset="0.25" stop-color="#9aa6b2"/><stop offset="1" stop-color="#1f262d"/></radialGradient></defs>`;
  const body = at === undefined || s?.turn !== undefined ? '' : bubble ? `<circle cx="${x}" cy="${zero + dir * at * k}" r="${r}" style="fill:rgba(255,255,255,0.85);stroke:#6c8fb0"/>` : `${steel}<circle cx="${x}" cy="${zero + dir * at * k}" r="${r}" style="fill:url(#sink-steel);stroke:#11161b;stroke-width:0.8"/>`;
  const label = s?.label ? `<text class="bench-reading" x="${x}" y="${top - 10}" text-anchor="middle">${s.label}</text>` : '';
  // The bottle being turned over (1 — still upright, its air under the cap at the top; 0 — upside down).
  const turn = s?.turn;
  if (bubble && turn !== undefined) {
    const air = turn > 0.5 ? `<rect x="${x - w / 2 + 2}" y="${bottom - 14}" width="${w - 4}" height="8" style="fill:rgba(255,255,255,0.75)"/>` : '';
    return `<g transform="rotate(${180 * turn} ${x} ${(top + bottom) / 2})">${glass}${air}</g>${label}`;
  }
  return `${glass}${marks}${body}${label}`;
}

/**
 * Induction: the coil lying on the table, its axis left–right, wires to a milliammeter with its zero in the middle;
 * the bar magnet (north red, south blue) at the end of its move — in the coil or out to the left — the pole named
 * facing the coil; an arrow shows the move.
 */
function inductSvg(d: BenchView['induct']): string {
  const y = TABLE - 70;
  const cx = 380;
  const move = d?.move ?? 'none';
  const coil = `<rect x="${cx - 22}" y="${y - 26}" width="44" height="52" rx="6" style="fill:#b0703a;stroke:#7a4a22"/>${Array.from({ length: 10 }, (_, i) => `<path d="M${cx - 20 + i * 4.4},${y - 26} v52" style="stroke:#d4893a;stroke-width:1.4"/>`).join('')}<ellipse cx="${cx - 22}" cy="${y}" rx="5" ry="20" style="fill:#5a3416"/>`;
  // The magnet: 100 px long; inside — centred in the coil; out — away to the left.
  const mx = move === 'out' || move === 'none' ? cx - 150 : cx;
  const near = d?.pole ?? 'N';
  const far = near === 'N' ? 'S' : 'N';
  const color = (p: string) => (p === 'N' ? '#c0392b' : '#2563eb');
  const magnet = `<rect x="${mx - 50}" y="${y - 8}" width="50" height="16" style="fill:${color(far)}"/><rect x="${mx}" y="${y - 8}" width="50" height="16" style="fill:${color(near)}"/><text class="lever-mark" x="${mx - 40}" y="${y + 4}" style="fill:#fff;font-weight:700;font-size:10px">${far}</text><text class="lever-mark" x="${mx + 38}" y="${y + 4}" style="fill:#fff;font-weight:700;font-size:10px">${near}</text>`;
  // In the coil the magnet's right half is hidden behind the winding's front.
  const front = move === 'out' || move === 'none' ? '' : `<rect x="${cx - 22}" y="${y - 26}" width="44" height="52" rx="6" style="fill:#b0703a;opacity:0.85"/>${Array.from({ length: 10 }, (_, i) => `<path d="M${cx - 20 + i * 4.4},${y - 26} v52" style="stroke:#d4893a;stroke-width:1.4;opacity:0.85"/>`).join('')}`;
  const arrow = move === 'in' ? `<path class="bench-arrow" d="M${cx - 120},${y - 40} H${cx - 40} m-8,-5 l8,5 l-8,5"/>` : move === 'out' ? `<path class="bench-arrow" d="M${cx - 40},${y - 40} H${cx - 120} m8,-5 l-8,5 l8,5"/>` : move === 'coil' ? `<path class="bench-arrow" d="M${cx + 90},${y - 40} H${cx + 30} m8,-5 l-8,5 l8,5"/>` : '';
  // The milliammeter: zero up in the middle, the needle ±60° over its scale.
  const gx = 530;
  const gy = TABLE - 120;
  const a = (Math.max(-1, Math.min(1, d?.swing ?? 0)) * Math.PI) / 3;
  const ticks = Array.from({ length: 11 }, (_, k) => {
    const t = ((k - 5) / 5) * (Math.PI / 3);
    return `<path d="M${gx + 30 * Math.sin(t)},${gy - 30 * Math.cos(t)} L${gx + (k % 5 === 0 ? 24 : 27) * Math.sin(t)},${gy - (k % 5 === 0 ? 24 : 27) * Math.cos(t)}" style="stroke:#333;stroke-width:0.9"/>`;
  }).join('');
  const meter = `<rect x="${gx - 40}" y="${gy - 42}" width="80" height="56" rx="6" style="fill:#f4f1e8;stroke:${DARK};stroke-width:2"/>${ticks}<text class="lever-mark" x="${gx}" y="${gy - 8}" text-anchor="middle" style="font-size:9px">0</text><path d="M${gx},${gy + 4} L${gx + 28 * Math.sin(a)},${gy + 4 - 28 * Math.cos(a)}" style="stroke:#c0392b;stroke-width:1.8"/><circle cx="${gx}" cy="${gy + 4}" r="2.5" style="fill:${DARK}"/><text class="lever-mark" x="${gx}" y="${gy + 11}" text-anchor="middle" style="font-size:8px">mA</text>${d?.read ? `<text class="bench-reading" x="${gx}" y="${gy - 50}" text-anchor="middle">${d.read}</text>` : ''}`;
  const wire = Math.abs(d?.swing ?? 0) > 0.01 ? '#e2b04a' : '#9aa3ad';
  const wires = `<path d="M${cx + 18},${y + 26} V${TABLE - 12} H${gx + 20} V${gy + 14}" style="fill:none;stroke:${wire};stroke-width:2"/><path d="M${cx - 18},${y + 26} V${TABLE - 6} H${gx - 20} V${gy + 14}" style="fill:none;stroke:${wire};stroke-width:2"/>`;
  return `${wires}${coil}${magnet}${front}${arrow}${meter}`;
}

/**
 * The electromagnet, seen from above: the source, the key, the rheostat and the ammeter on the left; the coil wound on
 * the nail (or on a plastic straw) lying east–west; the compass on its axis to the right, «N» up, its needle turned by θ.
 */
function magnetSvg(m: BenchView['magnet']): string {
  const on = (m?.current ?? 0) > 0;
  const wire = on ? '#e2b04a' : '#9aa3ad';
  const W = (d: string) => `<path d="${d}" style="fill:none;stroke:${wire};stroke-width:2.2"/>`;
  const y = TABLE - 170;
  const low = TABLE - 90;
  const back = TABLE - 40;
  const source = `<rect x="200" y="${low - 24}" width="56" height="36" rx="5" style="fill:${DARK}"/><circle cx="212" cy="${low - 6}" r="3" style="fill:#c0392b"/><circle cx="244" cy="${low - 6}" r="3" style="fill:#222"/>`;
  const key = `<circle cx="282" cy="${low - 6}" r="3" style="fill:${DARK}"/><circle cx="308" cy="${low - 6}" r="3" style="fill:${DARK}"/><path d="M282,${low - 6} L${on ? 308 : 304},${on ? low - 6 : low - 20}" style="stroke:${DARK};stroke-width:3;stroke-linecap:round"/>`;
  const rheostat = `<rect x="322" y="${low - 14}" width="56" height="16" rx="3" style="fill:#d9c08a;stroke:#8a6d33"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${326 + i * 6},${low - 14} v16" style="stroke:#8a6d33;stroke-width:0.8"/>`).join('')}<path d="M${340 + Math.min(1, (m?.current ?? 0) / 2) * 30},${low - 22} v8" style="stroke:${DARK};stroke-width:3"/>`;
  // The coil: 60 px of windings on a 100 px nail (or the straw), centred at cx.
  const cx = 440;
  const straw = `<rect x="${cx - 52}" y="${y - 5}" width="104" height="10" rx="3" style="fill:rgba(230,236,242,0.6);stroke:#9aa3ad"/>`;
  // The nail, its head on the left; pulled out by the head, it slides left out of the winding (the straw stays in it).
  const nail = (dx: number) => `<g transform="translate(${dx} 0)"><rect x="${cx - 50}" y="${y - 4}" width="100" height="8" style="fill:#8a96a3;stroke:#59636e"/><path d="M${cx - 50},${y - 6} v12" style="stroke:#59636e;stroke-width:5"/></g>`;
  // Taken out, it lies where it was pulled to.
  const rod = m?.pull !== undefined ? straw + nail(-95 * m.pull) : m?.core === false ? straw + nail(-95) : nail(0);
  const turns = Array.from({ length: 16 }, (_, i) => `<path d="M${cx - 30 + i * 4},${y - 8} l2,16" style="stroke:${on ? '#d4893a' : '#b0703a'};stroke-width:2.2"/>`).join('');
  const leads = W(`M244,${low - 6} H282`) + W(`M308,${low - 6} H322`) + W(`M378,${low - 6} H${cx - 32} V${y + 8}`) + W(`M${cx + 32},${y + 8} V${back} H212 V${low - 6}`);
  const ammeter = meterSvg(330, back - 2, 'A', on ? (m?.current ?? 0) / 2 : 0, m?.amps);
  // The compass on the axis, 15 cm away (scaled down): N up; the needle's north end red.
  const kx = 552;
  const r = 28;
  const a = ((m?.angle ?? 0) * Math.PI) / 180;
  const tip = (s: number) => `${kx + s * (r - 5) * Math.sin(a)},${y - s * (r - 5) * Math.cos(a)}`;
  const side = (s: number) => `${kx + s * 4 * Math.cos(a)},${y + s * 4 * Math.sin(a)}`;
  const compass = `<path d="M${cx + 52},${y} H${kx - r - 4}" class="bench-mark" style="stroke-dasharray:3 4"/><circle cx="${kx}" cy="${y}" r="${r + 4}" style="fill:#c9a96e;stroke:#7a5a2a;stroke-width:2"/><circle cx="${kx}" cy="${y}" r="${r}" style="fill:#f4f1e8"/><text class="lever-mark" x="${kx}" y="${y - r + 10}" text-anchor="middle" style="font-size:9px;font-weight:700">N</text><path d="M${tip(1)} L${side(1)} L${tip(-1)} L${side(-1)} Z" style="fill:#c9ccd1"/><path d="M${tip(1)} L${side(1)} L${kx},${y} L${side(-1)} Z" style="fill:#c0392b"/><circle cx="${kx}" cy="${y}" r="2" style="fill:${DARK}"/>${m?.read ? `<text class="bench-reading" x="${kx}" y="${y + r + 22}" text-anchor="middle">θ = ${m.read}</text>` : ''}`;
  return `${leads}${source}${key}${rheostat}${ammeter}${rod}${turns}${compass}`;
}

/**
 * Pascal's device (10 px to the centimetre): a stand with the vessel screwed on — straight, widening or narrowing,
 * all with the same 4 cm bottom — water in it to its height; a tube from the stand's rubber bottom to a U-tube
 * manometer on the right, its levels apart by Δh.
 */
function vesselsSvg(v: BenchView['vessels']): string {
  const k = 1000;
  const x = 380;
  const base = TABLE - 34;
  const half = 20;
  const topHalf = { straight: 20, wide: 40, narrow: 10 }[v?.shape ?? 'straight'];
  // The walls are straight lines from the bottom to their width 10 cm up; the vessel is 12 cm tall.
  const at = (h: number) => half + ((topHalf - half) * h) / 0.1;
  const H = 0.12;
  const stand = `<rect x="${x - 36}" y="${base}" width="72" height="34" rx="4" style="fill:#59636e"/><rect x="${x - half - 4}" y="${base - 6}" width="${2 * half + 8}" height="6" style="fill:#3d3d3d"/><path d="M${x - half},${base - 1} H${x + half}" style="stroke:#b03a2e;stroke-width:2.5"/>`;
  const glass = v?.shape ? `<path d="M${x - half},${base - 6} L${x - at(H)},${base - 6 - H * k} M${x + half},${base - 6} L${x + at(H)},${base - 6 - H * k}" style="fill:none;stroke:#8fb8dd;stroke-width:2.5"/>` : '';
  const h = v?.shape ? v.height : 0;
  const water = h > 0 ? `<path d="M${x - half},${base - 6} L${x - at(h)},${base - 6 - h * k} H${x + at(h)} L${x + half},${base - 6} Z" style="fill:rgba(120,170,230,0.55)"/>` : '';
  const ticks = Array.from({ length: 13 }, (_, i) => `<path d="M${x - 62},${base - 6 - i * 10} h${i % 5 === 0 ? 8 : 5}" style="stroke:#5b4a2a;stroke-width:1"/>`).join('');
  const ruler = `<rect x="${x - 66}" y="${base - 6 - H * k - 4}" width="12" height="${H * k + 4}" style="fill:#f1e3b0;stroke:#a8945a"/>${ticks}`;
  const poured = v?.poured ? `<text class="bench-reading" x="${x}" y="${base - 6 - H * k - 14}" text-anchor="middle">V = ${v.poured}</text>` : '';
  // The manometer: its arms at mx and mx + 40, the water's rest level in the middle; the joined arm goes down by Δh/2.
  const mx = 500;
  const mTop = TABLE - 250;
  const mBot = TABLE - 60;
  const rest = (mTop + mBot) / 2 + 10;
  const d = Math.min(80, ((v?.dh ?? 0) * k) / 2);
  const left = rest + d;
  const right = rest - d;
  const tube = `<path d="M${x + 36},${base + 14} H${mx - 30} V${mTop - 14} H${mx} V${mTop}" style="fill:none;stroke:#7b8a99;stroke-width:3"/>`;
  const arm = (ax: number) => `<rect x="${ax - 5}" y="${mTop}" width="10" height="${mBot - mTop}" style="fill:rgba(220,235,250,0.35);stroke:#8fb8dd"/>`;
  const mw = `<rect x="${mx - 4}" y="${left}" width="8" height="${mBot - left}" style="fill:#3b82c4"/><rect x="${mx + 36}" y="${right}" width="8" height="${mBot - right}" style="fill:#3b82c4"/><path d="M${mx - 5},${mBot} q0,16 25,16 q25,0 25,-16" style="fill:none;stroke:#3b82c4;stroke-width:9"/>`;
  const board = `<rect x="${mx - 18}" y="${mTop - 10}" width="76" height="${mBot - mTop + 32}" rx="4" style="fill:#e9dfc4;stroke:#a8945a"/>`;
  const marks = d > 1 ? `<path class="bench-mark" d="M${mx - 12},${left} H${mx + 52} M${mx - 12},${right} H${mx + 52}"/>${v?.read ? `<text class="bench-reading" x="${mx + 20}" y="${mBot + 40}" text-anchor="middle">Δh = ${v.read}</text>` : ''}` : '';
  return `${ruler}${stand}${water}${glass}${poured}${board}${tube}${arm(mx)}${arm(mx + 40)}${mw}${marks}`;
}

/**
 * A 1 mL syringe held in a stand's clamp, its nozzle down (a red cap on it when shut); the plunger pulled up by the
 * dynamometer, 2 px to the millimetre of its scale; a ruler beside it. The aneroid barometer on the right: its needle
 * over 960…1060 hPa.
 */
function atmSvg(a: BenchView['atm']): string {
  const x = 450;
  const nozzle = TABLE - 60;
  const bottom = nozzle - 10;
  const len = 114;
  const top = bottom - len - 16;
  const plunger = bottom - (a?.pulled ?? 0) * len;
  const stand = `<rect x="350" y="${TABLE - 8}" width="80" height="8" rx="2" style="fill:${DARK}"/><rect x="366" y="${TABLE - 250}" width="6" height="242" style="fill:#8a96a3"/><rect x="369" y="${bottom - 60}" width="${x - 369 - 9}" height="6" style="fill:#8a96a3"/><rect x="${x - 11}" y="${bottom - 66}" width="22" height="18" rx="3" style="fill:#59636e"/>`;
  const barrel = `<rect x="${x - 8}" y="${top}" width="16" height="${bottom - top}" rx="2" style="fill:rgba(220,235,250,0.35);stroke:#8fb8dd;stroke-width:1.5"/><path d="M${x - 3},${bottom} V${nozzle} H${x + 3} V${bottom}" style="fill:rgba(220,235,250,0.35);stroke:#8fb8dd"/>`;
  const marks = Array.from({ length: 11 }, (_, i) => `<path d="M${x + 8},${bottom - (i * len) / 10} h${i % 5 === 0 ? -7 : -4}" style="stroke:#3d3d3d;stroke-width:0.7"/>`).join('');
  const cap = a?.sealed ? `<rect x="${x - 5}" y="${nozzle - 2}" width="10" height="9" rx="2" style="fill:#c0392b"/>` : '';
  const rodTop = top - 40;
  const piston = `<rect x="${x - 7}" y="${plunger - 6}" width="14" height="6" style="fill:#3d3d3d"/><rect x="${x - 2}" y="${rodTop}" width="4" height="${plunger - 6 - rodTop}" style="fill:#d7dde3;stroke:#8a96a3"/><rect x="${x - 12}" y="${rodTop - 5}" width="24" height="5" rx="2" style="fill:#d7dde3;stroke:#8a96a3"/>`;
  const dyn = a?.pull ? `<path d="M${x},${rodTop - 5} V${rodTop - 14}" style="stroke:#555;stroke-width:2"/><rect x="${x - 6}" y="${rodTop - 70}" width="12" height="56" rx="3" style="fill:#f4f1e8;stroke:#555"/><path d="M${x - 10},${rodTop - 78} l10,-10 l10,10" style="fill:none;stroke:#c0392b;stroke-width:2"/><text class="bench-reading" x="${x + 16}" y="${rodTop - 40}">F = ${a.pull}</text>` : '';
  const ticks = Array.from({ length: 13 }, (_, i) => `<path d="M${x - 30},${bottom - i * 10} h${i % 5 === 0 ? 8 : 5}" style="stroke:#5b4a2a;stroke-width:1"/>`).join('');
  const ruler = `<rect x="${x - 34}" y="${bottom - 124}" width="12" height="128" style="fill:#f1e3b0;stroke:#a8945a"/>${ticks}`;
  const read = a?.read ? `<text class="bench-reading" x="${x - 40}" y="${bottom - len / 2}" text-anchor="end">${a.read}</text>` : '';
  // The barometer: a round dial, the needle at the day's pressure.
  const bx = 548;
  const by = TABLE - 170;
  const share = Math.max(0, Math.min(1, ((a?.air ?? 101_300) / 100 - 960) / 100));
  const ang = Math.PI * (1.25 - 1.5 * share);
  const dial = Array.from({ length: 11 }, (_, i) => {
    const t = Math.PI * (1.25 - 0.15 * i);
    const r0 = i % 5 === 0 ? 26 : 29;
    return `<path d="M${bx + 33 * Math.cos(t)},${by - 33 * Math.sin(t)} L${bx + r0 * Math.cos(t)},${by - r0 * Math.sin(t)}" style="stroke:#333;stroke-width:0.9"/>`;
  }).join('');
  const baro = `<circle cx="${bx}" cy="${by}" r="40" style="fill:#c9a96e;stroke:#7a5a2a;stroke-width:2"/><circle cx="${bx}" cy="${by}" r="35" style="fill:#f4f1e8"/>${dial}<path d="M${bx},${by} L${bx + 28 * Math.cos(ang)},${by - 28 * Math.sin(ang)}" style="stroke:#1f2a36;stroke-width:1.8"/><circle cx="${bx}" cy="${by}" r="2.5" style="fill:#1f2a36"/><text class="lever-mark" x="${bx}" y="${by + 18}" text-anchor="middle" style="font-size:8px">hPa</text>${a?.baro ? `<text class="bench-reading" x="${bx}" y="${by + 58}" text-anchor="middle">p₀ = ${a.baro}</text>` : ''}`;
  return `${stand}${ruler}${barrel}${marks}${piston}${cap}${dyn}${read}${baro}`;
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

/**
 * Adding forces: a stand with a long arm; school dynamometers (10 units to the newton) hang from it, their hooks
 * coming out as the spring stretches, so a ruler held by two of them tilts when they pull differently. Under the
 * load, for "down", a third position: a dynamometer turned over, its ring tied to a clamp on the table, its hook
 * pulling the weights down.
 */
const FORCES_K = 600;
function forcesSvg(f: BenchView['forces']): string {
  const hold = f?.hold ?? 'one';
  const loaded = !!f?.loaded;
  const armY = 40;
  const top = armY + 6;
  // To the right: the board's writing on the left stays readable.
  const xC = 480;
  const half = (0.3 * FORCES_K) / 2;
  const PER_N = 10;
  // A dynamometer hanging from (x, top): its pointer and hook go down by the force; returns the drawing and where the hook ends.
  const hanging = (x: number, F: number, read: string | undefined, left: boolean): [string, number] => {
    const p = top + 8 + F * PER_N;
    const tip = top + 64 + F * PER_N;
    const ticks = Array.from({ length: 11 }, (_, i) => `<path d="M${x - 6},${top + 8 + i * 5} h${i % 2 === 0 ? 6 : 3}"/>`).join('');
    const label = read ? `<text class="bench-reading" x="${x + 13}" y="${top + (left ? 24 : 40)}">${read}</text>` : '';
    return [`<path d="M${x},${armY + 3} V${top}" style="stroke:${THREAD};stroke-width:1.5"/><rect class="dyn-case" x="${x - 9}" y="${top}" width="18" height="64" rx="5"/><g class="dyn-ticks">${ticks}</g><path d="M${x},${p} V${tip}" style="stroke:${STEEL};stroke-width:2"/><path d="M${x - 7},${p} h14" style="stroke:#c0392b;stroke-width:2"/><path d="M${x},${tip} q0,6 -5,5" style="stroke:${THREAD};stroke-width:1.5;fill:none"/>${label}`, tip + 4];
  };
  const ruler = (x1: number, y1: number, x2: number, y2: number) => `<path d="M${x1},${y1} L${x2},${y2}" style="stroke:${WOOD_EDGE};stroke-width:7;stroke-linecap:round"/><path d="M${x1},${y1} L${x2},${y2}" style="stroke:${WOOD};stroke-width:5;stroke-linecap:round"/>`;
  const load = (x: number, y: number) => `<path d="M${x},${y} v12" style="stroke:${THREAD};stroke-width:1.5"/>${weightsSvg(x, y + 12, 2)}`;
  const stand = standSvg(345, 610, armY);
  if (!loaded) {
    // Not hung yet: the dynamometers empty, the ruler and the weights on the table.
    const xs = hold === 'two' ? [xC - half, xC + half] : [xC];
    return `${stand}${xs.map((x, i) => hanging(x, 0, undefined, i === 0 && xs.length > 1)[0]).join('')}${ruler(xC - half - 30, TABLE - 4, xC + half - 30, TABLE - 4)}${weightsSvg(xC + half + 10, TABLE - 20, 2)}`;
  }
  if (hold === 'two') {
    const [l, yl] = hanging(xC - half, f!.a, f!.readA, true);
    const [r, yr] = hanging(xC + half, f!.b, f!.readB, false);
    const k = Math.max(0, Math.min(1, f!.at / 0.3));
    return `${stand}${l}${r}${ruler(xC - half, yl, xC + half, yr)}${load(xC - half + k * 2 * half, yl + (yr - yl) * k)}`;
  }
  const [a, y] = hanging(xC, f!.a, f!.readA, false);
  const body = `${ruler(xC - half, y, xC + half, y)}${load(xC, y)}`;
  if (hold === 'one') return `${stand}${a}${body}`;
  // The lower one, turned over: its hook in the weights' bottom, pulled out by the force; its ring tied to a clamp.
  const hook = y + 12 + 20 + 2;
  const bt = hook + 6 + f!.b * PER_N;
  const p = bt + 56 - f!.b * PER_N;
  const ticks = Array.from({ length: 11 }, (_, i) => `<path d="M${xC - 6},${bt + 56 - i * 5} h${i % 2 === 0 ? 6 : 3}"/>`).join('');
  const lower = `<path d="M${xC},${hook} V${p}" style="stroke:${STEEL};stroke-width:2"/><rect class="dyn-case" x="${xC - 9}" y="${bt}" width="18" height="64" rx="5"/><g class="dyn-ticks">${ticks}</g><path d="M${xC - 7},${p} h14" style="stroke:#c0392b;stroke-width:2"/><path d="M${xC},${bt + 64} V${TABLE - 10}" style="stroke:${THREAD};stroke-width:1.5"/><rect x="${xC - 14}" y="${TABLE - 10}" width="28" height="10" rx="2" style="fill:${DARK}"/>${f!.readB ? `<text class="bench-reading" x="${xC + 16}" y="${bt + 36}">${f!.readB}</text>` : ''}`;
  return `${stand}${a}${body}${lower}`;
}

/**
 * The method of rows, seen from the front, 4 units to the millimetre (larger than life): a ruler with millimetre
 * marks lying on the table, the row laid along it from its zero — peas or millet grains, pressed between two
 * toothpicks — or a pen refill with the thread wound on it turn to turn; a bracket with the row's length.
 */
const ROW_K = 4000;
function rowsSvg(r: BenchView['rows']): string {
  // (Clear of the Professor on the left.)
  const x0 = 180;
  const top = TABLE - 16;
  const mmTicks = Array.from({ length: 111 }, (_, i) => `<path d="M${x0 + i * 4},${top} v${i % 10 === 0 ? 8 : i % 5 === 0 ? 6 : 3}"/>`).join('');
  const labels = Array.from({ length: 12 }, (_, i) => `<text x="${x0 + i * 40}" y="${top + 15}" text-anchor="middle">${i}</text>`).join('');
  const ruler = `<g class="bench-ruler"><rect x="${x0 - 10}" y="${top}" width="${460}" height="16" rx="2"/><g class="ticks">${mmTicks}</g><g class="labels">${labels}</g></g>`;
  if (!r) return ruler;
  const n = Math.floor(r.placed);
  const falling = r.placed - n;
  let x = x0;
  const parts: string[] = [];
  if (r.body === 'thread') {
    // The refill lies along the ruler; the turns go on from its zero, one after another.
    const total = r.sizes.reduce((a, d) => a + d, 0) * ROW_K;
    parts.push(`<rect x="${x0 - 30}" y="${top - 9}" width="${Math.max(120, total + 60)}" height="7" rx="3" style="fill:#5d8fc9;stroke:#33557e"/>`);
    r.sizes.slice(0, n).forEach((d, i) => {
      const w = d * ROW_K;
      parts.push(`<rect x="${x}" y="${top - 11}" width="${w}" height="11" style="fill:${i % 2 ? '#f4e9c8' : '#ffffff'};stroke:#9b8b5d;stroke-width:0.3"/>`);
      x += w;
    });
  } else {
    const color = r.body === 'pea' ? '#b9c45a' : '#f0c53c';
    const edge = r.body === 'pea' ? '#6f7a26' : '#a7801d';
    r.sizes.forEach((d, i) => {
      const rad = (d * ROW_K) / 2;
      if (i < n || (i === n && falling > 0)) {
        // The one being laid drops in from above.
        const lift = i === n ? (1 - falling) * 50 : 0;
        parts.push(`<circle cx="${x + rad}" cy="${top - rad - lift}" r="${rad}" style="fill:${color};stroke:${edge};stroke-width:0.8"/>`);
      }
      x += rad * 2;
    });
    // The toothpicks press the row from both ends (once it is all laid).
    x = x0 + r.sizes.slice(0, n).reduce((a, d) => a + d * ROW_K, 0);
    if (n > 1) parts.push(`<rect x="${x0 - 3}" y="${top - 26}" width="3" height="26" rx="1" style="fill:${WOOD};stroke:${WOOD_EDGE}"/><rect x="${x}" y="${top - 26}" width="3" height="26" rx="1" style="fill:${WOOD};stroke:${WOOD_EDGE}"/>`);
  }
  const end = x0 + r.sizes.slice(0, n).reduce((a, d) => a + d * ROW_K, 0);
  const bracket = r.read ? `<path class="bench-mark" d="M${x0},${top - 34} v-6 H${end} v6"/><text class="bench-reading" x="${(x0 + end) / 2}" y="${top - 46}" text-anchor="middle">${r.read}</text>` : '';
  return `${ruler}${parts.join('')}${bracket}`;
}
