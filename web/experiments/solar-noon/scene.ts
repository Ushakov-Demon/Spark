import { clockText } from '../../../src/experiments/solar-noon/bench.js';
import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { WOOD, WOOD_EDGE } from '../../graphics/scene/kit.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/** The gnomon in the yard: 100 units to the metre; the stick's foot here, its shadow along the tape to the right. */
const GNOMON_X = 420;
const GNOMON_K = 80;

/**
 * The gnomon: the shadows measured so far (their tips chalked on the ground, the clock time by each), the one being
 * measured now (its length, m, and the clock); `anim` — how many of the last ones to play one by one.
 */
export type GnomonView = { readonly tips: readonly { readonly length: number; readonly time: string; readonly read: string }[]; readonly now?: { readonly length: number; readonly time: string; readonly read?: string }; readonly anim?: number };

function view({ log, last: lastStep, command, locale }: SceneContext): GnomonView {
  const done = log.filter((e) => e.command.type === 'lab.gnomon');
  const tips = done.flatMap((e) => readingsOf([e]).map((x) => ({ length: x.record.value ?? 0, time: clockText(x.record.inputs?.['time'] ?? 0), read: formatMeasured('length', x.record.value, 0.01, locale) })));
  const last = tips[tips.length - 1];
  const fresh = command?.type === 'lab.gnomon' && lastStep && readingsOf([lastStep]).length ? readingsOf([[...done].pop()!]).length : 0;
  return { tips, ...(last ? { now: { length: last.length, time: last.time, read: last.read } } : {}), ...(fresh ? { anim: fresh } : {}) };
}

/**
 * The yard: the metre stick upright, its shadow on the ground along a tape, the Sun on the line through the stick's
 * top and the shadow's end (so the picture keeps the true angle), the clock; chalk ticks where the shadows ended.
 */
function gnomonSvg(g: GnomonView): string {
  const ground = TABLE - 4;
  const top = ground - GNOMON_K;
  const tape = `<rect x="${GNOMON_X}" y="${ground + 1}" width="${2 * GNOMON_K}" height="6" style="fill:#f1d36b;stroke:#a88a2c;stroke-width:0.6"/>${Array.from({ length: 21 }, (_, i) => `<path d="M${GNOMON_X + i * 8},${ground + 1} v${i % 5 ? 2.5 : 5}" style="stroke:#5a4a14;stroke-width:0.6"/>`).join('')}`;
  const stick = `<rect x="${GNOMON_X - 2.5}" y="${top}" width="5" height="${GNOMON_K}" rx="1" style="fill:${WOOD};stroke:${WOOD_EDGE}"/>`;
  const ticks = g.tips.map((t) => `<path d="M${GNOMON_X + t.length * GNOMON_K},${ground - 6} v8" style="stroke:#ffffff;stroke-width:1.6"/>`).join('');
  let now = '';
  if (g.now) {
    const L = g.now.length * GNOMON_K;
    // The Sun on the ray from the shadow's end through the stick's top, 105 units beyond the top.
    const dx = -L;
    const dy = -GNOMON_K;
    const r = Math.hypot(dx, dy);
    const sx = GNOMON_X + (dx / r) * 105;
    const sy = top + (dy / r) * 105;
    now = `<path d="M${sx},${sy} L${GNOMON_X + L},${ground}" style="stroke:#ffd54a;stroke-width:1;stroke-dasharray:3 4;opacity:0.7"/><circle cx="${sx}" cy="${sy}" r="13" style="fill:#ffd54a;stroke:#f0a500;stroke-width:2"/><path d="M${GNOMON_X},${ground - 1} H${GNOMON_X + L}" style="stroke:rgba(20,25,30,0.75);stroke-width:5;stroke-linecap:round"/>${g.now.read ? `<text class="bench-reading" x="${GNOMON_X + L}" y="${ground - 12}" text-anchor="middle">${g.now.read}</text>` : ''}`;
  }
  const clock = g.now ? `<rect x="${GNOMON_X + 100}" y="${top - 60}" width="64" height="26" rx="4" style="fill:#1d2a36;stroke:#56687a"/><text x="${GNOMON_X + 132}" y="${top - 41}" text-anchor="middle" style="font:700 15px monospace;fill:#7cf29a">${g.now.time}</text>` : '';
  return `${tape}${ticks}${now}${stick}${clock}`;
}

/** The gnomon: the series' shadows one after another — the Sun moves, the shadow turns to its length, a chalk tick. */
function gnomonRun(next: GnomonView, draw: (v: GnomonView) => void): Motion | null {
  const g = next;
  if (!g.anim) return null;
  const n = Math.min(g.anim ?? 0, g.tips.length);
  if (!n) return { channels: [], frame: () => draw(next) };
  const before = g.tips.slice(0, g.tips.length - n);
  const fresh = g.tips.slice(g.tips.length - n);
  const each = 1.1;
  const clock = new Channel(0, n * each, { kind: 'steady', speed: 1 }, 1e-4);
  return {
    channels: [clock],
    frame: (done) => {
      if (done) return draw(next);
      // (Before the first tick the channel has no value yet.)
      const u = (Number.isFinite(clock.value) ? clock.value : 0) / each;
      const k = Math.max(0, Math.min(n - 1, Math.floor(u)));
      const f = Math.min(1, (u - k) / 0.6);
      const from = k > 0 ? fresh[k - 1]! : (before[before.length - 1] ?? fresh[0]!);
      const to = fresh[k]!;
      const length = from.length + (to.length - from.length) * f;
      draw({ tips: [...before, ...fresh.slice(0, f >= 1 ? k + 1 : k)], now: { length, time: to.time, ...(f >= 1 ? { read: to.read } : {}) } });
    },
  };
}

export const solarNoonScene = defineScene({ kind: 'gnomon', view, svg: gnomonSvg, motion: gnomonRun });
