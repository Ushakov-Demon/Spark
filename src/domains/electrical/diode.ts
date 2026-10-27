/**
 * A semiconductor diode: the Shockley equation I = I_s·(e^(U / (n·V_T)) − 1), V_T = k·T / e. Forward (U > 0) the
 * current grows steeply once U passes a few tenths of a volt; in reverse it is only −I_s, nanoamperes. A diode in a
 * circuit with a source E and a resistance R in series: E = I·R + U(I), solved for I.
 */

/** The Boltzmann constant, J/K, and the elementary charge, C: exact in the SI since 2019. */
export const BOLTZMANN = 1.380649e-23;
export const ELEMENTARY_CHARGE = 1.602176634e-19;

export interface DiodeParams {
  /** The saturation current, A. */
  readonly saturation: number;
  /** The ideality factor (1…2). */
  readonly ideality: number;
}

/** The thermal voltage k·T / e at T kelvin (≈ 25.9 mV at 300 K). */
export const thermalVoltage = (kelvin: number): number => (BOLTZMANN * kelvin) / ELEMENTARY_CHARGE;

/** The current through the diode at the voltage `u` across it (forward positive). */
export function diodeCurrent(d: DiodeParams, u: number, kelvin: number): number {
  return d.saturation * Math.expm1(u / (d.ideality * thermalVoltage(kelvin)));
}

/**
 * The current in a loop of a source `emf`, a resistance `r` and the diode (turned forward to the source, or in
 * reverse): the voltage on the diode found so that E = I·R + U. Bisection on U: the diode's current only grows with it.
 */
export function diodeLoop(d: DiodeParams, emf: number, r: number, kelvin: number, reverse = false): { readonly current: number; readonly diodeVoltage: number } {
  const e = reverse ? -emf : emf;
  // The diode's voltage lies between 0 and the source's (with its sign): the resistor takes the rest.
  let lo = Math.min(0, e);
  let hi = Math.max(0, e);
  for (let k = 0; k < 200; k++) {
    const u = (lo + hi) / 2;
    // Too much current through the diode for what the resistor leaves: a lower voltage on it.
    if (diodeCurrent(d, u, kelvin) * r + u > e) hi = u;
    else lo = u;
  }
  const u = (lo + hi) / 2;
  return { current: diodeCurrent(d, u, kelvin), diodeVoltage: u };
}
