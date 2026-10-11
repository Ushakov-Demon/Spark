import type { SourcedValue } from '../knowledge/types.js';

/**
 * Vessel shapes. Proportions are given relative to the bottom diameter (or the
 * sphere diameter); sizes follow from the capacity.
 *
 *  - cylinder: pot, beaker;
 *  - frustum:  conical flask, cezve — bottom and top of different width;
 *  - sphere:   round-bottom flask (with a narrow neck);
 *  - tube:     test tube — a long narrow cylinder with a rounded bottom.
 */
export type VesselShape =
  | { readonly type: 'cylinder'; readonly heightToDiameter: SourcedValue }
  | { readonly type: 'frustum'; readonly heightToDiameter: SourcedValue; readonly topToBottom: SourcedValue }
  | { readonly type: 'sphere'; readonly neckToDiameter: SourcedValue }
  | { readonly type: 'tube'; readonly heightToDiameter: SourcedValue };

/** Can it stand flat on a hob? A sphere or a round-bottom tube touches a plane at a single point. */
export const hasFlatBottom = (shape: VesselShape): boolean => shape.type === 'cylinder' || shape.type === 'frustum';

export interface VesselGeometry {
  /** Flat bottom that can touch a hot plate, m² (0 for round bottoms). */
  readonly contactArea: number;
  /** Inner surface in contact with the liquid, m². */
  readonly wetted: number;
  /** Open liquid surface (exchanging heat with the air or the lid), m². */
  readonly freeSurface: number;
  /** Outer side surface exposed to the room, m². */
  readonly outerSide: number;
  /** Diameter of the opening, m (what fits inside). */
  readonly opening: number;
  readonly height: number;
  /** Height of the liquid, m. */
  readonly liquidHeight: number;
}

/** Solves f(x) = target for monotonic increasing f on [0, hi]. */
function invert(f: (x: number) => number, target: number, hi: number): number {
  let lo = 0;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Geometry of a vessel of capacity `capacityL` holding `liquidL` litres.
 * Simple solids — good enough for heat exchange areas, not for drawing.
 */
export function vesselGeometry(shape: VesselShape, capacityL: number, liquidL: number): VesselGeometry {
  const C = capacityL / 1000;
  const V = Math.min(liquidL, capacityL) / 1000;
  switch (shape.type) {
    case 'cylinder':
    case 'tube': {
      const k = shape.heightToDiameter.value;
      const r = Math.cbrt(C / (2 * Math.PI * k));
      const height = 2 * k * r;
      const bottom = Math.PI * r * r;
      const liquidHeight = V / bottom;
      return {
        contactArea: shape.type === 'cylinder' ? bottom : 0,
        wetted: bottom + 2 * Math.PI * r * liquidHeight,
        freeSurface: bottom,
        outerSide: 2 * Math.PI * r * height,
        opening: 2 * r,
        height,
        liquidHeight,
      };
    }
    case 'frustum': {
      const a = shape.heightToDiameter.value;
      const k = shape.topToBottom.value;
      // V = π H (R² + R r + r²) / 3,  H = 2aR,  r = kR
      const R = Math.cbrt((3 * C) / (2 * Math.PI * a * (1 + k + k * k)));
      const H = 2 * a * R;
      const radiusAt = (h: number) => R + (k * R - R) * (h / H);
      const volumeTo = (h: number) => (Math.PI * h * (R * R + R * radiusAt(h) + radiusAt(h) ** 2)) / 3;
      const lateralTo = (h: number) => Math.PI * (R + radiusAt(h)) * Math.hypot(h, R - radiusAt(h));
      const liquidHeight = invert(volumeTo, V, H);
      const bottom = Math.PI * R * R;
      return {
        contactArea: bottom,
        wetted: bottom + lateralTo(liquidHeight),
        freeSurface: Math.PI * radiusAt(liquidHeight) ** 2,
        outerSide: lateralTo(H),
        opening: 2 * k * R,
        height: H,
        liquidHeight,
      };
    }
    case 'sphere': {
      const R = Math.cbrt((3 * C) / (4 * Math.PI));
      const capVolume = (h: number) => (Math.PI * h * h * (3 * R - h)) / 3;
      const h = invert(capVolume, V, 2 * R);
      return {
        contactArea: 0,
        wetted: 2 * Math.PI * R * h,
        freeSurface: Math.PI * (2 * R * h - h * h),
        outerSide: 4 * Math.PI * R * R,
        opening: shape.neckToDiameter.value * 2 * R,
        height: 2 * R,
        liquidHeight: h,
      };
    }
  }
}
