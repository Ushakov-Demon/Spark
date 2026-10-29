import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { DARK } from '../../graphics/scene/kit.js';
import { defineScene, type SceneContext } from '../types.js';

/** The syringe and the barometer: the plunger out by so many mL (0…1), the nozzle shut; the dynamometer's reading, the ruler's; the day's pressure, Pa, and its reading once looked at. */
export type AtmView = { readonly pulled: number; readonly sealed: boolean; readonly pull?: string; readonly read?: string; readonly air: number; readonly baro?: string };

function view({ log, last, command, plan, locale }: SceneContext): AtmView {
  const show = (q: 'force' | 'length', v: number | null | undefined) => formatMeasured(q, v ?? 0, q === 'force' ? 0.1 : 0.001, locale);
  const r = last ? readingsOf([last])[0]?.record : undefined;
  const ac = command?.type === 'lab.atm' ? (command as unknown as { step: string; pulled?: number; air: number }) : undefined;
  const any = log.find((e) => e.command.type === 'lab.atm') ?? plan.find((s) => s.kind === 'bench' && s.command.type === 'lab.atm');
  const air = (any && 'command' in any ? (any.command as unknown as { air: number }).air : undefined) ?? 101_300;
  const b = log.find((e) => e.command.type === 'lab.atm' && (e.command as unknown as { step: string }).step === 'barometer');
  const baro = b ? readingsOf([b])[0]?.record.value : undefined;
  const pull = ac && (ac.step === 'open' || ac.step === 'sealed') && r ? show('force', r.value) : undefined;
  return { pulled: ac?.step === 'sealed' ? (ac.pulled ?? 0) : ac?.step === 'open' ? 1 : 0, sealed: ac?.step === 'sealed', air, ...(pull ? { pull } : {}), ...(ac?.step === 'scale' && r ? { read: `l = ${show('length', r.value)}` } : {}), ...(baro != null ? { baro: formatMeasured('pressure', baro, 100, locale) } : {}) };
}

/**
 * A 1 mL syringe held in a stand's clamp, its nozzle down (a red cap on it when shut); the plunger pulled up by the
 * dynamometer, 2 px to the millimetre of its scale; a ruler beside it. The aneroid barometer on the right: its needle
 * over 960…1060 hPa.
 */
function atmSvg(a: AtmView): string {
  const x = 450;
  const nozzle = TABLE - 60;
  const bottom = nozzle - 10;
  const len = 114;
  const top = bottom - len - 16;
  const plunger = bottom - (a?.pulled ?? 0) * len;
  const stand = `<rect x="350" y="${TABLE - 8}" width="80" height="8" rx="2" style="fill:${DARK}"/><rect x="366" y="${TABLE - 250}" width="6" height="242" style="fill:#8a96a3"/><rect x="369" y="${bottom - 60}" width="${x - 369 - 9}" height="6" style="fill:#8a96a3"/><rect x="${x - 11}" y="${bottom - 66}" width="22" height="18" rx="3" style="fill:#59636e"/>`;
  const barrel = `<rect x="${x - 8}" y="${top}" width="16" height="${bottom - top}" rx="2" style="fill:rgba(220,235,250,0.35);stroke:#8fb8dd;stroke-width:1.5"/><path d="M${x - 3},${bottom} V${nozzle} H${x + 3} V${bottom}" style="fill:rgba(220,235,250,0.35);stroke:#8fb8dd"/>`;
  const marks = Array.from({ length: 11 }, (_, i) => `<path d="M${x + 8},${bottom - (i * len) / 10} h${i % 5 === 0 ? -7 : -4}" style="stroke:#3d3d3d;stroke-width:0.7"/>`).join('');
  const cap = a?.sealed ? `<rect x="${x - 5}" y="${nozzle - 2}" width="10" height="9" rx="2" style="fill:#c0392b"/>` : '';
  const rodTop = top - 40;
  const piston = `<rect x="${x - 7}" y="${plunger - 6}" width="14" height="6" style="fill:#3d3d3d"/><rect x="${x - 2}" y="${rodTop}" width="4" height="${plunger - 6 - rodTop}" style="fill:#d7dde3;stroke:#8a96a3"/><rect x="${x - 12}" y="${rodTop - 5}" width="24" height="5" rx="2" style="fill:#d7dde3;stroke:#8a96a3"/>`;
  const dyn = a?.pull ? `<path d="M${x},${rodTop - 5} V${rodTop - 14}" style="stroke:#555;stroke-width:2"/><rect x="${x - 6}" y="${rodTop - 70}" width="12" height="56" rx="3" style="fill:#f4f1e8;stroke:#555"/><path d="M${x - 10},${rodTop - 78} l10,-10 l10,10" style="fill:none;stroke:#c0392b;stroke-width:2"/><text class="bench-reading" x="${x + 16}" y="${rodTop - 40}">F = ${a.pull}</text>` : '';
  const ticks = Array.from({ length: 13 }, (_, i) => `<path d="M${x - 30},${bottom - i * 10} h${i % 5 === 0 ? 8 : 5}" style="stroke:#5b4a2a;stroke-width:1"/>`).join('');
  const ruler = `<rect x="${x - 34}" y="${bottom - 124}" width="12" height="128" style="fill:#f1e3b0;stroke:#a8945a"/>${ticks}`;
  const read = a?.read ? `<text class="bench-reading" x="${x - 40}" y="${bottom - len / 2}" text-anchor="end">${a.read}</text>` : '';
  // The barometer: a round dial, the needle at the day's pressure.
  const bx = 548;
  const by = TABLE - 170;
  const share = Math.max(0, Math.min(1, ((a?.air ?? 101_300) / 100 - 960) / 100));
  const ang = Math.PI * (1.25 - 1.5 * share);
  const dial = Array.from({ length: 11 }, (_, i) => {
    const t = Math.PI * (1.25 - 0.15 * i);
    const r0 = i % 5 === 0 ? 26 : 29;
    return `<path d="M${bx + 33 * Math.cos(t)},${by - 33 * Math.sin(t)} L${bx + r0 * Math.cos(t)},${by - r0 * Math.sin(t)}" style="stroke:#333;stroke-width:0.9"/>`;
  }).join('');
  const baro = `<circle cx="${bx}" cy="${by}" r="40" style="fill:#c9a96e;stroke:#7a5a2a;stroke-width:2"/><circle cx="${bx}" cy="${by}" r="35" style="fill:#f4f1e8"/>${dial}<path d="M${bx},${by} L${bx + 28 * Math.cos(ang)},${by - 28 * Math.sin(ang)}" style="stroke:#1f2a36;stroke-width:1.8"/><circle cx="${bx}" cy="${by}" r="2.5" style="fill:#1f2a36"/><text class="lever-mark" x="${bx}" y="${by + 18}" text-anchor="middle" style="font-size:8px">hPa</text>${a?.baro ? `<text class="bench-reading" x="${bx}" y="${by + 58}" text-anchor="middle">p₀ = ${a.baro}</text>` : ''}`;
  return `${stand}${ruler}${barrel}${marks}${piston}${cap}${dyn}${read}${baro}`;
}

export const atmosphericPressureScene = defineScene({ kind: 'atm', view, svg: atmSvg, motion: () => null });
