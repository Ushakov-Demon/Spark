import type { BenchView } from './bench.js';
import { TABLE } from './constants.js';

/** What the bench's pictures are drawn with — the colours and the common parts — for the old scenes and the experiment modules alike. */

export const CM = 6;
export const WOOD = '#d8a86a';
export const WOOD_EDGE = '#9a6b33';
export const STEEL = '#8d949c';
export const DARK = '#3a3f46';
/** Threads and hooks: light, so they show against the dark green board behind the table. */
export const THREAD = '#efe9d6';

/** Slotted weights stacked: each a short cylinder. */
export function weightsSvg(x: number, top: number, n: number, w = 22, h = 10): string {
  return Array.from({ length: n }, (_, i) => `<rect x="${x - w / 2}" y="${top + i * h}" width="${w}" height="${h - 1}" rx="2" style="fill:#b9a26b;stroke:#7a6533"/><path d="M${x - w / 2 + 2},${top + i * h + 3} h${w - 4}" style="stroke:rgba(255,255,255,0.45)"/>`).join('');
}

/** A coil spring from (x, top) down `len` units. */
export function springSvg(x: number, top: number, len: number): string {
  const turns = 14;
  const hook = 6;
  const body = Math.max(8, len - 2 * hook);
  const pts = Array.from({ length: turns * 2 + 1 }, (_, i) => `${x + (i === 0 || i === turns * 2 ? 0 : i % 2 ? 7 : -7)},${top + hook + (body * i) / (turns * 2)}`).join(' ');
  return `<path d="M${x},${top} v${hook}" style="stroke:${THREAD};stroke-width:1.5;fill:none"/><polyline points="${pts}" style="stroke:${STEEL};stroke-width:1.8;fill:none"/><path d="M${x},${top + hook + body} v${hook}" style="stroke:${THREAD};stroke-width:1.5;fill:none"/>`;
}

/** A ruler with centimetre marks, vertical (from y0 down) or horizontal (from x0 right). */
export function rulerSvg(x0: number, y0: number, cm: number, vertical: boolean, unit = CM): string {
  const len = cm * unit;
  const ticks = Array.from({ length: cm * 2 + 1 }, (_, i) => {
    const d = (i * unit) / 2;
    const long = i % 10 === 0 ? 7 : i % 2 === 0 ? 5 : 3;
    return vertical ? `<path d="M${x0},${y0 + d} h${long}"/>` : `<path d="M${x0 + d},${y0} v${long}"/>`;
  }).join('');
  const labels = Array.from({ length: Math.floor(cm / 5) + 1 }, (_, i) => (vertical ? `<text x="${x0 + 9}" y="${y0 + i * 5 * unit + 3}">${i * 5}</text>` : `<text x="${x0 + i * 5 * unit}" y="${y0 + 15}" text-anchor="middle">${i * 5}</text>`)).join('');
  const body = vertical ? `<rect x="${x0 - 2}" y="${y0 - 3}" width="22" height="${len + 6}" rx="2"/>` : `<rect x="${x0 - 3}" y="${y0 - 2}" width="${len + 6}" height="20" rx="2"/>`;
  return `<g class="bench-ruler">${body}<g class="ticks">${ticks}</g><g class="labels">${labels}</g></g>`;
}

/** A spring dynamometer, horizontal or hanging, with its reading. */
export function dynamometerSvg(x: number, y: number, horizontal: boolean, display: string): string {
  return horizontal
    ? `<rect class="dyn-case" x="${x}" y="${y - 9}" width="86" height="18" rx="5"/><g class="dyn-ticks">${Array.from({ length: 11 }, (_, i) => `<path d="M${x + 10 + i * 6.5},${y - 6} v${i % 5 === 0 ? 7 : 4}"/>`).join('')}</g><text class="dyn-text" x="${x + 43}" y="${y - 14}" text-anchor="middle">${display}</text>`
    : `<rect class="dyn-case" x="${x - 9}" y="${y}" width="18" height="80" rx="5"/><g class="dyn-ticks">${Array.from({ length: 11 }, (_, i) => `<path d="M${x - 5},${y + 8 + i * 6.5} h${i % 5 === 0 ? 7 : 4}"/>`).join('')}</g><text class="dyn-text" x="${x + 14}" y="${y + 44}">${display}</text>`;
}

/** A stopwatch standing on the table at x, its bottom just above it: its display (and, when the drawing is sped up, by how much). */
export function stopwatchSvg(sw: NonNullable<BenchView['stopwatch']>, x: number): string {
  const y = TABLE - 30;
  return `<g class="stopwatch"><rect x="${x - 3}" y="${y - 30}" width="6" height="8" rx="1" style="fill:${DARK}"/><circle cx="${x}" cy="${y}" r="24" style="fill:#f4f1e8;stroke:${DARK};stroke-width:3"/><rect x="${x - 19}" y="${y - 8}" width="38" height="16" rx="3" style="fill:#c9d8b6;stroke:#6f7f5c"/><text class="sw-text" x="${x}" y="${y + 4.5}" text-anchor="middle">${sw.display}</text>${sw.fast && sw.fast > 1.05 ? `<text class="bench-reading" x="${x}" y="${y - 38}" text-anchor="middle">⏩ ×${Math.round(sw.fast)}</text>` : ''}</g>`;
}

/** A steel ball with a highlight. */
export function ballSvg(x: number, y: number, r: number, color = '#9aa3ad'): string {
  return `<circle cx="${x}" cy="${y}" r="${r}" style="fill:${color};stroke:${DARK}"/><circle cx="${x - r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.3}" style="fill:rgba(255,255,255,0.75)"/>`;
}
export const PLASTICINE = '#e8743b';

/** The stand: a heavy base on the table, a rod, a clamp arm reaching to x (to the right or to the left of the rod). */
export function standSvg(rodX: number, armX: number, armY: number): string {
  return `<rect x="${rodX - 40}" y="${TABLE - 8}" width="80" height="8" rx="2" style="fill:${DARK}"/><rect x="${rodX - 3}" y="${armY - 20}" width="6" height="${TABLE - 8 - armY + 20}" style="fill:${STEEL}"/><rect x="${rodX - 7}" y="${armY - 6}" width="14" height="12" rx="2" style="fill:${DARK}"/><rect x="${Math.min(rodX, armX - 6)}" y="${armY - 3}" width="${Math.abs(armX - rodX) + 6}" height="6" rx="2" style="fill:${STEEL}"/>`;
}
