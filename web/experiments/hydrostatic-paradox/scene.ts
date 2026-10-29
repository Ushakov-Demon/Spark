import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { defineScene, type SceneContext } from '../types.js';

/** Pascal's device: the vessel screwed on (none yet), the water's height in it, m; the manometer's Δh, m, and what was read. */
export type VesselView = { readonly shape?: 'straight' | 'wide' | 'narrow'; readonly height: number; readonly dh: number; readonly read?: string; readonly poured?: string };

function view({ last, command, plan, locale }: SceneContext): VesselView {
  const show = (q: 'force' | 'length', v: number | null | undefined) => formatMeasured(q, v ?? 0, q === 'force' ? 0.1 : 0.001, locale);
  const vc = command?.type === 'lab.vessel' ? (command as unknown as { step: string; shape?: 'straight' | 'wide' | 'narrow'; height?: number }) : undefined;
  const next = plan.find((s) => s.kind === 'bench' && s.command.type === 'lab.vessel' && 'shape' in s.command);
  const shape = vc?.shape ?? (next?.kind === 'bench' ? (next.command as { shape?: 'straight' | 'wide' | 'narrow' }).shape : undefined);
  const recs = last && vc?.step === 'fill' ? readingsOf([last]).map((x) => x.record) : [];
  const V = recs.find((x) => x.quantity === 'volume');
  const M = recs.find((x) => x.quantity === 'length');
  return { ...(shape ? { shape } : {}), height: vc?.step === 'fill' ? (vc.height ?? 0) : 0, dh: M?.value ?? 0, ...(M ? { read: show('length', M.value) } : {}), ...(V ? { poured: formatMeasured('volume', V.value, 5e-6, locale) } : {}) };
}

/**
 * Pascal's device (10 px to the centimetre): a stand with the vessel screwed on — straight, widening or narrowing,
 * all with the same 4 cm bottom — water in it to its height; a tube from the stand's rubber bottom to a U-tube
 * manometer on the right, its levels apart by Δh.
 */
function vesselsSvg(v: VesselView): string {
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

export const hydrostaticParadoxScene = defineScene({ kind: 'vessels', view, svg: vesselsSvg, motion: () => null });
