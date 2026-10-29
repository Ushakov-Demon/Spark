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
/** The pressure of a liquid at a depth h: the weight of the column above each square metre, p = ρ·g·h. */
export const hydrostaticPressure = (density: number, g: number, depth: number): number => density * g * depth;
/** The air's pressure from the force on a syringe's plunger: its area from the scale, S = V / l, so p = F·l / V. */
export const syringePressure = (force: number, length: number, volume: number): number => (force * length) / volume;
/** The force of a liquid on a flat bottom: its pressure there over the bottom's area, F = ρ·g·h·S — whatever the vessel's shape. */
export const bottomForce = (density: number, g: number, depth: number, area: number): number => density * g * depth * area;
/** A hydraulic machine: the same pressure under both pistons, F₂ = F₁·S₂ / S₁. */
export const hydraulicForce = (f1: number, s1: number, s2: number): number => (f1 * s2) / s1;
/** Two liquids balanced in communicating vessels (heights above their boundary): ρ₁·h₁ = ρ₂·h₂, so ρ₂ = ρ₁·h₁ / h₂. */
export const balancedDensity = (rho1: number, h1: number, h2: number): number => (rho1 * h1) / h2;

/** Average speed: the path over the time it took, v = l / t. */
export const averageSpeed = (path: number, time: number): number => path / time;

/** The method of rows: a small body's size from a row of N of them, d = L / N. */
export const rowSize = (length: number, count: number): number => length / count;

/** A thread wound on (off) a spool: each turn moves it by the circumference, l = π·d·n. */
export const woundLength = (diameter: number, turns: number): number => Math.PI * diameter * turns;
/** Kepler's T²/a³: the period and the distance in the Earth's years and distances. */
export const keplerConstant = (period: number, distance: number): number => (period * period) / (distance * distance * distance);
/** The latitude from the Sun's height at noon and its declination, degrees. */
export const noonLatitude = (height: number, declination: number): number => 90 - height + declination;
/** How far a calendar moves the equinox's date in N years, days: its year T against the Sun's T☉ (later if shorter). */
export const calendarDrift = (years: number, calendarYear: number, sunYear: number): number => years * (sunYear - calendarYear);

/** The potential energy of a body raised by h: Eп = m·g·h. */
export const potentialEnergy = (mass: number, g: number, height: number): number => mass * g * height;

/** Two forces along one line: the same way they add, R = F₁ + F₂; opposite ways — the larger less the smaller, R = F₁ − F₂. */
export const resultantSame = (f1: number, f2: number): number => f1 + f2;
export const resultantOpposite = (f1: number, f2: number): number => f1 - f2;

/** Period of a repeating motion: the time of N turns (or swings) over N, T = t / N. */
export const period = (time: number, count: number): number => time / count;

/** Period of a pendulum swinging a little: T = 2π·√(l / g). */
export const pendulumPeriod = (length: number, g: number): number => 2 * Math.PI * Math.sqrt(length / g);

/**
 * A pendulum's period at an amplitude θ₀ (rad): the small-swing one lengthened by Bernoulli's first correction,
 * T ≈ 2π·√(l/g)·(1 + θ₀²/16).
 */
export const pendulumPeriodAt = (length: number, g: number, amplitude: number): number => pendulumPeriod(length, g) * (1 + amplitude ** 2 / 16);

/** Acceleration of a ball rolling down a slope without slipping: a = g·sin α / (1 + I/(m·r²)); a solid ball — I = 2/5·m·r². */
export const rollingAcceleration = (g: number, sinSlope: number, inertiaShare = 2 / 5): number => (g * sinSlope) / (1 + inertiaShare);

/** A body on a thread going round a horizontal circle (a conical pendulum): T = 2π·√(L·cos θ / g), sin θ = r / L. */
export const conicalPeriod = (threadLength: number, radius: number, g: number): number => 2 * Math.PI * Math.sqrt((threadLength * Math.sqrt(1 - (radius / threadLength) ** 2)) / g);

/** Moment of a force about an axis: the force times its arm, M = F·l. */
export const moment = (force: number, arm: number): number => force * arm;

/** Efficiency of a machine: the useful work over the work done, η = A_useful / A_done. */
export const efficiency = (useful: number, done: number): number => useful / done;
