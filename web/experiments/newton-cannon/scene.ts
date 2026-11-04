import { earthR, mu, OUTCOME, type CannonCommand } from '../../../src/experiments/newton-cannon/bench.js';
import { kmText, speedText, timeText } from '../../../src/experiments/newton-cannon/words.js';
import { conic, radiusAt, reach } from '../../../src/domains/mechanics/orbit.js';
import { t } from '../../../src/knowledge/messages.js';
import { readingsOf } from '../../../src/scenarios/measuring.js';
import { Channel, type Motion } from '../../motion.js';
import { boom, splash, thud } from '../../sounds/index.js';
import { defineScene, type SceneContext } from '../types.js';

/**
 * The Earth seen from far off, a mountain on its top with a cannon (both much larger than life), and the paths of
 * the shots: the earlier ones faint, this one with the ball flying along it. The Earth and the paths to one scale —
 * the largest path of the run so far fitting the board; a path that leaves for good is drawn till it leaves the view.
 */
type Shot = { readonly v: number; readonly outcome: number; readonly end: number };
export type CannonView = {
  readonly h: number;
  readonly gamma: number;
  readonly shots: readonly Shot[];
  /** How far along its path the last shot's ball is (0…1). */
  readonly along: number;
  readonly read?: string;
  readonly labels: { readonly mountain: string; readonly speed: string };
};

type Cmd = CannonCommand;

/** The Earth's centre on the drawing, and the room around it. */
const CX = 445;
const TOP = 26;
const BOTTOM = 304;
const HALF_WIDTH = 150;
const MAX_R = 120;
/** …and not smaller than this, px: a very long orbit runs off the board instead. */
const MIN_R = 22;
/** The mountain and the cannon are drawn this tall, whatever their height. */
const MOUNTAIN = 16;

/** Where along its path the ball stops: the landing angle, one turn, or as far as it goes before leaving (escape). */
function endOf(outcome: number, angle: number, h: number, v: number, gamma: number): number {
  return outcome === OUTCOME.lands ? angle : outcome === OUTCOME.orbits ? 2 * Math.PI : reach(conic(mu(), earthR() + h, v, gamma));
}

function view({ log, last, command, locale }: SceneContext): CannonView {
  const done = readingsOf(log).filter((x) => x.command.type === 'lab.cannon');
  const mine = command?.type === 'lab.cannon' ? (command as unknown as Cmd) : undefined;
  const gamma = (((mine ?? (done[0]?.command as unknown as Cmd | undefined))?.angle ?? 0) * Math.PI) / 180;
  const r = mine && last ? readingsOf([last])[0]?.record : undefined;
  const h = mine?.h ?? (done[0] ? (done[0].command as unknown as Cmd).h : 200_000);
  // (The record's `angle` is the shot's angle to the horizon; how far round the Earth it came down is the landing's.)
  const shots = done.map((x) => {
    const c = x.command as unknown as Cmd;
    const o = x.record.inputs?.['outcome'] ?? 0;
    const land = o === OUTCOME.lands ? (x.record.exact ?? 0) / earthR() : 0;
    return { v: c.v, outcome: o, end: endOf(o, land, c.h, c.v, gamma) };
  });
  const read = r ? (r.inputs?.['outcome'] === OUTCOME.lands && r.value !== null ? kmText(r.value, locale) : r.inputs?.['outcome'] === OUTCOME.orbits && r.value !== null ? `T = ${timeText(r.value, locale)}` : '∞') : undefined;
  return { h, gamma, shots, along: 1, ...(read ? { read } : {}), labels: { mountain: t(locale, 'newton-cannon-scene-mountain'), speed: mine ? speedText(mine.v, locale) : '' } };
}

/**
 * The Earth as seen from space, Europe and Africa facing us: a lit ocean,
 * the continents in rough outline, ice at the poles, a few clouds, a thin blue air at the rim. Shapes in a unit circle.
 */
const LANDS: readonly (readonly [number, number])[][] = [
  // Europe, Ukraine at its east.
  [[-0.2, -0.32], [-0.12, -0.5], [0.02, -0.6], [0.18, -0.72], [0.36, -0.66], [0.5, -0.5], [0.48, -0.36], [0.34, -0.3], [0.22, -0.34], [0.1, -0.26], [-0.04, -0.24], [-0.14, -0.2]],
  // Scandinavia.
  [[0.02, -0.66], [0.1, -0.86], [0.24, -0.9], [0.22, -0.76], [0.12, -0.7]],
  // Africa.
  [[-0.22, -0.14], [0.04, -0.2], [0.3, -0.18], [0.46, -0.02], [0.44, 0.22], [0.3, 0.46], [0.2, 0.7], [0.08, 0.66], [0.02, 0.4], [-0.14, 0.22], [-0.3, 0.06]],
  // Arabia and the edge of Asia.
  [[0.52, -0.3], [0.8, -0.46], [0.96, -0.2], [0.9, 0.08], [0.7, 0.04], [0.56, -0.08]],
  // South America at the left rim.
  [[-0.96, 0.08], [-0.72, 0.12], [-0.64, 0.36], [-0.74, 0.62], [-0.9, 0.5]],
  // Greenland.
  [[-0.56, -0.74], [-0.32, -0.82], [-0.36, -0.62], [-0.5, -0.58]],
];
const CLOUDS: readonly (readonly [number, number, number])[] = [[-0.4, 0.3, 0.22], [0.1, 0.1, 0.18], [0.55, 0.45, 0.2], [-0.2, -0.55, 0.16], [0.65, -0.62, 0.14]];
/** The polar caps as drawn: an ellipse at each pole, [centre y, half-width, half-height] in the unit circle. */
const CAPS: readonly (readonly [number, number, number])[] = [[-1, 0.34, 0.07], [1, 0.4, 0.08]];
/** Is this point of the unit circle in the drawn sea (not in a continent's outline, nor on the ice)? */
function inSea(x: number, y: number): boolean {
  const inside = (pts: readonly (readonly [number, number])[]) => {
    let odd = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i]!;
      const [xj, yj] = pts[j]!;
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) odd = !odd;
    }
    return odd;
  };
  return !LANDS.some(inside) && !CAPS.some(([cy, rx, ry]) => (x / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1);
}
/** Where a ball that came down `th` round from the top hits the picture: a little inside the rim, where the land is drawn. */
const RIM = 0.97;

/** A closed outline through the points, rounded (each corner smoothed through the midpoints). */
function blob(pts: readonly (readonly [number, number])[], x: (u: number) => number, y: (u: number) => number): string {
  const mid = (a: readonly [number, number], b: readonly [number, number]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] as const;
  const n = pts.length;
  const m0 = mid(pts[n - 1]!, pts[0]!);
  let d = `M${x(m0[0]).toFixed(1)},${y(m0[1]).toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p = pts[i]!;
    const m = mid(p, pts[(i + 1) % n]!);
    d += ` Q${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)} ${x(m[0]).toFixed(1)},${y(m[1]).toFixed(1)}`;
  }
  return `${d} Z`;
}
function earthSvg(cx: number, cy: number, r: number): string {
  const x = (u: number) => cx + u * r;
  const y = (u: number) => cy + u * r;
  const lands = LANDS.map((p) => `<path d="${blob(p, x, y)}" style="fill:url(#nc-land)"/>`).join('');
  const caps = CAPS.map(([w, rx, ry]) => `<ellipse cx="${cx}" cy="${y(w)}" rx="${r * rx}" ry="${r * ry}" style="fill:#f3f7fa"/>`).join('');
  const clouds = CLOUDS.map(([u, w, s]) => `<ellipse cx="${x(u)}" cy="${y(w)}" rx="${s * r}" ry="${s * r * 0.32}" style="fill:rgba(255,255,255,0.55)"/>`).join('');
  return `<defs><radialGradient id="nc-sea" cx="0.36" cy="0.32" r="0.75"><stop offset="0" stop-color="#4f9de0"/><stop offset="0.7" stop-color="#1f5fa8"/><stop offset="1" stop-color="#0f2f5c"/></radialGradient><linearGradient id="nc-land" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6f9c4a"/><stop offset="0.55" stop-color="#8a9a4c"/><stop offset="1" stop-color="#b89a5a"/></linearGradient><radialGradient id="nc-shade" cx="0.35" cy="0.3" r="0.8"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.45"/></radialGradient><clipPath id="nc-globe"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath></defs>`
    + `<circle cx="${cx}" cy="${cy}" r="${r * 1.04}" style="fill:rgba(140,200,255,0.25)"/>`
    + `<g clip-path="url(#nc-globe)"><circle cx="${cx}" cy="${cy}" r="${r}" style="fill:url(#nc-sea)"/>${lands}${caps}${clouds}<circle cx="${cx}" cy="${cy}" r="${r}" style="fill:url(#nc-shade)"/></g>`
    + `<circle cx="${cx}" cy="${cy}" r="${r}" style="fill:none;stroke:rgba(170,215,255,0.7);stroke-width:1.2"/>`;
}

/** How far out a path is drawn: past this (in Earth radii) the ball is off in open space. */
const OPEN_SPACE = 40;

/** A path's points from the throw (the top) on, θ clockwise; r in metres; cut where it leaves for open space. */
function pathOf(h: number, v: number, end: number, gamma: number): { th: number; r: number }[] {
  const r0 = earthR() + h;
  if (v <= 0) return [{ th: 0, r: r0 }, { th: 0, r: earthR() }];
  const k = conic(mu(), r0, v, gamma);
  const n = Math.max(48, Math.ceil(end * 120));
  const out: { th: number; r: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const th = (end * i) / n;
    const r = radiusAt(k, th);
    if (!(r > 0) || r > OPEN_SPACE * earthR()) break;
    out.push({ th, r });
  }
  return out;
}

/** The angle the ball has reached after this share of its flight's time (Kepler's second law: equal areas, r² dθ, in equal times). */
function angleAt(h: number, v: number, end: number, share: number, gamma: number): number {
  if (share >= 1) return end;
  const pts = pathOf(h, v, end, gamma);
  if (pts.length < 2) return end * share;
  const area = [0];
  for (let i = 1; i < pts.length; i++) area.push(area[i - 1]! + ((pts[i]!.r ** 2 + pts[i - 1]!.r ** 2) / 2) * (pts[i]!.th - pts[i - 1]!.th));
  const want = share * area[area.length - 1]!;
  const i = Math.max(1, area.findIndex((a) => a >= want));
  const f = (want - area[i - 1]!) / (area[i]! - area[i - 1]! || 1);
  return pts[i - 1]!.th + f * (pts[i]!.th - pts[i - 1]!.th);
}

function svg(v: CannonView): string {
  const R = earthR();
  // The scale: the largest path so far (and the Earth with the mountain) within the room.
  let up = R + v.h;
  let down = R;
  let side = R + v.h;
  for (const s of v.shots) {
    if (s.outcome !== OUTCOME.orbits) continue;
    for (const q of pathOf(v.h, s.v, 2 * Math.PI, v.gamma)) {
      up = Math.max(up, q.r * Math.cos(q.th));
      down = Math.max(down, -q.r * Math.cos(q.th));
      side = Math.max(side, Math.abs(q.r * Math.sin(q.th)));
    }
  }
  const k = Math.max(MIN_R / R, Math.min(MAX_R / R, (BOTTOM - TOP - 2 * MOUNTAIN) / (up + down), (HALF_WIDTH - MOUNTAIN) / side));
  const cy = TOP + up * k + MOUNTAIN;
  // Heights up to the mountain's top are drawn stretched to the drawn mountain (else a path hugs the ground), above it to scale.
  const lift = Math.max(0, MOUNTAIN - v.h * k);
  const drawn = (r: number) => r * k + lift * Math.max(0, Math.min(1, v.h > 0 ? (r - R) / v.h : 0));
  const at = (th: number, r: number) => ({ x: CX + drawn(r) * Math.sin(th), y: cy - drawn(r) * Math.cos(th) });
  const earth = earthSvg(CX, cy, R * k);
  // The mountain and the cannon on the top, much larger than life.
  const topY = cy - R * k;
  const peak = cy - drawn(R + v.h);
  const mountain = `<path d="M${CX - 14},${topY + 2} L${CX},${peak} L${CX + 14},${topY + 2} Z" style="fill:#8a6a4a;stroke:#5e4630"/><rect x="${CX - 2}" y="${peak - 4}" width="12" height="4" rx="1.5" transform="rotate(${(-v.gamma * 180) / Math.PI} ${CX} ${peak - 2})" style="fill:#2b2f36"/>`;
  const paths = v.shots
    .map((s, i) => {
      const last = i === v.shots.length - 1;
      // (The ball flies wherever its path goes, off the board too: the path is marked free, the apparatus measured without it.)
      // The ball goes along its path as in time, not evenly by angle: fast near the Earth, slow far off (r² dθ ∝ dt).
      const pts = pathOf(v.h, s.v, last ? angleAt(v.h, s.v, s.end, v.along, v.gamma) : s.end, v.gamma).map((q) => at(q.th, q.r));
      const d = pts.map((q, j) => `${j ? 'L' : 'M'}${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ');
      const ball = last && pts.length ? `<circle cx="${pts[pts.length - 1]!.x}" cy="${pts[pts.length - 1]!.y}" r="4.5" style="fill:#ffd166;stroke:#3a2f12"/>` : '';
      return `<g data-free="1"><path d="${d}" style="fill:none;stroke:${last ? '#ffd166' : 'rgba(255,209,102,0.35)'};stroke-width:${last ? 2 : 1.4};stroke-dasharray:${last ? 'none' : '4 3'}"/>${ball}</g>`;
    })
    .join('');
  const note = `<text x="${CX + 18}" y="${peak - 6}" style="font:600 9px system-ui,sans-serif;fill:#e8e2cf">${v.labels.mountain}</text>`;
  const read = v.read ? `<text class="bench-reading" x="596" y="${BOTTOM}" text-anchor="end">${v.labels.speed} → ${v.read}</text>` : '';
  return `${earth}${paths}${mountain}${note}${read}`;
}

/** The ball flies its path: about three seconds — a «пуух» as it leaves, a «бульк» in the sea or a «тук» on land as it comes down. */
function motion(next: CannonView, draw: (v: CannonView) => void): Motion | null {
  if (!next.read) return null;
  const { read: _r, ...rest } = next;
  void _r;
  const clock = new Channel(0, 1, { kind: 'steady', speed: 1 / 3 }, 1e-6);
  const shot = next.shots[next.shots.length - 1];
  let fired = false;
  let fell = false;
  return {
    channels: [clock],
    frame: (done) => {
      if (!fired) {
        fired = true;
        boom();
      }
      if (done && !fell && shot?.outcome === OUTCOME.lands) {
        fell = true;
        if (inSea(RIM * Math.sin(shot.end), -RIM * Math.cos(shot.end))) splash();
        else thud();
      }
      if (done) draw(next);
      else draw({ ...rest, along: clock.value });
    },
  };
}

export const newtonCannonScene = defineScene({ kind: 'cannon', view, svg, motion });
