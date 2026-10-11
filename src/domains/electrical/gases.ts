import { COMPONENTS, molarMass, type ComponentId, type Electrolysis } from '../../components/index.js';

/** Faraday constant, C/mol — exact since the 2019 SI (Wikipedia, Faraday constant). */
export const FARADAY = 96_485.33212;
/** Molar gas constant, J/(mol·K) — exact since the 2019 SI. */
export const GAS_CONSTANT = 8.314462618;

export interface GasAmount {
  readonly component: ComponentId;
  readonly moles: number;
  readonly mass: number; // kg
  /** Volume at the given temperature and 1 atm, m³ (ideal gas). */
  readonly volume: number;
}

/** Faraday's law: n = Q / (z·F) for each electrode's gas; volume by the ideal gas law. */
export function electrolysisGases(e: Electrolysis, charge: number, temperatureK: number, pressure = 101_325): GasAmount[] {
  return [e.cathode, e.anode].map((side) => {
    const component = side.component as ComponentId;
    const moles = charge / (side.electrons * FARADAY);
    const M = molarMass(COMPONENTS[component]) ?? 0;
    return { component, moles, mass: moles * M, volume: (moles * GAS_CONSTANT * temperatureK) / pressure };
  });
}
