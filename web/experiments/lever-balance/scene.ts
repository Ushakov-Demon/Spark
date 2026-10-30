import { balanceWeights, WEIGHT_SET, weightsText } from '../../../src/experiments/lever-balance/bench.js';
import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { BODY_COLOR, DARK, STEEL, THREAD } from '../../graphics/scene/kit.js';
import { Channel, type Motion, type ProcedureStep } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/** On the lever balance: what lies on the left pan, the weights on the right one (kg), and the sum; the beam's tilt. */
type Balance = { readonly load: 'body' | 'empty' | 'full'; readonly color: string; readonly weights: readonly number[]; readonly display: string; readonly mass?: number; readonly tilt?: number };
/** The balance once something is weighed; before — empty (null). */
export type BalanceView = Balance | null;

function view({ last, command, locale }: SceneContext): BalanceView {
  const r = last ? readingsOf([last])[0]?.record : undefined;
  const c = command;
  const b = c?.type === 'lab.balance' ? (c as unknown as { what: string; substance?: string; label?: { uk: string; en: string } }) : undefined;
  const set = r?.value != null && b ? (balanceWeights(r.value) ?? []) : [];
  return b ? { load: b.what === 'body' ? 'body' : b.what === 'vessel' ? 'full' : 'empty', color: BODY_COLOR[b.substance ?? ''] ?? '#9aa1a8', weights: set, ...(r && r.value !== null ? { mass: r.exact } : {}), display: r?.value != null ? `${weightsText(set, locale === 'uk')} = ${formatMeasured('mass', r.value, 0.00001, locale)}` : '' }  : null;
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
  const load = !b ? '' : b.load === 'body' ? `<rect x="${L.x - 14}" y="${ly - 22}" width="28" height="22" rx="3" style="fill:${b.color};stroke:rgba(0,0,0,0.35)"/>` : `<path d="M${L.x - 16},${ly - 40} v38 h32 v-38" style="fill:rgba(210,232,255,0.35);stroke:#8fb8dd;stroke-width:1.5"/>${b.load === 'full' ? `<rect x="${L.x - 15}" y="${ly - 22}" width="30" height="20" style="fill:rgba(240,200,80,0.55)"/>` : ''}`;
  // The weights: brass cylinders for grams in a row, milligram plates in a little pile at the right.
  const ry = R.y + drop;
  let x = R.x - 28;
  let pile = 0;
  const weights = (b?.weights ?? [])
    .map((w) => {
      const g = w * 1000;
      if (g < 1) {
        pile += 2.5;
        return `<rect x="${R.x + 18}" y="${ry - pile}" width="9" height="2.2" rx="0.8" style="fill:#d7dde6;stroke:#6d7177;stroke-width:0.5"/>`;
      }
      const h = 6 + Math.cbrt(g) * 3;
      const wd = 5 + Math.cbrt(g) * 1.9;
      const out = `<rect x="${x}" y="${ry - h}" width="${wd}" height="${h}" rx="1.5" style="fill:#c9a43a;stroke:#7a6533"/>`;
      x += wd + 1;
      return out;
    })
    .join('');
  const beam = `<g transform="rotate(${-(b?.tilt ?? 0)} ${cx} ${top})"><rect x="${cx - arm}" y="${top - 3}" width="${arm * 2}" height="6" rx="2" style="fill:${STEEL}"/><path d="M${cx},${top} v-22" style="stroke:#b11;stroke-width:2"/></g>`;
  return `<rect x="${cx - 50}" y="${TABLE - 8}" width="100" height="8" rx="2" style="fill:${DARK}"/><rect x="${cx - 3}" y="${top}" width="6" height="${TABLE - 8 - top}" style="fill:${STEEL}"/><path d="M${cx - 10},${top - 26} h20" style="stroke:${THREAD};stroke-width:1"/>${beam}<circle cx="${cx}" cy="${top}" r="3.5" style="fill:${DARK}"/>${pan(L)}${pan(R)}${load}${weights}${b?.display ? `<text class="bench-reading" x="${cx}" y="${TABLE - 14}" text-anchor="middle">${b.display}</text>` : ''}`;
}

/**
 * The lever balance: each weight of the set goes on from the largest; one that tips the beam the other way is
 * taken off again (as one weighs by hand). The beam swings towards where the difference sends it, up to its
 * stops. Its period and damping are those of the drawing, not measured.
 */
function balance(next: Balance, mass: number, draw: (v: BalanceView) => void): Motion {
  const b = next;
  const on: number[] = [];
  const lean = () => 7 * Math.tanh((mass - on.reduce((a, x) => a + x, 0)) / 0.004);
  const beam = new Channel(0, lean(), { kind: 'damped', period: 1.1, damping: 0.45, min: -10, max: 10 }, 0.05);
  const steps: ProcedureStep[] = [{ delay: 700, apply: () => undefined }];
  let sum = 0;
  for (const w of WEIGHT_SET) {
    const heavy = sum + w > mass + 0.000005;
    // Grams take a moment to watch; the light milligram plates go on quicker; a weight that tips it over stays a moment longer.
    steps.push({ delay: w >= 0.001 ? 420 : 170, apply: () => (on.push(w), (beam.target = lean())) });
    if (heavy) steps.push({ delay: 620, apply: () => (on.splice(on.lastIndexOf(w), 1), (beam.target = lean())) });
    else sum += w;
  }
  return {
    channels: [beam],
    steps,
    frame: (done) => draw({ ...b, weights: done ? b.weights : [...on], tilt: done ? 0 : beam.value, display: done ? b.display : '' }),
  };
}

export const leverBalanceScene = defineScene({ kind: 'balance', view, svg: balanceSvg, motion: (next, draw) => (next?.mass !== undefined ? balance(next, next.mass, draw) : null) });
