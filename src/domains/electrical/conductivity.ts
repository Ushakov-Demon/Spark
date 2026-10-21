import { COMPONENTS, NACL_SOLUTE, type ComponentId, type Electrolysis } from '../../components/index.js';
import { ZERO_CELSIUS_IN_KELVIN } from '../../core/units.js';
import type { ThermalBody } from '../thermal/entities.js';
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
    const solution = liquid + mix.salt - mix.crystals;
    // Each dissolved component conducts by its own measured table, at its own share of the solution;
    // with several, their conductivities add up (an approximation: ions slow each other a little).
    let k20 = 0;
    const electrolyses: Electrolysis[] = [];
    for (const x of mix.solutes) {
      const dissolved = x.mass - x.crystals;
      if (!(dissolved > 1e-9)) continue;
      const c = COMPONENTS[x.component as ComponentId];
      const w = dissolved / solution;
      const table = c?.inWater?.conductivityTable;
      k20 += c?.inWater?.model?.conductivityAt20?.(w) ?? (table ? interpolate(table.w, table.kappa, w) : 0);
      const e = c?.inWater?.model?.electrolysis ?? c?.inWater?.electrolysis;
      if (e) electrolyses.push(e);
    }
    // Only the liquid part conducts; ice crystals block part of the way.
    const kappa = Math.max(k20, waterK) * tempFactor(T) * (liquid / mix.water);
    const electrolysis = chooseElectrolysis(electrolyses) ?? water.electrical?.electrolysis;
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

/**
 * With several solutes, what happens at each electrode: the cathode takes the easiest reduction (the
 * highest potential: copper before hydrogen), the anode a halide's gas if there is one (chlorine beats
 * oxygen: oxygen needs a large overpotential), else the first. With none — the water's own electrolysis.
 */
function chooseElectrolysis(list: readonly Electrolysis[]): Electrolysis | undefined {
  if (list.length <= 1) return list[0];
  const cathode = [...list].sort((a, b) => (b.cathode.potential?.value ?? -Infinity) - (a.cathode.potential?.value ?? -Infinity))[0]!.cathode;
  const anode = (list.find((e) => e.anode.component !== 'oxygen') ?? list[0]!).anode;
  const voltage = (anode.potential?.value ?? 0) - (cathode.potential?.value ?? 0);
  const base = list[0]!.voltage;
  return { voltage: { ...base, value: Math.max(0, voltage) }, cathode, anode };
}

function interpolate(xs: readonly number[], ys: readonly number[], x: number): number {
  if (x <= xs[0]!) return ys[0]!;
  for (let i = 1; i < xs.length; i++) if (x <= xs[i]!) return ys[i - 1]! + ((ys[i]! - ys[i - 1]!) * (x - xs[i - 1]!)) / (xs[i]! - xs[i - 1]!);
  return ys[ys.length - 1]!;
}
