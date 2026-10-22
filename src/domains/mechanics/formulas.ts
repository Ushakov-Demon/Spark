/**
 * Pure formulas of 7th-grade mechanics: density, weight, Archimedes, floating; a spring (Hooke),
 * sliding friction, pressure on a support. Plain numbers in SI units.
 */

/** Density: ρ = m / V. */
export const density = (mass: number, volume: number): number => mass / volume;

/** Weight of a body at rest: P = m·g. */
export const weight = (mass: number, g: number): number => mass * g;

/** Archimedes: the buoyant force equals the weight of the liquid displaced, F = ρ_liquid·g·V_submerged. */
export const buoyantForce = (liquidDensity: number, g: number, submergedVolume: number): number => liquidDensity * g * submergedVolume;

/** A body floats when it is less dense than the liquid; then this share of it is under the surface: ρ_body / ρ_liquid. Otherwise it sinks (1). */
export const submergedShare = (bodyDensity: number, liquidDensity: number): number => Math.min(1, bodyDensity / liquidDensity);

/** Hooke's law: the elastic force of a stretched spring F = k·x (x — the extension). */
export const elasticForce = (stiffness: number, extension: number): number => stiffness * extension;

/** Sliding friction (Amontons–Coulomb): F = μ·N. */
export const slidingFriction = (mu: number, normalForce: number): number => mu * normalForce;

/** Pressure of a body on its support: p = F / S. */
export const pressure = (force: number, area: number): number => force / area;
