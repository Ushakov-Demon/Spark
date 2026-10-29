import { formatMeasured, readingsOf } from '../../../src/scenarios/measuring.js';
import { TABLE } from '../../graphics/scene/constants.js';
import { DARK, stopwatchSvg } from '../../graphics/scene/kit.js';
import { Channel, type Motion } from '../../motion.js';
import { defineScene, type SceneContext } from '../types.js';

/** A snail: the surface it crawls on, how far it has gone (m), the distance read. */
type Snail = { readonly surface: string; readonly at: number; readonly read?: string };
/** The snail, and what plays it. */
export type SnailView = { readonly snail: Snail; readonly stopwatch?: { readonly display: string; readonly fast?: number }; readonly run?: { readonly seconds: number } };

function view({ last, command, plan, locale }: SceneContext): SnailView {
  const r = last ? readingsOf([last])[0]?.record : undefined;
  const sc = command?.type === 'lab.snail' ? (command as unknown as { surface: string }) : undefined;
  const next = plan.find((s) => s.kind === 'bench' && s.command.type === 'lab.snail');
  const surface = sc?.surface ?? (next?.kind === 'bench' ? (next.command as unknown as { surface: string }).surface : 'flat');
  const done = sc && r && r.value !== null;
  return { snail: { surface, at: done ? r.value! : 0, ...(done ? { read: `${Math.round(r.value! * 1000)} ${locale === 'uk' ? 'мм' : 'mm'}` } : {}) }, ...(done ? { stopwatch: { display: formatMeasured('time', r.inputs?.['time'] ?? 30, 0.01, locale).replace(/ (с|s)$/, '') }, run: { seconds: r.inputs?.['time'] ?? 30 } } : {}) };
}

/** The snail's drawing: the ruler's millimetres, units (the snail and its way some 3½ times larger than life). */
const SNAIL_K = 3.6;

/**
 * A snail crawling beside a ruler: on a plastic sheet lying on the table (dry, or wet with drops), on sandpaper, or
 * up the sheet stood upright. A chalk mark where it started; its shell and body drawn larger than life.
 */
function snailSvg(sn: Snail): string {
  const wall = sn.surface === 'wall';
  const len = 70;
  // Along the sheet: lying, from left to right on the table; upright, from the bottom up.
  const x0 = wall ? 470 : 330;
  const y0 = wall ? TABLE - 30 : TABLE - 46;
  const along = (d: number) => (wall ? { x: x0, y: y0 - d } : { x: x0 + d, y: y0 });
  const sheet = sn.surface === 'sandpaper' ? '#b58a55' : 'rgba(225,235,245,0.85)';
  const plate = wall
    ? `<rect x="${x0 - 40}" y="${y0 - len * SNAIL_K - 30}" width="60" height="${len * SNAIL_K + 40}" style="fill:${sheet};stroke:#8fa3b8"/><rect x="${x0 - 70}" y="${TABLE - 8}" width="120" height="8" rx="2" style="fill:${DARK}"/>`
    : `<rect x="${x0 - 30}" y="${y0 - 8}" width="${len * SNAIL_K + 60}" height="16" style="fill:${sheet};stroke:#8fa3b8"/>`;
  const grit = sn.surface === 'sandpaper' ? Array.from({ length: 60 }, (_, i) => `<circle cx="${x0 - 26 + ((i * 37) % (len * SNAIL_K + 52))}" cy="${y0 - 6 + ((i * 7) % 12)}" r="0.9" style="fill:#7a5a33"/>`).join('') : '';
  const drops = sn.surface === 'wet' ? Array.from({ length: 9 }, (_, i) => `<ellipse cx="${x0 - 10 + i * 30}" cy="${y0 - 2 + (i % 2) * 4}" rx="5" ry="2" style="fill:rgba(130,190,240,0.7)"/>`).join('') : '';
  // The ruler beside the way, in millimetres.
  const ruler = wall
    ? `<rect x="${x0 + 24}" y="${y0 - len * SNAIL_K - 6}" width="18" height="${len * SNAIL_K + 12}" rx="2" style="fill:#f1e7c8;stroke:#a88a4a"/>${Array.from({ length: len + 1 }, (_, mm) => `<path d="M${x0 + 24},${y0 - mm * SNAIL_K} h${mm % 10 === 0 ? 8 : mm % 5 === 0 ? 6 : 3}" style="stroke:#3a3f46;stroke-width:0.8"/>${mm % 10 === 0 ? `<text x="${x0 + 34}" y="${y0 - mm * SNAIL_K + 3}" style="font:600 7px system-ui;fill:#3a3f46">${mm / 10}</text>` : ''}`).join('')}`
    : `<rect x="${x0 - 6}" y="${y0 + 12}" width="${len * SNAIL_K + 12}" height="18" rx="2" style="fill:#f1e7c8;stroke:#a88a4a"/>${Array.from({ length: len + 1 }, (_, mm) => `<path d="M${x0 + mm * SNAIL_K},${y0 + 12} v${mm % 10 === 0 ? 8 : mm % 5 === 0 ? 6 : 3}" style="stroke:#3a3f46;stroke-width:0.8"/>${mm % 10 === 0 ? `<text x="${x0 + mm * SNAIL_K}" y="${y0 + 28}" text-anchor="middle" style="font:600 7px system-ui;fill:#3a3f46">${mm / 10}</text>` : ''}`).join('')}`;
  const p = along(sn.at * 1000 * SNAIL_K);
  const start = along(0);
  const mark = wall ? `<path d="M${start.x - 22},${start.y} h18" style="stroke:#c0392b;stroke-width:2"/>` : `<path d="M${start.x},${start.y - 12} v8" style="stroke:#c0392b;stroke-width:2"/>`;
  // The snail: its body along the way (the head forward), the shell on its back.
  const rot = wall ? -90 : 0;
  const body = `<g transform="translate(${p.x},${p.y}) rotate(${rot})"><path d="M-30,6 Q-10,-2 6,2 Q14,3 16,-6 l3,-8 m-6,8 l-1,-9 M16,-6 Q20,4 6,7 Z" style="fill:#c9a27a;stroke:#8a6a46;stroke-width:1.2"/><circle cx="-12" cy="-8" r="13" style="fill:#a8743c;stroke:#6e4a22;stroke-width:1.5"/><path d="M-12,-8 m-8,0 a8,8 0 1 1 8,8 a5,5 0 1 1 -5,-5" style="fill:none;stroke:#6e4a22;stroke-width:1.2"/></g>`;
  const trail = wall ? `<path d="M${start.x},${start.y} V${p.y}" style="stroke:rgba(255,255,255,0.5);stroke-width:4"/>` : `<path d="M${start.x},${start.y + 4} H${p.x}" style="stroke:rgba(255,255,255,0.5);stroke-width:4"/>`;
  const read = sn.read ? `<text class="bench-reading" x="${wall ? x0 - 50 : (start.x + p.x) / 2}" y="${wall ? (start.y + p.y) / 2 : y0 - 40}" text-anchor="${wall ? 'end' : 'middle'}">l = ${sn.read}</text>` : '';
  return `${plate}${grit}${drops}${ruler}${trail}${mark}${body}${read}`;
}

/** A snail: its 30 s played some eight times faster, the stopwatch running with it. */
function snailRun(next: SnailView, run: NonNullable<SnailView['run']>, draw: (v: SnailView) => void): Motion {
  const sn = next.snail;
  const fast = 8;
  const comma = (next.stopwatch?.display ?? ',').includes(',');
  const clock = new Channel(0, run.seconds, { kind: 'steady', speed: fast }, 1e-4);
  return {
    channels: [clock],
    frame: (done) => {
      if (done) return draw(next);
      const { read: _r, ...rest } = sn;
      draw({ ...next, stopwatch: { display: clock.value.toFixed(2).replace('.', comma ? ',' : '.'), fast }, snail: { ...rest, at: (sn.at * clock.value) / run.seconds } });
    },
  };
}

export const snailSpeedScene = defineScene({
  kind: 'snail',
  view,
  svg: (v: SnailView) => `${snailSvg(v.snail)}${v.stopwatch ? stopwatchSvg(v.stopwatch, 595) : ''}`,
  motion: (next, draw) => (next.snail.read && next.run ? snailRun(next, next.run, draw) : null),
});
