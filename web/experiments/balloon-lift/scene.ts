import { sizeText } from '../../../src/experiments/balloon-lift/bench.js';
import { liftText } from '../../../src/experiments/balloon-lift/words.js';
import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { forceGaugeSvg, labBalanceSvg } from '../../graphics/scene/kit.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/**
 * The balloon: lying empty (being weighed), filled and measured, or tied to a weight on the balance (a small force) or
 * to an anchor through a force gauge (a big one) — floating up on its string or lying (`up` 0…1); its gas (its
 * colour; hot air — an envelope with a basket), its size in words, what was read and what the balance shows.
 */
export type LiftView = {
  readonly stage: 'shell' | 'size' | 'lift';
  readonly gas: string;
  readonly diameter: number;
  readonly size: string;
  readonly up: number;
  readonly flies: boolean;
  readonly gauge: boolean;
  readonly read?: string;
  /** What the balance's display shows: the shell's mass; tared under the weight, the change of mass (lighter — minus). */
  readonly display: string;
  /** The display tared: zero, in the page's language. */
  readonly tare: string;
};

const COLOR: Record<string, string> = { helium: '#9ec9f0', hydrogen: '#f3c94f', 'hot-air': '#e8743b', air: '#e98bb0' };
/** The drawn radius: grows with the diameter (as its cube root), kept within the picture. */
const radius = (d: number) => Math.max(10, Math.min(60, 30 * Math.cbrt(d / 0.3)));

function view({ last, command, plan, locale }: SceneContext): LiftView {
  type Cmd = { step: string; gas?: string; diameter?: number };
  const lc = command?.type === 'lab.balloon' ? (command as unknown as Cmd) : undefined;
  const any = [lc, ...plan.map((s) => (s.kind === 'bench' && s.command.type === 'lab.balloon' ? (s.command as unknown as Cmd) : undefined))];
  const gas = any.find((c) => c?.gas)?.gas ?? 'helium';
  const diameter = lc?.diameter ?? any.find((c) => c?.diameter)?.diameter ?? 0.3;
  const r = last && lc ? readingsOf([last])[0]?.record : undefined;
  const zero = formatMeasured('mass', 0, 1e-5, locale);
  const base = { gas: lc?.gas ?? gas, diameter, size: `D = ${sizeText(diameter, locale)}`, up: 0, flies: false, gauge: false, display: zero, tare: zero };
  if (!lc || lc.step === 'shell') return { ...base, stage: 'shell', ...(r?.value != null ? { display: formatMeasured('mass', r.value, r.inputs?.['division'] ?? 1e-5, locale) } : {}) };
  if (lc.step === 'size') return { ...base, stage: 'size' };
  const F = r?.value ?? 0;
  const g = r?.inputs?.['g'] ?? 9.81;
  return { ...base, stage: 'lift', up: 1, flies: F > 0, gauge: r?.inputs?.['balance'] === 0, ...(r ? { read: liftText(r, locale), display: formatMeasured('mass', -F / g || 0, 1e-5, locale) } : {}) };
}

/** A balloon centred at (x, y): a round one with its knot, or a hot-air envelope with its basket. */
function balloonSvg(x: number, y: number, r: number, gas: string): string {
  if (gas === 'hot-air')
    return `<path d="M${x - r},${y} a${r},${r} 0 1 1 ${2 * r},0 q0,${r * 0.6} ${-r * 0.55},${r * 1.05} h${-r * 0.9} q${-r * 0.45},${-r * 0.45} ${-r * 0.55},${-r * 1.05} z" style="fill:${COLOR[gas]};stroke:#9a3f12;stroke-width:1.5"/><path d="M${x},${y - r} V${y + r}" style="stroke:#9a3f12;opacity:0.5"/><rect x="${x - r * 0.25}" y="${y + r * 1.15}" width="${r * 0.5}" height="${r * 0.3}" style="fill:#9a6b33;stroke:#5e3f1a"/>`;
  return `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.1}" style="fill:${COLOR[gas] ?? '#ccc'};stroke:rgba(0,0,0,0.35)"/><ellipse cx="${x - r * 0.35}" cy="${y - r * 0.4}" rx="${r * 0.18}" ry="${r * 0.28}" style="fill:rgba(255,255,255,0.55)"/><path d="M${x - 3},${y + r * 1.1 + 4} l3,-4 l3,4 z" style="fill:${COLOR[gas] ?? '#ccc'}"/>`;
}

function svg(v: LiftView): string {
  const r = radius(v.diameter);
  const size = `<text class="bench-reading" x="596" y="40" text-anchor="end">${v.size}</text>`;
  if (v.stage === 'shell') {
    // The empty shell on the balance: a crumpled skin.
    const x = 400;
    const top = 286;
    return `${labBalanceSvg(x, top, v.display)}<path d="M${x - 16},${top - 9} q8,-10 16,-2 q8,-9 16,2 q-16,6 -32,0 z" style="fill:${COLOR[v.gas] ?? '#ccc'};stroke:rgba(0,0,0,0.35)"/>`;
  }
  if (v.stage === 'size') {
    // Filled and resting on the table, a tape round it.
    const x = 400;
    const y = TABLE - 4 - r * 1.1;
    return `${balloonSvg(x, y, r, v.gas)}<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.18}" style="fill:none;stroke:#f1e3b8;stroke-width:2"/>${size}`;
  }
  // Tied on: to a weight on the balance, or (a big force) to an anchor through a force gauge.
  const ax = 400;
  // One that does not fly is set down on the pan beside the weight (moved aside for it): the balance weighs it too.
  const onPan = !v.flies && !v.gauge;
  const wx = onPan ? ax - 26 : ax;
  const holder = v.gauge
    ? `<rect x="${ax - 30}" y="${TABLE - 30}" width="60" height="30" style="fill:#8d949c;stroke:#3a3f46"/>${forceGaugeSvg(ax, TABLE - 30 - 86, '')}`
    : `${labBalanceSvg(ax, 286, v.display)}<rect x="${wx - 12}" y="262" width="24" height="18" rx="3" style="fill:#b9a26b;stroke:#7a6533"/>`;
  const tie = v.gauge ? TABLE - 30 - 86 : 262;
  // Floating: right above the tie on a taut string; lying: on the table beside, the string slack.
  const floatY = Math.max(20 + r, tie - 60 - r * 1.1);
  const lieX = ax + 110;
  const lieY = TABLE - 4 - r * 1.1;
  const k = v.flies ? v.up : 0;
  // On the pan: lowered from a hand's height (`up` 0) to rest on it (1), its bottom on the pan.
  const panY = 277 - r * (v.gas === 'hot-air' ? 1.45 : 1.1);
  const bx = v.flies ? ax : onPan ? ax + 14 : lieX;
  const by = v.flies ? lieY + (floatY - lieY) * k : onPan ? panY - 70 * (1 - v.up) : lieY;
  const string = v.flies
    ? `<path d="M${ax},${tie} L${bx},${by + r * 1.1}" style="stroke:#efe9d6;stroke-width:1.5"/>`
    : onPan
      ? `<path d="M${wx},${tie} Q${wx + 6},${tie - 14} ${bx},${by + r * 1.1}" style="fill:none;stroke:#efe9d6;stroke-width:1.5"/>`
      : `<path d="M${ax},${tie} Q${(ax + lieX) / 2},${TABLE - 2} ${lieX},${lieY + r * 1.1}" style="fill:none;stroke:#efe9d6;stroke-width:1.5"/>`;
  const read = v.read ? `<text class="bench-reading" x="596" y="60" text-anchor="end">${v.read}</text>` : '';
  return `${holder}${string}${balloonSvg(bx, by, r, v.gas)}${size}${read}`;
}

/** Let go on its string: the balloon rises to it (about a second and a half) — or, one that does not fly, set down on the pan. */
function motion(next: LiftView, draw: (v: LiftView) => void): Motion | null {
  if (next.stage !== 'lift' || (!next.flies && next.gauge)) return null;
  const clock = new Channel(0, 1, { kind: 'steady', speed: 1 / 1.5 }, 1e-6);
  // (The display still shows the tare while the balloon moves: its change comes with the reading, at the end.)
  const { read: _r, ...rest } = next;
  void _r;
  return { channels: [clock], frame: (done) => draw(done ? next : { ...rest, up: clock.value, display: next.tare }) };
}

export const balloonLiftScene = defineScene({ kind: 'balloon', view, svg, motion });
