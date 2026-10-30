import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/**
 * The Cartesian diver: on the balance (its reading), pushed under in the cylinder (the level before and after), or in
 * the bottle — how hard it is squeezed (0…1), how far the water climbed its tube (m), where it is (0 — at the top,
 * 1 — at the bottom), what the ruler read.
 */
export type DiverView = { readonly stage: 'balance' | 'cylinder' | 'bottle'; readonly mass?: string; readonly weighed?: boolean; readonly cylinder?: { readonly after: number; readonly read: string }; readonly squeeze: number; readonly rise: number; readonly depth: number; readonly read?: string };

/** The squeeze drawn fully: 15 kPa. */
const FULL_SQUEEZE = 15_000;

function view({ last, command, locale }: SceneContext): DiverView {
  const dc = command?.type === 'lab.diver' ? (command as unknown as { step: string; press?: number }) : undefined;
  const r = last && dc ? readingsOf([last])[0]?.record : undefined;
  if (!dc || dc.step === 'weigh') return { stage: 'balance', squeeze: 0, rise: 0, depth: 0, mass: formatMeasured('mass', r ? r.value : 0, 0.00001, locale), weighed: !!r };
  if (dc.step === 'volume') return { stage: 'cylinder', squeeze: 0, rise: 0, depth: 0, ...(r ? { cylinder: { after: r.inputs?.['after'] ?? 0, read: `V = ${formatMeasured('volume', r.value, 1e-7, locale)}` } } : {}) };
  const sinks = r?.inputs?.['sinks'] === 1;
  const rise = r?.value ?? 0;
  const mm = `${Math.round(rise * 1000)} ${locale === 'uk' ? 'мм' : 'mm'}`;
  return { stage: 'bottle', squeeze: dc.step === 'squeeze' ? Math.min(1, (dc.press ?? 0) / FULL_SQUEEZE) : 0, rise, depth: sinks ? 1 : 0, read: `Δh = ${mm}` };
}

/** The diver drawn big (not to scale): a glass tube, a red rubber cap; air in the cap and the top of the tube, water under the meniscus. */
function diverSvg(x: number, top: number, rise: number): string {
  const tube = 46;
  const cap = 20;
  // The air reaches 18 px down the tube; the water climbs it a pixel a millimetre (drawn ×1.5).
  const air = Math.max(2, 18 - rise * 1000 * 1.5);
  return `<rect x="${x - 7}" y="${top}" width="14" height="${cap}" rx="6" style="fill:#c0392b;stroke:#7d1f16"/>` +
    `<rect x="${x - 4}" y="${top + cap}" width="8" height="${tube}" style="fill:rgba(255,255,255,0.18);stroke:#dfe9f2;stroke-width:1.2"/>` +
    `<rect x="${x - 3}" y="${top + cap}" width="6" height="${air}" style="fill:rgba(255,255,255,0.85)"/>` +
    `<path d="M${x - 3},${top + cap + air} h6" style="stroke:#1f5f99;stroke-width:1.5"/>` +
    `<path d="M${x - 4},${top + cap + tube} l4,6 l4,-6" style="fill:rgba(255,255,255,0.18);stroke:#dfe9f2;stroke-width:1.2"/>`;
}

const DIVER_H = 72;

/** The balance; the diver on its pan once weighed, beside it on the table before. */
function balanceSvg(mass: string | undefined, weighed: boolean): string {
  const x = 400;
  const top = 286;
  const [dx, dy] = weighed ? [x, top - 16] : [x + 120, TABLE - 8];
  return `<rect class="scale-body lab" x="${x - 60}" y="${top}" width="120" height="${TABLE - top}" rx="6"/>` +
    `<rect class="scale-stem" x="${x - 4}" y="${top - 6}" width="8" height="6"/><ellipse class="scale-pan" cx="${x}" cy="${top - 6}" rx="40" ry="5"/>` +
    `<g transform="rotate(-90 ${dx} ${dy})">${diverSvg(dx, dy - DIVER_H / 2, 0)}</g>` +
    `<rect class="scale-lcd" x="${x - 36}" y="${TABLE - 24}" width="72" height="16" rx="2"/>` +
    `<text class="scale-text" x="${x}" y="${TABLE - 12.5}" text-anchor="middle">${mass ?? ''}</text>`;
}

/** The 10 mL cylinder (a millilitre — 14 px), the diver held under on a wire. */
function cylinderSvg(c: DiverView['cylinder']): string {
  const x = 400;
  const bottom = TABLE - 6;
  const k = 14e6;
  const level = bottom - (c?.after ?? 5e-6) * k;
  const marks = Array.from({ length: 11 }, (_, i) => `<path d="M${x - 22},${bottom - i * 14} h${i % 5 === 0 ? 12 : 7}" style="stroke:#3d3d3d;stroke-width:1"/>${i % 5 === 0 ? `<text x="${x - 26}" y="${bottom - i * 14 + 3}" text-anchor="end" style="font:600 10px system-ui,sans-serif;fill:#efe9d2">${i}</text>` : ''}`).join('');
  // (Half size: the wire holds its cap just under the water.)
  const under = level + 6;
  const diver = c ? `<path d="M${x},${level - 50} V${under}" style="stroke:#8d949c;stroke-width:1.2"/><g transform="translate(${x} ${under}) scale(0.5) translate(${-x} 0)">${diverSvg(x, 0, 0)}</g>` : '';
  return `<rect x="${x - 22}" y="${bottom - 160}" width="44" height="160" style="fill:rgba(220,235,250,0.18);stroke:#8fb8dd;stroke-width:2"/>` +
    `<rect x="${x - 21}" y="${level}" width="42" height="${bottom - level}" style="fill:rgba(120,170,230,0.5)"/>${diver}${marks}` +
    `<rect x="${x - 32}" y="${bottom}" width="64" height="6" rx="2" style="fill:#8fb8dd"/>` +
    (c ? `<text class="bench-reading" x="${x + 34}" y="${level + 4}">${c.read}</text>` : '');
}

/** The bottle full of water (its walls pressed in by the hands as it is squeezed), the diver in it. */
function bottleSvg(v: DiverView): string {
  const x = 400;
  const bottom = TABLE - 4;
  const top = bottom - 250;
  const w = 92;
  const shoulder = top + 50;
  const surface = shoulder - 16;
  const dent = v.squeeze * 10;
  const mid = (shoulder + bottom) / 2;
  const L = x - w / 2;
  const R = x + w / 2;
  const body = `M${x - 14},${top + 14} V${top + 26} C${x - 14},${shoulder - 10} ${L},${shoulder - 14} ${L},${shoulder} Q${L + dent},${mid} ${L},${bottom - 8} q0,8 8,8 H${R - 8} q8,0 8,-8 Q${R - dent},${mid} ${R},${shoulder} C${R},${shoulder - 14} ${x + 14},${shoulder - 10} ${x + 14},${top + 26} V${top + 14} Z`;
  const cap = `<rect x="${x - 17}" y="${top}" width="34" height="16" rx="3" style="fill:#2f7fc1;stroke:#1d5a8c"/>`;
  const clip = `<clipPath id="diver-water"><path d="${body}"/></clipPath>`;
  const water = `<rect x="${L - 2}" y="${surface}" width="${w + 4}" height="${bottom - surface}" clip-path="url(#diver-water)" style="fill:rgba(120,170,230,0.5)"/>`;
  // The cap of the diver just out of the water at the top; at the bottom, its tip on the bottle's floor.
  const y = surface - 6 + v.depth * (bottom - 6 - DIVER_H - (surface - 6));
  const hands = v.squeeze > 0.01 ? [[L + dent * 0.6 - 16, -1], [R - dent * 0.6 + 16, 1]].map(([hx, s]) => `<ellipse cx="${hx}" cy="${mid}" rx="16" ry="30" style="fill:#e7b892;stroke:#a8714d"/><path d="M${hx! + s! * 30},${mid} h${-s! * 10}" style="stroke:#c0392b;stroke-width:2.5"/><path d="M${hx! + s! * 22},${mid - 5} l${-s! * 6},5 l${s! * 6},5" style="fill:none;stroke:#c0392b;stroke-width:2.5"/>`).join('') : '';
  const read = v.read ? `<text class="bench-reading" x="${R + 50}" y="${top + 70}">${v.read}</text>` : '';
  return `<defs>${clip}</defs>${water}<path d="${body}" style="fill:rgba(220,235,250,0.15);stroke:#8fb8dd;stroke-width:2"/>${cap}${diverSvg(x, y, v.rise)}${hands}${read}`;
}

const svg = (v: DiverView) => (v.stage === 'balance' ? balanceSvg(v.mass, !!v.weighed) : v.stage === 'cylinder' ? cylinderSvg(v.cylinder) : bottleSvg(v));

/**
 * The bottle squeezed or let go: the hands press (or let go) and the water climbs (or leaves) the tube in about 0.8 s;
 * then, if it must, the diver goes down or up in about 1.6 s.
 */
function motion(next: DiverView, draw: (v: DiverView) => void, prev: DiverView | null): Motion | null {
  if (next.stage !== 'bottle') return null;
  const from = prev?.stage === 'bottle' ? prev : { ...next, squeeze: 0, rise: 0, depth: 0 };
  const press = 0.8;
  const move = from.depth !== next.depth ? 1.6 : 0;
  const clock = new Channel(0, press + move, { kind: 'steady', speed: 1 }, 1e-6);
  const mix = (a: number, b: number, k: number) => a + (b - a) * Math.min(1, Math.max(0, k));
  return {
    channels: [clock],
    frame: (done) => {
      if (done) return draw(next);
      const u = clock.value;
      const k = u / press;
      // (Sinking it speeds up a little, as the air shrinks more the deeper it goes.)
      const t = move ? Math.max(0, (u - press) / move) : 0;
      const depth = mix(from.depth, next.depth, next.depth > from.depth ? t * t : t);
      const { read: _r, ...rest } = next;
      void _r;
      draw({ ...rest, squeeze: mix(from.squeeze, next.squeeze, k), rise: mix(from.rise, next.rise, k), depth });
    },
  };
}

export const cartesianDiverScene = defineScene({ kind: 'diver', view, svg, motion });
