import { beakerFor, type MandarinPart, mandarinParts, partName } from '../../../src/experiments/mandarin-float/bench.js';
import { tr } from '../../../src/knowledge/i18n.js';
import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { kitchenScaleSvg, labBalanceSvg } from '../../graphics/scene/kit.js';
import { Channel, type Motion } from '../../motion.js';
import { once } from '../../sounds/events.js';
import { defineScene, type SceneContext } from '../types.js';

/** Where it is: lying by the balance (before the first step), on the pan, peeled (the peel aside), in a beaker on the pan. */
type Stage = 'idle' | 'weigh' | 'peel' | 'dunk';

/**
 * The mandarin: what step it is at, which part is shown (whole, flesh, peel), its size and peel (m), the drawing's
 * scale (px to the metre, the same all through the run); the balance (lab or kitchen) and what its display shows —
 * nothing, the body's mass or what it shows with the body right under; the beaker's size (L) and its liquid (salty,
 * its density); whether the part floats and how much of it is under; where it is drawn now (`y`, its centre; `under`
 * — it is held right under), a rod or a thread on it, and what was read.
 */
export type MandarinView = {
  readonly stage: Stage;
  readonly part: MandarinPart;
  readonly D: number;
  readonly peel: number;
  readonly k: number;
  readonly lab: boolean;
  readonly display: string;
  readonly zero: string;
  readonly showsMass: string;
  readonly showsUnder: string;
  readonly size: number;
  readonly salty: boolean;
  readonly floats: boolean;
  readonly share: number;
  /** Where it is: above the beaker, resting (afloat or on the bottom), held right under, or halfway down on a thread. */
  readonly at: 'above' | 'rest' | 'under' | 'mid';
  /** Between two of those (0…1 to `to`), while it moves. */
  readonly to?: 'above' | 'rest' | 'under' | 'mid';
  readonly go?: number;
  readonly rod: boolean;
  readonly thread: boolean;
  readonly read?: string;
  readonly aside?: string;
};

const LOOK = { skin: '#f28c28', skinEdge: '#a85a12', flesh: '#f6b360', fleshLine: '#d9822b', pith: '#fff1d6' };
/** The balance under the beaker: x, and where its pan or plate takes the load. */
const BX = 420;
/** Where a thing lies on the table beside the balance (not under the board's chalk on the left). */
const ASIDE = 548;
const SEAT = { lab: 278, kitchen: 296 };
/**
 * The drawing's scale, px to the metre: the same as the balance's (its body, 120 px, is some 20 cm of a real one) —
 * smaller only when a big fruit's beaker would not fit (at most this wide, px).
 */
const PX_PER_M = 600;
const BEAKER_PX = 150;
/** A low-form beaker: 1.4 times as tall as wide (the catalogue's). */
const beakerWidth = (size: number) => Math.cbrt((4 * size) / 1000 / (Math.PI * 1.4));

function view({ last, command, plan, locale }: SceneContext): MandarinView {
  type Cmd = { step: Stage; part?: MandarinPart; diameter: number; peel: number; salt?: number };
  const c = command?.type === 'lab.mandarin' ? (command as unknown as Cmd) : undefined;
  const first = plan.find((s) => s.kind === 'bench' && s.command.type === 'lab.mandarin');
  const at = c ?? (first?.kind === 'bench' ? (first.command as unknown as Cmd) : { step: 'weigh' as Stage, diameter: 0.07, peel: 0.004 });
  const D = at.diameter;
  const parts = mandarinParts(D, at.peel);
  const k = Math.min(PX_PER_M, BEAKER_PX / beakerWidth(beakerFor(parts.whole.volume).size));
  const recs = last && c ? readingsOf([last]).map((x) => x.record) : [];
  const r = recs[0];
  const g = (kg: number, d: number) => formatMeasured('mass', kg, d, locale);
  const base = { D, peel: at.peel, k, salty: false, floats: false, share: 1, at: 'rest' as const, rod: false, thread: false, size: 0 };
  if (!c || !r) {
    const zero = g(0, 1e-5);
    return { ...base, stage: 'idle', part: 'whole', lab: true, display: zero, zero, showsMass: zero, showsUnder: zero };
  }
  const d = r.inputs?.['division'] ?? 1e-5;
  const lab = r.instrument === 'lab-balance';
  if (c.step === 'weigh' || c.step === 'peel') {
    const m = g(r.value ?? 0, d);
    const peelRec = recs[1];
    const aside = c.step === 'peel' && peelRec ? `${tr(partName('peel'), locale)}: ${g(peelRec.value ?? 0, peelRec.inputs?.['division'] ?? d)}` : undefined;
    return { ...base, stage: c.step, part: c.step === 'peel' ? 'flesh' : 'whole', lab, display: m, zero: g(0, d), showsMass: m, showsUnder: m, ...(aside ? { aside } : {}) };
  }
  const part = c.part ?? 'whole';
  const floats = r.inputs?.['floats'] === 1;
  const mass = g(r.inputs?.['mass'] ?? 0, d);
  const under = g(r.value ?? 0, d);
  const V = (r.value ?? 0) / (r.inputs?.['liquid'] ?? 1000);
  const read = `Δm = ${under} → V ≈ ${formatMeasured('volume', V, 1e-6, locale)}`;
  return {
    ...base,
    stage: 'dunk',
    part,
    lab,
    zero: g(0, d),
    display: mass,
    showsMass: mass,
    showsUnder: under,
    size: r.inputs?.['beaker'] ?? 0.6,
    salty: (c.salt ?? 0) > 0,
    floats,
    share: r.inputs?.['share'] ?? 1,
    read,
  };
}

/** How deep a ball of radius R sits for `share` of its volume under (h from its bottom), px. */
function depthOf(share: number, R: number): number {
  let lo = 0;
  let hi = 2 * R;
  for (let i = 0; i < 40; i++) {
    const h = (lo + hi) / 2;
    if ((h * h * (3 * R - h)) / (4 * R ** 3) < share) lo = h;
    else hi = h;
  }
  return (lo + hi) / 2;
}

/** The beaker and the body in it: where things are, px. */
function geometry(v: MandarinView) {
  const seat = v.lab ? SEAT.lab : SEAT.kitchen;
  const Db = beakerWidth(v.size);
  const w = Db * v.k;
  const h = 1.4 * w;
  const bottom = seat - 3;
  const area = (Math.PI * Db * Db) / 4;
  const parts = mandarinParts(v.D, v.peel);
  const V = parts[v.part].volume;
  // The body's own height: a ball (whole, flesh), or the peel as a bowl as wide as the mandarin.
  // (The peel, a bowl in pieces, is drawn as wide as fits its smaller beaker.)
  const R = v.part === 'flesh' ? (v.D / 2 - v.peel) * v.k : v.part === 'peel' ? Math.min((v.D / 2) * v.k, 0.42 * w) : (v.D / 2) * v.k;
  const tall = v.part === 'peel' ? R : 2 * R;
  const level = (sub: number) => bottom - ((v.size / 2000 + sub) / area) * v.k;
  // Its top (y) at each place, and how much of it is under there (m³).
  const rest = v.floats ? (() => {
    const s = v.share;
    const surface = level(s * V);
    const under = v.part === 'peel' ? s * tall : depthOf(s, R);
    return { top: surface + under - tall, sub: s * V };
  })() : { top: bottom - tall, sub: V };
  const places = {
    above: { top: bottom - h - tall - 24, sub: 0 },
    rest,
    under: { top: level(V) + 3, sub: V },
    mid: { top: Math.min(bottom - tall - 4, (level(V) + 3 + bottom - tall) / 2), sub: V },
  };
  return { seat, w, h, bottom, R, tall, level, places };
}

/** A mandarin (or its flesh, or its peel as a bowl) with its top at y. */
function bodySvg(part: MandarinPart, x: number, top: number, R: number, peelPx: number): string {
  const cy = top + R;
  if (part === 'whole')
    return `<circle cx="${x}" cy="${cy}" r="${R}" style="fill:${LOOK.skin};stroke:${LOOK.skinEdge};stroke-width:1.5"/>${[[-0.35, -0.3], [0.25, -0.45], [0.4, 0.15], [-0.15, 0.35], [-0.5, 0.1]].map(([a, b]) => `<circle cx="${x + a! * R}" cy="${cy + b! * R}" r="${Math.max(0.8, R * 0.04)}" style="fill:${LOOK.skinEdge};opacity:0.45"/>`).join('')}<path d="M${x},${top + 1} q${R * 0.12},${-R * 0.18} ${R * 0.3},${-R * 0.12}" style="fill:none;stroke:#4f7a2a;stroke-width:${Math.max(1.5, R * 0.08)}"/>`;
  if (part === 'flesh') {
    const lines = Array.from({ length: 5 }, (_, i) => {
      const a = (i / 5) * Math.PI - Math.PI / 2;
      return `<path d="M${x},${cy - R} Q${x + Math.sin(a) * R * 1.1},${cy} ${x},${cy + R}" style="fill:none;stroke:${LOOK.fleshLine};stroke-width:1"/>`;
    }).join('');
    return `<circle cx="${x}" cy="${cy}" r="${R}" style="fill:${LOOK.flesh};stroke:${LOOK.fleshLine};stroke-width:1.2"/>${lines}`;
  }
  // The peel: a bowl, orange outside, its white spongy inside.
  const r = Math.max(1, R - Math.max(2, peelPx));
  return `<path d="M${x - R},${top} A${R},${R} 0 0 0 ${x + R},${top} H${x + r} A${r},${r} 0 0 1 ${x - r},${top} Z" style="fill:${LOOK.pith};stroke:${LOOK.skinEdge};stroke-width:1.2"/><path d="M${x - R},${top} A${R},${R} 0 0 0 ${x + R},${top}" style="fill:none;stroke:${LOOK.skin};stroke-width:${Math.max(2, Math.min(peelPx, R * 0.25))}"/>`;
}

function svg(v: MandarinView): string {
  const balance = v.lab ? labBalanceSvg(BX, 286, v.display) : kitchenScaleSvg(BX, 300, v.display);
  const seat = v.lab ? SEAT.lab : SEAT.kitchen;
  const R = (v.D / 2) * v.k;
  const peelPx = v.peel * v.k;
  if (v.stage === 'idle') return `${balance}${bodySvg('whole', ASIDE, TABLE - 2 * R, R, peelPx)}`;
  if (v.stage === 'weigh') return `${balance}${bodySvg('whole', BX, seat - 2 * R, R, peelPx)}`;
  if (v.stage === 'peel') {
    const r = R - peelPx;
    const aside = v.aside ? `<text class="bench-reading" x="596" y="40" text-anchor="end">${v.aside}</text>` : '';
    return `${balance}${bodySvg('flesh', BX, seat - 2 * r, r, peelPx)}${bodySvg('peel', ASIDE, TABLE - R, R, peelPx)}${aside}`;
  }
  const g = geometry(v);
  const from = g.places[v.at];
  const to = g.places[v.to ?? v.at];
  const u = v.go ?? 0;
  const top = from.top + (to.top - from.top) * u;
  const sub = from.sub + (to.sub - from.sub) * u;
  const x0 = BX - g.w / 2;
  const surface = g.level(sub);
  const liquid = v.salty ? 'rgba(200,215,235,0.6)' : 'rgba(120,170,230,0.5)';
  const water = `<rect x="${x0 + 2}" y="${surface}" width="${g.w - 4}" height="${g.bottom - surface}" style="fill:${liquid}"/>`;
  const glass = `<path d="M${x0},${g.bottom - g.h} V${g.bottom} H${x0 + g.w} V${g.bottom - g.h}" style="fill:none;stroke:#9fb4c4;stroke-width:2.5"/><path d="M${x0 + 2},${g.bottom + 1.5} H${x0 + g.w - 2}" style="stroke:#9fb4c4;stroke-width:3"/>`;
  const body = bodySvg(v.part, BX, top, g.R, peelPx);
  // A thin rod from above pressing on its top; or a thread it hangs on.
  const rod = v.rod ? `<path d="M${BX + 70},${g.bottom - g.h - 70} L${BX + 4},${top + 1}" style="stroke:#8a6a3c;stroke-width:3;stroke-linecap:round"/><circle cx="${BX + 2}" cy="${top + 1}" r="4" style="fill:none;stroke:#8a6a3c;stroke-width:2"/>` : '';
  const thread = v.thread ? `<path d="M${BX},${g.bottom - g.h - 70} V${top}" style="stroke:#efe9d6;stroke-width:1.2"/>` : '';
  const read = v.read ? `<text class="bench-reading" x="596" y="40" text-anchor="end">${v.read}</text>` : '';
  return `${balance}${body}${water}${glass}${rod}${thread}${read}`;
}

/**
 * The steps played: put on the pan; peeled (the peel lifted off and laid aside); lowered into the beaker — one that
 * floats settles, is pushed right under with the rod (the display shows the liquid pushed aside) and let up again;
 * one that sinks goes down on a thread, is held right under, then let go to the bottom.
 */
function motion(next: MandarinView, draw: (v: MandarinView) => void): Motion | null {
  if (next.stage === 'idle') return null;
  const T = next.stage === 'dunk' ? 5 : 1.4;
  const clock = new Channel(0, 1, { kind: 'steady', speed: 1 / T }, 1e-6);
  const { read: _r, aside: _a, ...rest } = next;
  void _r;
  void _a;
  const ease = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, x)));
  const span = (u: number, a: number, b: number) => ease((u - a) / (b - a));
  const g = next.stage === 'dunk' ? geometry(next) : null;
  const R = (next.D / 2) * next.k;
  const goesIn = once({ kind: 'into-liquid', size: Math.min(2.5, Math.max(0.6, R / 25)) });
  const lands = once({ kind: 'lands' });
  return {
    channels: [clock],
    frame: (done) => {
      if (done) return draw(next);
      const u = clock.value;
      if (next.stage === 'weigh') {
        lands(u > 0.6);
        return draw({ ...rest, display: u > 0.6 ? next.display : next.zero });
      }
      if (next.stage === 'peel') return draw({ ...rest, display: u > 0.7 ? next.display : next.zero });
      // Into the beaker.
      const surfaceTop = g!.level(0);
      const enter = (top: number) => goesIn(top + g!.tall > surfaceTop);
      if (next.floats) {
        if (u < 0.3) {
          const go = span(u, 0, 0.3);
          enter(g!.places.above.top + (g!.places.rest.top - g!.places.above.top) * go);
          return draw({ ...rest, at: 'above', to: 'rest', go, display: next.zero });
        }
        if (u < 0.4) return draw({ ...rest, at: 'rest', display: next.showsMass });
        if (u < 0.65) return draw({ ...rest, at: 'rest', to: 'under', go: span(u, 0.4, 0.65), rod: true, display: u > 0.6 ? next.showsUnder : next.showsMass });
        if (u < 0.8) return draw({ ...rest, at: 'under', rod: true, display: next.showsUnder });
        return draw({ ...rest, at: 'under', to: 'rest', go: span(u, 0.8, 1), display: next.showsMass });
      }
      // It sinks: down on a thread, held under, let go.
      if (u < 0.35) {
        const go = span(u, 0, 0.35);
        enter(g!.places.above.top + (g!.places.mid.top - g!.places.above.top) * go);
        return draw({ ...rest, at: 'above', to: 'mid', go, thread: true, display: go > 0.9 ? next.showsUnder : next.zero });
      }
      if (u < 0.6) return draw({ ...rest, at: 'mid', thread: true, display: next.showsUnder });
      return draw({ ...rest, at: 'mid', to: 'rest', go: span(u, 0.6, 1) ** 1.5, display: u > 0.95 ? next.showsMass : next.showsUnder });
    },
  };
}

export const mandarinFloatScene = defineScene({ kind: 'mandarin', view, svg, motion });
