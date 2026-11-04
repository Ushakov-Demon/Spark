import { orbitPeriod } from './formulas.js';

/**
 * A body thrown from a height over a ball-shaped planet, with no air: Newton's cannonball, at any angle to the
 * horizon. Its path is a conic about the planet's centre: r = p / (1 + e cos f), f the angle from the near point;
 * p = L²/μ (L = r₀·v·cos γ, γ the angle above the horizon), e cos f₀ = p/r₀ − 1, e sin f₀ = L·v·sin γ/μ at the throw.
 * Slow, it comes down; fast enough sideways, it goes round (an ellipse, e < 1); from the escape speed, away for good
 * (e ≥ 1) — unless aimed into the ground.
 */
export type Flight =
  | { readonly outcome: 'lands'; readonly angle: number; readonly range: number; readonly time: number }
  | { readonly outcome: 'orbits'; readonly period: number; readonly near: number; readonly far: number }
  | { readonly outcome: 'escapes' };

/** The path: p, e (≥ 0) and f₀ — where on it the throw is; r(θ) = p / (1 + e cos(f₀ + θ)), θ the angle gone since the throw. */
export interface Conic {
  readonly p: number;
  readonly e: number;
  readonly f0: number;
}

/** Straight up (or down) is taken a hair off the vertical: the path a needle-thin ellipse, the same rise and fall. */
const NEAR_VERTICAL = 1e-6;

/** The path of a throw at `v` from `r0` from the centre, `gamma` radians above the horizon. */
export function conic(mu: number, r0: number, v: number, gamma = 0): Conic {
  const c = Math.cos(gamma);
  const L = r0 * v * (Math.abs(c) < NEAR_VERTICAL ? NEAR_VERTICAL : c);
  const p = (L * L) / mu;
  const ec = p / r0 - 1;
  const es = (L * v * Math.sin(gamma)) / mu;
  return { p, e: Math.hypot(ec, es), f0: Math.atan2(es, ec) };
}

/** The distance from the centre `th` radians along the path from the throw. */
export const radiusAt = (k: Conic, th: number): number => k.p / (1 + k.e * Math.cos(k.f0 + th));

/** How far along the path it can go: once round an ellipse, or up to (just short of) a hyperbola's way out. */
export function reach(k: Conic): number {
  if (k.e < 1) return 2 * Math.PI;
  return Math.acos(-1 / k.e) - k.f0 - 1e-9;
}

/** How many slices the time along the path is summed in (Simpson's rule: far within a thousandth). */
const SLICES = 2000;

/** Thrown at `v` from `h` above a planet of radius `R` and gravitational parameter `mu`, `gamma` radians above the horizon. */
export function flight(mu: number, R: number, h: number, v: number, gamma = 0): Flight {
  const r0 = R + h;
  // Let go with no speed: straight down, t = √(r₀³/2μ) · (√(x(1 − x)) + arccos √x), x = R/r₀.
  if (v <= 0) {
    const x = R / r0;
    return { outcome: 'lands', angle: 0, range: 0, time: Math.sqrt(r0 ** 3 / (2 * mu)) * (Math.sqrt(x * (1 - x)) + Math.acos(Math.sqrt(x))) };
  }
  const k = conic(mu, r0, v, gamma);
  const end = reach(k);
  // Where it meets the ground (r = R): the first such point ahead of the throw, if any before it goes round or away.
  const c = k.e > 0 ? (k.p / R - 1) / k.e : Infinity;
  let land = Infinity;
  if (Math.abs(c) <= 1) {
    const a = Math.acos(c);
    for (const f of [a, -a, a + 2 * Math.PI, -a + 2 * Math.PI]) {
      const d = f - k.f0;
      const dd = ((d % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      // (From the ground the throw itself is on r = R: that root is not a landing.)
      if (dd > (h <= 0 ? 1e-8 : 1e-12) && dd < end && dd < land) land = dd;
    }
  }
  // Thrown from the ground itself, downwards or level: down at once.
  if (h <= 0 && Math.sin(gamma) <= 0) return { outcome: 'lands', angle: 0, range: 0, time: 0 };
  if (land < Infinity) {
    const L = Math.sqrt(k.p * mu);
    const n = SLICES;
    const step = land / n;
    let s = 0;
    for (let i = 0; i <= n; i++) s += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * radiusAt(k, i * step) ** 2;
    return { outcome: 'lands', angle: land, range: R * land, time: (s * step) / 3 / L };
  }
  if (k.e >= 1) return { outcome: 'escapes' };
  const near = k.p / (1 + k.e) - R;
  const far = k.p / (1 - k.e) - R;
  return { outcome: 'orbits', period: orbitPeriod(mu, k.p / (1 - k.e * k.e)), near, far };
}
