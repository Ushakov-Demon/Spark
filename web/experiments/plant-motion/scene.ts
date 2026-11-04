import { MOSO_HEIGHT, shootAt, type PlantCommand } from '../../../src/experiments/plant-motion/bench.js';
import { heightText, spanText } from '../../../src/experiments/plant-motion/words.js';
import { NUMBER_LOCALE } from '../../../src/knowledge/i18n.js';
import { t } from '../../../src/knowledge/messages.js';
import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { DARK, STEEL } from '../../graphics/scene/kit.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/**
 * A moso bamboo shoot in a tub by a red-and-white measuring pole, a camera on a tripod taking a photo now and then,
 * the time since the first photo on its display; the pole to one scale for the whole run (as tall as the tallest
 * photo needs). The «what if…»: a Venus flytrap, magnified, its two lobes snapping shut frame by frame.
 */
export type PlantView = {
  readonly mode: 'shoot' | 'trap';
  /** The shoot: its height, m, the time since the first photo, s; the pole's height, m. */
  readonly h: number;
  readonly t: number;
  readonly pole: number;
  /** The trap: how far shut (0 — open, 1 — shut), the frames counted of all, the camera's frames a second. */
  readonly shut: number;
  readonly frame: number;
  readonly frames: number;
  readonly read?: string;
  readonly labels: { readonly t: string; readonly frame: string; readonly magnified: string };
  readonly locale: 'uk' | 'en';
};

type Cmd = PlantCommand;

/** The pole: its x, the ground (the tub's soil) and the top it may reach. */
const POLE_X = 430;
const GROUND = TABLE - 22;
const TOP = 30;

function view({ log, last, command, plan, locale }: SceneContext): PlantView {
  const mine = command?.type === 'lab.plant' ? (command as unknown as Cmd) : undefined;
  const all = [...log.map((e) => e.command), ...plan.filter((s) => s.kind === 'bench').map((s) => (s.kind === 'bench' ? s.command : { type: '' }))].filter((c) => c.type === 'lab.plant') as unknown as Cmd[];
  const tMax = Math.max(0, ...all.map((c) => (c.step === 'shoot' ? c.t : 0)));
  const r = mine && last ? readingsOf([last])[0]?.record : undefined;
  const base = { pole: Math.min(MOSO_HEIGHT.value, shootAt(tMax)) * 1.15, shut: 0, frame: 0, frames: 0, locale, ...(r ? { read: mine?.step === 'trap' ? formatMeasured('time', r.value, r.inputs?.['division'] ?? 0.01, locale) : `h = ${heightText(r.value ?? 0, locale)}` } : {}) };
  const labels = (tt: number, f: number, n: number) => ({ t: spanText(tt, locale), frame: t(locale, 'plant-motion-scene-frame', { f, n }), magnified: t(locale, 'plant-motion-scene-magnified') });
  if (mine?.step === 'trap') {
    const n = r?.inputs?.['frames'] ?? 0;
    return { ...base, mode: 'trap', h: 0, t: 0, shut: 1, frame: n, frames: n, labels: labels(0, n, n) };
  }
  const tt = mine?.step === 'shoot' ? mine.t : 0;
  return { ...base, mode: 'shoot', h: shootAt(tt), t: tt, labels: labels(tt, 0, 0) };
}

function shootSvg(v: PlantView): string {
  const perM = (GROUND - TOP) / v.pole;
  const y = (m: number) => GROUND - m * perM;
  // The pole: red and white by the decimetre, or by the metre when it is tall; numbered in metres.
  const step = v.pole > 4 ? 1 : 0.1;
  const bands = Array.from({ length: Math.ceil(v.pole / step) }, (_, i) => `<rect x="${POLE_X - 5}" y="${y((i + 1) * step)}" width="10" height="${step * perM}" style="fill:${i % 2 ? '#f4f1e8' : '#c0392b'}"/>`).join('');
  const every = v.pole > 12 ? 5 : v.pole > 4 ? 1 : v.pole > 1.6 ? 0.5 : 0.2;
  const nums = Array.from({ length: Math.floor(v.pole / every) + 1 }, (_, i) => i * every).map((m) => `<path d="M${POLE_X + 5},${y(m)} h5" style="stroke:#e8e2cf;stroke-width:1"/><text x="${POLE_X + 12}" y="${y(m) + 3}" style="font:600 8px system-ui,sans-serif;fill:#e8e2cf">${new Intl.NumberFormat(NUMBER_LOCALE[v.locale]).format(Number(m.toFixed(1)))}</text>`).join('');
  const pole = `${bands}<rect x="${POLE_X - 5}" y="${TOP}" width="10" height="${GROUND - TOP}" style="fill:none;stroke:#555;stroke-width:0.8"/>${nums}`;
  // The tub with soil; the shoot a tapering green cone wrapped in brown sheaths, its tip at h.
  const tub = `<path d="M${POLE_X - 110},${GROUND - 6} h120 l-10,${TABLE - GROUND + 6} h-100 Z" style="fill:#8a5a3a;stroke:#5e3a22;stroke-width:1.5"/><rect x="${POLE_X - 108}" y="${GROUND - 6}" width="116" height="6" style="fill:#4a3426"/>`;
  const sx = POLE_X - 50;
  const top = y(v.h);
  const w = Math.min(16, 4 + (GROUND - top) * 0.06);
  const count = Math.max(2, Math.floor((GROUND - top) / 22));
  const sheaths = Array.from({ length: count }, (_, i) => {
    const yy = GROUND - ((i + 0.5) * (GROUND - top)) / count;
    const ww = w * (1 - (GROUND - yy) / (GROUND - top + 1)) + 2;
    return `<path d="M${sx - ww},${yy + 6} Q${sx},${yy - 6} ${sx + ww},${yy + 6}" style="fill:none;stroke:#8a6a3a;stroke-width:2"/>`;
  }).join('');
  const shoot = `<path d="M${sx - w},${GROUND - 6} Q${sx - w * 0.5},${(GROUND + top) / 2} ${sx},${top} Q${sx + w * 0.5},${(GROUND + top) / 2} ${sx + w},${GROUND - 6} Z" style="fill:#7bb661;stroke:#4f7f3a;stroke-width:1.2"/>${sheaths}`;
  // The tip's height carried over to the pole.
  const mark = `<path d="M${sx + 4},${top} H${POLE_X - 6}" style="stroke:#ffd166;stroke-width:1;stroke-dasharray:3 3"/>`;
  // The camera on its tripod, the time since the first photo on its display.
  const cam = `<path d="M545,${TABLE} L560,${TABLE - 70} L575,${TABLE} M560,${TABLE - 70} V${TABLE}" style="stroke:${STEEL};stroke-width:3"/><rect x="532" y="${TABLE - 100}" width="62" height="32" rx="5" style="fill:${DARK}"/><circle cx="532" cy="${TABLE - 84}" r="9" style="fill:#222;stroke:#999;stroke-width:2"/><rect x="543" y="${TABLE - 96}" width="47" height="14" rx="2" style="fill:#c9d6b8"/><text x="587" y="${TABLE - 85}" text-anchor="end" style="font:700 9px ui-monospace,monospace;fill:#1d2a1d">${v.labels.t}</text>`;
  const read = v.read ? `<text class="bench-reading" x="${sx - w - 8}" y="${top + 4}" text-anchor="end">${v.read}</text>` : '';
  return `${tub}${pole}${shoot}${mark}${cam}${read}`;
}

function trapSvg(v: PlantView): string {
  // The two lobes on their midrib, opening up to 70° each side; the teeth along their edges.
  const cx = 440;
  const cy = 210;
  const L = 70;
  const open = (1 - v.shut) * 70 * (Math.PI / 180) + 0.06;
  const lobe = (side: 1 | -1) => {
    const a = -Math.PI / 2 + side * open;
    const ex = cx + L * Math.cos(a);
    const ey = cy + L * Math.sin(a);
    const nx = -Math.sin(a) * side;
    const ny = Math.cos(a) * side;
    const teeth = Array.from({ length: 7 }, (_, i) => {
      const k = (i + 1) / 8;
      const px = cx + (ex - cx) * k + nx * 8 * Math.sin(Math.PI * k);
      const py = cy + (ey - cy) * k + ny * 8 * Math.sin(Math.PI * k);
      return `<path d="M${px},${py} l${Math.cos(a) * 4 - nx * 10},${Math.sin(a) * 4 - ny * 10}" style="stroke:#9ccc65;stroke-width:1.5"/>`;
    }).join('');
    return `<path d="M${cx},${cy} Q${cx + (ex - cx) / 2 + nx * 20},${cy + (ey - cy) / 2 + ny * 20} ${ex},${ey} Z" style="fill:#c0392b;stroke:#7cb342;stroke-width:3"/>${teeth}`;
  };
  const stem = `<path d="M${cx},${cy} V${TABLE - 30}" style="stroke:#7cb342;stroke-width:5"/><path d="M${cx - 45},${TABLE - 30} h90 l-10,30 h-70 Z" style="fill:#8a5a3a;stroke:#5e3a22;stroke-width:1.5"/>`;
  const fly = v.shut < 0.6 ? `<g transform="translate(${cx - 2},${cy - 40})"><ellipse cx="0" cy="0" rx="6" ry="3.5" style="fill:#222"/><ellipse cx="-3" cy="-4" rx="4" ry="2" style="fill:rgba(220,230,255,0.8)"/><ellipse cx="3" cy="-4" rx="4" ry="2" style="fill:rgba(220,230,255,0.8)"/></g>` : '';
  const counter = `<rect x="508" y="40" width="86" height="34" rx="5" style="fill:${DARK}"/><text x="551" y="61" text-anchor="middle" style="font:700 10px ui-monospace,monospace;fill:#ffd166">${v.labels.frame}</text>`;
  const note = `<text x="${cx}" y="${TABLE - 36}" text-anchor="middle" style="font:600 9px system-ui,sans-serif;fill:#e8e2cf">${v.labels.magnified}</text>`;
  const read = v.read ? `<text class="bench-reading" x="551" y="92" text-anchor="middle">t = ${v.read}</text>` : '';
  return `${stem}${lobe(1)}${lobe(-1)}${fly}${counter}${note}${read}`;
}

const svg = (v: PlantView): string => (v.mode === 'trap' ? trapSvg(v) : shootSvg(v));

/** Time-lapse: the shoot grows from the last photo to this one while the time runs; slow motion: the lobes shut frame by frame. About two seconds and a half. */
function motion(next: PlantView, draw: (v: PlantView) => void, prev: PlantView | null): Motion | null {
  if (!next.read) return null;
  const { read: _r, ...rest } = next;
  void _r;
  const clock = new Channel(0, 1, { kind: 'steady', speed: 0.4 }, 1e-6);
  if (next.mode === 'trap') {
    return {
      channels: [clock],
      frame: (done) => {
        if (done) return draw(next);
        // A still moment first, then the snap — frame by frame.
        const x = Math.max(0, (clock.value - 0.3) / 0.7);
        const f = Math.floor(x * next.frames);
        draw({ ...rest, shut: next.frames ? f / next.frames : x, frame: f, labels: { ...rest.labels, frame: t(rest.locale, 'plant-motion-scene-frame', { f, n: next.frames }) } });
      },
    };
  }
  const t0 = prev && prev.mode === 'shoot' && prev.t <= next.t ? prev.t : 0;
  return {
    channels: [clock],
    frame: (done) => {
      if (done) return draw(next);
      const tt = t0 + (next.t - t0) * clock.value;
      draw({ ...rest, h: shootAt(tt), t: tt, labels: { ...rest.labels, t: spanText(tt, rest.locale) } });
    },
  };
}

export const plantMotionScene = defineScene({ kind: 'plant', view, svg, motion });
