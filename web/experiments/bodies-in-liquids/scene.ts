import { type SinkLiquid, sinkLiquidName } from '../../../src/experiments/bodies-in-liquids/bench.js';
import { tr } from '../../../src/knowledge/i18n.js';
import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { PLAY_SECONDS } from '../../graphics/scene/bench-motion.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { stopwatchSvg } from '../../graphics/scene/kit.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/**
 * A body moving through a liquid: a tall vessel (a bottle turned upside down, or a measuring cylinder) with marks every
 * few centimetres (8 px to the centimetre, the zero mark near the start); the bubble rises from below, the ball sinks
 * from above; it stands where the step left it — at the last mark.
 */
/** How far before the zero mark the body starts (the bottle's neck, the liquid's surface), m: it has its steady speed by the zero mark. */
const SINK_LEAD = 30 / 800;

/** A body in a liquid: a bubble in the bottle or a ball in the cylinder; the liquid's colour; its marks (m from the zero one) and where the body is now (m past the zero mark; none — not let go yet); its size, m. */
export type Sink = { readonly body: 'bubble' | 'ball'; readonly color: string; readonly marks: readonly number[]; readonly at?: number; readonly diameter: number; readonly label?: string; readonly speed?: number; readonly turn?: number };
/** A body in a liquid, the stopwatch and the run; the bottle carried along the table, when it is (relative-motion). */
export type SinkView = { readonly sink: Sink; readonly stopwatch?: { readonly display: string; readonly fast?: number }; readonly run?: { readonly seconds: number }; readonly carry?: { readonly speed: number; readonly shift: number; readonly path?: string; readonly rise?: string } };

function view({ last, command, plan, locale }: SceneContext): SinkView {
  const sc = command?.type === 'lab.sink' ? (command as unknown as { body: 'bubble' | 'ball'; liquid: string; diameter: number; marks: number[] }) : undefined;
  const next = plan.find((s) => s.kind === 'bench' && s.command.type === 'lab.sink');
  const cmd = sc ?? (next?.kind === 'bench' ? (next.command as unknown as { body: 'bubble' | 'ball'; liquid: string; diameter: number; marks: number[] }) : undefined);
  const laps = last && sc ? readingsOf([last]).map((x) => x.record).filter((x) => x.quantity === 'time') : [];
  const lap = laps[laps.length - 1];
  const color = { 'washing-up': 'rgba(120,200,120,0.55)', glycerol: 'rgba(225,235,245,0.55)', 'sunflower-oil': 'rgba(240,200,80,0.6)', water: 'rgba(120,170,230,0.5)' }[cmd?.liquid ?? 'water'] ?? 'rgba(120,170,230,0.5)';
  const label = cmd ? (cmd.body === 'bubble' ? `${locale === 'uk' ? 'бульбашка' : 'bubble'} ≈ ${String(cmd.diameter * 1000).replace('.', locale === 'uk' ? ',' : '.')} ${locale === 'uk' ? 'мм' : 'mm'}` : tr({ uk: sinkLiquidName(cmd.liquid as SinkLiquid).uk, en: sinkLiquidName(cmd.liquid as SinkLiquid).en }, locale)) : undefined;
  return { ...(lap ? { stopwatch: { display: formatMeasured('time', lap.value, 0.01, locale).replace(/ (с|s)$/, '') }, run: { seconds: lap.value ?? 0 } } : {}), sink: { body: cmd?.body ?? 'ball', color, marks: cmd?.marks ?? [], diameter: cmd?.diameter ?? 0.002, ...(lap ? { at: lap.inputs?.['mark'] ?? 0, speed: lap.inputs?.['speed'] ?? 0 } : {}), ...(label ? { label } : {}) } };
}

export function sinkSvg(s: Sink): string {
  const k = 800;
  const x = 400;
  const bubble = s?.body === 'bubble';
  const w = bubble ? 60 : 40;
  const bottom = TABLE - 8;
  const top = bottom - 200;
  const zero = bubble ? bottom - 30 : top + 30;
  const dir = bubble ? -1 : 1;
  const glass = bubble
    ? `<path d="M${x - w / 2},${top + 10} V${bottom - 6} q0,6 6,6 H${x + w / 2 - 6} q6,0 6,-6 V${top + 10} q0,-10 -10,-10 H${x - w / 2 + 10} q-10,0 -10,10 Z" style="fill:${s?.color ?? 'rgba(120,200,120,0.5)'};stroke:#8fb8dd;stroke-width:2"/><rect x="${x - 8}" y="${bottom}" width="16" height="6" style="fill:#c0392b"/>`
    : `<rect x="${x - w / 2}" y="${top}" width="${w}" height="${bottom - top}" style="fill:${s?.color ?? 'rgba(120,170,230,0.5)'};stroke:#8fb8dd;stroke-width:2"/><rect x="${x - w / 2 - 8}" y="${bottom - 4}" width="${w + 16}" height="6" rx="2" style="fill:#8fb8dd"/>`;
  const marks = [0, ...(s?.marks ?? [])].map((m) => `<path d="M${x + w / 2 - 10},${zero + dir * m * k} h14" style="stroke:#3d3d3d;stroke-width:1.2"/><text x="${x + w / 2 + 8}" y="${zero + dir * m * k + 3}" style="font:600 10px system-ui,sans-serif;fill:#efe9d2">${Math.round(m * 100)}</text>`).join('');
  const at = s?.at;
  // (Not to scale: a millimetre ball would be a dot.)
  const r = Math.max(bubble ? 2.5 : 4.5, (s?.diameter ?? 0.002) * 1000 * (bubble ? 1.6 : 3));
  // A steel ball: dark, with a highlight (it must not melt into the liquid).
  const steel = `<defs><radialGradient id="sink-steel" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#ffffff"/><stop offset="0.25" stop-color="#9aa6b2"/><stop offset="1" stop-color="#1f262d"/></radialGradient></defs>`;
  const body = at === undefined || s?.turn !== undefined ? '' : bubble ? `<circle cx="${x}" cy="${zero + dir * at * k}" r="${r}" style="fill:rgba(255,255,255,0.85);stroke:#6c8fb0"/>` : `${steel}<circle cx="${x}" cy="${zero + dir * at * k}" r="${r}" style="fill:url(#sink-steel);stroke:#11161b;stroke-width:0.8"/>`;
  const label = s?.label ? `<text class="bench-reading" x="${x}" y="${top - 10}" text-anchor="middle">${s.label}</text>` : '';
  // The bottle being turned over (1 — still upright, its air under the cap at the top; 0 — upside down).
  const turn = s?.turn;
  if (bubble && turn !== undefined) {
    const air = turn > 0.5 ? `<rect x="${x - w / 2 + 2}" y="${bottom - 14}" width="${w - 4}" height="8" style="fill:rgba(255,255,255,0.75)"/>` : '';
    return `<g transform="rotate(${180 * turn} ${x} ${(top + bottom) / 2})">${glass}${air}</g>${label}`;
  }
  return `${glass}${marks}${body}${label}`;
}

/**
 * A body through a liquid: the bottle is turned over first (a bubble), then the body goes at its steady speed from
 * where it starts (the neck, the surface) past the zero mark — the stopwatch starts there — to the last mark.
 * A long run is sped up, the turn of the bottle with it, so it takes about a second whatever the speed-up.
 */
export function through<V extends SinkView>(next: V, run: NonNullable<SinkView['run']>, s: Sink, draw: (v: V) => void): Motion {
  const fast = Math.max(1, run.seconds / PLAY_SECONDS);
  const comma = (next.stopwatch?.display ?? ',').includes(',');
  // (The display's own width: the seconds without their unit, as the reading itself.)
  const lcd = (t: number) => t.toFixed(2).replace('.', comma ? ',' : '.');
  const v = s.speed!;
  const flip = s.body === 'bubble' ? 1.2 * fast : 0;
  const lead = SINK_LEAD / v;
  const clock = new Channel(0, flip + lead + run.seconds, { kind: 'steady', speed: fast }, 1e-6);
  return {
    channels: [clock],
    frame: (done) => {
      const u = clock.value;
      if (!done && u < flip) return draw({ ...next, stopwatch: { display: lcd(0), fast }, sink: { ...s, turn: 1 - u / flip }, ...(next.carry ? { carry: { speed: next.carry.speed, shift: 0 } } : {}) } as V);
      const t = u - flip - lead;
      const sink = { ...s, at: done ? (s.at ?? 0) : t < 0 ? -SINK_LEAD + (u - flip) * v : t * v };
      // (The carried bottle: moved from the moment the bubble passes the zero mark; its marks measured at the end.)
      const carry = next.carry && !done ? { speed: next.carry.speed, shift: next.carry.speed * Math.max(0, t) } : next.carry;
      return draw({ ...next, stopwatch: { display: done ? (next.stopwatch?.display ?? lcd(t)) : lcd(Math.max(0, t)), fast }, sink, ...(carry ? { carry } : {}) } as V);
    },
  };
}

export const bodiesInLiquidsScene = defineScene({
  kind: 'sink',
  view,
  svg: (v: SinkView) => `${sinkSvg(v.sink)}${v.stopwatch ? stopwatchSvg(v.stopwatch, 520) : ''}`,
  motion: (next, draw) => (next.run && next.sink.speed ? through(next, next.run, next.sink, draw) : null),
});
