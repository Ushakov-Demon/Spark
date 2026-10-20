import type { VesselGeom } from './vessels.js';

/** A ball with a highlight (a glass marble). */
export const ballAt = (cx: number, cy: number, r: number, color: string) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" style="fill:${color};stroke:rgba(0,0,0,0.35)"/><path d="M${cx - r * 0.45},${cy - r * 0.35} q${r * 0.2},${-r * 0.35} ${r * 0.6},${-r * 0.35}" stroke="rgba(255,255,255,0.8)" stroke-width="2" fill="none" stroke-linecap="round"/>`;

/** Bodies in the liquid: sinking ones on the bottom, floating ones at the surface with their share under it. */
/** `drop` — the index of a body just put in: it falls in from the rim. */
export function blocksSvg(pieces: readonly { color: string; volume: number; share: number; ball?: boolean; melting?: number }[], g: VesselGeom, level: number, drop = -1): string {
  if (!pieces.length) return '';
  // A melting cube may get very small before it is gone; a solid body keeps a visible size.
  let sides = pieces.map((p) => Math.max(p.melting !== undefined ? 2 : 10, Math.min(60, 22 * Math.cbrt(p.volume / 1e-5))));
  const room = g.right - g.left - 12;
  const total = sides.reduce((a, b) => a + b, 0) + 5 * (sides.length - 1);
  if (total > room) sides = sides.map((x) => (x * room) / total);
  let x = g.left + 6 + Math.max(0, (room - Math.min(room, total)) / 2);
  return pieces
    .map((p, i) => {
      const w = sides[i]!;
      const h = p.ball ? w : w * 0.7;
      const y = p.share < 1 ? level - (1 - p.share) * h : g.bottom - h;
      const r = p.ball ? ballAt(x + w / 2, y + h / 2, w / 2, p.color) : `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" style="fill:${p.color};stroke:rgba(0,0,0,0.35)"/><path d="M${x + 3},${y + 3} h${w * 0.5}" stroke="rgba(255,255,255,0.55)" stroke-width="2"/>`;
      x += w + 5;
      const body = p.melting !== undefined && p.melting < 1 ? `<g style="opacity:${(0.25 + 0.75 * p.melting).toFixed(2)}">${r}</g>` : r;
      return i === drop ? `<g class="dropping" style="--from:${Math.round(g.top - h - y)}px">${body}</g>` : body;
    })
    .join('');
}
