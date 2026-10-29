import { WINCH_SPOOLS, type WinchSpool } from '../../../src/experiments/windlass/bench.js';
import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { CM, DARK, rulerSvg, standSvg, STEEL, THREAD, weightsSvg, WOOD_EDGE } from '../../graphics/scene/kit.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/** The windlass's drawing: its axis, and the load's way down the ruler (6 units to the centimetre, as the other rulers). */
const WINCH_AXIS = { x: 520, y: 64 };
/** The windlass: where the load is before the handle is turned, m below the spool. */
const WINCH_LOW = 0.33;

/**
 * A windlass: the spool and its diameter (m); how far it has turned (turns, + — the way letting the load down
 * turns it); the load's depth below the spool (m); what was counted or measured.
 */
export type WinchView = { readonly spool: string; readonly d: number; readonly turned: number; readonly drop: number; readonly read?: string };

function view({ last, command, plan, locale }: SceneContext): WinchView {
  const r = last ? readingsOf([last])[0]?.record : undefined;
  type Winch = { spool: WinchSpool; mode: 'lower' | 'turn'; amount: number };
  const wc = command?.type === 'lab.winch' ? (command as unknown as Winch) : undefined;
  const next = plan.find((s) => s.kind === 'bench' && s.command.type === 'lab.winch');
  const cmd = wc ?? (next?.kind === 'bench' ? (next.command as unknown as Winch) : undefined);
  const d = WINCH_SPOOLS[cmd?.spool ?? 'reel'];
  const done = wc && r;
  // Turned by the handle, the load starts low (where letting it down took it, and a little more).
  const drop = !done ? (cmd?.mode === 'turn' ? WINCH_LOW : 0) : wc.mode === 'lower' ? wc.amount : WINCH_LOW - Math.PI * d * wc.amount;
  const turned = !done ? 0 : wc.mode === 'lower' ? wc.amount / (Math.PI * d) : -wc.amount;
  const read = done ? (wc.mode === 'lower' ? `n = ${formatMeasured('turns', r.value, 0.25, locale)}` : `h = ${String(Math.round((r.value ?? 0) * 1000) / 10).replace('.', locale === 'uk' ? ',' : '.')} ${locale === 'uk' ? 'см' : 'cm'}`) : undefined;
  return { spool: cmd?.spool ?? 'reel', d, turned, drop, ...(read ? { read } : {}) };
}

/**
 * A windlass: a stand with the axis at the arm's end, the spool on it (drawn some 2½ times larger than life) with a
 * red mark and a handle that turn together; the thread from the spool's right edge down to the load; a ruler beside
 * it from the spool's level down. The reading by the load.
 */
function winchSvg(w: WinchView): string {
  const { x, y } = WINCH_AXIS;
  const r = w.d * 1000 * 1.1 + 2;
  const top = y + 24;
  const loadY = top + w.drop * 100 * CM;
  const a = w.turned * 2 * Math.PI;
  const stand = standSvg(x - 90, x, y);
  const ruler = rulerSvg(x + r + 26, top, 35, true);
  const thread = `<path d="M${x + r},${y} V${loadY}" style="stroke:${THREAD};stroke-width:1.6"/>`;
  const load = `${weightsSvg(x + r, loadY, 2, 20, 9)}<path d="M${x + r - 30},${loadY} h26" style="stroke:#c0392b;stroke-width:1.5"/>`;
  const spool = w.spool === 'pencil'
    ? `<circle cx="${x}" cy="${y}" r="${r}" style="fill:#f2c94c;stroke:#9a7a1f;stroke-width:1.5"/><circle cx="${x}" cy="${y}" r="${r * 0.35}" style="fill:#3a3f46"/>`
    : `<circle cx="${x}" cy="${y}" r="${r + 5}" style="fill:#d9b27c;stroke:${WOOD_EDGE};stroke-width:1.5"/><circle cx="${x}" cy="${y}" r="${r}" style="fill:#f1efe4;stroke:#c9c2a8"/><circle cx="${x}" cy="${y}" r="3" style="fill:${DARK}"/>`;
  // The mark and the handle turn with the spool (letting the load down turns it clockwise).
  const mark = `<path d="M${x},${y} L${x + r * Math.sin(a)},${y - r * Math.cos(a)}" style="stroke:#c0392b;stroke-width:2.5"/>`;
  const hx = x - 34 * Math.sin(a + Math.PI / 3);
  const hy = y + 34 * Math.cos(a + Math.PI / 3);
  const handle = `<path d="M${x},${y} L${hx},${hy}" style="stroke:${STEEL};stroke-width:4;stroke-linecap:round"/><circle cx="${hx}" cy="${hy}" r="5" style="fill:#7a4a1f"/>`;
  const read = w.read ? `<text class="bench-reading" x="${x + r - 34}" y="${loadY + 14}" text-anchor="end">${w.read}</text>` : '';
  return `${stand}${ruler}${thread}${load}${handle}${spool}${mark}${read}`;
}

/**
 * A windlass: the load goes down (or up) steadily and the spool turns with it — as many turns as the thread's length
 * over the circumference — in about three seconds.
 */
function winch(next: WinchView, draw: (v: WinchView) => void): Motion {
  const w = next;
  // Let down — from the spool; turned up — from where the handle's turns started it (low on the ruler).
  const from = w.turned < 0 ? w.drop + Math.PI * w.d * -w.turned : 0;
  const k = new Channel(0, 1, { kind: 'steady', speed: 0.35 }, 0.001);
  return {
    channels: [k],
    frame: (done) => {
      if (done) return draw(next);
      const { read: _r, ...rest } = w;
      draw({ ...rest, drop: from + (w.drop - from) * k.value, turned: w.turned * k.value });
    },
  };
}

export const windlassScene = defineScene({ kind: 'winch', view, svg: winchSvg, motion: (next, draw) => (next.read ? winch(next, draw) : null) });
