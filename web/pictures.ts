/**
 * Pictures of substances for the shelf: a reagent bottle (or a jar for a solid)
 * with the liquid's colour and the formula on its label.
 */
import { liquidColor, type LiquidKind } from './scene.js';

export function bottleSvg(kind: LiquidKind, formula: string, solid = false): string {
  const c = liquidColor(kind);
  const label = formula.length > 9 ? formula.slice(0, 9) : formula;
  if (solid) {
    // A jar of white crystals.
    return `<svg class="thumb" viewBox="0 0 80 96" aria-hidden="true">
      <rect x="18" y="8" width="44" height="12" rx="3" class="cap"/>
      <path d="M14 22h52v62a6 6 0 0 1-6 6H20a6 6 0 0 1-6-6z" class="jar"/>
      <path d="M17 40h46v44a4 4 0 0 1-4 4H21a4 4 0 0 1-4-4z" class="grains"/>
      ${[24, 34, 46, 56, 29, 41, 52].map((x, i) => `<path d="M${x} ${48 + (i % 3) * 10}l3-4 3 4-3 3z" class="grain"/>`).join('')}
      <rect x="20" y="26" width="40" height="12" rx="2" class="label"/><text x="40" y="35" class="label-text">${label}</text>
    </svg>`;
  }
  return `<svg class="thumb" viewBox="0 0 80 96" aria-hidden="true">
    <rect x="30" y="4" width="20" height="10" rx="2" class="cap"/>
    <path d="M32 14h16v12c10 4 16 12 16 22v34a8 8 0 0 1-8 8H24a8 8 0 0 1-8-8V48c0-10 6-18 16-22z" class="bottle"/>
    <path d="M18.5 52h43v30a6 6 0 0 1-6 6h-31a6 6 0 0 1-6-6z" style="fill:${c}"/>
    <rect x="20" y="56" width="40" height="14" rx="2" class="label"/><text x="40" y="66" class="label-text">${label}</text>
    <path d="M26 30c-4 3-6 8-6 14" class="shine"/>
  </svg>`;
}

/** A solid body for the shelf: a block of its colour with a highlight, its formula or symbol on a tag. */
export function blockSvg(color: string, label: string): string {
  const tag = label.length > 7 ? label.slice(0, 7) : label;
  return `<svg class="thumb" viewBox="0 0 80 96" aria-hidden="true">
    <path d="M14 46l26-12 26 12-26 12z" style="fill:${color};filter:brightness(1.15)" class="block-top"/>
    <path d="M14 46v26l26 12V58z" style="fill:${color};filter:brightness(0.9)" class="block-side"/>
    <path d="M66 46v26L40 84V58z" style="fill:${color};filter:brightness(0.75)" class="block-side"/>
    <path d="M20 47l18 -8" class="shine"/>
    ${tag ? `<rect x="22" y="12" width="36" height="14" rx="3" class="label"/><text x="40" y="22" class="label-text">${tag}</text>` : ''}
  </svg>`;
}

/** A ball (a glass marble) for the shelf: a sphere with a highlight. */
export function ballSvg(color: string): string {
  return `<svg class="thumb" viewBox="0 0 80 96" aria-hidden="true">
    <ellipse cx="40" cy="84" rx="20" ry="4" fill="rgba(0,0,0,0.15)"/>
    <circle cx="40" cy="58" r="24" style="fill:${color};stroke:rgba(0,0,0,0.3);stroke-width:1.5"/>
    <path d="M30 48 q4 -8 14 -8" stroke="rgba(255,255,255,0.85)" stroke-width="4" fill="none" stroke-linecap="round"/>
    <circle cx="48" cy="68" r="4" fill="rgba(255,255,255,0.35)"/>
  </svg>`;
}
