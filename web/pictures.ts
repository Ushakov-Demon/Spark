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
