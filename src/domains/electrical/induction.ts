import { MU0 } from './magnet.js';

/**
 * Electromagnetic induction (grade 9, «Явище електромагнітної індукції»): a bar magnet moved through a coil. The
 * magnet is taken as a uniformly magnetized cylinder (M = B_r/μ₀): on its side it is a sheet of current M per metre
 * of length. The flux it sends through one turn of the coil is the sum over that sheet of the mutual inductance of
 * two coaxial circles times its current; the mutual inductance comes from Neumann's formula, which for coaxial
 * circles of radii a, b, d apart is M₁₂ = μ₀·a·b/2 · ∫₀^{2π} cos φ dφ / √(a² + b² + d² − 2ab·cos φ).
 * The EMF is ε = −dΛ/dt (Λ — the flux through all the turns); moved at a steady speed v, ε = −v·dΛ/dz.
 */

/** The mutual inductance of two coaxial circles (radii a, b; d apart along the axis), H. */
export function coaxialMutual(a: number, b: number, d: number, steps = 64): number {
  let s = 0;
  for (let i = 0; i < steps; i++) {
    const p = ((i + 0.5) * 2 * Math.PI) / steps;
    s += Math.cos(p) / Math.sqrt(a * a + b * b + d * d - 2 * a * b * Math.cos(p));
  }
  return ((MU0 * a * b) / 2) * ((s * 2 * Math.PI) / steps);
}

export interface CoilAndMagnet {
  /** The coil: turns, mean radius and length, m. */
  readonly turns: number;
  readonly radius: number;
  readonly length: number;
  /** The magnet: remanence B_r, T; radius and length, m. */
  readonly remanence: number;
  readonly magnetRadius: number;
  readonly magnetLength: number;
}

/** The flux through all the coil's turns, Wb, with the magnet's middle z from the coil's middle (along the axis). */
export function linkage(s: CoilAndMagnet, z: number): number {
  const M = s.remanence / MU0;
  const nc = 12;
  const nm = 30;
  let sum = 0;
  for (let i = 0; i < nc; i++) {
    const zc = -s.length / 2 + ((i + 0.5) * s.length) / nc;
    for (let j = 0; j < nm; j++) {
      const zm = z - s.magnetLength / 2 + ((j + 0.5) * s.magnetLength) / nm;
      sum += coaxialMutual(s.radius, s.magnetRadius, zc - zm) * ((M * s.magnetLength) / nm);
    }
  }
  return (sum * s.turns) / nc;
}

/**
 * The largest EMF while the magnet goes from `from` to `to` (its middle from the coil's middle, m) in `time` s at a
 * steady speed, V — signed: positive while the flux grows.
 */
export function peakEmf(s: CoilAndMagnet, from: number, to: number, time: number): number {
  const v = Math.abs(to - from) / time;
  const n = 80;
  const h = 1e-3;
  let peak = 0;
  for (let i = 0; i <= n; i++) {
    const z = from + ((to - from) * i) / n;
    // dΛ/dt = dΛ/dz · dz/dt
    const e = ((linkage(s, z + h) - linkage(s, z - h)) / (2 * h)) * Math.sign(to - from) * v;
    if (Math.abs(e) > Math.abs(peak)) peak = e;
  }
  return -peak;
}
