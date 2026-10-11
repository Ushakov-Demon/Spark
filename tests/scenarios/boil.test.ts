import { describe, expect, it } from 'vitest';
import { createCommandRegistry, createSimulation, entityId, runExperiment, seconds } from '../../src/core/index.js';
import { celsius } from '../../src/core/units.js';
import { createThermalSolver, isHeater, isReservoir, isThermalBody, thermalEnergy, THERMAL_COMMANDS, type ThermalCommand } from '../../src/domains/thermal/index.js';
import { boilLab, DEFAULT_BOIL, potGeometry } from '../../src/scenarios/index.js';

const run = (p = DEFAULT_BOIL) => {
  const initial = boilLab(p);
  return runExperiment<ThermalCommand>({
    initial,
    simulation: createSimulation({ solvers: [createThermalSolver()], fixedDt: seconds(0.5) }),
    commands: createCommandRegistry<ThermalCommand>(THERMAL_COMMANDS),
    duration: seconds(12 * 3600),
    sampleEvery: seconds(60),
    until: (s) => {
      const w = s.entities[entityId('water')]!;
      return isThermalBody(w) && w.state.temperature >= celsius(100);
    },
  });
};

describe('boil scenario', () => {
  it('converts litres to kilograms with the sourced density', () => {
    const w = boilLab().entities[entityId('water')]!;
    if (!isThermalBody(w)) throw new Error();
    expect(w.params.mass).toBeCloseTo(20 * 0.99705, 4);
  });

  it('pot geometry holds the requested volume', () => {
    const g = potGeometry(20);
    expect(Math.PI * g.radius ** 2 * g.height * 1000).toBeCloseTo(20, 9);
  });

  it('stops at 100 °C and closes the energy balance', () => {
    const r = run();
    expect(r.stoppedEarly).toBe(true);
    const plate = r.final.entities[entityId('source')]!;
    const room = r.final.entities[entityId('room')]!;
    if (!isHeater(plate) || !isReservoir(room)) throw new Error();
    const dU = thermalEnergy(r.final) - thermalEnergy(r.initial);
    expect(dU + room.state.heatAbsorbed).toBeCloseTo(plate.state.energyDelivered, 3);
    // Real heating needs more than the loss-free minimum, but not absurdly more.
    const ideal = 19.941 * 4181 * 80 + 3 * 466 * 80;
    expect(plate.state.energyDelivered).toBeGreaterThan(ideal);
    expect(plate.state.energyDelivered).toBeLessThan(1.5 * ideal);
  });

  it('a weak hotplate may never boil the water', () => {
    expect(run({ ...DEFAULT_BOIL, power: 100 }).stoppedEarly).toBe(false);
  });
});
