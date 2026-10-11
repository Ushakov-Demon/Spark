import { describe, expect, it } from 'vitest';
import {
  kelvin,
  kilograms,
  meters,
  seconds,
  squareMeters,
} from '../../../src/core/units.js';
import {
  conductionConductance,
  equilibriumTemperature,
  heatForTemperatureChange,
  newtonCooling,
} from '../../../src/domains/thermal/formulas.js';
import { MATERIALS } from '../../../src/domains/thermal/materials.js';

describe('thermal formulas', () => {
  it('Q = m·c·ΔT: heating 1 kg of water by 80 K takes ~335 kJ', () => {
    expect(heatForTemperatureChange(kilograms(1), MATERIALS.water.specificHeat, 80)).toBeCloseTo(334_880);
  });

  it('Fourier: copper rod 1 cm², 10 cm long', () => {
    expect(conductionConductance(MATERIALS.copper.conductivity, squareMeters(1e-4), meters(0.1))).toBeCloseTo(0.401);
  });

  it('heat balance equation', () => {
    const t = equilibriumTemperature([
      { mass: kilograms(1), specificHeat: MATERIALS.water.specificHeat, temperature: kelvin(300) },
      { mass: kilograms(1), specificHeat: MATERIALS.water.specificHeat, temperature: kelvin(340) },
    ]);
    expect(t).toBeCloseTo(320);
  });

  it('Newton cooling after one time constant is 1/e of the way', () => {
    expect(newtonCooling(kelvin(100), kelvin(0), seconds(10), seconds(10))).toBeCloseTo(100 / Math.E);
  });
});
