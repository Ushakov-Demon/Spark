import { forceDivision, heightText, massText } from '../../../src/experiments/pulley/bench.js';
import { lengthText } from '../../../src/experiments/pulley/words.js';
import { G } from '../../../src/domains/mechanics/constants.js';
import { weight } from '../../../src/domains/mechanics/formulas.js';
import { SCALES } from '../../../src/equipment/scales.js';
import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { dynamometerSvg, forceGaugeSvg, standSvg, weightsSvg } from '../../graphics/scene/kit.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/**
 * How the load is lifted, how far up it is (0…1 of its lift), the dynamometer's reading, the rope's travel; the
 * instrument that measured the force (the lab dynamometer, it read finer, or a force gauge — by the force) and the
 * load as it is (weights, or a crate with its mass); the height it goes up, in words.
 */
export type PulleyView = {
  readonly how: 'straight' | 'fixed' | 'movable';
  readonly up: number;
  readonly force?: string;
  readonly rope?: string;
  readonly meter: 'lab' | 'fine' | 'gauge';
  readonly load: { readonly weights: number } | { readonly crate: string } | { readonly small: string };
  readonly height?: string;
};

/** The drawing goes up 50 px whatever the height: the real one is in the words. */
const LIFT = 50;
const ARM = 70;
const BASE = TABLE - 40;

type Cmd = { readonly how: PulleyView['how']; readonly mass: number; readonly lift: number };

/** The instrument the force calls for (as the model reads it): the lab dynamometer, read finer, or a gauge beyond it. */
const meterFor = (F: number): PulleyView['meter'] => (F > SCALES.dynamometer.spec.capacity.value ? 'gauge' : forceDivision(F) < SCALES.dynamometer.spec.resolution.value ? 'fine' : 'lab');
/** The load: under 50 g — a small weight with its mass; under a kilogram — 100 g weights (one to four drawn); heavier — a crate. */
const loadFor = (mass: number, uk: boolean): PulleyView['load'] => (mass < 0.05 ? { small: massText(mass, uk) } : mass < 1 ? { weights: Math.max(1, Math.min(4, Math.round(mass / 0.1))) } : { crate: massText(mass, uk) });

function view({ last, command, plan, locale }: SceneContext): PulleyView {
  const uk = locale === 'uk';
  const pc = command?.type === 'lab.pulley' ? (command as unknown as Cmd) : undefined;
  const next = plan.find((s) => s.kind === 'bench' && s.command.type === 'lab.pulley');
  const c = pc ?? (next?.kind === 'bench' ? (next.command as unknown as Cmd) : undefined);
  const mass = c?.mass ?? 0.3;
  const base = { load: loadFor(mass, uk), height: `h = ${heightText(c?.lift ?? 0.1, uk)}` };
  if (!pc || !last) return { how: c?.how ?? 'straight', up: 0, meter: meterFor(weight(mass, G)), ...base };
  const recs = readingsOf([last]).map((x) => x.record);
  const F = recs.find((r) => r.inputs?.['which'] === 1);
  const s = recs.find((r) => r.inputs?.['which'] === 2);
  const f = F?.value ?? 0;
  return { how: pc.how, up: 1, meter: meterFor(f), force: formatMeasured('force', f, forceDivision(f), locale), rope: `s = ${lengthText(s?.value ?? 0, locale)}`, ...base };
}

/** A pulley wheel at (x, y). */
const wheel = (x: number, y: number) => `<circle cx="${x}" cy="${y}" r="13" style="fill:#d7dde3;stroke:#3a3f46;stroke-width:2"/><circle cx="${x}" cy="${y}" r="3" style="fill:#3a3f46"/>`;
const rope = (d: string) => `<path d="${d}" style="fill:none;stroke:#efe9d6;stroke-width:2"/>`;

function svg(v: PulleyView): string {
  const rise = v.up * LIFT;
  // (On the movable pulley the rope is tied to the arm's end, the instrument free beside it.)
  const stand = standSvg(260, v.how === 'movable' ? 410 : 470, ARM);
  const top = BASE - 30 - rise;
  // The load: weights hanging from their hook, or a crate with its mass (one size whatever the mass: it is in the label).
  const load = (x: number) => {
    if ('weights' in v.load) {
      const t = top + (3 - v.load.weights) * 10;
      return `${weightsSvg(x, t, v.load.weights, 28, 10)}<path d="M${x},${t} V${top - 8}" style="stroke:#3a3f46;stroke-width:2"/>`;
    }
    if ('small' in v.load) return `<rect x="${x - 6}" y="${top + 18}" width="12" height="12" rx="2" style="fill:#c9a227;stroke:#7a6533"/><path d="M${x},${top + 18} V${top - 8}" style="stroke:#3a3f46;stroke-width:2"/><text class="bench-reading" x="${x + 12}" y="${top + 28}">${v.load.small}</text>`;
    return `<rect x="${x - 22}" y="${top}" width="44" height="30" rx="2" style="fill:#9a6b33;stroke:#5e3f1a;stroke-width:1.5"/><path d="M${x - 22},${top + 10} h44 M${x - 22},${top + 20} h44" style="stroke:#5e3f1a;stroke-width:0.8"/><text class="bench-reading" x="${x}" y="${top + 19}" text-anchor="middle">${v.load.crate}</text><path d="M${x},${top} V${top - 8}" style="stroke:#3a3f46;stroke-width:2"/>`;
  };
  // The instrument the force called for, hanging from (x, y), 80 px long.
  const meter = (x: number, y: number) => (v.meter === 'gauge' ? forceGaugeSvg(x, y, v.force ?? '') : dynamometerSvg(x, y, false, v.force ?? ''));
  const reading = `<text class="bench-reading" x="560" y="${ARM + 12}">${v.height ?? ''}</text>${v.force ? `<text class="bench-reading" x="560" y="${ARM + 30}">F = ${v.force}</text><text class="bench-reading" x="560" y="${ARM + 48}">${v.rope}</text>` : ''}`;
  if (v.how === 'straight') {
    // The instrument straight above the load, the hand pulling it up.
    const x = 420;
    const y = top - 8 - 80 - 20;
    return `${stand}${load(x)}${rope(`M${x},${top - 8} V${y + 80}`)}${meter(x, y)}${reading}`;
  }
  if (v.how === 'fixed') {
    // Over the pulley on the arm: the load on the left goes up, the instrument on the right comes down as far.
    const px = 440;
    const py = ARM + 14;
    const lx = px - 13;
    const dx = px + 13;
    const y = 170 + rise;
    return `${stand}${wheel(px, py)}${rope(`M${lx},${top - 8} V${py} A13,13 0 0 1 ${dx},${py} V${y}`)}${load(lx)}${meter(dx, y)}${reading}`;
  }
  // The movable pulley on the load: the rope from the arm down round it and up to the instrument — which goes twice as far.
  const cx = 420;
  const wy = top - 24;
  const left = cx - 13;
  const right = cx + 13;
  const y = 120 - 2 * rise;
  return `${stand}${rope(`M${left},${ARM + 6} V${wy} A13,13 0 0 0 ${right},${wy} V${y + 80}`)}${wheel(cx, wy)}<path d="M${cx},${wy + 13} V${top - 8}" style="stroke:#3a3f46;stroke-width:2"/>${load(cx)}${meter(right, y)}${reading}`;
}

/** The load goes up (about 1.5 s) — and the instrument with it, as far as the rope says. */
function motion(next: PulleyView, draw: (v: PulleyView) => void): Motion | null {
  if (!next.force) return null;
  const clock = new Channel(0, 1, { kind: 'steady', speed: 1 / 1.5 }, 1e-6);
  const { force: _f, rope: _r, ...still } = next;
  void _f, void _r;
  return { channels: [clock], frame: (done) => draw(done ? next : { ...still, up: clock.value }) };
}

export const pulleyScene = defineScene({ kind: 'pulley', view, svg, motion });
