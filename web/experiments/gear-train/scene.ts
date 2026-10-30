import { readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/**
 * The gears: three apart with their teeth counted, or a train meshing on the board; how far the driver has turned (in
 * turns) and the last gear's counted turns.
 */
export type GearView = { readonly train: readonly number[]; readonly counted: boolean; readonly turned: number; readonly read?: string };

/** A gear's pitch radius, px: 1.6 px a tooth (so meshing gears touch). */
const R = (z: number) => 1.6 * z;
const Y = TABLE - 110;
const COLORS: Record<number, string> = { 8: '#e0a030', 24: '#5b8cd6', 40: '#6aa86a' };

function view({ last, command, locale }: SceneContext): GearView {
  const gc = command?.type === 'lab.gears' ? (command as unknown as { step: string; train?: number[]; turns?: number }) : undefined;
  if (!gc || gc.step === 'count') return { train: [8, 24, 40], counted: !!gc, turned: 0 };
  const r = last ? readingsOf([last])[0]?.record : undefined;
  const n2 = r?.value ?? 0;
  const uk = locale === 'uk';
  return { train: gc.train ?? [24, 8], counted: true, turned: gc.turns ?? 1, read: `n₁ = ${String(gc.turns ?? 1).replace('.', uk ? ',' : '.')}, n₂ = ${String(n2).replace('.', uk ? ',' : '.')}` };
}

/** A gear: its teeth (a ring of them), a hub, a chalk mark to count its turns by; turned by `angle` (radians). */
function gearSvg(x: number, y: number, z: number, angle: number, label?: string): string {
  const r = R(z);
  const pts: string[] = [];
  for (let k = 0; k < z * 4; k++) {
    const a = angle + (k / (z * 4)) * 2 * Math.PI;
    const rr = k % 4 < 2 ? r + 3 : r - 3;
    pts.push(`${(x + rr * Math.cos(a)).toFixed(1)},${(y + rr * Math.sin(a)).toFixed(1)}`);
  }
  const mark = `<circle cx="${(x + r * 0.62 * Math.cos(angle)).toFixed(1)}" cy="${(y + r * 0.62 * Math.sin(angle)).toFixed(1)}" r="${Math.max(2.5, r * 0.12)}" style="fill:#ffffff;stroke:#c0392b;stroke-width:1.5"/>`;
  return `<polygon points="${pts.join(' ')}" style="fill:${COLORS[z] ?? '#999'};stroke:#2b2f36;stroke-width:1"/><circle cx="${x}" cy="${y}" r="${Math.max(3, r * 0.18)}" style="fill:#d7dde3;stroke:#2b2f36"/>${mark}${label ? `<text class="bench-reading" x="${x}" y="${y + r + 18}" text-anchor="middle">${label}</text>` : ''}`;
}

function svg(v: GearView): string {
  const board = `<rect x="250" y="${Y - 80}" width="360" height="160" rx="6" style="fill:#d8a86a;stroke:#9a6b33;opacity:0.85"/>`;
  if (v.turned === 0 && v.train.length === 3 && !v.read) {
    // The three gears apart, their teeth counted.
    let x = 285;
    return board + v.train.map((z) => { const r = R(z); x += r; const g = gearSvg(x, Y, z, 0, v.counted ? `z = ${z}` : undefined); x += r + 30; return g; }).join('');
  }
  // A train: each gear touching the next; the driver turned by `turned` turns, each next one the other way, by the teeth.
  const total = v.train.reduce((a, z) => a + 2 * R(z), 0);
  let x = 440 - total / 2;
  // (The whole angle, not its rest after full turns: the next gears follow it smoothly.)
  let angle = v.turned * 2 * Math.PI;
  const out: string[] = [];
  v.train.forEach((z, k) => {
    const r = R(z);
    x += r;
    // (Half a tooth's turn so the teeth go in between each other.)
    const phase = k === 0 ? 0 : Math.PI + Math.PI / z;
    out.push(gearSvg(x, Y, z, angle + phase, `${z}`));
    if (k === 0) out.push(`<path d="M${x},${Y} L${x + r * 0.62 * Math.cos(angle)},${Y + r * 0.62 * Math.sin(angle)}" style="stroke:#3d3d3d;stroke-width:3"/>`);
    const next = v.train[k + 1];
    if (next) angle = (-angle * z) / next;
    x += r;
  });
  const read = v.read ? `<text class="bench-reading" x="440" y="${Y - 90}" text-anchor="middle">${v.read}</text>` : '';
  return board + out.join('') + read;
}

/** The handle turned: the driver turns its turns (about a second and a half a turn, at most 4 s), the rest with it. */
function motion(next: GearView, draw: (v: GearView) => void): Motion | null {
  if (!next.read) return null;
  const T = Math.min(4, 1.5 * next.turned);
  const clock = new Channel(0, 1, { kind: 'steady', speed: 1 / T }, 1e-6);
  return {
    channels: [clock],
    frame: (done) => {
      if (done) return draw(next);
      const { read: _r, ...rest } = next;
      void _r;
      draw({ ...rest, turned: next.turned * clock.value });
    },
  };
}

export const gearTrainScene = defineScene({ kind: 'gears', view, svg, motion });
