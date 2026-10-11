import { ZERO_CELSIUS_IN_KELVIN } from '../../core/units.js';
import { NACL, NACL_EUTECTIC, VANT_HOFF_NACL, fractionFreezingAt, saturationFraction } from '../../substances/nacl.js';
import { MATERIALS } from './materials.js';
import { saturationPressure } from './evaporation.js';

/**
 * Water + table salt (NaCl) as one body with a changing composition — the
 * binary phase diagram in a lumped model:
 *
 *  - ice forms from pure water; the rest gets saltier and freezes colder
 *    (freezing curve), down to the eutectic −21.1 °C where everything is solid;
 *  - salt beyond solubility crystallises (solubility curve);
 *  - water boils when its vapour pressure, lowered by the dissolved salt
 *    (Raoult: p = x_water · p_sat), reaches 1 atm — so boiling brine gets hotter
 *    as it concentrates, and boiling it dry leaves salt crystals.
 *
 * Enthalpy is measured from liquid water and solid salt at 0 °C; the heat of
 * dissolution is ignored (small for NaCl).
 */
export interface MixtureAmounts {
  /** All H₂O in the body (liquid + ice), kg. */
  readonly water: number;
  /** All NaCl (dissolved + crystals), kg. */
  readonly salt: number;
  readonly ice: number;
  readonly crystals: number;
}

const T0 = ZERO_CELSIUS_IN_KELVIN;
const TE = T0 + NACL_EUTECTIC.t;
const CW = MATERIALS.water.specificHeat.value;
const CI = MATERIALS.ice.specificHeat.value;
const CS = NACL.specificHeat.value;
const LF = 334_000; // J/kg, water (OpenStax, Wikipedia: see the substance catalog)
const M_WATER = 0.01802;
const M_SALT = NACL.molarMass.value;
const P_ATM = 101_325;

export function mixtureEnthalpy(m: MixtureAmounts, temperature: number): number {
  const t = temperature - T0;
  return (m.water - m.ice) * CW * t + m.ice * (-LF + CI * t) + m.salt * CS * t;
}

/** Heat capacity of the body right now, J/K (for the stability limit). */
export const mixtureHeatCapacity = (m: MixtureAmounts): number => (m.water - m.ice) * CW + m.ice * CI + m.salt * CS;

/** Ice and crystals in equilibrium at temperature T for given totals. */
export function equilibriumAt(water: number, salt: number, temperature: number): MixtureAmounts {
  if (temperature < TE) return { water, salt, ice: water, crystals: salt };
  const t = temperature - T0;
  let ice = 0;
  if (t < 0) {
    const wf = fractionFreezingAt(t);
    const liquidWater = wf > 0 ? (salt * (1 - wf)) / wf : 0;
    if (liquidWater < water) ice = water - liquidWater;
  }
  const liquid = water - ice;
  const ws = saturationFraction(Math.max(t, 0));
  let crystals = 0;
  if (liquid <= 0) crystals = salt;
  else if (salt / (liquid + salt) > ws) crystals = salt - (ws / (1 - ws)) * liquid;
  return { water, salt, ice, crystals: Math.max(0, Math.min(salt, crystals)) };
}

const enthalpyAt = (water: number, salt: number, temperature: number) => mixtureEnthalpy(equilibriumAt(water, salt, temperature), temperature);

/**
 * Temperature and phases from total enthalpy H. H(T) only grows with T but has
 * jumps (melting of pure ice at 0 °C, the eutectic): inside a jump the
 * temperature stays put and the amounts are interpolated — that is the plateau.
 */
export function decodeMixture(h: number, water: number, salt: number): { temperature: number; amounts: MixtureAmounts } {
  let lo = TE - 200;
  let hi = T0 + 1500;
  if (h <= enthalpyAt(water, salt, lo)) return { temperature: lo, amounts: equilibriumAt(water, salt, lo) };
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (enthalpyAt(water, salt, mid) < h) lo = mid;
    else hi = mid;
  }
  const eps = 1e-6;
  const left = equilibriumAt(water, salt, lo - eps);
  const right = equilibriumAt(water, salt, hi + eps);
  const hl = mixtureEnthalpy(left, lo);
  const hr = mixtureEnthalpy(right, hi);
  if (hr - hl > 1e-6 && h > hl && h < hr) {
    // On a plateau: part of the substance has changed phase.
    const f = (h - hl) / (hr - hl);
    return {
      temperature: (lo + hi) / 2,
      amounts: { water, salt, ice: left.ice + f * (right.ice - left.ice), crystals: left.crystals + f * (right.crystals - left.crystals) },
    };
  }
  const temperature = (lo + hi) / 2;
  return { temperature, amounts: equilibriumAt(water, salt, temperature) };
}

/** Mole fraction of water in the liquid (dissolved salt counted as ions). */
export function waterMoleFraction(m: MixtureAmounts): number {
  const nw = (m.water - m.ice) / M_WATER;
  const ns = ((m.salt - m.crystals) / M_SALT) * VANT_HOFF_NACL.value;
  return nw <= 0 ? 0 : nw / (nw + ns);
}

/** Boiling point of the liquid part, K (Raoult's law), or Infinity if there is no liquid water. */
export function mixtureBoilingPoint(m: MixtureAmounts): number {
  const x = waterMoleFraction(m);
  if (!(x > 0)) return Infinity;
  let lo = T0 + 90;
  let hi = T0 + 150;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (x * saturationPressure({ kind: 'buck' }, mid) < P_ATM) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Concentration of the liquid part (mass fraction of dissolved salt). */
export function liquidConcentration(m: MixtureAmounts): number {
  const liquid = m.water - m.ice;
  const dissolved = m.salt - m.crystals;
  return liquid + dissolved > 0 ? dissolved / (liquid + dissolved) : 0;
}

export const MIXTURE_CONSTANTS = { CW, CI, CS, LF, T0, TE } as const;
