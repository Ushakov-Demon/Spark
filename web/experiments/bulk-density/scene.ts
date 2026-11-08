import { liquidDensity } from '../../../src/experiments/bulk-density/bench.js';
import type { BulkSubstance } from '../../../src/experiments/bulk-density/shared.js';
import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { labBalanceSvg } from '../../graphics/scene/kit.js';
import { Channel, type Motion } from '../../motion.js';
import { once } from '../../sounds/events.js';
import { defineScene, type SceneContext } from '../types.js';

/**
 * The grains in the measuring cylinder on the balance: the substance (its colour), where their top is (mL), how much
 * liquid has gone in between them (mL) and which; the second cylinder with the liquid (mL left in it); what the balance
 * shows; shaken (`jiggle` — the cylinder knocked about while it settles); what was read.
 */
export type BulkView = {
  readonly stage: 'idle' | 'pour' | 'fill' | 'shake';
  readonly substance: BulkSubstance;
  readonly level: number;
  readonly liquid: number;
  readonly oil: boolean;
  readonly source: number;
  /** As much liquid as fills the gaps to the grains' top, mL. */
  readonly full: number;
  readonly display: string;
  readonly zero: string;
  readonly jiggle: number;
  readonly read?: string;
};

const LOOK: Record<BulkSubstance, { fill: string; edge: string }> = {
  'sodium-chloride': { fill: '#f6f6f2', edge: '#b9b9b0' },
  sucrose: { fill: '#fbf3df', edge: '#c9b98f' },
  'sodium-bicarbonate': { fill: '#f9f9f9', edge: '#c4c4c4' },
  'calcium-carbonate': { fill: '#ecebe4', edge: '#b3b1a4' },
  'copper-sulfate': { fill: '#3f86d6', edge: '#1d4f8f' },
  iron: { fill: '#5b6168', edge: '#2e3238' },
};

function view({ last, command, plan, locale }: SceneContext): BulkView {
  type Cmd = { step: 'pour' | 'fill' | 'shake'; substance: BulkSubstance };
  const c = command?.type === 'lab.bulk' ? (command as unknown as Cmd) : undefined;
  const first = plan.find((s) => s.kind === 'bench' && s.command.type === 'lab.bulk');
  const substance = c?.substance ?? (first?.kind === 'bench' ? (first.command as unknown as Cmd).substance : 'sodium-chloride');
  const r = last && c ? readingsOf([last])[0]?.record : undefined;
  const g = (kg: number) => formatMeasured('mass', kg, 1e-5, locale);
  const base = { substance, level: 0, liquid: 0, full: 0, oil: false, source: 0, display: g(0), zero: g(0), jiggle: 0 } as const;
  if (!c || !r || r.value === null) return { ...base, stage: 'idle' };
  const inp = r.inputs ?? {};
  if (c.step === 'pour') return { ...base, stage: 'pour', level: 100, display: g(r.value), read: `m = ${g(r.value)}` };
  if (c.step === 'shake') return { ...base, stage: 'shake', level: r.value * 1e6, display: g(inp['mass'] ?? 0), read: `V = ${formatMeasured('volume', r.value, 1e-6, locale)}` };
  const oil = inp['oil'] === 1;
  const Vl = r.value;
  return { ...base, stage: 'fill', level: 100, liquid: Vl * 1e6, full: Vl * 1e6, oil, source: 100 - Vl * 1e6, display: g((inp['mass'] ?? 0) + Vl * liquidDensity(oil ? 'oil' : 'water')), read: `V_р = ${formatMeasured('volume', Vl, 1e-6, locale)}` };
}

/** The 100 mL cylinder drawn: 1.9 px to the mL up, 30 px wide inside. */
const PX_PER_ML = 1.9;
const W = 30;
const X = 400;
const SEAT = 280;

/** A measuring cylinder standing at (x, foot): its glass, its marks every 10 mL (a number every 20). */
function cylinderSvg(x: number, foot: number): string {
  const top = foot - 4 - 105 * PX_PER_ML;
  const marks = Array.from({ length: 11 }, (_, i) => {
    const y = foot - 4 - i * 10 * PX_PER_ML;
    return `<path d="M${x + W / 2 - 8},${y} h8" style="stroke:#d8e2ea;stroke-width:1"/>${i % 2 === 0 && i > 0 ? `<text class="bench-label" x="${x + W / 2 + 4}" y="${y + 4}" style="font-size:9px;fill:#d8e2ea">${i * 10}</text>` : ''}`;
  }).join('');
  return `<path d="M${x - W / 2},${top} V${foot - 4} H${x + W / 2} V${top}" style="fill:none;stroke:#9fb4c4;stroke-width:2"/><rect x="${x - W / 2 - 8}" y="${foot - 4}" width="${W + 16}" height="4" rx="1" style="fill:#9fb4c4"/>${marks}`;
}

/** Grains from the bottom up to `level` mL: a heap of little round crystals; `liquid` mL of a liquid gone in among them (`full` — as much as fills them to the top). */
function grainsSvg(x: number, foot: number, level: number, liquid: number, full: number, s: BulkSubstance, oil: boolean): string {
  const bottom = foot - 4;
  const top = bottom - level * PX_PER_ML;
  const look = LOOK[s];
  const body = level > 0 ? `<rect x="${x - W / 2 + 1}" y="${top}" width="${W - 2}" height="${bottom - top}" style="fill:${look.fill}"/>` : '';
  // The liquid among the grains: from the bottom up, as far as it has got (all of it — up to their top).
  const reach = full > 0 ? Math.min(level, (level * liquid) / full) : 0;
  const tint = liquid > 0 ? `<rect x="${x - W / 2 + 1}" y="${bottom - reach * PX_PER_ML}" width="${W - 2}" height="${reach * PX_PER_ML}" style="fill:${oil ? 'rgba(232,190,60,0.55)' : 'rgba(90,150,220,0.5)'}"/>` : '';
  const dots: string[] = [];
  for (let row = 0; row * 4 < level * PX_PER_ML - 2; row++)
    for (let col = 0; col < 7; col++) {
      const dx = x - W / 2 + 3 + col * 4 + (row % 2) * 2;
      const dy = bottom - 2 - row * 4;
      if (dx < x + W / 2 - 2) dots.push(`<circle cx="${dx}" cy="${dy}" r="1.5" style="fill:none;stroke:${look.edge};stroke-width:0.6"/>`);
    }
  return `${body}${tint}${dots.join('')}`;
}

function svg(v: BulkView): string {
  const jx = v.jiggle;
  const balance = labBalanceSvg(X, 286, v.display);
  const cyl = `<g transform="translate(${jx},${-Math.abs(jx) * 0.6})">${grainsSvg(X, SEAT, v.level, v.liquid, v.full, v.substance, v.oil)}${cylinderSvg(X, SEAT)}</g>`;
  // The second cylinder with the liquid, beside on the table (once the liquid is in play).
  const sx = 520;
  const src = v.stage === 'fill' ? `<rect x="${sx - W / 2 + 1}" y="${TABLE - 4 - v.source * PX_PER_ML}" width="${W - 2}" height="${v.source * PX_PER_ML}" style="fill:${v.oil ? 'rgba(232,190,60,0.75)' : 'rgba(90,150,220,0.6)'}"/>${cylinderSvg(sx, TABLE)}` : '';
  const read = v.read ? `<text class="bench-reading" x="596" y="40" text-anchor="end">${v.read}</text>` : '';
  return `${balance}${cyl}${src}${read}`;
}

/** Pouring the grains in (the display counting up); pouring the liquid in among them; knocking the cylinder till they settle. */
function motion(next: BulkView, draw: (v: BulkView) => void): Motion | null {
  if (next.stage === 'idle') return null;
  const T = next.stage === 'shake' ? 2.4 : 2.2;
  const clock = new Channel(0, 1, { kind: 'steady', speed: 1 / T }, 1e-6);
  const { read: _r, ...rest } = next;
  void _r;
  const knock = once({ kind: 'lands' });
  return {
    channels: [clock],
    frame: (done) => {
      if (done) return draw(next);
      const u = clock.value;
      if (next.stage === 'pour') return draw({ ...rest, level: 100 * u, display: u > 0.95 ? next.display : next.zero });
      if (next.stage === 'fill') return draw({ ...rest, liquid: next.liquid * u, source: 100 - next.liquid * u });
      // Poured to 100 mL, then knocked: it settles a little with each knock.
      const settle = Math.min(1, u / 0.85);
      knock(u > 0.1);
      return draw({ ...rest, level: 100 - (100 - next.level) * settle, jiggle: u < 0.85 ? 3 * Math.sin(u * 60) : 0 });
    },
  };
}

export const bulkDensityScene = defineScene({ kind: 'bulk', view, svg, motion });
