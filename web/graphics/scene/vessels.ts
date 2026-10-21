import { isGlass, LIQUID, METAL } from './colors.js';
import { CX, TABLE } from './constants.js';
import type { DeviceKind, LiquidKind, VesselShape } from './types.js';

/** Vessels on the table: their outlines, where they stand, and a small preview for the shelf. */
export interface VesselGeom {
  /** Outline of the vessel wall. */
  readonly outer: string;
  /** Inside of the vessel (liquid lives here). */
  readonly inner: string;
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
  /** Extras drawn with the vessel: handles, spout, graduations, clamp. */
  readonly extras: string;
  readonly lidPath?: string;
  /** Room for electrodes / immersion element: x range inside, near the top. */
  readonly mouth: { readonly l: number; readonly r: number };
}

/** Vessel geometry standing with its bottom at `base`. */
export function vesselGeom(shape: VesselShape, base: number): VesselGeom {
  switch (shape) {
    case 'pot': {
      const w = 190, h = 112, l = CX - w / 2, r = CX + w / 2, t = base - h;
      return {
        outer: `M${l},${t} L${l},${base - 10} Q${l},${base} ${l + 12},${base} L${r - 12},${base} Q${r},${base} ${r},${base - 10} L${r},${t} Z`,
        inner: `M${l + 5},${t} L${l + 5},${base - 12} Q${l + 5},${base - 5} ${l + 14},${base - 5} L${r - 14},${base - 5} Q${r - 5},${base - 5} ${r - 5},${base - 12} L${r - 5},${t} Z`,
        left: l, right: r, top: t, bottom: base,
        extras: `<path class="handle" d="M${l},${t + 18} h-22 a7,7 0 0 0 0,14 h22"/><path class="handle" d="M${r},${t + 18} h22 a7,7 0 0 1 0,14 h-22"/>`,
        lidPath: `M${l - 6},${t} Q${CX},${t - 26} ${r + 6},${t} Z M${CX - 12},${t - 13} h24 v-8 h-24 Z`,
        mouth: { l: l + 30, r: r - 30 },
      };
    }
    case 'turka': {
      const wb = 86, wt = 62, h = 104, t = base - h;
      const lb = CX - wb / 2, rb = CX + wb / 2, lt = CX - wt / 2, rt = CX + wt / 2;
      return {
        outer: `M${lt - 6},${t} L${lb},${base - 6} Q${lb + 2},${base} ${lb + 8},${base} L${rb - 8},${base} Q${rb - 2},${base} ${rb},${base - 6} L${rt},${t} Z`,
        inner: `M${lt - 1},${t} L${lb + 5},${base - 8} L${rb - 5},${base - 8} L${rt},${t} Z`,
        left: lb, right: rb, top: t, bottom: base,
        extras: `<path class="handle long" d="M${rt + 4},${t + 22} L${rt + 120},${t - 6}"/>`,
        mouth: { l: lt + 6, r: rt - 6 },
      };
    }
    case 'beaker': {
      const w = 108, h = 136, l = CX - w / 2, r = CX + w / 2, t = base - h;
      const grads = [0.25, 0.5, 0.75].map((f) => `<path class="grad" d="M${l + 8},${base - 6 - f * (h - 14)} h16"/>`).join('');
      return {
        outer: `M${l - 8},${t - 4} Q${l},${t} ${l},${t + 8} L${l},${base - 6} Q${l},${base} ${l + 6},${base} L${r - 6},${base} Q${r},${base} ${r},${base - 6} L${r},${t} Z`,
        inner: `M${l + 3},${t + 6} L${l + 3},${base - 7} Q${l + 3},${base - 3} ${l + 8},${base - 3} L${r - 8},${base - 3} Q${r - 3},${base - 3} ${r - 3},${base - 7} L${r - 3},${t} Z`,
        left: l, right: r, top: t, bottom: base, extras: grads,
        mouth: { l: l + 18, r: r - 18 },
      };
    }
    case 'cylinder': {
      // A measuring cylinder: tall and narrow, marks every 10 mL (long ones every 50), a spout and a foot.
      const w = 46, h = 214, l = CX - w / 2, r = CX + w / 2, t = base - h - 8;
      const marks = Array.from({ length: 10 }, (_, i) => {
        const y = base - 12 - ((i + 1) / 10) * (h - 16);
        return `<path class="grad" d="M${l + 4},${y} h${i % 5 === 4 ? 16 : 9}"/>`;
      }).join('');
      return {
        outer: `M${l - 5},${t - 3} Q${l},${t} ${l},${t + 6} L${l},${base - 10} L${r},${base - 10} L${r},${t} Z`,
        inner: `M${l + 3},${t + 4} L${l + 3},${base - 13} L${r - 3},${base - 13} L${r - 3},${t} Z`,
        left: l, right: r, top: t, bottom: base - 13,
        extras: `${marks}<path class="cyl-foot" d="M${l - 22},${base} L${l - 14},${base - 10} L${r + 14},${base - 10} L${r + 22},${base} Z"/>`,
        mouth: { l: l + 8, r: r - 8 },
      };
    }
    case 'calorimeter': {
      // The inner cup (cut away to show the water) inside an outer cup: two walls with air between.
      const w = 100, h = 118, l = CX - w / 2, r = CX + w / 2, t = base - h;
      const o = 16;
      const jacket = `<path class="jacket" d="M${l - o},${t + 6} L${l - o},${base + 2} L${r + o},${base + 2} L${r + o},${t + 6}" /><path class="jacket-ring" d="M${l - o - 4},${t + 6} h${o + 6} M${r - 2},${t + 6} h${o + 6}"/>`;
      return {
        outer: `M${l},${t} L${l},${base - 8} Q${l},${base - 4} ${l + 6},${base - 4} L${r - 6},${base - 4} Q${r},${base - 4} ${r},${base - 8} L${r},${t} Z`,
        inner: `M${l + 3},${t} L${l + 3},${base - 9} Q${l + 3},${base - 6} ${l + 8},${base - 6} L${r - 8},${base - 6} Q${r - 3},${base - 6} ${r - 3},${base - 9} L${r - 3},${t} Z`,
        left: l, right: r, top: t, bottom: base - 4, extras: jacket,
        lidPath: `M${l - o - 4},${t} h${w + 2 * o + 8} v-7 h-${w + 2 * o + 8} Z M${CX - 8},${t - 7} h16 v-6 h-16 Z`,
        mouth: { l: l + 16, r: r - 16 },
      };
    }
    case 'flask-conical': {
      const wb = 136, wn = 32, hb = 108, hn = 46, t = base - hb - hn;
      const lb = CX - wb / 2, rb = CX + wb / 2, ln = CX - wn / 2, rn = CX + wn / 2, shoulder = base - hb;
      return {
        outer: `M${ln},${t} L${ln},${shoulder} L${lb},${base - 6} Q${lb},${base} ${lb + 8},${base} L${rb - 8},${base} Q${rb},${base} ${rb},${base - 6} L${rn},${shoulder} L${rn},${t} Z`,
        inner: `M${ln + 3},${t} L${ln + 3},${shoulder + 2} L${lb + 6},${base - 7} L${rb - 6},${base - 7} L${rn - 3},${shoulder + 2} L${rn - 3},${t} Z`,
        left: lb, right: rb, top: t, bottom: base,
        extras: `<path class="rim" d="M${ln - 5},${t} h${wn + 10}"/>`,
        mouth: { l: ln + 5, r: rn - 5 },
      };
    }
    case 'flask-round': {
      const R = 62, wn = 28, hn = 56, cy = base - R, t = cy - R - hn + 8;
      const ln = CX - wn / 2, rn = CX + wn / 2;
      const join = Math.sqrt(R * R - (wn / 2) ** 2);
      return {
        outer: `M${ln},${t} L${ln},${cy - join} A${R},${R} 0 1 0 ${rn},${cy - join} L${rn},${t} Z`,
        inner: `M${ln + 3},${t} L${ln + 3},${cy - join + 3} A${R - 4},${R - 4} 0 1 0 ${rn - 3},${cy - join + 3} L${rn - 3},${t} Z`,
        left: CX - R, right: CX + R, top: t, bottom: base,
        extras: `<path class="stand" d="M${CX + R + 60},${TABLE} V${t - 10} M${CX + R + 60},${t + 18} H${rn + 2}"/><rect class="clamp" x="${rn - 2}" y="${t + 12}" width="12" height="12" rx="2"/>`,
        mouth: { l: ln + 4, r: rn - 4 },
      };
    }
    case 'crucible': {
      // A small porcelain cup, narrow at the bottom, in a pipe-clay triangle (drawn larger than life: 4 cm is tiny on the table).
      const wb = 44, wt = 76, h = 62, t = base - h;
      const lb = CX - wb / 2, rb = CX + wb / 2, lt = CX - wt / 2, rt = CX + wt / 2;
      return {
        outer: `M${lt},${t} L${lb},${base - 4} Q${lb + 1},${base} ${lb + 6},${base} L${rb - 6},${base} Q${rb - 1},${base} ${rb},${base - 4} L${rt},${t} Z`,
        inner: `M${lt + 5},${t} L${lb + 5},${base - 6} L${rb - 5},${base - 6} L${rt - 5},${t} Z`,
        left: lt, right: rt, top: t, bottom: base - 6,
        extras: `<path class="clay-triangle" d="M${lt - 26},${base - 18} L${rt + 26},${base - 18} M${lt - 18},${base - 22} L${CX},${base + 6} L${rt + 18},${base - 22}"/>`,
        lidPath: `M${lt - 4},${t} Q${CX},${t - 12} ${rt + 4},${t} Z M${CX - 6},${t - 6} h12 v-6 h-12 Z`,
        mouth: { l: lt + 10, r: rt - 10 },
      };
    }
    case 'test-tube': {
      const w = 34, h = 160, l = CX - w / 2, r = CX + w / 2, t = base - h;
      return {
        outer: `M${l},${t} L${l},${base - w / 2} A${w / 2},${w / 2} 0 0 0 ${r},${base - w / 2} L${r},${t} Z`,
        inner: `M${l + 3},${t} L${l + 3},${base - w / 2} A${w / 2 - 3},${w / 2 - 3} 0 0 0 ${r - 3},${base - w / 2} L${r - 3},${t} Z`,
        left: l, right: r, top: t, bottom: base,
        extras: `<path class="stand" d="M${r + 70},${TABLE} V${t - 14} M${r + 70},${t + 20} H${r + 2}"/><rect class="clamp" x="${r - 4}" y="${t + 14}" width="12" height="12" rx="2"/><path class="rim" d="M${l - 4},${t} h${w + 8}"/>`,
        mouth: { l: l + 6, r: r - 6 },
      };
    }
  }
}

/** Where the vessel bottom sits for this device. */
export const baseFor = (d: DeviceKind, shape: VesselShape): number => {
  if (d === 'furnace') return TABLE - 46;
  if (shape === 'crucible') return d === 'bunsen' ? 252 : d === 'spirit' ? 262 : TABLE;
  if (shape === 'flask-round' || shape === 'test-tube') return d === 'bunsen' || d === 'spirit' ? 236 : TABLE - 30;
  switch (d) {
    case 'hotplate':
    case 'induction':
    case 'gas':
      return TABLE - 34;
    case 'bunsen':
      return 240;
    case 'spirit':
      return 250;
    default:
      return TABLE;
  }
};

/** A small picture of a vessel for the shelf: the same drawing as on the table, with some liquid in it. */
export function vesselPreview(shape: VesselShape, material: string, liquid: LiquidKind = 'water', fill = 0.6): string {
  const g = vesselGeom(shape, TABLE);
  const glass = isGlass(material);
  const metal = METAL[material] ?? METAL['steel']!;
  const level = g.bottom - fill * (g.bottom - g.top);
  const id = `vp-${shape}-${material}`.replace(/[^a-z0-9-]/gi, '');
  const pad = shape === 'turka' ? 130 : shape === 'flask-round' || shape === 'test-tube' ? 90 : 34;
  return `<svg class="thumb" viewBox="${g.left - 34} ${g.top - 16} ${g.right - g.left + 34 + pad} ${g.bottom - g.top + 22}" aria-hidden="true">
    <defs><clipPath id="${id}"><path d="${g.inner}"/></clipPath></defs>
    ${glass ? '' : `<path d="${g.outer}" style="fill:${metal.fill};stroke:${metal.edge}" stroke-width="3"/>`}
    <g clip-path="url(#${id})"><rect x="${g.left - 10}" y="${level}" width="${g.right - g.left + 20}" height="${g.bottom - level + 10}" style="fill:${LIQUID[liquid]}"/></g>
    ${glass ? `<path d="${g.outer}" style="fill:rgba(210,232,255,0.18);stroke:#8fb8dd" stroke-width="4"/>` : ''}
    <g class="thumb-extras">${g.extras.replace(/class="stand"[^/]*\/>/, '')}</g>
  </svg>`;
}

/**
 * Steam as puffs of cloud: they rise, swell and melt away. From an open vessel they billow up across
 * its mouth; under a lid they squeeze out at its edges and drift sideways.
 */
export function steamPuffs(g: VesselGeom, lid: boolean): string {
  const top = g.top - (lid ? 4 : 6);
  const spots = lid
    ? [g.left - 2, g.left + 4, g.right - 4, g.right + 2].map((x, i) => ({ x, dx: i < 2 ? -18 : 18 }))
    : Array.from({ length: 7 }, (_, i) => ({ x: g.mouth.l + ((g.mouth.r - g.mouth.l) * (i + 0.5)) / 7, dx: (i % 2 ? 1 : -1) * 8 }));
  return spots
    .map((p, i) => `<ellipse class="puff" cx="${p.x.toFixed(1)}" cy="${top}" rx="${lid ? 7 : 11}" ry="${lid ? 5 : 8}" style="--dx:${p.dx}px;animation-delay:${((i * 0.37) % 2.4).toFixed(2)}s"/>`)
    .join('');
}
