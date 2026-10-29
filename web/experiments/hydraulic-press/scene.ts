import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { weightsSvg } from '../../graphics/scene/kit.js';
import { defineScene, type SceneContext } from '../types.js';

/** The hydraulic machine: weights on the wide piston, the dynamometer's reading on the narrow one, how far the pistons moved (0…1 of the push), what the ruler read. */
export type PressView = { readonly weights: number; readonly pull?: string; readonly pushed: number; readonly read?: string };

function view({ last, command, plan, locale }: SceneContext): PressView {
  const show = (q: 'force' | 'length', v: number | null | undefined) => formatMeasured(q, v ?? 0, q === 'force' ? 0.1 : 0.001, locale);
  const r = last ? readingsOf([last])[0]?.record : undefined;
  const pc = command?.type === 'lab.press' ? (command as unknown as { step: string; weights?: number }) : undefined;
  const next = plan.find((s) => s.kind === 'bench' && s.command.type === 'lab.press' && 'weights' in s.command);
  const weights = pc?.weights ?? (next?.kind === 'bench' ? ((next.command as { weights?: number }).weights ?? 0) : 0);
  const recs = last && pc ? readingsOf([last]).map((x) => x.record) : [];
  const read = pc?.step === 'diameters' ? `d₁ = ${formatMeasured('length', recs[0]?.value ?? 0, 0.001, locale)}, d₂ = ${formatMeasured('length', recs[1]?.value ?? 0, 0.001, locale)}` : pc?.step === 'travel' ? `l₂ = ${formatMeasured('length', recs[0]?.value ?? 0, 0.001, locale)}` : undefined;
  return { weights, pushed: pc?.step === 'travel' ? 1 : 0, ...(pc?.step === 'lift' && r ? { pull: show('force', r.value) } : {}), ...(read ? { read } : {}) };
}

/**
 * Two syringes standing on the table, their nozzles joined by a tube under them: the narrow one (left) with the
 * dynamometer pressing on its plunger, the wide one (right) with weights on its plunger. Pushed, the narrow plunger
 * goes 6 cm down (60 px) and the wide one comes up by the share of it the areas give.
 */
function pressSvg(p: PressView): string {
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

export const hydraulicPressScene = defineScene({ kind: 'press', view, svg: pressSvg, motion: () => null });
