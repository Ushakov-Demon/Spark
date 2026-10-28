import { cite, sv } from '../../components/sourced.js';
import type { SourcedValue } from '../../knowledge/types.js';

/**
 * The magnetic field of a coil and of an iron rod in it (grade 9, «Електромагніти»). On the axis of a coil of length L
 * and radius a with n turns per metre and a current I, at a distance z from its middle:
 *   B = μ₀·n·I/2 · ((z + L/2)/√((z + L/2)² + a²) − (z − L/2)/√((z − L/2)² + a²)).
 * A rod magnetized uniformly with M along its axis makes the same field with M in place of n·I (its surface currents
 * are a coil's). A rod in the coil's field H = n·I is magnetized M = (μ_app − 1)·H, where the rod's apparent
 * permeability μ_app = μ_r / (1 + N·(μ_r − 1)) is much less than the material's own μ_r: the poles at its ends
 * push back (N — the demagnetizing factor; for a rod taken as a prolate spheroid with m = length/diameter,
 * N = (m/√(m² − 1)·ln(m + √(m² − 1)) − 1) / (m² − 1)). Far from saturation (B in the iron ≪ 1.5 T).
 */

/** The magnetic constant, T·m/A (since 2019 measured, ≈ 4π·10⁻⁷). */
export const MU0 = 1.25663706212e-6;

/** The horizontal part of the Earth's field in Kyiv: what turns a compass needle north. */
export const EARTH_HORIZONTAL: SourcedValue = sv(19.4e-6, 'T', 'Kyiv (50.45° N, 30.52° E), ground level, late 2026', 'single-source', 0.05, [cite('noaa-wmm-2025', 'WMM-2025 computed for Kyiv, 2026.8: H = 19 448 nT (F = 51 053 nT, I = 67.6°)', 'Kyiv, 2026.8', 19.4e-6)], 'From the model: a building’s steel and wiring change it locally by a few per cent; Lviv 19.9, Kharkiv 19.6, Odesa 21.6 µT.');
/** Carbon steel (a nail): relative permeability at weak fields. */
export const CARBON_STEEL_MU: SourcedValue = sv(100, '', 'carbon steel, at 0.002 T', 'single-source', 0.5, [cite('wikipedia-permeability', 'Table: carbon steel — 100, at 0.002 T', 'carbon steel', 100)], 'Steels differ much, and μ_r grows with the field: with 100 the nail’s apparent permeability is ≈ 65, with 1000 it would be ≈ 155 (its shape caps it near 1/N ≈ 180).');

/** The field on a coil's axis (or of a rod magnetized along it, with M for n·I), z from its middle. */
export function coilAxisField(nI: number, length: number, radius: number, z: number): number {
  const f = (s: number) => s / Math.sqrt(s * s + radius * radius);
  return ((MU0 * nI) / 2) * (f(z + length / 2) - f(z - length / 2));
}

/** The demagnetizing factor of a rod along its axis, as a prolate spheroid of the same length/diameter m (> 1). */
export function rodDemagnetizingFactor(m: number): number {
  const r = Math.sqrt(m * m - 1);
  return ((m / r) * Math.log(m + r) - 1) / (m * m - 1);
}

/** A rod's apparent permeability: its material's μ_r held back by its own poles. */
export const apparentPermeability = (mur: number, demag: number): number => mur / (1 + demag * (mur - 1));

export interface Electromagnet {
  readonly turns: number;
  readonly current: number;
  /** The winding: its length and radius, m. */
  readonly coilLength: number;
  readonly radius: number;
  /** An iron rod in it (none — a coil alone): its length and the material's μ_r. */
  readonly core?: { readonly length: number; readonly mur: number };
}

/** The field of the electromagnet on its axis, z from the middle (the rod and the coil centred alike). */
export function electromagnetField(e: Electromagnet, z: number): number {
  const nI = (e.turns * e.current) / e.coilLength;
  const coil = coilAxisField(nI, e.coilLength, e.radius, z);
  if (!e.core) return coil;
  const mu = apparentPermeability(e.core.mur, rodDemagnetizingFactor(e.core.length / (2 * e.radius)));
  return coil + coilAxisField((mu - 1) * nI, e.core.length, e.radius, z);
}

/** A compass needle's turn from north when a field B across the Earth's horizontal one H acts on it, degrees. */
export const compassDeflection = (b: number, h: number): number => (Math.atan2(b, h) * 180) / Math.PI;
