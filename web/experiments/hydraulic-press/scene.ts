import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { weightsSvg } from '../../graphics/scene/kit.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/**
 * The syringe machine: water or air in it, the weights on the wide piston, the dynamometer's reading on the narrow one;
 * how far the narrow piston went in (m) of its push (m), how far it goes before the load stirs (m), how far the load
 * rises (m); what the ruler read.
 */
export type PressView = { readonly medium: 'water' | 'air'; readonly weights: number; readonly pull?: string; readonly pushed: number; readonly push: number; readonly dead: number; readonly rise: number; readonly read?: readonly string[] };

/** 1000 px to the metre for both pistons (the narrow one's 6 cm — 60 px): their travels compare as they are. */
const K = 1000;

type Cmd = { readonly type: string; readonly step: string; readonly weights?: number; readonly medium?: 'water' | 'air' };

function view({ last, command, plan, locale }: SceneContext): PressView {
  const len = (v: number | null | undefined) => formatMeasured('length', v ?? 0, 0.001, locale);
  const mm = (v: number | null | undefined) => `${Math.round((v ?? 0) * 1000)} ${locale === 'uk' ? 'мм' : 'mm'}`;
  const pc = command?.type === 'lab.press' || command?.type === 'lab.pneumatic' ? (command as unknown as Cmd) : undefined;
  const next = plan.find((s) => s.kind === 'bench' && (s.command.type === 'lab.press' || s.command.type === 'lab.pneumatic') && 'weights' in s.command);
  const weights = pc?.weights ?? (next?.kind === 'bench' ? ((next.command as { weights?: number }).weights ?? 0) : 0);
  const recs = last && pc ? readingsOf([last]).map((x) => x.record) : [];
  const still = { medium: 'water' as const, weights, pushed: 0, push: 0, dead: 0, rise: 0 };
  if (!pc) return still;
  if (pc.step === 'diameters') return { ...still, read: [`d₁ = ${len(recs[0]?.value)}, d₂ = ${len(recs[1]?.value)}`] };
  if (pc.step === 'lift') return { ...still, pull: formatMeasured('force', recs[0]?.value ?? 0, 0.1, locale) };
  if (pc.type === 'lab.press') {
    const push = recs[0]?.inputs?.['push'] ?? 0.06;
    return { ...still, pushed: push, push, rise: recs[0]?.value ?? 0, read: [`l₂ = ${len(recs[0]?.value)}`] };
  }
  const dead = recs.find((r) => r.inputs?.['which'] === 4);
  const rise = recs.find((r) => r.inputs?.['which'] === 3);
  const push = dead?.inputs?.['push'] ?? 0.06;
  return { medium: pc.medium ?? 'air', weights, pushed: push, push, dead: dead?.value ?? 0, rise: rise?.value ?? 0, read: [`x₀ = ${mm(dead?.value)}`, `l₂ = ${mm(rise?.value)}`] };
}

/**
 * Two syringes standing on the table, their nozzles joined by a tube under them: the narrow one (left) pushed by the
 * dynamometer or a hand's arrow, the wide one (right) with weights on its plunger. Water is blue; air — pale, dotted.
 * The wide plunger stands while the narrow one only squeezes what is inside, then rises.
 */
function pressSvg(p: PressView): string {
  const y0 = TABLE - 30;
  const water = p.medium === 'water';
  const fill = water ? '#7fb3e0' : 'rgba(235,242,250,0.55)';
  const dots = (x: number, w: number, top: number) => (water ? '' : Array.from({ length: Math.max(0, Math.floor((y0 - top) / 9)) }, (_, i) => `<circle cx="${x - w / 4 + (i % 2) * (w / 2)}" cy="${y0 - 5 - i * 9}" r="1.3" style="fill:#8fb8dd"/>`).join(''));
  const syringe = (x: number, w: number, plunger: number) =>
    `<rect x="${x - w / 2}" y="${y0 - 130}" width="${w}" height="130" rx="3" style="fill:rgba(220,235,250,0.4);stroke:#8fb8dd;stroke-width:1.5"/>` +
    `<rect x="${x - w / 2 + 2}" y="${plunger}" width="${w - 4}" height="${y0 - plunger}" style="fill:${fill}"/>${dots(x, w, plunger)}` +
    `<rect x="${x - w / 2 + 1}" y="${plunger - 6}" width="${w - 2}" height="6" style="fill:#3d3d3d"/>` +
    `<rect x="${x - 2}" y="${plunger - 46}" width="4" height="40" style="fill:#d7dde3;stroke:#8a96a3"/>` +
    `<rect x="${x - w / 2 - 4}" y="${plunger - 52}" width="${w + 8}" height="6" rx="2" style="fill:#d7dde3;stroke:#8a96a3"/>`;
  const nx = 360;
  const wx = 480;
  const nTop = y0 - 100 + p.pushed * K;
  const lift = p.push > p.dead ? Math.max(0, p.pushed - p.dead) / (p.push - p.dead) : 0;
  const wTop = y0 - 70 - lift * p.rise * K;
  const tube = `<path d="M${nx},${y0} V${y0 + 14} H${wx} V${y0}" style="fill:none;stroke:${water ? '#7fb3e0' : '#c9d6e2'};stroke-width:5"/><path d="M${nx},${y0} V${y0 + 14} H${wx} V${y0}" style="fill:none;stroke:#8fb8dd;stroke-width:1;opacity:0.6"/>`;
  const weights = p.weights > 0 ? weightsSvg(wx, wTop - 52 - p.weights * 9, p.weights, 30, 9) : '';
  // The dynamometer pressing the narrow plunger, its reading beside it; or a hand's arrow pushing it in.
  const dyn = p.pull ? `<rect x="${nx - 6}" y="${nTop - 108}" width="12" height="56" rx="3" style="fill:#f4f1e8;stroke:#555"/><path d="M${nx},${nTop - 52} V${nTop - 46}" style="stroke:#555;stroke-width:2"/><path d="M${nx - 10},${nTop - 116} l10,10 l10,-10" style="fill:none;stroke:#c0392b;stroke-width:2"/><text class="bench-reading" x="${nx - 14}" y="${nTop - 76}" text-anchor="end">F₁ = ${p.pull}</text>` : '';
  const hand = !p.pull && p.push ? `<path d="M${nx},${nTop - 90} V${nTop - 58}" style="stroke:#c0392b;stroke-width:2.5"/><path d="M${nx - 6},${nTop - 66} l6,8 l6,-8" style="fill:none;stroke:#c0392b;stroke-width:2.5"/>` : '';
  const what = `<text class="bench-reading" x="${(nx + wx) / 2}" y="${y0 + 32}" text-anchor="middle">${water ? '💧' : '💨'}</text>`;
  const read = p.read ? p.read.map((t, i) => `<text class="bench-reading" x="${wx + 30}" y="${wTop - 26 + i * 16}">${t}</text>`).join('') : '';
  return `${tube}${syringe(nx, 16, nTop)}${syringe(wx, 34, wTop)}${weights}${dyn}${hand}${what}${read}`;
}

/** The narrow piston goes in steadily (about 2.5 s); the wide one stands until the idle travel is done, then rises. */
function motion(next: PressView, draw: (v: PressView) => void): Motion | null {
  if (!next.push) return null;
  const clock = new Channel(0, next.push, { kind: 'steady', speed: next.push / 2.5 }, 1e-9);
  return {
    channels: [clock],
    frame: (done) => {
      if (done) return draw(next);
      const { read: _r, ...rest } = next;
      void _r;
      draw({ ...rest, pushed: clock.value });
    },
  };
}

export const hydraulicPressScene = defineScene({ kind: 'press', view, svg: pressSvg, motion });
