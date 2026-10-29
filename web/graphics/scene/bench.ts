import { TABLE } from './constants.js';
import { gregorianDay, julianDay } from '../../../src/scenarios/calendar-bench.js';

/**
 * The mechanics bench of grade 7, drawn on the table instead of the vessel: a stand with a spring, slotted
 * weights and a ruler (Hooke's law); a wooden block pulled along a board by a dynamometer (friction); the
 * block with a ruler at the edge being measured (pressure). Sizes follow the real ones: 1 cm of the
 * apparatus is 6 units of the drawing.
 */
export interface BenchView {
  readonly kind: 'spring' | 'friction' | 'pressure' | 'balance' | 'incline' | 'circle' | 'pendulum' | 'lever' | 'slope' | 'circuit' | 'series' | 'parallel' | 'box' | 'depth' | 'utube' | 'press' | 'atm' | 'vessels' | 'magnet' | 'induct' | 'bubble' | 'sink' | 'forces' | 'rows' | 'lift' | 'bounce' | 'carry' | 'winch' | 'wind' | 'strobe' | 'snail' | 'coin' | 'touch' | 'carts' | 'drag' | 'tower' | 'gnomon' | 'air' | 'planets' | 'calendar';
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
  /** Weight in a lift: the phase, where the cabin is (0 — the ground floor, 1 — the top), the dynamometer's force and reading; `fall` — how far it has fallen to the floor (0…1). */
  /**
   * Inertia: how far the card has gone (m; past 0.2 — taken away), how far the coin moved along it (m), how far it has
   * dropped below the card (m), its tilt (°), and the slow motion's label.
   */
  /**
   * The Solar System's model: the field with the Sun-ball and the planets laid out (`marks`, as many as are out so far;
   * the field shows `range` metres); the orbits seen from above, the planets `years` on; Voyager's view back (`dark` —
   * how far the frame has gone dark, `dot` — the pale blue dot showing).
   */
  /**
   * Calendars: the equinox's slide — a tape of days from 1 March to 30 April, the Sun on its date, the years counting
   * (`year`, written `yearFmt[0]` + year + `yearFmt[1]`; `sun`, `start` — days of March from its 1st); October 1582 —
   * the days 5–14 struck out one by one (`cut` 0…1; 2 — the month as it was, without them); 1616 — April's sheets of
   * Madrid and London, and one tape of the Gregorian calendar the London date moves over to (`shift` 0…1).
   */
  readonly calendar?: { readonly view: 'drift' | 'october' | 'bard'; readonly title: string; readonly sub?: string; /** October's sheet's title. */ readonly month?: string; readonly months: readonly string[]; readonly weekdays: readonly string[]; readonly year?: number; readonly yearFmt?: readonly [string, string]; readonly sun?: number; readonly start?: number; readonly startNote?: string; readonly cut?: number; readonly shift?: number; readonly names?: readonly [string, string]; readonly sheets?: readonly [string, string]; readonly strip?: string; readonly read?: string; /** The step just done, to be played. */ readonly anim?: 'egypt' | 'julian' | 'gregorian' | 'bard' };
  readonly planets?: { readonly view: 'field' | 'orbits' | 'back'; readonly marks: readonly { readonly name: string; readonly distance: number; readonly size: number; readonly read: string; readonly color: string }[]; readonly range: number; readonly sun: string; readonly years?: number; readonly orbits?: readonly { readonly name: string; readonly a: number; readonly t: number; readonly color: string }[]; readonly dark?: number; readonly dot?: number; readonly caption?: string; readonly note?: string; /** The step just done, to be played. */ readonly anim?: 'ball' | 'inner' | 'outer' | 'kepler' | 'voyager' };
  /**
   * The air: where the phone is — on the ground floor, on the ninth (`floor` between them while the lift goes), or in
   * the airship over the town; its barometer's reading; the labels.
   */
  readonly air?: { readonly where: 'ground' | 'ninth' | 'airship' | 'high'; readonly floor: number; /** How far the camera has risen with the airship: 0 — on the ground, 1 — 300 m, 2 — 2 km. */ readonly zoom?: number; readonly read?: string; readonly label: string; readonly air: string };
  /**
   * The gnomon: the shadows measured so far (their tips chalked on the ground, the clock time by each), the one being
   * measured now (its length, m, and the clock); `anim` — how many of the last ones to play one by one.
   */
  readonly gnomon?: { readonly tips: readonly { readonly length: number; readonly time: string; readonly read: string }[]; readonly now?: { readonly length: number; readonly time: string; readonly read?: string }; readonly anim?: number };
  /**
   * The liquid tower: how many layers are poured (2.5 — the third half-way); the bodies in the cylinder, each
   * where it is (mL mark of its bottom… or resting: `share` of it below the mark), the names of the liquids.
   */
  readonly tower?: { readonly poured: number; readonly bodies: readonly { readonly body: 'nut' | 'acrylic' | 'hdpe' | 'pine'; readonly at: number }[]; readonly names: readonly string[]; readonly ml: string; /** What has just happened, to be played: the pouring, or the last body going in. */ readonly anim?: 'pour' | 'drop' };
  /**
   * The drag: the plasticine body (its form) let go in the aquarium's water or in the air; `at` — how far it has
   * fallen from where it was let go (m); `count` — the frames counted between the marks so far; `read` — the result.
   */
  readonly drag?: { readonly shape: 'ball' | 'cube' | 'plate'; readonly medium: 'water' | 'air'; readonly at: number; readonly size: number; readonly count?: string; readonly read?: string; readonly slow?: string; readonly moving?: boolean; readonly air: string };
  /**
   * Carts: pushed apart — the weights on cart 2, how far each has gone (m), the burning thread (0…1), the paths read;
   * weighed — which cart hangs on the dynamometer, with its weights, and the reading.
   */
  readonly carts?: { readonly mode: string; readonly weights: number; readonly x1: number; readonly x2: number; readonly flame?: number; readonly cart?: number; readonly read?: readonly string[]; readonly slow?: string; readonly moving?: boolean };
  /** Contact and non-contact forces: the case shown and how far it has played (0 — before, 1 — done). */
  readonly touch?: { readonly case: string; readonly k: number; readonly read?: string };
  /** Inertia's motion: the card's speed, the coin's drag (μ·g), when the card leaves it, whether it slipped and dropped in. */
  readonly coinRun?: { readonly v: number; readonly a: number; readonly exit: number; readonly slipped: boolean; readonly inGlass: boolean; readonly slow?: string };
  readonly coin?: { readonly card: number; readonly x: number; readonly drop: number; readonly tilt: number; readonly slow?: string; readonly read?: string };
  /** A snail: the surface it crawls on, how far it has gone (m), the distance read. */
  readonly snail?: { readonly surface: string; readonly at: number; readonly read?: string };
  /**
   * A stroboscopic photo: which one, the ball's places on it (mm on the photo, from the first image), how many images
   * the flashes have left so far (a fraction — the flash fading), and the gaps once measured (their labels).
   */
  readonly strobe?: { readonly photo: string; readonly at: readonly number[]; readonly shown: number; readonly gaps?: readonly string[] };
  /** The wind's speed: the day (1–3, its Beaufort force), the wind (m/s), where the bubble is (m past the first mark; none — not blown yet), the speed found. */
  readonly wind?: { readonly day: number; readonly speed: number; readonly at?: number; readonly read?: string };
  /**
   * A windlass: the spool and its diameter (m); how far it has turned (turns, + — the way letting the load down
   * turns it); the load's depth below the spool (m); what was counted or measured.
   */
  readonly winch?: { readonly spool: string; readonly d: number; readonly turned: number; readonly drop: number; readonly read?: string };
  /**
   * The relativity of motion: the bubble's bottle (in `sink`) carried along the table at `speed` (m/s), moved `shift`
   * (m) so far; the line on the paper behind, once measured (`path`).
   */
  readonly carry?: { readonly speed: number; readonly shift: number; readonly path?: string; readonly rise?: string };
  /**
   * A ball's bounce: the ball, its diameter (m), its bottom's height (m, 1 — the drop height), how squashed it is
   * (0…1; plasticine stays flat), the mechanical energy left (a share of the start's); the tops marked so far; the
   * last top's reading; the energy bars' labels (potential, kinetic, heat and sound).
   */
  readonly bounce?: { readonly ball: string; readonly size: number; readonly y: number; readonly squash: number; readonly mech: number; readonly marks: readonly number[]; readonly read?: string; readonly labels: readonly [string, string, string] };
  readonly lift?: { readonly phase: string; readonly y: number; readonly force: number; readonly read?: string; readonly fall?: number; readonly rest?: number; readonly diff?: string };
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
  if (v.kind === 'lift') return liftSvg(v.lift);
  if (v.kind === 'bounce') return bounceSvg(v.bounce);
  if (v.kind === 'carts') return cartsSvg(v.carts);
  if (v.kind === 'drag') return dragSvg(v.drag);
  if (v.kind === 'tower') return towerSvg(v.tower);
  if (v.kind === 'gnomon') return gnomonSvg(v.gnomon);
  if (v.kind === 'air') return airSvg(v.air);
  if (v.kind === 'planets') return planetsSvg(v.planets);
  if (v.kind === 'calendar') return calendarSvg(v.calendar);
  if (v.kind === 'touch') return touchSvg(v.touch);
  if (v.kind === 'coin') return coinSvg(v.coin);
  if (v.kind === 'snail') return `${snailSvg(v.snail)}${v.stopwatch ? stopwatchSvg(v.stopwatch, 595) : ''}`;
  if (v.kind === 'strobe') return strobeSvg(v.strobe);
  if (v.kind === 'wind') return `${windSvg(v.wind)}${v.stopwatch ? stopwatchSvg(v.stopwatch, 450) : ''}`;
  if (v.kind === 'winch') return winchSvg(v.winch);
  if (v.kind === 'carry') return `${carrySvg(v.sink, v.carry)}${v.stopwatch ? stopwatchSvg(v.stopwatch, 585) : ''}`;
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
 * The Solar System's model. The field: the Sun-ball on the left, a tape along the ground, each planet a dot (drawn
 * bigger than to scale — its true size is in its label) at its distance. The orbits: from above, the inner planets
 * round the Sun at the true ratio of their distances, turning at their true periods. Voyager's view back: the frame
 * goes dark, slanting beams of scattered sunlight cross it, and in one of them — a single pale blue dot.
 */
function planetsSvg(p: BenchView['planets']): string {
  if (!p) return '';
  if (p.view === 'orbits') {
    const cx = 470;
    const cy = 165;
    const k = 78;
    const sun = `<circle cx="${cx}" cy="${cy}" r="9" style="fill:#ffd54a;stroke:#f0a500;stroke-width:1.5"/>`;
    const rings = (p.orbits ?? []).map((o) => {
      const ang = (2 * Math.PI * (p.years ?? 0)) / o.t - Math.PI / 2;
      const x = cx + o.a * k * Math.cos(ang);
      const y = cy + o.a * k * Math.sin(ang);
      return `<circle cx="${cx}" cy="${cy}" r="${o.a * k}" style="fill:none;stroke:rgba(216,226,234,0.35);stroke-dasharray:3 4"/><circle cx="${x}" cy="${y}" r="4" style="fill:${o.color};stroke:#1d2a36"/><text class="bench-label" x="${x + 7}" y="${y - 6}">${o.name}</text>`;
    }).join('');
    const backdrop = `<circle cx="${cx}" cy="${cy}" r="${1.6 * k}" style="fill:rgba(16,24,20,0.88)"/>`;
    return `${backdrop}${sun}${rings}${p.note ? `<text class="bench-label" x="${cx}" y="${cy + 150}" text-anchor="middle">${p.note}</text>` : ''}${p.caption ? `<text class="bench-reading" x="${cx}" y="${cy - 130}" text-anchor="middle">${p.caption}</text>` : ''}`;
  }
  const ground = TABLE - 18;
  const x0 = 175;
  const x1 = 585;
  const at = (d: number) => x0 + (d / p.range) * (x1 - x0);
  const field = `<path d="M${x0 - 30},${ground + 6} H${x1 + 10}" style="stroke:#7fae6a;stroke-width:3"/><path d="M${x0},${ground + 2} H${x1}" style="stroke:#f1d36b;stroke-width:2;stroke-dasharray:2 3"/><circle cx="${x0 - 12}" cy="${ground - 8}" r="12" style="fill:#ffd54a;stroke:#f0a500;stroke-width:1.5"/><text class="bench-label" x="${x0 - 12}" y="${ground - 26}" text-anchor="middle">${p.sun}</text>`;
  // (Planets too close together for labels — the inner ones on the long field — go unlabelled.)
  let lastLabel = -Infinity;
  const dots = p.marks.map((m, i) => {
    const x = at(m.distance);
    const r = Math.max(2, Math.min(7, 2 + m.size * 300));
    const label = x - lastLabel > 40;
    if (label) lastLabel = x;
    const up = i % 2 === 0;
    return `<circle cx="${x}" cy="${ground - r}" r="${r}" style="fill:${m.color};stroke:#1d2a36;stroke-width:0.8"/>${label ? `<text class="bench-label" x="${x}" y="${up ? ground - 2 * r - 18 : ground - 2 * r - 6}" text-anchor="middle">${m.name}</text>` : ''}`;
  }).join('');
  const scale = `<text class="bench-label" x="${x1}" y="${ground + 22}" text-anchor="end">${p.caption ?? ''}</text>`;
  if (p.view === 'back') {
    // The view back: dark coming over the board, the beams, the dot (a pixel and a half) in the middle beam.
    const d = p.dark ?? 0;
    const beam = (x: number, w: number, o: number) => `<path d="M${x},14 l${w},0 l-150,300 l${-w},0 Z" style="fill:rgba(255,214,150,${o * d})"/>`;
    const dot = p.dot ? `<circle cx="432" cy="168" r="1.6" style="fill:rgba(170,210,255,${p.dot})"/>` : '';
    return `${field}${dots}${scale}<rect x="18" y="12" width="586" height="${ground - 4}" style="fill:rgba(4,6,10,${0.96 * d})"/>${beam(380, 34, 0.18)}${beam(470, 60, 0.26)}${beam(560, 22, 0.14)}${dot}${p.dot && p.note ? `<text class="bench-label" x="440" y="${ground - 20}" style="fill:rgba(200,215,230,${p.dot})">${p.note}</text>` : ''}`;
  }
  return `${field}${dots}${scale}`;
}

/** Paper and ink of the calendar sheets; the Sun; the two men's colours. */
const PAPER = '#f7f2e4';
const INK = '#2b2f36';
const RED_INK = '#c0392b';
const BLUE_INK = '#2e6fb5';
const ink = (x: number, y: number, t: string | number, size = 11, extra = '') => `<text x="${x}" y="${y}" text-anchor="middle" style="font:${size}px system-ui,sans-serif;fill:${INK};${extra}">${t}</text>`;
const sunAt = (x: number, y: number) => `${Array.from({ length: 8 }, (_, k) => { const a = (k * Math.PI) / 4; return `<path d="M${x + 13 * Math.cos(a)},${y + 13 * Math.sin(a)} L${x + 18 * Math.cos(a)},${y + 18 * Math.sin(a)}" style="stroke:#f0a500;stroke-width:2"/>`; }).join('')}<circle cx="${x}" cy="${y}" r="10" style="fill:#ffd54a;stroke:#f0a500;stroke-width:1.5"/>`;
/** A month's sheet: `days` of it from weekday `first` (0 — Monday), cells `w`×`h` from (x, y); `mark` — the cell to ring. */
function monthGrid(x: number, y: number, w: number, h: number, weekdays: readonly string[], cells: readonly { day: number; at: number; style?: string }[]): string {
  const head = weekdays.map((d, k) => ink(x + w * k + w / 2, y, d, 9, k >= 5 ? `fill:${RED_INK}` : '')).join('');
  return head + cells.map((c) => ink(x + w * (c.at % 7) + w / 2, y + h * (1 + Math.floor(c.at / 7)), c.day, Math.min(12, h * 0.6), c.style ?? '')).join('');
}

/**
 * Calendars, on the right half of the board (its left half keeps the board's lines). The slide: a tape of the days of
 * March and April, a dashed mark where the equinox was, the Sun where it is now, the years running on, a bracket with
 * the slide. October 1582: its sheet, the days 5–14 crossed out, then the month without them. 1616: April in Madrid
 * (Gregorian) and in London (Julian), each with its day ringed; below, one Gregorian tape.
 */
function calendarSvg(c: BenchView['calendar']): string {
  if (!c) return '';
  const sheet = (x: number, y: number, w: number, h: number) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" style="fill:${PAPER};stroke:#b9ae92;stroke-width:1"/>`;
  const cx = 464;
  if (c.view === 'drift') {
    const x0 = 326;
    const dx = 276 / 61;
    const at = (day: number) => x0 + (day + 0.5) * dx;
    const y = 212;
    const tape = `<rect x="${x0}" y="${y}" width="${31 * dx}" height="12" style="fill:#dcebc9"/><rect x="${x0 + 31 * dx}" y="${y}" width="${30 * dx}" height="12" style="fill:#cfe0f0"/>${Array.from({ length: 62 }, (_, d) => `<path d="M${x0 + d * dx},${y} v${d === 0 || d === 31 || d === 61 ? 18 : d % 5 === 0 ? 8 : 4}" style="stroke:#55606b;stroke-width:${d === 31 ? 1.4 : 0.6}"/>`).join('')}`;
    const nums = [0, 10, 20, 31, 41, 51].map((d) => ink(at(d), y + 28, d < 31 ? d + 1 : d - 30, 10)).join('');
    const months = ink(x0 + 15.5 * dx, y + 43, c.months[2]!, 10, 'font-weight:600') + ink(x0 + 46 * dx, y + 43, c.months[3]!, 10, 'font-weight:600');
    const start = c.start ?? 20;
    const ghost = `<path d="M${at(start)},${y - 62} V${y}" style="stroke:#8a7f66;stroke-width:1.2;stroke-dasharray:3 3"/>${c.startNote ? ink(at(start), y - 66, c.startNote, 10, 'fill:#6b6250') : ''}`;
    const sun = c.sun ?? start;
    const d = Math.round(sun) + 1;
    const date = d > 31 ? `${d - 31} ${c.months[3]}` : d >= 1 ? `${d} ${c.months[2]}` : '';
    const year = c.year === undefined ? '' : ink(cx, 122, `${c.yearFmt?.[0] ?? ''}${Math.round(c.year)}${c.yearFmt?.[1] ?? ''}`, 22, 'font-weight:700');
    const bracket = c.read ? `<path d="M${at(start)},${y + 50} v6 H${at(sun)} v-6" style="fill:none;stroke:${INK};stroke-width:1.2"/>${ink(cx, y + 70, c.read, 11, 'font-weight:700')}` : '';
    return `${sheet(316, 50, 296, 240)}${ink(cx, 72, c.title, 13, 'font-weight:700')}${c.sub ? ink(cx, 89, c.sub, 11) : ''}${year}${tape}${nums}${months}${ghost}${sunAt(at(sun), y - 24)}${ink(at(sun), y - 46, date, 11, 'font-weight:600')}${bracket}`;
  }
  if (c.view === 'october') {
    const x = 338;
    const w = 36;
    const h = 30;
    const top = 106;
    const cut = c.cut ?? 0;
    const cell = (i: number) => [x + w * (i % 7) + w / 2, top + h * (1 + Math.floor(i / 7)) - 4] as const;
    // (1 October 1582 was a Monday.) Before the cut, the whole month; after — 15 straight after 4.
    const cells = cut >= 2
      ? Array.from({ length: 31 }, (_, i) => i + 1).filter((d) => d < 5 || d > 14).map((d, i) => ({ day: d, at: i, style: d === 4 || d === 15 ? 'font-weight:700' : '' }))
      : Array.from({ length: 31 }, (_, i) => ({ day: i + 1, at: i, style: i + 1 >= 5 && i + 1 <= 14 && i + 1 - 5 < cut * 10 ? 'fill:#a39c8c' : '' }));
    const crosses = cut >= 2 ? '' : Array.from({ length: 10 }, (_, k) => k).filter((k) => k < cut * 10).map((k) => { const [px, py] = cell(4 + k); return `<path d="M${px - 10},${py - 8} L${px + 10},${py + 6} M${px + 10},${py - 8} L${px - 10},${py + 6}" style="stroke:${RED_INK};stroke-width:2"/>`; }).join('');
    const ring = (i: number) => { const [px, py] = cell(i); return `<circle cx="${px}" cy="${py}" r="12" style="fill:none;stroke:${BLUE_INK};stroke-width:1.6"/>`; };
    const jump = cut >= 2 ? `${ring(3)}${ring(4)}` : '';
    return `${sheet(326, 50, 276, 236)}${ink(cx, 78, c.month ?? '', 14, 'font-weight:700')}${monthGrid(x, top, w, h, c.weekdays, cells)}${crosses}${jump}`;
  }
  // 1616: the two Aprils (1 April: a Friday in Madrid's calendar, a Monday in London's), then the one tape.
  const w = 19;
  const h = 17;
  const april = (x: number, gregorian: boolean, mark: number, color: string, title: string) => {
    const first = (gregorian ? gregorianDay(1616, 4, 1) : julianDay(1616, 4, 1)) % 7;
    const cells = Array.from({ length: 30 }, (_, i) => ({ day: i + 1, at: first + i, style: i + 1 === mark ? `font-weight:700;fill:${color}` : '' }));
    const i = first + mark - 1;
    return `${sheet(x - 6, 34, 7 * w + 12, 162)}${ink(x + 3.5 * w, 52, title, 10, 'font-weight:700')}${monthGrid(x, 70, w, h, c.weekdays, cells)}<circle cx="${x + w * (i % 7) + w / 2}" cy="${70 + h * (1 + Math.floor(i / 7)) - 4}" r="9" style="fill:none;stroke:${color};stroke-width:1.6"/>`;
  };
  const names = c.names ?? ['', ''];
  const sheets = c.sheets ?? ['', ''];
  const x0 = 326;
  const dx = 276 / 20;
  // The tape: 18 April … 7 May, Gregorian.
  const at = (k: number) => x0 + (k + 0.5) * dx;
  const y = 250;
  const tape = `<rect x="${x0}" y="${y}" width="${13 * dx}" height="12" style="fill:#dcebc9"/><rect x="${x0 + 13 * dx}" y="${y}" width="${7 * dx}" height="12" style="fill:#f3e3c4"/>${Array.from({ length: 20 }, (_, k) => ink(at(k), y + 24, k < 13 ? 18 + k : k - 12, 9)).join('')}`;
  const shift = c.shift ?? 0;
  const s = 5 + 10 * shift;
  const marks = `<circle cx="${at(4)}" cy="${y + 6}" r="5.5" style="fill:${RED_INK}"/><text x="${at(4) + 2}" y="${y - 6}" text-anchor="end" style="font:700 10px system-ui,sans-serif;fill:${RED_INK}">${names[0]}</text><circle cx="${at(s)}" cy="${y + 6}" r="5.5" style="fill:${BLUE_INK}"/><text x="${at(s) - 2}" y="${y - 6}" style="font:700 10px system-ui,sans-serif;fill:${BLUE_INK}">${names[1]}</text>`;
  const gap = shift >= 1 && c.read ? `<path d="M${at(4)},${y + 30} v5 H${at(15)} v-5" style="fill:none;stroke:${INK};stroke-width:1.2"/>${ink((at(4) + at(15)) / 2, y + 48, c.read, 11, 'font-weight:700')}` : '';
  return `${april(322, true, 22, RED_INK, sheets[0])}${april(470, false, 23, BLUE_INK, sheets[1])}${sheet(316, 206, 296, 108)}${c.strip ? ink(cx, 224, c.strip, 10, 'fill:#6b6250') : ''}${tape}${marks}${gap}`;
}

/**
 * The air: a band of air beside, thick at the bottom and thinning upwards; a nine-storey block with its lift, the phone
 * on the floor it is on — or a mountain with the phone on its top. The phone's screen shows the barometer.
 */
function airSvg(a: BenchView['air']): string {
  if (!a) return '';
  const ground = TABLE - 2;
  const band = `<defs><linearGradient id="air-thin" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="rgba(140,200,255,0.55)"/><stop offset="1" stop-color="rgba(140,200,255,0.04)"/></linearGradient></defs><rect x="592" y="20" width="22" height="${ground - 20}" style="fill:url(#air-thin)"/><text class="bench-label" x="603" y="14" text-anchor="middle">${a.air}</text>`;
  const phone = (x: number, y: number) => `<rect x="${x - 9}" y="${y - 30}" width="18" height="30" rx="3" style="fill:#2b2f36"/><rect x="${x - 7}" y="${y - 27}" width="14" height="22" rx="1" style="fill:#cfe3f3"/>${a.read ? `<text class="bench-reading" x="${x - 14}" y="${y - 12}" text-anchor="end">${a.read}</text>` : ''}`;
  // A block of `n` storeys, 22 units each, its foot at (x, ground): the windows two to a storey.
  const storey = 22;
  const w = 80;
  const block = (x: number, n: number, numbers: boolean) => Array.from({ length: n }, (_, i) => `<rect x="${x}" y="${ground - (i + 1) * storey}" width="${w}" height="${storey}" style="fill:#c9b79c;stroke:#8c7a5e"/><rect x="${x + 10}" y="${ground - (i + 1) * storey + 6}" width="14" height="10" style="fill:#7fa7c9"/><rect x="${x + 34}" y="${ground - (i + 1) * storey + 6}" width="14" height="10" style="fill:#7fa7c9"/>${numbers ? `<text x="${x - 6}" y="${ground - i * storey - 7}" text-anchor="end" style="font:10px sans-serif;fill:#d8e2ea">${i + 1}</text>` : ''}`).join('');
  const x0 = 470;
  const label = `<text class="bench-label" x="${x0 - 14}" y="${ground - 9 * storey + 4}" text-anchor="end">${a.label}</text>`;
  if (a.where === 'airship' || a.where === 'high') {
    // The camera flies with the airship: it stays big in the frame, and the town below shrinks — at 300 m to a fifth,
    // at 2 km to a speck among its neighbours, all to the left of it so none leaves the board (`zoom`: 0 — on the
    // ground, 1 — 300 m, 2 — 2 km).
    const z = a.zoom ?? (a.where === 'high' ? 2 : 1);
    const sc = z <= 1 ? 1 - 0.78 * z : 0.22 - 0.17 * (z - 1);
    const cx = x0 + w / 2;
    const town = `<g transform="translate(${cx},${ground}) scale(${sc}) translate(${-cx},${-ground})">${block(x0 - 4 * (w + 14), 14, false)}${block(x0 - 3 * (w + 14), 7, false)}${block(x0 - 2 * (w + 14), 5, false)}${block(x0 - (w + 14), 12, false)}${block(x0, 9, false)}</g>`;
    const sy = 110;
    // (On its envelope a registration in the German airships' manner, D-LZ…: an invented one.)
    const ship = `<g transform="translate(${cx},${sy}) scale(1.25)"><ellipse cx="0" cy="0" rx="46" ry="14" style="fill:#d9dde2;stroke:#7d858d;stroke-width:1.2"/><path d="M40,-4 l14,-9 v26 l-14,-9 Z" style="fill:#b9c0c8;stroke:#7d858d"/><rect x="-12" y="12" width="24" height="7" rx="2" style="fill:#5a636c"/><text x="-4" y="4" text-anchor="middle" style="font:700 10px sans-serif;fill:#3a4652;letter-spacing:1px">D-LZUA</text></g>`;
    return `${band}${town}${ship}${phone(cx, sy + 44)}<text class="bench-label" x="${cx}" y="${ground - 6}" text-anchor="middle">${a.label}</text>`;
  }
  const y = ground - (a.floor - 1) * storey;
  const lift = `<rect x="${x0 + w - 22}" y="${y - storey + 2}" width="18" height="${storey - 3}" style="fill:#e8e2d5;stroke:#555"/>`;
  return `${band}${block(x0, 9, true)}${lift}${phone(x0 + w - 13, y - 2)}${label}`;
}

/** The gnomon in the yard: 100 units to the metre; the stick's foot here, its shadow along the tape to the right. */
const GNOMON_X = 420;
const GNOMON_K = 80;
/**
 * The yard: the metre stick upright, its shadow on the ground along a tape, the Sun on the line through the stick's
 * top and the shadow's end (so the picture keeps the true angle), the clock; chalk ticks where the shadows ended.
 */
function gnomonSvg(g: BenchView['gnomon']): string {
  if (!g) return '';
  const ground = TABLE - 4;
  const top = ground - GNOMON_K;
  const tape = `<rect x="${GNOMON_X}" y="${ground + 1}" width="${2 * GNOMON_K}" height="6" style="fill:#f1d36b;stroke:#a88a2c;stroke-width:0.6"/>${Array.from({ length: 21 }, (_, i) => `<path d="M${GNOMON_X + i * 8},${ground + 1} v${i % 5 ? 2.5 : 5}" style="stroke:#5a4a14;stroke-width:0.6"/>`).join('')}`;
  const stick = `<rect x="${GNOMON_X - 2.5}" y="${top}" width="5" height="${GNOMON_K}" rx="1" style="fill:${WOOD};stroke:${WOOD_EDGE}"/>`;
  const ticks = g.tips.map((t) => `<path d="M${GNOMON_X + t.length * GNOMON_K},${ground - 6} v8" style="stroke:#ffffff;stroke-width:1.6"/>`).join('');
  let now = '';
  if (g.now) {
    const L = g.now.length * GNOMON_K;
    // The Sun on the ray from the shadow's end through the stick's top, 105 units beyond the top.
    const dx = -L;
    const dy = -GNOMON_K;
    const r = Math.hypot(dx, dy);
    const sx = GNOMON_X + (dx / r) * 105;
    const sy = top + (dy / r) * 105;
    now = `<path d="M${sx},${sy} L${GNOMON_X + L},${ground}" style="stroke:#ffd54a;stroke-width:1;stroke-dasharray:3 4;opacity:0.7"/><circle cx="${sx}" cy="${sy}" r="13" style="fill:#ffd54a;stroke:#f0a500;stroke-width:2"/><path d="M${GNOMON_X},${ground - 1} H${GNOMON_X + L}" style="stroke:rgba(20,25,30,0.75);stroke-width:5;stroke-linecap:round"/>${g.now.read ? `<text class="bench-reading" x="${GNOMON_X + L}" y="${ground - 12}" text-anchor="middle">${g.now.read}</text>` : ''}`;
  }
  const clock = g.now ? `<rect x="${GNOMON_X + 100}" y="${top - 60}" width="64" height="26" rx="4" style="fill:#1d2a36;stroke:#56687a"/><text x="${GNOMON_X + 132}" y="${top - 41}" text-anchor="middle" style="font:700 15px monospace;fill:#7cf29a">${g.now.time}</text>` : '';
  return `${tape}${ticks}${now}${stick}${clock}`;
}

/** The tower's cylinder: 11 units to the centimetre; 250 mL across 3.8 cm inside — 50 mL is 4.4 cm of it. */
const TOWER_X = 500;
export const TOWER_PX_PER_ML = (11 * 4.41) / 50;
const TOWER_COLORS = ['rgba(240,214,140,0.85)', 'rgba(74,144,217,0.75)', 'rgba(232,197,71,0.85)', 'rgba(224,108,140,0.7)'];
/** The bodies: a grey hexagon nut; a clear bluish square; a white piece; a wooden cube — 1 cm or so, side by side. */
const TOWER_BODY: Record<'nut' | 'acrylic' | 'hdpe' | 'pine', { dx: number; h: number; svg: (x: number, y: number) => string }> = {
  nut: { dx: 0, h: 7, svg: (x, y) => `<rect x="${x - 8}" y="${y - 7}" width="16" height="7" rx="1" style="fill:#7d858d;stroke:#3a3f46"/><path d="M${x - 3},${y - 7} v7 M${x + 3},${y - 7} v7" style="stroke:#3a3f46;stroke-width:0.8"/>` },
  acrylic: { dx: -9, h: 9, svg: (x, y) => `<rect x="${x - 5}" y="${y - 9}" width="10" height="9" rx="1" style="fill:rgba(200,235,255,0.85);stroke:#1f6fa8;stroke-width:1.2"/>` },
  hdpe: { dx: 9, h: 6, svg: (x, y) => `<rect x="${x - 6}" y="${y - 6}" width="12" height="6" rx="1" style="fill:#fafafa;stroke:#555;stroke-width:1"/>` },
  pine: { dx: 0, h: 11, svg: (x, y) => `<rect x="${x - 6}" y="${y - 11}" width="12" height="11" rx="1" style="fill:${WOOD};stroke:${WOOD_EDGE}"/>` },
};
/** Where a body's bottom is drawn when it rests: `share` of it below the mark (on the bottom: on the glass). */
export const towerBodyHeight = (b: 'nut' | 'acrylic' | 'hdpe' | 'pine') => TOWER_BODY[b].h;
function towerSvg(t: BenchView['tower']): string {
  if (!t) return '';
  const w = 44;
  const bottom = TABLE - 14;
  const k = TOWER_PX_PER_ML;
  const x0 = TOWER_X - w / 2;
  const top = bottom - 250 * k;
  const layers = TOWER_COLORS.map((c, i) => {
    const fill = Math.max(0, Math.min(1, t.poured - i));
    if (!fill) return '';
    const y1 = bottom - 50 * k * (i + fill);
    return `<rect x="${x0 + 2}" y="${y1}" width="${w - 4}" height="${50 * k * fill}" style="fill:${c}"/>`;
  }).join('');
  const names = t.names.map((n, i) => (t.poured >= i + 1 ? `<text class="bench-label" x="${x0 - 8}" y="${bottom - 50 * k * (i + 0.5) + 4}" text-anchor="end">${n}</text>` : '')).join('');
  const marks = [50, 100, 150, 200, 250].map((m) => `<path d="M${x0 + w - 10},${bottom - m * k} h10" style="stroke:#d8e2ea;stroke-width:1"/><text class="bench-label" x="${x0 + w + 6}" y="${bottom - m * k + 4}">${m}</text>`).join('');
  const bodies = t.bodies.map((b) => TOWER_BODY[b.body].svg(TOWER_X + TOWER_BODY[b.body].dx, Math.min(bottom, bottom - b.at * k))).join('');
  const glass = `<rect x="${x0}" y="${top - 6}" width="${w}" height="${bottom - top + 6}" rx="3" style="fill:none;stroke:#9fb4c4;stroke-width:2.5"/><rect x="${x0 - 14}" y="${bottom}" width="${w + 28}" height="8" rx="2" style="fill:${DARK}"/>`;
  return `${layers}${bodies}${glass}${marks}<text class="bench-label" x="${x0 + w + 6}" y="${top - 10}">${t.ml}</text>${names}`;
}

/** The aquarium: its water's surface, 8 units to the centimetre down from it; the marks at 5 and 25 cm. */
export const DRAG_TOP = 62;
export const DRAG_K = 800;
const DRAG_X = 508;
const PLASTICINE = '#e8743b';
/**
 * The drag: an aquarium on the table (water, or empty — the air), two marks on its glass 20 cm apart, the
 * plasticine body falling; a phone filming from the side, its count of frames between the marks.
 */
function dragSvg(d: BenchView['drag']): string {
  if (!d) return '';
  const w = 100;
  const bottom = TABLE - 6;
  const x0 = DRAG_X - w / 2;
  const glass = `<rect x="${x0}" y="${DRAG_TOP - 22}" width="${w}" height="${bottom - DRAG_TOP + 22}" rx="3" style="fill:none;stroke:#9fb4c4;stroke-width:2.5"/><rect x="${x0 - 4}" y="${bottom}" width="${w + 8}" height="6" rx="2" style="fill:${DARK}"/>`;
  const water = d.medium === 'water' ? `<rect x="${x0 + 1.5}" y="${DRAG_TOP}" width="${w - 3}" height="${bottom - DRAG_TOP}" style="fill:rgba(90,160,220,0.32)"/><path d="M${x0 + 1.5},${DRAG_TOP} h${w - 3}" style="stroke:#5a9fd8;stroke-width:1.5"/>` : `<text class="bench-label" x="${DRAG_X}" y="${DRAG_TOP + 2}" text-anchor="middle">${d.air}</text>`;
  const m1 = DRAG_TOP + 0.05 * DRAG_K;
  const m2 = DRAG_TOP + 0.25 * DRAG_K;
  const marks = `<path d="M${x0 - 10},${m1} h${w + 20} M${x0 - 10},${m2} h${w + 20}" style="stroke:#c0392b;stroke-width:1.5;stroke-dasharray:5 3"/><text class="bench-label" x="${x0 - 14}" y="${m1 + 4}" text-anchor="end">0</text><text class="bench-label" x="${x0 - 14}" y="${m2 + 4}" text-anchor="end">20 см</text>`;
  const px = d.size * 100 * 8;
  const y = Math.min(DRAG_TOP + d.at * DRAG_K, bottom - (d.shape === 'plate' ? 2 : px / 2));
  const body = d.shape === 'ball' ? `<circle cx="${DRAG_X}" cy="${y}" r="${px / 2}" style="fill:${PLASTICINE};stroke:#8a3a12"/>` : d.shape === 'cube' ? `<rect x="${DRAG_X - px / 2}" y="${y - px / 2}" width="${px}" height="${px}" rx="1.5" style="fill:${PLASTICINE};stroke:#8a3a12"/>` : `<rect x="${DRAG_X - px / 2}" y="${y - 2}" width="${px}" height="4" rx="1" style="fill:${PLASTICINE};stroke:#8a3a12"/>`;
  // The phone on a stand beside the aquarium, its lens to the marks; the count of frames on its screen.
  const px0 = x0 + w + 14;
  const phone = `<rect x="${px0}" y="${m1 + 30}" width="34" height="62" rx="5" style="fill:#2b2f36"/><rect x="${px0 + 3}" y="${m1 + 36}" width="28" height="48" rx="2" style="fill:#cfe3f3"/><circle cx="${px0 + 17}" cy="${m1 + 33}" r="1.6" style="fill:#9aa"/><path d="M${px0 + 17},${m1 + 92} V${bottom + 6}" style="stroke:${STEEL};stroke-width:3"/>`;
  const count = d.count ? `<text x="${px0 + 17}" y="${m1 + 65}" text-anchor="middle" style="font:700 14px sans-serif;fill:#1d2a36">${d.count}</text>` : '';
  const read = d.read && !d.moving ? `<text class="bench-reading" x="${DRAG_X + 10}" y="${DRAG_TOP - 30}" text-anchor="middle">${d.read}</text>` : '';
  const slow = d.slow && d.moving ? `<text class="bench-label" x="${DRAG_X}" y="${DRAG_TOP - 30}" text-anchor="middle">${d.slow}</text>` : '';
  return `${water}${marks}${body}${glass}${phone}${count}${read}${slow}`;
}

/** The carts on the table: 5 units to the centimetre; where they stand, touching through the spring. */
const CARTS_K = 500;
const CARTS_X = 440;
/** A light cart: a body on two wheels, its weights on top. */
function cartSvg(x: number, base: number, weights: number, colour: string): string {
  return `<rect x="${x - 25}" y="${base - 26}" width="50" height="18" rx="3" style="fill:${colour};stroke:#3a3f46"/><circle cx="${x - 14}" cy="${base - 5}" r="5" style="fill:#3a3f46"/><circle cx="${x + 14}" cy="${base - 5}" r="5" style="fill:#3a3f46"/>${weights ? weightsSvg(x, base - 26 - 9 * weights, weights, 18, 9) : ''}`;
}
/**
 * Carts: pushed apart — the two carts on the table with the spring between them, held by a thread that burns, a
 * ruler along the table, the paths read; weighed — a cart hanging on the dynamometer from the stand.
 */
function cartsSvg(c: BenchView['carts']): string {
  if (!c) return '';
  const base = TABLE;
  if (c.mode === 'weigh') {
    const x = 470;
    const top = 40;
    const two = c.cart === 2;
    const hook = top + 3 + 80;
    const cart = `<path d="M${x},${hook} v18 M${x - 18},${hook + 34} L${x},${hook + 18} L${x + 18},${hook + 34}" style="fill:none;stroke:${THREAD};stroke-width:1.3"/>${cartSvg(x, hook + 60, two ? c.weights : 0, two ? '#5b8dd6' : '#d65b5b')}`;
    return `${standSvg(x - 110, x, top)}${dynamometerSvg(x, top + 3, false, c.read?.[0] ?? '')}${cart}`;
  }
  const x1 = CARTS_X - 30 - c.x1 * CARTS_K;
  const x2 = CARTS_X + 30 + c.x2 * CARTS_K;
  const together = c.x1 === 0 && c.x2 === 0;
  // The spring: squeezed between the carts until they part; then each keeps a little of it.
  const spring = together ? `<path d="M${x1 + 25},${base - 17} ${Array.from({ length: 6 }, (_, i) => `l1.7,${i % 2 ? 6 : -6}`).join(' ')}" style="fill:none;stroke:#8d949c;stroke-width:1.6"/>` : '';
  const thread = together && (c.flame ?? 0) < 1 ? `<path d="M${x1 + 20},${base - 22} H${x2 - 20}" style="stroke:${THREAD};stroke-width:1"/>` : '';
  const flame = c.flame !== undefined && c.flame > 0 && c.flame < 1 ? `<path d="M${CARTS_X},${base - 24} q-5,-8 0,-18 q5,10 0,18 Z" style="fill:#ffb347;opacity:${1 - c.flame}"/>` : '';
  // The ruler lies along the table behind the carts; red marks where they stood.
  const ruler = rulerSvg(CARTS_X - 150, base - 22, 60, false, 5);
  const marks = `<path d="M${CARTS_X - 30},${base - 24} v-8 M${CARTS_X + 30},${base - 24} v-8" style="stroke:#c0392b;stroke-width:2"/>`;
  const read = c.read ? `<text class="bench-reading" x="${x1}" y="${base - 60}" text-anchor="middle">${c.read[0]}</text><text class="bench-reading" x="${x2}" y="${base - 60 - 9 * c.weights}" text-anchor="middle">${c.read[1]}</text>` : '';
  const slow = c.slow && c.moving ? `<text class="bench-label" x="${CARTS_X}" y="${base - 110}" text-anchor="middle">${c.slow}</text>` : '';
  return `${ruler}${marks}${cartSvg(x1, base, 0, '#d65b5b')}${cartSvg(x2, base, c.weights, '#5b8dd6')}${spring}${thread}${flame}${read}${slow}`;
}

/**
 * Contact and non-contact forces, one scene a case: the paper clip on its thread leaning to the magnet (across air,
 * or through a card); bits of paper jumping up to the rubbed comb; the block hung just clear of the table, drawn
 * aside without friction; the weight let go, falling. `k` — how far it has played.
 */
function touchSvg(t: BenchView['touch']): string {
  if (!t) return '';
  const k = t.k;
  // (Above the block and its pull; elsewhere low on the right.)
  const read = t.read ? `<text class="bench-reading" x="590" y="${t.case === 'lifted' ? TABLE - 70 : TABLE - 16}" text-anchor="end">${t.read}</text>` : '';
  if (t.case === 'magnet' || t.case === 'card') {
    const top = { x: 420, y: 90 };
    const len = 130;
    const a = (22 * k * Math.PI) / 180;
    const cx = top.x + len * Math.sin(a);
    const cy = top.y + len * Math.cos(a);
    const clip = `<path d="M${cx - 4},${cy} v14 a4,4 0 0 0 8,0 v-12 a3,3 0 0 0 -6,0 v10" style="fill:none;stroke:#b8c0c8;stroke-width:2"/>`;
    const magnet = `<rect x="${cx + 24 + (1 - k) * 60}" y="${cy - 4}" width="30" height="22" style="fill:#c0392b"/><rect x="${cx + 54 + (1 - k) * 60}" y="${cy - 4}" width="30" height="22" style="fill:#2e6db4"/><text x="${cx + 39 + (1 - k) * 60}" y="${cy + 11}" text-anchor="middle" style="font:700 10px system-ui;fill:#fff">N</text><text x="${cx + 69 + (1 - k) * 60}" y="${cy + 11}" text-anchor="middle" style="font:700 10px system-ui;fill:#fff">S</text>`;
    const card = t.case === 'card' ? `<rect x="${cx + 14 + (1 - k) * 60}" y="${cy - 40}" width="5" height="80" style="fill:#d8c39a;stroke:#9a7a4a"/>` : '';
    return `${standSvg(top.x - 100, top.x, top.y)}<path d="M${top.x},${top.y} L${cx},${cy}" style="stroke:${THREAD};stroke-width:1.4"/>${clip}${card}${magnet}${read}`;
  }
  if (t.case === 'comb') {
    const combY = TABLE - 70 - (1 - k) * 60;
    const comb = `<rect x="370" y="${combY - 12}" width="120" height="8" rx="2" style="fill:#2b3a4a"/>${Array.from({ length: 20 }, (_, i) => `<path d="M${373 + i * 6},${combY - 4} v10" style="stroke:#2b3a4a;stroke-width:2"/>`).join('')}`;
    const bits = Array.from({ length: 9 }, (_, i) => {
      const x = 380 + i * 12;
      const up = k > 0.5 && i % 3 !== 2 ? Math.min(1, (k - 0.5) * 2.5) : 0;
      const y = TABLE - 4 - up * (TABLE - 4 - (combY + 8));
      return `<rect x="${x - 1}" y="${y - 5}" width="9" height="6" transform="rotate(${(i * 37) % 60 - 30} ${x + 3} ${y - 2})" style="fill:#f4f1e8;stroke:#b9b2a0;stroke-width:0.6"/>`;
    }).join('');
    return `${comb}${bits}${read}`;
  }
  if (t.case === 'lifted') {
    const top = { x: 400, y: 70 };
    const bx = top.x + 50 * k;
    const blockTop = TABLE - 6 - 40;
    const thread = `<path d="M${top.x},${top.y} L${bx},${blockTop}" style="stroke:${THREAD};stroke-width:1.4"/>`;
    const block = `<rect x="${bx - 30}" y="${blockTop}" width="60" height="40" rx="2" style="fill:#c8794a;stroke:#7a4a1f"/>`;
    const gap = `<path d="M${bx - 40},${TABLE - 1} h80" style="stroke:#ffd166;stroke-width:1;stroke-dasharray:3 3"/>`;
    const pull = `<path d="M${bx + 30},${blockTop + 20} h${30 + 10 * k}" style="stroke:${THREAD};stroke-width:1.4"/><path class="bench-arrow" d="M${bx + 66},${blockTop + 6} h26 l-5,-4 m5,4 l-5,4"/>`;
    return `${standSvg(top.x - 100, top.x, top.y)}${thread}${block}${gap}${pull}${read}`;
  }
  // The weight, let go from the hand, falls to the table (the way grows as t²).
  const y0 = 90;
  const y = y0 + (TABLE - 6 - 30 - y0) * k * k;
  const weight = weightsSvg(430, y, 3);
  const arrow = `<path class="bench-mark" d="M470,${y + 6} v34 m-4,-6 l4,6 l4,-6" style="fill:none"/><text class="bench-label" x="478" y="${y + 30}">F</text>`;
  return `${weight}${arrow}${read}`;
}

/** The coin on the card: 12 units to the centimetre; the glass's axis. */
const COIN_K = 1200;
const COIN_X = 400;
/**
 * Inertia: a glass on the table (10 cm tall, 6.5 cm across the mouth), the postcard over it and the coin on the card
 * above the mouth — side on. The card goes off to the right; the coin rides with it, or stays and drops in, or hits
 * the rim and falls beside.
 */
function coinSvg(c: BenchView['coin']): string {
  if (!c) return '';
  const k = COIN_K;
  const mouth = TABLE - 0.1 * k;
  const half = 0.0325 * k;
  const glass = `<path d="M${COIN_X - half - 3},${mouth} L${COIN_X - half + 4},${TABLE - 2} H${COIN_X + half - 4} L${COIN_X + half + 3},${mouth}" style="fill:rgba(200,225,245,0.25);stroke:#bfe3ff;stroke-width:3"/><path d="M${COIN_X - half + 6},${TABLE - 6} H${COIN_X + half - 6}" style="stroke:#bfe3ff;stroke-width:4"/>`;
  const cardY = mouth - 3;
  const cardX = COIN_X - 0.075 * k + c.card * k;
  const card = c.card < 0.2 ? `<rect x="${cardX}" y="${cardY}" width="${0.15 * k}" height="3" style="fill:#f4f1e8;stroke:#c9c2a8"/>` : '';
  // The coin: 2.6 cm across, 2 mm thick (drawn 4), its centre where it is.
  const cx = COIN_X + c.x * k;
  const cy = cardY - 2 + c.drop * k;
  const coin = `<g transform="rotate(${c.tilt} ${cx} ${cy})"><rect x="${cx - 0.013 * k}" y="${cy - 2}" width="${0.026 * k}" height="4" rx="1.5" style="fill:#d9b44a;stroke:#8a6a1f"/></g>`;
  const slow = c.slow ? `<text class="bench-label" x="${COIN_X}" y="${mouth - 70}" text-anchor="middle">${c.slow}</text>` : '';
  const read = c.read ? `<text class="bench-reading" x="${COIN_X}" y="${mouth - 40}" text-anchor="middle">${c.read}</text>` : '';
  return `${glass}${card}${coin}${slow}${read}`;
}

/** The snail's drawing: the ruler's millimetres, units (the snail and its way some 3½ times larger than life). */
const SNAIL_K = 3.6;
/**
 * A snail crawling beside a ruler: on a plastic sheet lying on the table (dry, or wet with drops), on sandpaper, or
 * up the sheet stood upright. A chalk mark where it started; its shell and body drawn larger than life.
 */
function snailSvg(sn: BenchView['snail']): string {
  if (!sn) return '';
  const wall = sn.surface === 'wall';
  const len = 70;
  // Along the sheet: lying, from left to right on the table; upright, from the bottom up.
  const x0 = wall ? 470 : 330;
  const y0 = wall ? TABLE - 30 : TABLE - 46;
  const along = (d: number) => (wall ? { x: x0, y: y0 - d } : { x: x0 + d, y: y0 });
  const sheet = sn.surface === 'sandpaper' ? '#b58a55' : 'rgba(225,235,245,0.85)';
  const plate = wall
    ? `<rect x="${x0 - 40}" y="${y0 - len * SNAIL_K - 30}" width="60" height="${len * SNAIL_K + 40}" style="fill:${sheet};stroke:#8fa3b8"/><rect x="${x0 - 70}" y="${TABLE - 8}" width="120" height="8" rx="2" style="fill:${DARK}"/>`
    : `<rect x="${x0 - 30}" y="${y0 - 8}" width="${len * SNAIL_K + 60}" height="16" style="fill:${sheet};stroke:#8fa3b8"/>`;
  const grit = sn.surface === 'sandpaper' ? Array.from({ length: 60 }, (_, i) => `<circle cx="${x0 - 26 + ((i * 37) % (len * SNAIL_K + 52))}" cy="${y0 - 6 + ((i * 7) % 12)}" r="0.9" style="fill:#7a5a33"/>`).join('') : '';
  const drops = sn.surface === 'wet' ? Array.from({ length: 9 }, (_, i) => `<ellipse cx="${x0 - 10 + i * 30}" cy="${y0 - 2 + (i % 2) * 4}" rx="5" ry="2" style="fill:rgba(130,190,240,0.7)"/>`).join('') : '';
  // The ruler beside the way, in millimetres.
  const ruler = wall
    ? `<rect x="${x0 + 24}" y="${y0 - len * SNAIL_K - 6}" width="18" height="${len * SNAIL_K + 12}" rx="2" style="fill:#f1e7c8;stroke:#a88a4a"/>${Array.from({ length: len + 1 }, (_, mm) => `<path d="M${x0 + 24},${y0 - mm * SNAIL_K} h${mm % 10 === 0 ? 8 : mm % 5 === 0 ? 6 : 3}" style="stroke:#3a3f46;stroke-width:0.8"/>${mm % 10 === 0 ? `<text x="${x0 + 34}" y="${y0 - mm * SNAIL_K + 3}" style="font:600 7px system-ui;fill:#3a3f46">${mm / 10}</text>` : ''}`).join('')}`
    : `<rect x="${x0 - 6}" y="${y0 + 12}" width="${len * SNAIL_K + 12}" height="18" rx="2" style="fill:#f1e7c8;stroke:#a88a4a"/>${Array.from({ length: len + 1 }, (_, mm) => `<path d="M${x0 + mm * SNAIL_K},${y0 + 12} v${mm % 10 === 0 ? 8 : mm % 5 === 0 ? 6 : 3}" style="stroke:#3a3f46;stroke-width:0.8"/>${mm % 10 === 0 ? `<text x="${x0 + mm * SNAIL_K}" y="${y0 + 28}" text-anchor="middle" style="font:600 7px system-ui;fill:#3a3f46">${mm / 10}</text>` : ''}`).join('')}`;
  const p = along(sn.at * 1000 * SNAIL_K);
  const start = along(0);
  const mark = wall ? `<path d="M${start.x - 22},${start.y} h18" style="stroke:#c0392b;stroke-width:2"/>` : `<path d="M${start.x},${start.y - 12} v8" style="stroke:#c0392b;stroke-width:2"/>`;
  // The snail: its body along the way (the head forward), the shell on its back.
  const rot = wall ? -90 : 0;
  const body = `<g transform="translate(${p.x},${p.y}) rotate(${rot})"><path d="M-30,6 Q-10,-2 6,2 Q14,3 16,-6 l3,-8 m-6,8 l-1,-9 M16,-6 Q20,4 6,7 Z" style="fill:#c9a27a;stroke:#8a6a46;stroke-width:1.2"/><circle cx="-12" cy="-8" r="13" style="fill:#a8743c;stroke:#6e4a22;stroke-width:1.5"/><path d="M-12,-8 m-8,0 a8,8 0 1 1 8,8 a5,5 0 1 1 -5,-5" style="fill:none;stroke:#6e4a22;stroke-width:1.2"/></g>`;
  const trail = wall ? `<path d="M${start.x},${start.y} V${p.y}" style="stroke:rgba(255,255,255,0.5);stroke-width:4"/>` : `<path d="M${start.x},${start.y + 4} H${p.x}" style="stroke:rgba(255,255,255,0.5);stroke-width:4"/>`;
  const read = sn.read ? `<text class="bench-reading" x="${wall ? x0 - 50 : (start.x + p.x) / 2}" y="${wall ? (start.y + p.y) / 2 : y0 - 40}" text-anchor="${wall ? 'end' : 'middle'}">l = ${sn.read}</text>` : '';
  return `${plate}${grit}${drops}${ruler}${trail}${mark}${body}${read}`;
}

/**
 * A stroboscopic photo propped on the table: dark, with the table's edge or the sloping groove, the ball's images
 * one per flash, a millimetre ruler along them and, measured, the gaps over brackets. A photo is drawn to fill the
 * print (the table's 216 mm smaller, the groove's 59 mm larger), its ruler drawn to the same scale.
 */
function strobeSvg(st: BenchView['strobe']): string {
  if (!st) return '';
  const left = 300;
  const right = 610;
  const top = 110;
  const bottom = TABLE - 14;
  const span = Math.max(1, st.at.at(-1) ?? 1);
  const k = (right - left - 50) / span;
  const groove = st.photo === 'groove';
  // The track: the table's edge, or the groove sloping down to the right as in lab work 1 (raised 10 cm over 1.2 m:
  // the ruler along the images is all but along it).
  const x0 = left + 24;
  const y0 = bottom - 80;
  const slope = groove ? 0.1 / 1.2 : 0;
  const P = (mm: number) => ({ x: x0 + mm * k, y: y0 + mm * k * slope });
  const end = P(Math.min(span + 12, (right - 8 - x0) / k));
  const print = `<rect x="${left}" y="${top}" width="${right - left}" height="${bottom - top}" rx="3" style="fill:#14181d;stroke:#e9e4d4;stroke-width:5"/><text class="bench-label" x="${right - 10}" y="${bottom - 8}" text-anchor="end" style="fill:#e9e4d4">1 : 5</text>`;
  const track = `<path d="M${x0 - 12},${y0 + 7 - 12 * slope} L${end.x},${end.y + 7}" style="stroke:#6b6f75;stroke-width:3"/>`;
  const r = groove ? 9 : 6;
  const imgs = st.at.map((mm, i) => {
    const o = Math.max(0, Math.min(1, st.shown - i));
    if (o <= 0) return '';
    const p = P(mm);
    return `<circle cx="${p.x}" cy="${p.y}" r="${r}" style="fill:rgba(240,240,232,${0.25 + 0.6 * o});stroke:rgba(255,255,255,${o})"/>`;
  }).join('');
  // A flash: the print lights up for a moment as each image is taken.
  const flash = st.shown < st.at.length && st.shown % 1 > 0 && st.shown % 1 < 0.3 ? `<rect x="${left}" y="${top}" width="${right - left}" height="${bottom - top}" style="fill:rgba(255,255,255,${0.35 * (1 - (st.shown % 1) / 0.3)})"/>` : '';
  // The ruler along the images, and the gaps measured.
  const ry = P(span).y + 26;
  const ticks = Array.from({ length: Math.floor(span) + 1 }, (_, mm) => (k * mm >= 3 || mm % 5 === 0 ? `<path d="M${x0 + mm * k},${ry} v${mm % 10 === 0 ? 7 : mm % 5 === 0 ? 5 : 3}" style="stroke:#3a3f46"/>` : '')).join('');
  const ruler = st.gaps ? `<rect x="${x0 - 6}" y="${ry - 2}" width="${span * k + 12}" height="16" rx="2" style="fill:#f1e7c8;stroke:#a88a4a"/>${ticks}` : '';
  const gaps = st.gaps
    ? st.at.slice(1).map((mm, i) => {
        const a = P(st.at[i]!);
        const b = P(mm);
        const yb = Math.min(a.y, b.y) - r - 10;
        return `<path d="M${a.x},${yb + 4} V${yb} H${b.x} V${yb + 4}" style="fill:none;stroke:#ffd166;stroke-width:1.3"/><text class="bench-reading" x="${(a.x + b.x) / 2}" y="${yb - 4}" text-anchor="middle" style="font-size:10px">${st.gaps![i]}</text>`;
      }).join('')
    : '';
  return `${print}${track}${imgs}${flash}${ruler}${gaps}`;
}

/** The yard: the first and the second mark (6 m apart), units of the drawing. */
const WIND_MARKS = [340, 560] as const;
/**
 * The wind's speed: a yard drawn on the table — two stakes 6 m apart with the tape measure between them (the
 * stopwatch between them), a flag on a pole that flies the more the stronger the wind (hanging at force 1, out at force 3), and the soap bubble carried
 * from the first stake to the second.
 */
function windSvg(w: BenchView['wind']): string {
  if (!w) return '';
  const ground = TABLE - 6;
  const [a, b] = WIND_MARKS;
  const per = (b - a) / 6;
  const stake = (x: number, label: string) => `<path d="M${x},${ground} V${ground - 46}" style="stroke:#8a5a2b;stroke-width:4"/><text class="bench-label" x="${x}" y="${ground - 52}" text-anchor="middle">${label}</text>`;
  const tape = `<path d="M${a},${ground - 3} H${b}" style="stroke:#f2c94c;stroke-width:4"/>${Array.from({ length: 7 }, (_, i) => `<path d="M${a + i * per},${ground - 7} v8" style="stroke:${DARK};stroke-width:1"/>`).join('')}`;
  // The flag: its droop from the pole, by the wind (down at force 1, out at force 3).
  const pole = 592;
  const top = ground - 180;
  const droop = Math.max(8, 75 - 15 * w.speed) * (Math.PI / 180);
  const fx = 50 * Math.cos(droop);
  const fy = 50 * Math.sin(droop);
  const flag = `<path d="M${pole},${ground} V${top}" style="stroke:${STEEL};stroke-width:3"/><path d="M${pole},${top} L${pole + fx * 0.8},${top + fy * 0.8} L${pole + fx * 0.8 - 14 * Math.sin(droop)},${top + fy * 0.8 + 26 * Math.cos(droop) - 4} L${pole},${top + 26} Z" style="fill:#e05a47;stroke:#8e2b20"/>`;
  const by = ground - 96;
  const bubble = w.at === undefined ? '' : `<circle cx="${a + w.at * per}" cy="${by + 6 * Math.sin(w.at * 1.7)}" r="11" style="fill:rgba(190,230,255,0.35);stroke:#bfe3ff;stroke-width:1.5"/><path d="M${a + w.at * per - 5},${by + 6 * Math.sin(w.at * 1.7) - 5} a6,6 0 0 1 6,-3" style="fill:none;stroke:#fff;stroke-width:1.5"/>`;
  const read = w.read ? `<text class="bench-reading" x="${b}" y="${by - 22}" text-anchor="middle">v ≈ ${w.read}</text>` : '';
  const arrow = `<path class="bench-arrow" d="M${a + 40},${top + 10} h${30 + 12 * w.speed} m-6,-4 l6,4 l-6,4"/>`;
  return `${tape}${stake(a, '0')}${stake(b, '6 м')}${flag}${arrow}${bubble}${read}`;
}

/** The windlass's drawing: its axis, and the load's way down the ruler (6 units to the centimetre, as the other rulers). */
const WINCH_AXIS = { x: 520, y: 64 };
/**
 * A windlass: a stand with the axis at the arm's end, the spool on it (drawn some 2½ times larger than life) with a
 * red mark and a handle that turn together; the thread from the spool's right edge down to the load; a ruler beside
 * it from the spool's level down. The reading by the load.
 */
function winchSvg(w: BenchView['winch']): string {
  if (!w) return '';
  const { x, y } = WINCH_AXIS;
  const r = w.d * 1000 * 1.1 + 2;
  const top = y + 24;
  const loadY = top + w.drop * 100 * CM;
  const a = w.turned * 2 * Math.PI;
  const stand = standSvg(x - 90, x, y);
  const ruler = rulerSvg(x + r + 26, top, 35, true);
  const thread = `<path d="M${x + r},${y} V${loadY}" style="stroke:${THREAD};stroke-width:1.6"/>`;
  const load = `${weightsSvg(x + r, loadY, 2, 20, 9)}<path d="M${x + r - 30},${loadY} h26" style="stroke:#c0392b;stroke-width:1.5"/>`;
  const spool = w.spool === 'pencil'
    ? `<circle cx="${x}" cy="${y}" r="${r}" style="fill:#f2c94c;stroke:#9a7a1f;stroke-width:1.5"/><circle cx="${x}" cy="${y}" r="${r * 0.35}" style="fill:#3a3f46"/>`
    : `<circle cx="${x}" cy="${y}" r="${r + 5}" style="fill:#d9b27c;stroke:${WOOD_EDGE};stroke-width:1.5"/><circle cx="${x}" cy="${y}" r="${r}" style="fill:#f1efe4;stroke:#c9c2a8"/><circle cx="${x}" cy="${y}" r="3" style="fill:${DARK}"/>`;
  // The mark and the handle turn with the spool (letting the load down turns it clockwise).
  const mark = `<path d="M${x},${y} L${x + r * Math.sin(a)},${y - r * Math.cos(a)}" style="stroke:#c0392b;stroke-width:2.5"/>`;
  const hx = x - 34 * Math.sin(a + Math.PI / 3);
  const hy = y + 34 * Math.cos(a + Math.PI / 3);
  const handle = `<path d="M${x},${y} L${hx},${hy}" style="stroke:${STEEL};stroke-width:4;stroke-linecap:round"/><circle cx="${hx}" cy="${hy}" r="5" style="fill:#7a4a1f"/>`;
  const read = w.read ? `<text class="bench-reading" x="${x + r - 34}" y="${loadY + 14}" text-anchor="end">${w.read}</text>` : '';
  return `${stand}${ruler}${thread}${load}${handle}${spool}${mark}${read}`;
}

/** Where the carried bottle starts (its axis), units of the drawing; the drawing's scale is the bottle's: 8 to the centimetre. */
const CARRY_X0 = 360;
/**
 * The relativity of motion: a sheet of paper fixed to the table behind the bottle, a ruler on the table in front;
 * the bottle (sinkSvg's, moved along) with its bubble. On the paper: a dot where the bubble passed the zero mark,
 * a chalk-red line from it to where the bubble is now — its path relative to the table — and, in the bottle, the
 * bubble's own way straight up. An arrow shows the bottle's motion.
 */
function carrySvg(s: BenchView['sink'], c: BenchView['carry']): string {
  const k = 800;
  const bottom = TABLE - 8;
  const zero = bottom - 30;
  const dx = (c?.shift ?? 0) * k;
  const paper = `<rect x="${CARRY_X0 - 50}" y="${bottom - 190}" width="220" height="180" style="fill:#f4f1e8;stroke:#c9c2a8;opacity:0.92"/>`;
  const ruler = rulerSvg(CARRY_X0 - 20, TABLE + 6, 20, false, 8);
  const at = s?.at;
  const on = at !== undefined && at >= 0 && s?.turn === undefined;
  const start = on ? `<circle cx="${CARRY_X0}" cy="${zero}" r="3" style="fill:#c0392b"/>` : '';
  const trail = on ? `<path d="M${CARRY_X0},${zero} L${CARRY_X0 + dx},${zero - at * k}" style="stroke:#c0392b;stroke-width:2;stroke-dasharray:5 3"/>` : '';
  const end = on && c?.path ? `<circle cx="${CARRY_X0 + dx}" cy="${zero - at * k}" r="3" style="fill:#c0392b"/><text class="bench-reading" x="${CARRY_X0 + dx / 2 - 8}" y="${zero - (at * k) / 2 + 16}" text-anchor="end" style="fill:#8e2b20">s = ${c.path}</text>` : '';
  // The bubble's own way, in the bottle: straight up from the zero mark.
  const own = on ? `<path d="M${CARRY_X0 + dx - 14},${zero} V${zero - at * k}" style="stroke:#2d6a9f;stroke-width:1.6"/>${c?.rise ? `<text class="bench-reading" x="${CARRY_X0 + dx - 10}" y="${zero - (at * k) / 2 + 4}" style="fill:#1f4f7a">${c.rise}</text>` : ''}` : '';
  const arrow = c && c.speed > 0 ? `<path class="bench-arrow" d="M${CARRY_X0 + dx - 20},${bottom - 212} h40 m-6,-4 l6,4 l-6,4"/><text class="bench-label" x="${CARRY_X0 + dx}" y="${bottom - 220}" text-anchor="middle">u</text>` : '';
  return `${paper}${ruler}${start}${trail}<g transform="translate(${CARRY_X0 - 400 + dx},0)">${sinkSvg(s)}</g>${own}${end}${arrow}`;
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

/** The bounce's drawing: a metre above the plate is this many units. */
const BOUNCE_K = 280;
const BOUNCE_LOOK: Readonly<Record<string, { fill: string; edge: string }>> = {
  pingpong: { fill: '#f7f6ef', edge: '#a9a89c' },
  tennis: { fill: '#d4e157', edge: '#8a9a1c' },
  clay: { fill: '#e0603f', edge: '#8e2b20' },
};
/**
 * A ball's bounce: a steel plate on the table, a metre stick beside it (a tick every 5 cm, a number every 10), the
 * ball (drawn larger than life) squashed at the impact; a chalk mark at each top it reached, the last one read.
 * On the board to the right, three chalk bars: the potential and kinetic energy and what went into heat and sound —
 * together always the energy it was let go with.
 */
function bounceSvg(b: BenchView['bounce']): string {
  if (!b) return '';
  const plate = TABLE - 6;
  const bx = 455;
  const sx = 500;
  const Y = (h: number) => plate - h * BOUNCE_K;
  const look = BOUNCE_LOOK[b.ball] ?? BOUNCE_LOOK['pingpong']!;
  const r = Math.max(8, b.size * BOUNCE_K * 0.8);
  const stick = `<rect x="${sx}" y="${Y(1) - 6}" width="16" height="${plate - Y(1) + 6}" style="fill:#e8c98f;stroke:${WOOD_EDGE}"/>${Array.from({ length: 21 }, (_, i) => `<path d="M${sx},${Y(i / 20)} h${i % 2 === 0 ? 8 : 4}" style="stroke:${DARK};stroke-width:1"/>${i % 2 === 0 ? `<text class="lever-mark" x="${sx + 15}" y="${Y(i / 20) + 3}" text-anchor="end" style="font-size:7px">${i * 5}</text>` : ''}`).join('')}`;
  const base = `<rect x="${bx - 34}" y="${plate}" width="68" height="6" rx="1" style="fill:#9aa3ab;stroke:${STEEL}"/>${stick}`;
  const marks = b.marks.map((h, i) => `<path d="M${bx - 16},${Y(h)} H${sx}" style="stroke:#f1efe4;stroke-width:1.5;stroke-dasharray:3 3;opacity:${i === b.marks.length - 1 ? 0.95 : 0.4}"/>`).join('');
  const read = b.read && b.marks.length ? `<text class="bench-reading" x="${bx - 22}" y="${Y(b.marks.at(-1)!) - 6}" text-anchor="end">h = ${b.read}</text>` : '';
  // Squashed: wider and lower, resting on the plate.
  const rx = r * (1 + 0.5 * b.squash);
  const ry = r * (1 - 0.55 * b.squash);
  const cy = Y(b.y) - ry;
  const seam = b.ball === 'tennis' ? `<path d="M${bx - rx * 0.8},${cy - ry * 0.4} q${rx * 0.8},${ry * 0.9} ${rx * 1.6},0" style="fill:none;stroke:#f4f6e0;stroke-width:1.6"/>` : '';
  const ball = `<ellipse cx="${bx}" cy="${cy}" rx="${rx}" ry="${ry}" style="fill:${look.fill};stroke:${look.edge};stroke-width:1.2"/>${seam}`;
  // The energy bars: shares of the start's energy.
  const ep = Math.max(0, Math.min(b.y, b.mech));
  const bars = [ep, Math.max(0, b.mech - ep), 1 - b.mech];
  const colours = ['#7fb8e6', '#f5c04a', '#f08a6c'];
  const H = 170;
  const foot = 292;
  const bar = bars.map((v, i) => {
    const x = 540 + i * 26;
    return `<rect x="${x}" y="${foot - H}" width="18" height="${H}" style="fill:none;stroke:#f1efe4;stroke-width:1;opacity:0.35"/><rect x="${x}" y="${foot - H * v}" width="18" height="${H * v}" style="fill:${colours[i]}"/><text class="bench-label" x="${x + 9}" y="${foot + 13}" text-anchor="middle" style="fill:#f1efe4;font-size:9px">${b.labels[i]}</text>`;
  }).join('');
  return `${base}${marks}${ball}${read}${bar}`;
}

/**
 * Weight in a lift: a shaft with its floors, the cabin on its cable; under its ceiling a dynamometer with four
 * weights, its hook coming out as the spring stretches (10 units to the newton). Arrows by the shaft: the cabin's
 * velocity (v) and acceleration (a). Let go, the dynamometer and its weights fall to the cabin's floor.
 */
function liftSvg(l: BenchView['lift']): string {
  const phase = l?.phase ?? 'rest';
  const left = 430;
  const right = 550;
  const x = (left + right) / 2;
  const trip = 150;
  const floor = TABLE - 4 - (l?.y ?? 0) * trip;
  // Tall enough for the dynamometer stretched by the heaviest reading and its four weights.
  const roof = floor - 175;
  const shaft = `<rect x="${left - 8}" y="-40" width="${right - left + 16}" height="${TABLE + 40}" style="fill:rgba(20,26,34,0.35)"/><path d="M${left - 6},-40 V${TABLE} M${right + 6},-40 V${TABLE}" style="stroke:${STEEL};stroke-width:3"/>${[0, 1].map((k) => `<path d="M${left - 30},${TABLE - 4 - k * trip} h22" style="stroke:${THREAD};stroke-width:2"/><text class="bench-label" x="${left - 34}" y="${TABLE - 8 - k * trip}" text-anchor="end">${k ? '5' : '1'}</text>`).join('')}`;
  const cable = `<path d="M${x},-40 V${roof}" style="stroke:${DARK};stroke-width:2.5"/>`;
  const cabin = `<rect x="${left}" y="${roof}" width="${right - left}" height="${floor - roof}" rx="3" style="fill:#d9dee4;stroke:#7d8791;stroke-width:2"/><rect x="${left + 6}" y="${roof + 6}" width="${right - left - 12}" height="${floor - roof - 12}" style="fill:#eef1f4"/>`;
  // The dynamometer: from the ceiling's hook, or let go and falling with its weights.
  const F = l?.force ?? 0;
  const drop = (l?.fall ?? 0) * (floor - 6 - (roof + 8 + 64 + 40));
  const top = roof + 8 + drop;
  const p = top + 8 + F * 10;
  const tip = top + 64 + F * 10;
  const ticks = Array.from({ length: 11 }, (_, i) => `<path d="M${x - 6},${top + 8 + i * 5} h${i % 2 === 0 ? 6 : 3}"/>`).join('');
  const dyn = `${l?.fall ? '' : `<path d="M${x},${roof + 6} V${top}" style="stroke:${DARK};stroke-width:1.5"/>`}<rect class="dyn-case" x="${x - 9}" y="${top}" width="18" height="64" rx="5"/><g class="dyn-ticks">${ticks}</g><path d="M${x},${p} V${tip}" style="stroke:${STEEL};stroke-width:2"/><path d="M${x - 7},${p} h14" style="stroke:#c0392b;stroke-width:2"/>${weightsSvg(x, tip + 2, 4)}`;
  // (Dark: the cabin's wall is light; coloured as the board's bar when it differs from the reading at rest.)
  const tone = l?.diff ? (l.diff.startsWith('+') ? '#2e8b46' : '#c0502e') : '#1d2733';
  const read = l?.read ? `<text class="bench-reading" x="${x + 14}" y="${top + 30}" style="fill:${tone}">${l.read}</text>` : '';
  // The arrows: up is negative y.
  const up = phase === 'up-start' || phase === 'up' || phase === 'up-stop';
  const down = phase === 'down-start' || phase === 'down' || phase === 'down-stop';
  const accUp = phase === 'up-start' || phase === 'down-stop';
  const accDown = phase === 'up-stop' || phase === 'down-start' || phase === 'fall';
  const arrow = (ax: number, dir: -1 | 1, label: string, cls: string) => {
    const y0 = (roof + floor) / 2;
    return `<path class="${cls}" d="M${ax},${y0 - dir * 22} V${y0 + dir * 22} m-5,${-dir * 7} l5,${dir * 7} l5,${-dir * 7}" style="fill:none;stroke-width:2.5"/><text class="bench-label" x="${ax + 9}" y="${y0 + 4}">${label}</text>`;
  };
  const arrows = `${up || down ? arrow(right + 24, up ? -1 : 1, 'v', 'bench-arrow') : ''}${accUp || accDown ? arrow(right + 52, accUp ? -1 : 1, phase === 'fall' ? 'g' : 'a', 'bench-mark') : ''}`;
  return `${shaft}${cable}${cabin}${dyn}${read}${arrows}${liftZoom(l, x - 9, top + 32)}`;
}

/**
 * The dynamometer's scale enlarged, in chalk on the board by the shaft: 0 at the top as on the instrument, a dashed
 * mark at its reading at rest and a bar from it to the pointer — green when it shows more, red when less — so that
 * half a newton, five units on the instrument itself, is plain to see. A dashed line leads to the instrument.
 */
function liftZoom(l: BenchView['lift'], toX: number, toY: number): string {
  if (!l?.rest) return '';
  const x = 395;
  const y0 = -32;
  const per = 34;
  const at = (F: number) => y0 + Math.min(5.2, Math.max(0, F)) * per;
  const chalk = 'stroke:#f1efe4';
  const ticks = Array.from({ length: 11 }, (_, i) => `<path d="M${x - (i % 2 === 0 ? 10 : 5)},${y0 + i * per / 2} H${x}" style="${chalk};stroke-width:1.5"/>${i % 2 === 0 ? `<text class="bench-label" x="${x + 6}" y="${y0 + i * per / 2 + 4}" style="fill:#f1efe4">${i / 2}</text>` : ''}`).join('');
  const F = l.force;
  const more = F - l.rest > 0.02;
  const less = F - l.rest < -0.02;
  const colour = more ? '#8fd694' : '#f2a07b';
  const bar = more || less ? `<rect x="${x - 26}" y="${Math.min(at(F), at(l.rest))}" width="14" height="${Math.abs(at(F) - at(l.rest))}" style="fill:${colour}"/>` : '';
  const diff = l.diff ? `<text class="bench-reading" x="${x - 32}" y="${(at(F) + at(l.rest)) / 2 + 5}" text-anchor="end" style="fill:${colour}">${l.diff}</text>` : '';
  const rest = `<path d="M${x - 38},${at(l.rest)} H${x}" style="${chalk};stroke-width:1.5;stroke-dasharray:4 3"/>`;
  const pointer = `<path d="M${x - 14},${at(F)} H${x + 2}" style="stroke:#ff6b5b;stroke-width:3"/>`;
  const lead = `<path d="M${x + 22},${at(F)} L${toX},${toY}" style="${chalk};stroke-width:1;stroke-dasharray:2 4;opacity:0.6"/>`;
  return `<path d="M${x},${y0} V${y0 + 5 * per}" style="${chalk};stroke-width:2"/>${ticks}${bar}${rest}${pointer}${diff}${lead}`;
}
