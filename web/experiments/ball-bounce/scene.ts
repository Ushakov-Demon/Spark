import { BOUNCE_BALLS, type BounceBall, bounceTops } from '../../../src/experiments/ball-bounce/bench.js';
import { readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { DARK, STEEL, WOOD_EDGE } from '../../graphics/scene/kit.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/** g for the bounce's timing, m/s². */
const BOUNCE_G = 9.81;
/** The bounce's drawing: a metre above the plate is this many units. */
const BOUNCE_K = 280;
const BOUNCE_LOOK: Readonly<Record<string, { fill: string; edge: string }>> = {
  pingpong: { fill: '#f7f6ef', edge: '#a9a89c' },
  tennis: { fill: '#d4e157', edge: '#8a9a1c' },
  clay: { fill: '#e0603f', edge: '#8e2b20' },
};
/** The ball is squashed within this much of the plate, m (drawn larger than life). */
const SQUASH_NEAR = 0.03;

/**
 * A ball's bounce: the ball, its diameter (m), its bottom's height (m, 1 — the drop height), how squashed it is
 * (0…1; plasticine stays flat), the mechanical energy left (a share of the start's); the tops marked so far; the
 * last top's reading; the energy bars' labels (potential, kinetic, heat and sound).
 */
export type BounceView = { readonly ball: string; readonly size: number; readonly y: number; readonly squash: number; readonly mech: number; readonly marks: readonly number[]; readonly read?: string; readonly labels: readonly [string, string, string] };

function view({ last, command, plan, locale }: SceneContext): BounceView {
  const r = last ? readingsOf([last])[0]?.record : undefined;
  type Drop = { ball: BounceBall; bounce: number };
  const bc = command?.type === 'lab.bounce' ? (command as unknown as Drop) : undefined;
  const next = plan.find((s) => s.kind === 'bench' && s.command.type === 'lab.bounce');
  const ball = bc?.ball ?? (next?.kind === 'bench' ? (next.command as unknown as Drop).ball : 'pingpong');
  const marks = bc ? bounceTops(bc.ball, bc.bounce).slice(1) : [];
  const end = marks.at(-1) ?? 1;
  const labels: [string, string, string] = locale === 'uk' ? ['Eп', 'Eк', 'тепло'] : ['Eп', 'Eк', 'heat'];
  return { ball, size: BOUNCE_BALLS[ball].size, y: end, squash: bc && end === 0 ? 1 : 0, mech: end, marks, labels, ...(bc && r ? { read: `${Math.round((r.value ?? 0) * 100)} ${locale === 'uk' ? 'см' : 'cm'}` } : {}) };
}

/**
 * A ball's bounce: a steel plate on the table, a metre stick beside it (a tick every 5 cm, a number every 10), the
 * ball (drawn larger than life) squashed at the impact; a chalk mark at each top it reached, the last one read.
 * On the board to the right, three chalk bars: the potential and kinetic energy and what went into heat and sound —
 * together always the energy it was let go with.
 */
function bounceSvg(b: BounceView): string {
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
 * A ball's bounce, played at under half the real speed: it falls from the metre (the way grows as t²), and after
 * each impact rises to the next top and falls again, squashed near the plate; at the last top it stops — as a
 * photo would catch it. Plasticine lands and flattens. The energy bars follow: the potential share is the height,
 * the rest of the mechanical energy is kinetic, and each impact moves a share into heat and sound.
 */
function bounce(next: BounceView, draw: (v: BounceView) => void): Motion {
  const b = next;
  const tops = [1, ...b.marks];
  const flat = tops.at(-1)! === 0;
  // The segments: falling from a top, rising to the next one; the time of each, √(2h/g).
  const legs: { from: number; to: number; time: number; mech: number; marks: number }[] = [];
  tops.forEach((h, j) => {
    if (j > 0 && h > 0) legs.push({ from: 0, to: h, time: Math.sqrt((2 * h) / BOUNCE_G), mech: h, marks: j - 1 });
    if (j < tops.length - 1) legs.push({ from: h, to: 0, time: Math.sqrt((2 * h) / BOUNCE_G), mech: j === 0 ? 1 : h, marks: j });
  });
  const FLATTEN = 0.15;
  const total = legs.reduce((a, x) => a + x.time, 0) + (flat ? FLATTEN : 0);
  const clock = new Channel(0, total, { kind: 'steady', speed: 0.4 }, 1e-4);
  return {
    channels: [clock],
    frame: (done) => {
      if (done) return draw(next);
      let t = clock.value;
      const { read: _r, ...rest } = b;
      for (const leg of legs) {
        if (t <= leg.time) {
          const k = t / leg.time;
          // Falling: the way grows as t²; rising: the way left shrinks as the time left squared.
          const y = leg.to === 0 ? leg.from * (1 - k * k) : leg.to * (1 - (1 - k) ** 2);
          const squash = flat ? 0 : Math.max(0, 1 - y / SQUASH_NEAR) * 0.6;
          return draw({ ...rest, y, squash, mech: leg.mech, marks: b.marks.slice(0, leg.marks) });
        }
        t -= leg.time;
      }
      // Plasticine on the plate: it flattens, and all its energy is heat now.
      draw({ ...rest, y: 0, squash: Math.min(1, t / FLATTEN), mech: 0, marks: [] });
    },
  };
}

export const ballBounceScene = defineScene({ kind: 'bounce', view, svg: bounceSvg, motion: (next, draw) => (next.read ? bounce(next, draw) : null) });
