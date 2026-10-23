import type { VesselGeom } from './vessels.js';

/** A ball with a highlight (a glass marble). */
export const ballAt = (cx: number, cy: number, r: number, color: string) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" style="fill:${color};stroke:rgba(0,0,0,0.35)"/><path d="M${cx - r * 0.45},${cy - r * 0.35} q${r * 0.2},${-r * 0.35} ${r * 0.6},${-r * 0.35}" stroke="rgba(255,255,255,0.8)" stroke-width="2" fill="none" stroke-linecap="round"/>`;

/**
 * A stoppered test tube with sand (the floating lab work): its width as a share of the vessel's, its length as a
 * share of the vessel's height (the scale the level is drawn in), the sand's share of it.
 */
export interface TubePiece {
  readonly width: number;
  readonly height: number;
  readonly sand: number;
}

/** Bodies in the liquid: sinking ones on the bottom, floating ones at the surface with their share under it. */
/** `drop` — the index of a body just put in: it falls in from the rim. */
export function blocksSvg(pieces: readonly { color: string; volume: number; share: number; ball?: boolean; melting?: number; tube?: TubePiece; inside?: boolean }[], g: VesselGeom, level: number, drop = -1): string {
  if (!pieces.length) return '';
  // Test tubes stand upright (the sand keeps the bottom down): on the bottom, inside the water, or out of it by their share.
  if (pieces.every((p) => p.tube)) return pieces.map((p, i) => tubeSvg(p.tube!, p.share, !!p.inside, g, level, i, pieces.length, i === drop)).join('');
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

function tubeSvg(t: TubePiece, share: number, inside: boolean, g: VesselGeom, level: number, i: number, n: number, drop: boolean): string {
  const inner = g.right - g.left;
  // (The drawn vessel is not to scale across: the width is kept below the vessel's, the length follows the marks.)
  const w = Math.min(0.5, t.width) * inner;
  const h = t.height * (g.bottom - g.top);
  const x = g.left + ((i + 1) * inner) / (n + 1) - w / 2;
  const deep = g.bottom - level;
  const y = share < 1 ? level - (1 - share) * h : inside ? Math.max(level + 3, level + (deep - h) / 2) : g.bottom - h;
  const r = w / 2;
  const outline = `M${x},${y} v${h - r} a${r},${r} 0 0 0 ${w},0 v${-(h - r)} z`;
  const cork = h * 0.1;
  const sandH = Math.max(0, Math.min(1, t.sand)) * (h - cork);
  const sandTop = y + h - sandH;
  const sand = sandH > 0 ? `<path d="M${x + 1.5},${Math.min(sandTop, y + h - r)} V${y + h - r} a${r - 1.5},${r - 1.5} 0 0 0 ${w - 3},0 V${Math.min(sandTop, y + h - r)} z" style="fill:#d8bf86"/>` : '';
  const body = `<g class="tube">${sand}<rect x="${x + 1}" y="${y}" width="${w - 2}" height="${cork}" rx="1.5" style="fill:#b9874f"/><path d="${outline}" style="fill:rgba(225,238,250,0.25);stroke:#cfe3f5;stroke-width:1.5"/><path d="M${x + 2.5},${y + cork + 3} v${h * 0.55}" stroke="rgba(255,255,255,0.6)" stroke-width="1.5"/></g>`;
  return drop ? `<g class="dropping" style="--from:${Math.round(g.top - h - y)}px">${body}</g>` : body;
}
