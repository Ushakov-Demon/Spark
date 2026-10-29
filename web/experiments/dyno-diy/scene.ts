import { BENCH_SPRING_K } from '../../../src/scenarios/bench-kit.js';
import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { DARK, PLASTICINE, springSvg, STEEL, THREAD, weightsSvg, WOOD, WOOD_EDGE } from '../../graphics/scene/kit.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/**
 * A home-made dynamometer: what hangs on it (`weights` 100 g each, or the apple, or the egg in its bag), the pointer
 * `stretch` m below the zero, the pencil `marks` (m), the scale once divided (`newton` — its length, m; `drawn` 0…1 —
 * how much of it is drawn so far); `unit` — «Н».
 */
/** The home-made dynamometer: 12 units of the drawing to a centimetre; the zero's height. */
const DYNO_K = 1200;
const DYNO_ZERO = 130;
export type DynoView = { readonly weights: number; readonly hang?: 'apple' | 'egg' | 'band'; readonly stretch: number; readonly marks: readonly number[]; readonly newton?: number; readonly drawn?: number; readonly unit: string; readonly read?: string; /** The step just done, to be played. */ readonly anim?: 'marks' | 'scale' | 'apple' | 'egg' };

function view({ log, last, command, plan, locale }: SceneContext): DynoView {
  type Step = 'marks' | 'scale' | 'apple' | 'egg';
  const done = log.filter((e) => e.ok && e.command.type === 'lab.dyno');
  const stepOf = (e: (typeof done)[number]) => (e.command as unknown as { step: Step }).step;
  const recOf = (s: Step) => { const e = done.find((x) => stepOf(x) === s); return e ? readingsOf([e]).map((x) => x.record) : []; };
  const marks = recOf('marks').map((r) => r.value ?? 0);
  const newton = recOf('scale')[0]?.value ?? undefined;
  const lastStep = done.length ? stepOf(done[done.length - 1]!) : undefined;
  const hangRec = lastStep === 'apple' || lastStep === 'egg' ? recOf(lastStep)[0] : undefined;
  const cs = command?.type === 'lab.dyno' ? (command as unknown as { step: Step }).step : undefined;
  const unit = locale === 'uk' ? 'Н' : 'N';
  const read = hangRec && cs ? formatMeasured('force', hangRec.value, 0.1, locale) : undefined;
  return { weights: lastStep === 'marks' ? 3 : 0, ...(hangRec ? { hang: lastStep as 'apple' | 'egg' } : {}), stretch: lastStep === 'marks' ? marks[2] ?? 0 : hangRec?.inputs?.['pointer'] ?? 0, marks, ...(newton ? { newton } : {}), unit, ...(read ? { read } : {}), ...(cs ? { anim: cs } : {}) };
}

/**
 * The home-made dynamometer: a board with a strip of paper, the spring from a nail, a wire pointer over the paper,
 * a hook below with the load; pencil marks on the paper; once divided, the scale in newtons.
 */
export function dynoSvg(d: DynoView): string {
  const x = 452;
  const top = 64;
  const y = DYNO_ZERO + d.stretch * DYNO_K;
  const board = `<rect x="${x - 34}" y="${top - 14}" width="104" height="${TABLE - top + 4}" rx="3" style="fill:${WOOD};stroke:${WOOD_EDGE}"/><rect x="${x + 18}" y="${top + 30}" width="40" height="${TABLE - top - 50}" style="fill:#fbf8ef;stroke:#d8d0bb;stroke-width:0.8"/><circle cx="${x}" cy="${top}" r="3" style="fill:${DARK}"/>`;
  const zero = `<path d="M${x + 18},${DYNO_ZERO} h12" style="stroke:#555;stroke-width:1.2"/><text x="${x + 34}" y="${DYNO_ZERO + 4}" style="font:600 10px system-ui,sans-serif;fill:#2b2f36">0</text>`;
  const marks = d.marks.map((m) => `<path d="M${x + 18},${DYNO_ZERO + m * DYNO_K} h14" style="stroke:#6b6f75;stroke-width:1.3"/>`).join('');
  let scale = '';
  if (d.newton) {
    const tenth = (d.newton * DYNO_K) / 10;
    const count = Math.floor(((TABLE - 40 - DYNO_ZERO) / tenth) * (d.drawn ?? 1));
    scale = Array.from({ length: count + 1 }, (_, k) => `<path d="M${x + 18},${DYNO_ZERO + k * tenth} h${k % 10 === 0 ? 12 : k % 5 === 0 ? 8 : 5}" style="stroke:#2b2f36;stroke-width:${k % 10 === 0 ? 1.2 : 0.7}"/>${k % 10 === 0 && k ? `<text x="${x + 34}" y="${DYNO_ZERO + k * tenth + 4}" style="font:600 10px system-ui,sans-serif;fill:#2b2f36">${k / 10} ${d.unit}</text>` : ''}`).join('');
  }
  const spring = springSvg(x, top, y - top);
  const pointer = `<path d="M${x},${y} H${x + 30}" style="stroke:#c0392b;stroke-width:1.8"/><path d="M${x},${y} v10" style="stroke:${THREAD};stroke-width:1.4"/>`;
  const hook = y + 10;
  let load = '';
  if (d.weights) load = `<path d="M${x},${hook} v4" style="stroke:${THREAD};stroke-width:1.4"/>${weightsSvg(x, hook + 4, d.weights)}`;
  else if (d.hang === 'apple') load = `<path d="M${x},${hook} v6" style="stroke:#6b4a2a;stroke-width:2"/><ellipse cx="${x + 6}" cy="${hook + 4}" rx="6" ry="3" style="fill:#5aa04a"/><circle cx="${x}" cy="${hook + 20}" r="14" style="fill:#d64535;stroke:#9c2a1e"/><path d="M${x - 6},${hook + 12} q3,-3 7,-2" style="stroke:rgba(255,255,255,0.5);stroke-width:2;fill:none"/>`;
  else if (d.hang === 'band') load = `<path d="M${x - 3},${hook} L${x - 3},${TABLE - 10} M${x + 3},${hook} L${x + 3},${TABLE - 10}" style="stroke:#b5651d;stroke-width:2;fill:none"/><rect x="${x - 10}" y="${TABLE - 12}" width="20" height="12" rx="2" style="fill:${DARK}"/>`;
  else if (d.hang === 'egg') load = `<path d="M${x},${hook} L${x - 13},${hook + 12} M${x},${hook} L${x + 13},${hook + 12}" style="stroke:rgba(230,230,230,0.8);stroke-width:1"/><ellipse cx="${x}" cy="${hook + 26}" rx="12" ry="16" style="fill:#f3e2c4;stroke:#c9a874"/><path d="M${x - 15},${hook + 12} Q${x - 18},${hook + 40} ${x},${hook + 44} Q${x + 18},${hook + 40} ${x + 15},${hook + 12} Z" style="fill:rgba(240,245,250,0.3);stroke:rgba(230,230,230,0.8)"/>`;
  return `${board}${zero}${marks}${scale}${spring}${pointer}${load}${d.read ? `<text class="bench-reading" x="${x + 76}" y="${y + 4}">${d.read}</text>` : ''}`;
}

/**
 * The home-made dynamometer: a load hung on — the pointer drops and bounces about its new place (1.8 s), the
 * weights one after another, a pencil mark each time; the scale drawn division by division (2 s).
 */
function dynoRun(next: DynoView, draw: (v: DynoView) => void): Motion | null {
  const d = next;
  if (!d.anim) return null;
  const anim = d.anim!;
  const per = 1.8;
  const length = anim === 'marks' ? 3 * per : anim === 'scale' ? 2 : per;
  const clock = new Channel(0, length, { kind: 'steady', speed: 1 }, 1e-4);
  const { anim: _a, read: _r, ...rest } = d;
  // A drop from x0 to x: a damped bounce, 0.55 s a swing.
  const bounce = (x0: number, x: number, t: number) => x - (x - x0) * Math.exp(-t / 0.4) * Math.cos((2 * Math.PI * t) / 0.55);
  return {
    channels: [clock],
    frame: (done) => {
      if (done) return draw({ ...rest, ...(d.read ? { read: d.read } : {}) });
      const t = Number.isFinite(clock.value) ? clock.value : 0;
      if (anim === 'scale') return draw({ ...rest, drawn: Math.min(1, t / 2) });
      if (anim === 'marks') {
        const k = Math.min(2, Math.floor(t / per));
        const u = t - k * per;
        const from = k === 0 ? 0 : d.marks[k - 1]!;
        // (The mark goes on once the spring has settled.)
        return draw({ ...rest, weights: k + 1, stretch: bounce(from, d.marks[k]!, u), marks: d.marks.slice(0, k + (u > per - 0.4 ? 1 : 0)) });
      }
      draw({ ...rest, stretch: bounce(0, d.stretch, t) });
    },
  };
}

export const dynoDiyScene = defineScene({ kind: 'dyno', view, svg: dynoSvg, motion: dynoRun });
