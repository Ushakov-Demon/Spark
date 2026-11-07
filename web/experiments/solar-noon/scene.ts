import { clockText, gnomonClock, gnomonPlace, solarNoon, sunOf, type GnomonCommand } from '../../../src/experiments/solar-noon/bench.js';
import { t } from '../../../src/knowledge/messages.js';
import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { WOOD, WOOD_EDGE } from '../../graphics/scene/kit.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/** The gnomon in the yard: 100 units to the metre; the stick's foot here, its shadow along the tape to the right. */
const GNOMON_X = 385;
const GNOMON_K = 115;
/** The compass needle: half its length; its north end red, the south grey. */
const NEEDLE = 9;
const RED = '#d9312b';
const GREY = '#7d858d';

/**
 * The gnomon: the shadows measured so far (their tips chalked on the ground, the clock time by each), the one being
 * measured now (its length, m, and the clock); `anim` — how many of the last ones to play one by one.
 */
export type GnomonView = { /** The compass on the stick: its ends' letters, the north end to the right (the shadow's way) or to the left. */ readonly compass: { readonly right: string; readonly left: string; readonly northRight: boolean }; readonly tips: readonly { readonly length: number; readonly time: string; readonly read: string }[]; readonly now?: { readonly length: number; readonly time: string; readonly read?: string }; readonly anim?: number };

function view({ log, last: lastStep, command, plan, locale }: SceneContext): GnomonView {
  // The noon shadow points north while the noon Sun is south of the zenith (south of the tropics in the north).
  const next = plan.find((s) => s.kind === 'bench' && s.command.type === 'lab.gnomon');
  const c = command?.type === 'lab.gnomon' ? (command as unknown as GnomonCommand) : next?.kind === 'bench' ? (next.command as unknown as GnomonCommand) : undefined;
  const place = gnomonPlace(c?.place);
  const south = place.lat < sunOf(solarNoon(place), gnomonClock(place).zone).decl;
  const [n, s] = [t(locale, 'solar-noon-scene-north'), t(locale, 'solar-noon-scene-south')];
  const compass = south ? { right: s, left: n, northRight: false } : { right: n, left: s, northRight: true };
  const done = log.filter((e) => e.command.type === 'lab.gnomon');
  const tips = done.flatMap((e) => readingsOf([e]).map((x) => ({ length: x.record.value ?? 0, time: clockText(x.record.inputs?.['time'] ?? 0), read: formatMeasured('length', x.record.value, 0.01, locale) })));
  const last = tips[tips.length - 1];
  const fresh = command?.type === 'lab.gnomon' && lastStep && readingsOf([lastStep]).length ? readingsOf([[...done].pop()!]).length : 0;
  return { compass, tips, ...(last ? { now: { length: last.length, time: last.time, read: last.read } } : {}), ...(fresh ? { anim: fresh } : {}) };
}

/**
 * The yard: the metre stick upright, its shadow on the ground along a tape, the Sun on the line through the stick's
 * top and the shadow's end (so the picture keeps the true angle), the clock; chalk ticks where the shadows ended.
 */
function gnomonSvg(g: GnomonView): string {
  const ground = TABLE - 4;
  const top = ground - GNOMON_K;
  const tape = `<rect x="${GNOMON_X}" y="${ground + 1}" width="${2 * GNOMON_K}" height="6" style="fill:#f1d36b;stroke:#a88a2c;stroke-width:0.6"/>${Array.from({ length: 21 }, (_, i) => `<path d="M${GNOMON_X + (i * GNOMON_K) / 10},${ground + 1} v${i % 5 ? 2.5 : 5}" style="stroke:#5a4a14;stroke-width:0.6"/>`).join('')}`;
  const stick = `<rect x="${GNOMON_X - 3.5}" y="${top}" width="7" height="${GNOMON_K}" rx="1" style="fill:${WOOD};stroke:${WOOD_EDGE}"/>`;
  const ticks = g.tips.map((t) => `<path d="M${GNOMON_X + t.length * GNOMON_K},${ground - 6} v8" style="stroke:#ffffff;stroke-width:1.6"/>`).join('');
  let now = '';
  if (g.now) {
    const L = g.now.length * GNOMON_K;
    // The Sun on the ray from the shadow's end through the stick's top, 80 units beyond the top.
    const dx = -L;
    const dy = -GNOMON_K;
    const r = Math.hypot(dx, dy);
    const sx = GNOMON_X + (dx / r) * 80;
    const sy = top + (dy / r) * 80;
    now = `<path d="M${sx},${sy} L${GNOMON_X + L},${ground}" style="stroke:#ffd54a;stroke-width:1;stroke-dasharray:3 4;opacity:0.7"/><circle cx="${sx}" cy="${sy}" r="13" style="fill:#ffd54a;stroke:#f0a500;stroke-width:2"/><path d="M${GNOMON_X},${ground - 1} H${GNOMON_X + L}" style="stroke:rgba(20,25,30,0.75);stroke-width:5;stroke-linecap:round"/>${g.now.read ? `<text class="bench-reading" x="${GNOMON_X + L}" y="${ground - 12}" text-anchor="middle">${g.now.read}</text>` : ''}`;
  }
  const clock = g.now ? `<rect x="${GNOMON_X + 100}" y="${top - 60}" width="64" height="26" rx="4" style="fill:#1d2a36;stroke:#56687a"/><text x="${GNOMON_X + 132}" y="${top - 41}" text-anchor="middle" style="font:700 15px monospace;fill:#7cf29a">${g.now.time}</text>` : '';
  // A compass hung on a nail on the stick, its needle along the tape: the red end to the north.
  const cy = top + 0.5 * GNOMON_K;
  const compass = `<path d="M${GNOMON_X},${top + 18} L${GNOMON_X - 6},${cy - 13} M${GNOMON_X},${top + 18} L${GNOMON_X + 6},${cy - 13}" style="stroke:#3a3f46;stroke-width:0.8"/><circle cx="${GNOMON_X}" cy="${top + 18}" r="1.5" style="fill:#3a3f46"/>
    <circle cx="${GNOMON_X}" cy="${cy}" r="14" style="fill:#c9a227;stroke:#7a6533;stroke-width:1.5"/><circle cx="${GNOMON_X}" cy="${cy}" r="11" style="fill:#f7f5ee;stroke:#7a6533;stroke-width:0.8"/>
    <path d="M${GNOMON_X},${cy - 3} L${GNOMON_X + NEEDLE},${cy} L${GNOMON_X},${cy + 3} z" style="fill:${g.compass.northRight ? RED : GREY}"/><path d="M${GNOMON_X},${cy - 3} L${GNOMON_X - NEEDLE},${cy} L${GNOMON_X},${cy + 3} z" style="fill:${g.compass.northRight ? GREY : RED}"/><circle cx="${GNOMON_X}" cy="${cy}" r="1.6" style="fill:#3a3f46"/>
    <text class="bench-label" x="${GNOMON_X + 18}" y="${cy + 4}">${g.compass.right}</text><text class="bench-label" x="${GNOMON_X - 18}" y="${cy + 4}" text-anchor="end">${g.compass.left}</text>`;
  return `${tape}${ticks}${now}${stick}${compass}${clock}`;
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
      draw({ ...g, tips: [...before, ...fresh.slice(0, f >= 1 ? k + 1 : k)], now: { length, time: to.time, ...(f >= 1 ? { read: to.read } : {}) } });
    },
  };
}

export const solarNoonScene = defineScene({ kind: 'gnomon', view, svg: gnomonSvg, share: 0.92, motion: gnomonRun });
