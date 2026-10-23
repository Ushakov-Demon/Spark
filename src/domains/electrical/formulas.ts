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
