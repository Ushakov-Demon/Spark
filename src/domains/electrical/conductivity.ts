import { COMPONENTS, NACL_SOLUTE, type ComponentId, type Electrolysis } from '../../components/index.js';
import { ZERO_CELSIUS_IN_KELVIN } from '../../core/units.js';
import type { ThermalBody } from '../thermal/entities.js';
import { liquidConcentration } from '../thermal/mixture.js';
import { SUBSTANCES, type SubstanceId } from '../../substances/catalog.js';

/** What the electrodes "see" in the liquid right now. */
export interface CellReading {
  /** Electrical conductivity κ, S/m (0 — practically an insulator). */
  readonly conductivity: number;
  /** What the current does: the minimum voltage and the gases. */
  readonly electrolysis?: Electrolysis;
}

/** Temperature rule for conductivity: + ≈ 2 % per kelvin above 20 °C (sourced in the NaCl solute model). */
const TEMP_COEFF = NACL_SOLUTE.conductivityTempCoeff!.value;
const tempFactor = (kelvin: number) => Math.max(0, 1 + TEMP_COEFF * (kelvin - ZERO_CELSIUS_IN_KELVIN - 20));

/**
 * Conductivity of a body from its composition and temperature, asked from the
 * component models: salt water — the solute's table; distilled water — its own
 * small value; ice and insulators (oil, alcohol) — practically zero.
 */
export function cellReading(body: ThermalBody): CellReading {
  const water = COMPONENTS.water;
  const waterK = water.electrical?.conductivity?.value ?? 0;
  const T = body.state.temperature;
  const mix = 'mixture' in body.state ? body.state.mixture : undefined;
  if (mix) {
    const liquid = mix.water - mix.ice;
    if (!(liquid > 1e-9)) return { conductivity: 0 };
    const solute = NACL_SOLUTE;
    const w = liquidConcentration(mix);
    const k20 = Math.max(solute.conductivityAt20?.(w) ?? 0, waterK);
    // Only the liquid part conducts; ice crystals block part of the way.
    const kappa = k20 * tempFactor(T) * (liquid / mix.water);
    const dissolved = mix.salt - mix.crystals > 1e-9;
    const electrolysis = dissolved ? solute.electrolysis : water.electrical?.electrolysis;
    return { conductivity: kappa, ...(electrolysis ? { electrolysis } : {}) };
  }
  const shelfId = 'substance' in body.params ? body.params.substance : undefined;
  const componentId = shelfId ? (SUBSTANCES[shelfId as SubstanceId]?.component ?? shelfId) : 'water';
  const component = COMPONENTS[componentId as ComponentId];
  const k20 = component?.electrical?.conductivity?.value ?? 0;
  const liquid = 1 - (body.state.solidFraction ?? 0);
  const electrolysis = component?.electrical?.electrolysis;
  return { conductivity: k20 * tempFactor(T) * liquid, ...(electrolysis ? { electrolysis } : {}) };
}
