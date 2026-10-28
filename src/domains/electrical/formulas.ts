/**
 * Pure formulas of current through a liquid (8th grade: Ohm, Joule–Lenz,
 * resistance; electrolysis — Faraday). Plain numbers in SI units.
 */

/** Resistance of the liquid between the electrodes: R = K / κ (K = L / A — the cell constant). */
export const cellResistance = (cellConstant: number, conductivity: number): number => cellConstant / conductivity;

/** Ohm's law for the cell with a counter-voltage: I = (U − U_d) / (R + r); no current below U_d. */
export const cellCurrentOhm = (voltage: number, decomposition: number, resistance: number, internal: number): number =>
  Math.max(0, voltage - decomposition) / (resistance + internal);

/** Joule–Lenz: heat released per second in the liquid, P = I²·R. */
export const joulePower = (current: number, resistance: number): number => current * current * resistance;

/** Faraday's law: amount of gas at an electrode, n = Q / (z·F). */
export const faradayMoles = (charge: number, electrons: number): number => charge / (electrons * 96_485.33212);

/** Resistance of a conductor from what the voltmeter and the ammeter show: R = U / I (Ohm's law for a part of a circuit). */
export const resistanceFromReadings = (voltage: number, current: number): number => voltage / current;

/** A metal's resistance warmed by Δt: R = R₀·(1 + α·Δt) — near room temperature its resistivity grows almost linearly. */
export const resistanceAtTemperature = (r0: number, alpha: number, dt: number): number => r0 * (1 + alpha * dt);

/** Two conductors in series: the same current, the voltages add up, U = U₁ + U₂ (and R = R₁ + R₂). */
export const seriesVoltage = (u1: number, u2: number): number => u1 + u2;

/** Two conductors in parallel: the same voltage, the currents add up, I = I₁ + I₂ (and 1/R = 1/R₁ + 1/R₂). */
export const parallelCurrent = (i1: number, i2: number): number => i1 + i2;

/** Power of a consumer: the voltage across it times the current through it, P = U · I. */
/** A field across the Earth's horizontal one, from the compass needle's turn: B = B_Earth·tg θ (θ in degrees). */
export const fieldFromCompass = (earth: number, degrees: number): number => earth * Math.tan((degrees * Math.PI) / 180);
export const electricPower = (voltage: number, current: number): number => voltage * current;
