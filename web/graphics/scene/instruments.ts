import { ballAt } from './bodies.js';
import { TABLE, VIEW_TOP } from './constants.js';
import type { VesselGeom } from './vessels.js';

/** Measuring instruments on the scene: the dynamometer over the vessel, electronic scales on the table. */
/** A spring dynamometer hanging over the vessel; its body in the air above it or lowered into the liquid. */
export function dynamometerSvg(h: { display: string; into: 'air' | 'liquid'; color: string; volume: number; share: number; ball?: boolean }, g: VesselGeom, level: number): string {
  const x = (g.left + g.right) / 2;
  const w = Math.max(12, Math.min(44, 22 * Math.cbrt(h.volume / 1e-5), g.right - g.left - 10));
  const bh = h.ball ? w : w * 0.7;
  // In the liquid the body hangs under the surface (or floats on it); in the air, above the rim.
  const bodyTop = h.into === 'air' ? g.top - bh - 26 : h.share < 1 ? level - (1 - h.share) * bh : Math.min(g.bottom - bh - 4, level + 10);
  // The dial never leaves the picture (its top edge is at VIEW_TOP).
  const top = Math.max(VIEW_TOP + 4, Math.min(g.top - 150, bodyTop - 140));
  const caseH = 92;
  const ticks = Array.from({ length: 11 }, (_, i) => `<path d="M${x - 6},${top + 12 + i * 7} h${i % 5 === 0 ? 8 : 5}"/>`).join('');
  return `<rect class="dyn-case" x="${x - 12}" y="${top}" width="24" height="${caseH}" rx="5"/>
    <g class="dyn-ticks">${ticks}</g>
    <path class="dyn-pointer" d="M${x + 3},${top + 40} h9"/>
    <path class="dyn-hook" d="M${x},${top + caseH} V${bodyTop}"/>
    ${h.ball ? ballAt(x, bodyTop + bh / 2, w / 2, h.color) : `<rect x="${x - w / 2}" y="${bodyTop}" width="${w}" height="${bh}" rx="2" style="fill:${h.color};stroke:rgba(0,0,0,0.35)"/>`}
    <text class="dyn-text" x="${x + 18}" y="${top + 44}">${h.display}</text>`;
}

/** Electronic scales on the table to the right, with the vessel (a small copy) on them and an LCD. */
export function scalesSvg(look: 'kitchen-scale' | 'lab-balance', vessel: string): string {
  const x0 = 506;
  const w = 118;
  const lab = look === 'lab-balance';
  const top = lab ? 286 : 296;
  const seat = lab ? top - 6 : top - 1;
  const load = vessel.replace('<svg class="thumb"', `<svg class="scale-load" x="${x0 + 12}" y="${seat - 78}" width="${w - 24}" height="78" preserveAspectRatio="xMidYMax meet"`);
  return `
    <rect class="scale-body${lab ? ' lab' : ''}" x="${x0}" y="${top}" width="${w}" height="${TABLE - top}" rx="6"/>
    ${lab ? `<rect class="scale-stem" x="${x0 + w / 2 - 4}" y="${seat}" width="8" height="${top - seat}"/><ellipse class="scale-pan" cx="${x0 + w / 2}" cy="${seat}" rx="40" ry="5"/>` : `<rect class="scale-plate" x="${x0 - 3}" y="${top - 3}" width="${w + 6}" height="5" rx="2"/>`}
    ${load}
    <rect class="scale-lcd" x="${x0 + 24}" y="${TABLE - (lab ? 24 : 18)}" width="${w - 48}" height="${lab ? 16 : 14}" rx="2"/>
    <text id="sc-scale-text" class="scale-text" x="${x0 + w / 2}" y="${TABLE - (lab ? 12.5 : 7.5)}" text-anchor="middle"></text>`;
}
