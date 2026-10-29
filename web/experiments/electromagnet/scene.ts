import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { DARK, meterSvg } from '../../graphics/scene/kit.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

export type MagnetView = { readonly current: number; readonly amps?: string; readonly core: boolean; readonly angle: number; readonly read?: string; /** The nail being pulled out of the coil: 0 — in, 1 — out (the straw stays). */ readonly pull?: number };

function view({ last, command, locale }: SceneContext): MagnetView {
  const mc = command?.type === 'lab.magnet' ? (command as unknown as { current: number; core: boolean }) : undefined;
  const recs = last && mc ? readingsOf([last]).map((x) => x.record) : [];
  const I = recs.find((x) => x.quantity === 'current');
  const th = recs.find((x) => x.quantity === 'angle');
  return { current: mc?.current ?? 0, core: mc?.core ?? true, angle: th?.value ?? 0, ...(I ? { amps: formatMeasured('current', I.value, 0.01, locale) } : {}), ...(th ? { read: formatMeasured('angle', th.value, 1, locale) } : {}) };
}

/**
 * The electromagnet, seen from above: the source, the key, the rheostat and the ammeter on the left; the coil wound on
 * the nail (or on a plastic straw) lying east–west; the compass on its axis to the right, «N» up, its needle turned by θ.
 */
function magnetSvg(m: MagnetView): string {
  const on = (m?.current ?? 0) > 0;
  const wire = on ? '#e2b04a' : '#9aa3ad';
  const W = (d: string) => `<path d="${d}" style="fill:none;stroke:${wire};stroke-width:2.2"/>`;
  const y = TABLE - 170;
  const low = TABLE - 90;
  const back = TABLE - 40;
  const source = `<rect x="200" y="${low - 24}" width="56" height="36" rx="5" style="fill:${DARK}"/><circle cx="212" cy="${low - 6}" r="3" style="fill:#c0392b"/><circle cx="244" cy="${low - 6}" r="3" style="fill:#222"/>`;
  const key = `<circle cx="282" cy="${low - 6}" r="3" style="fill:${DARK}"/><circle cx="308" cy="${low - 6}" r="3" style="fill:${DARK}"/><path d="M282,${low - 6} L${on ? 308 : 304},${on ? low - 6 : low - 20}" style="stroke:${DARK};stroke-width:3;stroke-linecap:round"/>`;
  const rheostat = `<rect x="322" y="${low - 14}" width="56" height="16" rx="3" style="fill:#d9c08a;stroke:#8a6d33"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${326 + i * 6},${low - 14} v16" style="stroke:#8a6d33;stroke-width:0.8"/>`).join('')}<path d="M${340 + Math.min(1, (m?.current ?? 0) / 2) * 30},${low - 22} v8" style="stroke:${DARK};stroke-width:3"/>`;
  // The coil: 60 px of windings on a 100 px nail (or the straw), centred at cx.
  const cx = 440;
  const straw = `<rect x="${cx - 52}" y="${y - 5}" width="104" height="10" rx="3" style="fill:rgba(230,236,242,0.6);stroke:#9aa3ad"/>`;
  // The nail, its head on the left; pulled out by the head, it slides left out of the winding (the straw stays in it).
  const nail = (dx: number) => `<g transform="translate(${dx} 0)"><rect x="${cx - 50}" y="${y - 4}" width="100" height="8" style="fill:#8a96a3;stroke:#59636e"/><path d="M${cx - 50},${y - 6} v12" style="stroke:#59636e;stroke-width:5"/></g>`;
  // Taken out, it lies where it was pulled to.
  const rod = m?.pull !== undefined ? straw + nail(-95 * m.pull) : m?.core === false ? straw + nail(-95) : nail(0);
  const turns = Array.from({ length: 16 }, (_, i) => `<path d="M${cx - 30 + i * 4},${y - 8} l2,16" style="stroke:${on ? '#d4893a' : '#b0703a'};stroke-width:2.2"/>`).join('');
  const leads = W(`M244,${low - 6} H282`) + W(`M308,${low - 6} H322`) + W(`M378,${low - 6} H${cx - 32} V${y + 8}`) + W(`M${cx + 32},${y + 8} V${back} H212 V${low - 6}`);
  const ammeter = meterSvg(330, back - 2, 'A', on ? (m?.current ?? 0) / 2 : 0, m?.amps);
  // The compass on the axis, 15 cm away (scaled down): N up; the needle's north end red.
  const kx = 552;
  const r = 28;
  const a = ((m?.angle ?? 0) * Math.PI) / 180;
  const tip = (s: number) => `${kx + s * (r - 5) * Math.sin(a)},${y - s * (r - 5) * Math.cos(a)}`;
  const side = (s: number) => `${kx + s * 4 * Math.cos(a)},${y + s * 4 * Math.sin(a)}`;
  const compass = `<path d="M${cx + 52},${y} H${kx - r - 4}" class="bench-mark" style="stroke-dasharray:3 4"/><circle cx="${kx}" cy="${y}" r="${r + 4}" style="fill:#c9a96e;stroke:#7a5a2a;stroke-width:2"/><circle cx="${kx}" cy="${y}" r="${r}" style="fill:#f4f1e8"/><text class="lever-mark" x="${kx}" y="${y - r + 10}" text-anchor="middle" style="font-size:9px;font-weight:700">N</text><path d="M${tip(1)} L${side(1)} L${tip(-1)} L${side(-1)} Z" style="fill:#c9ccd1"/><path d="M${tip(1)} L${side(1)} L${kx},${y} L${side(-1)} Z" style="fill:#c0392b"/><circle cx="${kx}" cy="${y}" r="2" style="fill:${DARK}"/>${m?.read ? `<text class="bench-reading" x="${kx}" y="${y + r + 22}" text-anchor="middle">θ = ${m.read}</text>` : ''}`;
  return `${leads}${source}${key}${rheostat}${ammeter}${rod}${turns}${compass}`;
}

/**
 * The electromagnet: the compass needle swings to its new turn and settles (its period and damping are the
 * drawing's). The nail taken out: it slides slowly out of the coil by its head, and the needle goes back as
 * it leaves — the field falls most as the last of it leaves the winding.
 */
function compass(was: MagnetView, next: MagnetView, draw: (v: MagnetView) => void): Motion | null {
  const m = next;
  const pulling = was.core && !m.core;
  if (!pulling && Math.abs(was.angle - m.angle) < 0.5) return null;
  const smooth = (k: number) => k * k * (3 - 2 * k);
  const out = new Channel(0, pulling ? 1 : 0, { kind: 'steady', speed: 0.4 }, 0.002);
  const needle = new Channel(was.angle, pulling ? was.angle : m.angle, { kind: 'damped', period: 1.2, damping: 0.22 }, 0.2);
  return {
    channels: [out, needle],
    frame: (done) => {
      if (pulling) needle.target = was.angle + (m.angle - was.angle) * smooth(out.value);
      const { read: _r, ...rest } = m;
      draw(done ? next : { ...rest, ...(pulling ? { core: true, pull: smooth(out.value) } : {}), angle: needle.value });
    },
  };
}

export const electromagnetScene = defineScene({ kind: 'magnet', view, svg: magnetSvg, motion: (next, draw, prev) => (prev ? compass(prev, next, draw) : null) });
