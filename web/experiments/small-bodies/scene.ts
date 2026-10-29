import { type RowBody, rowSizes } from '../../../src/experiments/small-bodies/bench.js';
import { readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { WOOD, WOOD_EDGE } from '../../graphics/scene/kit.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/** The method of rows: the bodies (their sizes, m, in the row's order), how many are laid so far (a fraction — the next one falling), what the ruler shows. */
export type RowsView = { readonly body: 'pea' | 'millet' | 'thread'; readonly sizes: readonly number[]; readonly placed: number; readonly read?: string };

function view({ last, command, plan, locale }: SceneContext): RowsView {
  const r = last ? readingsOf([last])[0]?.record : undefined;
  type Row = { body: RowBody; count: number };
  const rc = command?.type === 'lab.rows' ? (command as unknown as Row) : undefined;
  const next = plan.find((s) => s.kind === 'bench' && s.command.type === 'lab.rows');
  const cmd = rc ?? (next?.kind === 'bench' ? (next.command as unknown as Row) : undefined);
  const sizes = cmd ? rowSizes(cmd.body, cmd.count) : [];
  return { body: cmd?.body ?? 'pea', sizes, placed: rc ? sizes.length : 0, ...(rc && r ? { read: `${Math.round((r.value ?? 0) * 1000)} ${locale === 'uk' ? 'мм' : 'mm'}` } : {}) };
}

/**
 * The method of rows, seen from the front, 4 units to the millimetre (larger than life): a ruler with millimetre
 * marks lying on the table, the row laid along it from its zero — peas or millet grains, pressed between two
 * toothpicks — or a pen refill with the thread wound on it turn to turn; a bracket with the row's length.
 */
const ROW_K = 4000;
function rowsSvg(r: RowsView): string {
  // (Clear of the Professor on the left.)
  const x0 = 180;
  const top = TABLE - 16;
  const mmTicks = Array.from({ length: 111 }, (_, i) => `<path d="M${x0 + i * 4},${top} v${i % 10 === 0 ? 8 : i % 5 === 0 ? 6 : 3}"/>`).join('');
  const labels = Array.from({ length: 12 }, (_, i) => `<text x="${x0 + i * 40}" y="${top + 15}" text-anchor="middle">${i}</text>`).join('');
  const ruler = `<g class="bench-ruler"><rect x="${x0 - 10}" y="${top}" width="${460}" height="16" rx="2"/><g class="ticks">${mmTicks}</g><g class="labels">${labels}</g></g>`;
  if (!r) return ruler;
  const n = Math.floor(r.placed);
  const falling = r.placed - n;
  let x = x0;
  const parts: string[] = [];
  if (r.body === 'thread') {
    // The refill lies along the ruler; the turns go on from its zero, one after another.
    const total = r.sizes.reduce((a, d) => a + d, 0) * ROW_K;
    parts.push(`<rect x="${x0 - 30}" y="${top - 9}" width="${Math.max(120, total + 60)}" height="7" rx="3" style="fill:#5d8fc9;stroke:#33557e"/>`);
    r.sizes.slice(0, n).forEach((d, i) => {
      const w = d * ROW_K;
      parts.push(`<rect x="${x}" y="${top - 11}" width="${w}" height="11" style="fill:${i % 2 ? '#f4e9c8' : '#ffffff'};stroke:#9b8b5d;stroke-width:0.3"/>`);
      x += w;
    });
  } else {
    const color = r.body === 'pea' ? '#b9c45a' : '#f0c53c';
    const edge = r.body === 'pea' ? '#6f7a26' : '#a7801d';
    r.sizes.forEach((d, i) => {
      const rad = (d * ROW_K) / 2;
      if (i < n || (i === n && falling > 0)) {
        // The one being laid drops in from above.
        const lift = i === n ? (1 - falling) * 50 : 0;
        parts.push(`<circle cx="${x + rad}" cy="${top - rad - lift}" r="${rad}" style="fill:${color};stroke:${edge};stroke-width:0.8"/>`);
      }
      x += rad * 2;
    });
    // The toothpicks press the row from both ends (once it is all laid).
    x = x0 + r.sizes.slice(0, n).reduce((a, d) => a + d * ROW_K, 0);
    if (n > 1) parts.push(`<rect x="${x0 - 3}" y="${top - 26}" width="3" height="26" rx="1" style="fill:${WOOD};stroke:${WOOD_EDGE}"/><rect x="${x}" y="${top - 26}" width="3" height="26" rx="1" style="fill:${WOOD};stroke:${WOOD_EDGE}"/>`);
  }
  const end = x0 + r.sizes.slice(0, n).reduce((a, d) => a + d * ROW_K, 0);
  const bracket = r.read ? `<path class="bench-mark" d="M${x0},${top - 34} v-6 H${end} v6"/><text class="bench-reading" x="${(x0 + end) / 2}" y="${top - 46}" text-anchor="middle">${r.read}</text>` : '';
  return `${ruler}${parts.join('')}${bracket}`;
}

/** The method of rows: the bodies are laid one by one (each drops in), or the thread is wound turn by turn — in about three seconds. */
function row(next: RowsView, draw: (v: RowsView) => void): Motion {
  const r = next;
  const n = r.sizes.length;
  const laid = new Channel(0, n, { kind: 'steady', speed: Math.max(3, n / 3) }, 0.001);
  return {
    channels: [laid],
    frame: (done) => {
      const { read: _r, ...rest } = r;
      draw(done ? next : { ...rest, placed: laid.value });
    },
  };
}

export const smallBodiesScene = defineScene({ kind: 'rows', view, svg: rowsSvg, motion: (next, draw) => (next.read ? row(next, draw) : null) });
