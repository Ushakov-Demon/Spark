/**
 * Pure formulas of bodies at rest in a liquid (7th grade: density, weight,
 * Archimedes, floating). Plain numbers in SI units.
 */

/** Density: ρ = m / V. */
export const density = (mass: number, volume: number): number => mass / volume;

/** Weight of a body at rest: P = m·g. */
export const weight = (mass: number, g: number): number => mass * g;

/** Archimedes: the buoyant force equals the weight of the liquid displaced, F = ρ_liquid·g·V_submerged. */
export const buoyantForce = (liquidDensity: number, g: number, submergedVolume: number): number => liquidDensity * g * submergedVolume;

/** A body floats when it is less dense than the liquid; then this share of it is under the surface: ρ_body / ρ_liquid. Otherwise it sinks (1). */
export const submergedShare = (bodyDensity: number, liquidDensity: number): number => Math.min(1, bodyDensity / liquidDensity);
