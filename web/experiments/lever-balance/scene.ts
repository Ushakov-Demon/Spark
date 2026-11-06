import { balanceWeights, WEIGHT_SET, weightsText } from '../../../src/experiments/lever-balance/bench.js';
import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { LIQUID, LIQUID_TINT } from '../../graphics/scene/colors.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { BODY_COLOR, DARK, STEEL, THREAD } from '../../graphics/scene/kit.js';
import { placingWeights, weightsOnPan } from '../../graphics/scene/weights.js';
import type { Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/** On the lever balance: what lies on the left pan, the weights on the right one (kg), and the sum; the beam's tilt. */
type Balance = { readonly load: 'body' | 'empty' | 'full'; readonly color: string; /** The liquid in the vessel: its colour, and how much of the vessel it fills. */ readonly liquid?: { readonly color: string; readonly share: number }; readonly weights: readonly number[]; readonly display: string; readonly mass?: number; readonly tilt?: number };
/** The balance once something is weighed; before — empty (null). */
export type BalanceView = Balance | null;

function view({ last, command, substance, locale }: SceneContext): BalanceView {
  const r = last ? readingsOf([last])[0]?.record : undefined;
  const c = command;
  const b = c?.type === 'lab.balance' ? (c as unknown as { what: string; substance?: string; label?: { uk: string; en: string }; volume?: number }) : undefined;
  const set = r?.value != null && b ? (balanceWeights(r.value) ?? []) : [];
  return b ? { load: b.what === 'body' ? 'body' : b.what === 'vessel' ? 'full' : 'empty', color: BODY_COLOR[b.substance ?? ''] ?? '#9aa1a8', liquid: { color: LIQUID_TINT[b.substance ?? substance] ?? LIQUID.water, share: b.volume ? b.volume / VESSEL_DRAWN : 0.55 }, weights: set, ...(r && r.value !== null ? { mass: r.exact } : {}), display: r?.value != null ? `${weightsText(set, locale)} = ${formatMeasured('mass', r.value, 0.00001, locale)}` : '' }  : null;
}

/** How much the vessel on the pan holds, as drawn, m³: its liquid comes up to scale. */
const VESSEL_DRAWN = 70e-6;
const VESSEL_H = 38;
/** The liquid in the vessel on the pan, its bright surface over it. */
function liquidSvg(x: number, pan: number, liquid: Balance['liquid']): string {
  const h = VESSEL_H * Math.min(1, liquid?.share ?? 0.55);
  const top = pan - 2 - h;
  return `<rect x="${x - 15}" y="${top}" width="30" height="${h}" style="fill:${liquid?.color ?? LIQUID.water}"/><path d="M${x - 15},${top} h30" style="stroke:rgba(255,255,255,0.75);stroke-width:1.2"/>`;
}

/**
 * A school lever balance: a column, a beam on a pivot, two pans hanging from its ends; the load on the left,
 * the weights on the right. `tilt`, degrees: positive — the left (load) side is down.
 */
function balanceSvg(b: BalanceView): string {
  const cx = 330;
  const top = 190;
  const arm = 90;
  const drop = 70;
  const th = ((b?.tilt ?? 0) * Math.PI) / 180;
  const L = { x: cx - arm * Math.cos(th), y: top + arm * Math.sin(th) };
  const R = { x: cx + arm * Math.cos(th), y: top - arm * Math.sin(th) };
  // A pan hangs straight down from its end of the beam, whatever the tilt.
  const pan = (e: { x: number; y: number }) => `<path d="M${e.x},${e.y} L${e.x - 26},${e.y + drop} M${e.x},${e.y} L${e.x + 26},${e.y + drop}" style="stroke:${THREAD};stroke-width:1"/><path d="M${e.x - 32},${e.y + drop} q32,14 64,0 z" style="fill:#c9ced4;stroke:#6d7177"/>`;
  const ly = L.y + drop;
  const load = !b ? '' : b.load === 'body' ? `<rect x="${L.x - 14}" y="${ly - 22}" width="28" height="22" rx="3" style="fill:${b.color};stroke:rgba(0,0,0,0.35)"/>` : `<path d="M${L.x - 16},${ly - 40} v38 h32 v-38" style="fill:rgba(210,232,255,0.35);stroke:#8fb8dd;stroke-width:1.5"/>${b.load === 'full' ? liquidSvg(L.x, ly, b.liquid) : ''}`;
  // The weights: brass cylinders for grams in a row, milligram plates in a little pile at the right.
  const ry = R.y + drop;
  const weights = weightsOnPan(R.x, ry, b?.weights ?? []);
  const beam = `<g transform="rotate(${-(b?.tilt ?? 0)} ${cx} ${top})"><rect x="${cx - arm}" y="${top - 3}" width="${arm * 2}" height="6" rx="2" style="fill:${STEEL}"/><path d="M${cx},${top} v-22" style="stroke:#b11;stroke-width:2"/></g>`;
  return `<rect x="${cx - 50}" y="${TABLE - 8}" width="100" height="8" rx="2" style="fill:${DARK}"/><rect x="${cx - 3}" y="${top}" width="6" height="${TABLE - 8 - top}" style="fill:${STEEL}"/><path d="M${cx - 10},${top - 26} h20" style="stroke:${THREAD};stroke-width:1"/>${beam}<circle cx="${cx}" cy="${top}" r="3.5" style="fill:${DARK}"/>${pan(L)}${pan(R)}${load}${weights}${b?.display ? `<text class="bench-reading" x="${cx}" y="${TABLE - 14}" text-anchor="middle">${b.display}</text>` : ''}`;
}

/** The lever balance: the weights go on one by one; its beam shows what is still missing. */
function balance(next: Balance, mass: number, draw: (v: BalanceView) => void): Motion {
  const b = next;
  const { on, beam, steps } = placingWeights(mass, WEIGHT_SET);
  return {
    channels: [beam],
    steps,
    frame: (done) => draw({ ...b, weights: done ? b.weights : [...on], tilt: done ? 0 : beam.value, display: done ? b.display : '' }),
  };
}

export const leverBalanceScene = defineScene({ kind: 'balance', view, svg: balanceSvg, motion: (next, draw) => (next?.mass !== undefined ? balance(next, next.mass, draw) : null) });
