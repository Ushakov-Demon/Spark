/**
 * Pure formulas of photometry: illuminance as flux over area, the luminous intensity of a lamp that shines alike in
 * all directions, and the illuminance it gives at a distance (the inverse square and Lambert's cosine). Plain numbers
 * in SI units: lumens, candelas, lux, metres, radians.
 */

/** Illuminance: the luminous flux falling on a surface over its area, E = Φ / S (1 lx = 1 lm/m²). */
export const illuminance = (flux: number, area: number): number => flux / area;

/** The luminous intensity of a lamp shining alike in all directions: its flux over the full sphere's 4π sr, I = Φ / 4π. */
export const isotropicIntensity = (flux: number): number => flux / (4 * Math.PI);

/** The illuminance from a point source of intensity I at distance r, the light falling at α to the surface's normal: E = I · cos α / r². */
export const pointIlluminance = (intensity: number, r: number, alpha: number): number => (intensity * Math.cos(alpha)) / (r * r);

/** The luminous flux of a lamp: its luminous efficacy times the electric power it takes, Φ = η · P. */
export const luminousFlux = (efficacy: number, power: number): number => efficacy * power;
