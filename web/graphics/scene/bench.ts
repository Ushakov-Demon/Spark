import { TABLE } from './constants.js';

/**
 * The mechanics bench of grade 7, drawn on the table instead of the vessel: a stand with a spring, slotted
 * weights and a ruler (Hooke's law); a wooden block pulled along a board by a dynamometer (friction); the
 * block with a ruler at the edge being measured (pressure). Sizes follow the real ones: 1 cm of the
 * apparatus is 6 units of the drawing.
 */
export interface BenchView {
  readonly kind: 'spring' | 'friction' | 'pressure' | 'balance';
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

/** The stand: a heavy base on the table, a rod, a clamp arm reaching to x. */
function standSvg(rodX: number, armX: number, armY: number): string {
  return `<rect x="${rodX - 40}" y="${TABLE - 8}" width="80" height="8" rx="2" style="fill:${DARK}"/><rect x="${rodX - 3}" y="${armY - 20}" width="6" height="${TABLE - 8 - armY + 20}" style="fill:${STEEL}"/><rect x="${rodX - 7}" y="${armY - 6}" width="14" height="12" rx="2" style="fill:${DARK}"/><rect x="${rodX}" y="${armY - 3}" width="${armX - rodX + 6}" height="6" rx="2" style="fill:${STEEL}"/>`;
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
