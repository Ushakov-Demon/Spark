import { describe, expect, it } from 'vitest';
import { createSimulation, createState, entityId, seconds, type SystemState } from '../../../src/core/index.js';
import {
  celsius,
  heatCapacity,
  kelvin,
  kilograms,
  specificHeat,
  thermalConductance,
  toCelsius,
  watts,
} from '../../../src/core/units.js';
import {
  createThermalSolver,
  equilibriumTemperature,
  heater,
  isHeater,
  isReservoir,
  isThermalBody,
  MATERIALS,
  newtonCooling,
  reservoir,
  thermalBody,
  thermalEnergy,
  thermalLink,
  ThermalSolverError,
  timeConstant,
} from '../../../src/domains/thermal/index.js';
import { calorimeterScenario, kettleScenario } from '../../../src/scenarios/index.js';

const solver = createThermalSolver();
const sim = (dt = 0.1) => createSimulation({ solvers: [solver], fixedDt: seconds(dt) });

const tempOf = (s: SystemState, id: string): number => {
  const e = s.entities[entityId(id)];
  if (!e || !(isThermalBody(e) || isHeater(e))) throw new Error(`no thermal body ${id}`);
  return e.state.temperature;
};

function deepFreeze<T>(o: T): T {
  if (o && typeof o === 'object') {
    Object.values(o).forEach(deepFreeze);
    Object.freeze(o);
  }
  return o;
}

describe('thermal solver', () => {
  it('matches analytic Newton cooling (cup of tea in a room)', () => {
    const mass = kilograms(0.3);
    const c = specificHeat(4186);
    const g = thermalConductance(1.5);
    const s0 = createState({
      entities: [
        thermalBody({ id: 'tea', mass, specificHeat: c, temperature: celsius(90) }),
        reservoir({ id: 'room', temperature: celsius(20) }),
      ],
      connections: [thermalLink({ id: 'l', a: 'tea', b: 'room', conductance: g })],
    });
    const tau = timeConstant(heatCapacity(mass * c), g);
    const s = sim(1).run(s0, seconds(1800));
    const expected = newtonCooling(celsius(90), celsius(20), tau, seconds(1800));
    expect(tempOf(s, 'tea')).toBeCloseTo(expected, 1);
  });

  it('calorimeter reaches the heat-balance temperature', () => {
    const s0 = calorimeterScenario();
    const s = sim(0.5).run(s0, seconds(600));
    const theta = equilibriumTemperature([
      { mass: kilograms(0.5), specificHeat: MATERIALS.copper.specificHeat.value, temperature: celsius(100) },
      { mass: kilograms(0.2), specificHeat: MATERIALS.water.specificHeat.value, temperature: celsius(20) },
    ]);
    expect(tempOf(s, 'copper')).toBeCloseTo(theta, 2);
    expect(tempOf(s, 'water')).toBeCloseTo(theta, 2);
  });

  it('conserves energy: ΔU = E_heater − Q_to_reservoirs', () => {
    const s0 = kettleScenario();
    const s = sim(0.1).run(s0, seconds(120));
    const h = s.entities[entityId('heater')];
    const r = s.entities[entityId('room')];
    if (!h || !isHeater(h) || !r || !isReservoir(r)) throw new Error('scene broken');
    const dU = thermalEnergy(s) - thermalEnergy(s0);
    expect(h.state.energyDelivered).toBeCloseTo(2000 * 120, 6);
    expect(dU).toBeCloseTo(h.state.energyDelivered - r.state.heatAbsorbed, 3);
  });

  it('heater reaches steady state T = T_env + P / G', () => {
    const s0 = createState({
      entities: [
        heater({ id: 'h', mass: kilograms(0.1), specificHeat: specificHeat(500), power: watts(10), temperature: celsius(20) }),
        reservoir({ id: 'air', temperature: celsius(20) }),
      ],
      connections: [thermalLink({ id: 'l', a: 'h', b: 'air', conductance: thermalConductance(0.5) })],
    });
    const s = sim(1).run(s0, seconds(2000)); // τ = 100 s → 20τ
    expect(toCelsius(kelvin(tempOf(s, 'h')))).toBeCloseTo(20 + 10 / 0.5, 3);
  });

  it('turned-off heater produces no heat', () => {
    const s0 = createState({
      entities: [heater({ id: 'h', mass: kilograms(1), specificHeat: specificHeat(500), power: watts(1000), on: false, temperature: celsius(20) })],
    });
    expect(tempOf(sim().run(s0, seconds(10)), 'h')).toBeCloseTo(celsius(20));
  });

  it('stays stable when dt is far beyond the explicit limit (auto sub-stepping)', () => {
    const s0 = createState({
      entities: [
        thermalBody({ id: 'tiny', mass: kilograms(0.001), specificHeat: specificHeat(385), temperature: celsius(500) }),
        reservoir({ id: 'sink', temperature: celsius(0) }),
      ],
      connections: [thermalLink({ id: 'l', a: 'tiny', b: 'sink', conductance: thermalConductance(10) })],
    });
    // τ = 0.0385 s, dt = 1 s → naive Euler would explode.
    const s = sim(1).tick(s0, seconds(1));
    const t = toCelsius(kelvin(tempOf(s, 'tiny')));
    expect(t).toBeGreaterThanOrEqual(-1e-9);
    expect(t).toBeLessThan(1e-6);
  });

  it('throws a readable error when the scene is too stiff for the step budget', () => {
    const strict = createThermalSolver({ maxSubsteps: 10 });
    const s0 = createState({
      entities: [
        thermalBody({ id: 'tiny', mass: kilograms(0.001), specificHeat: specificHeat(385), temperature: celsius(500) }),
        reservoir({ id: 'sink', temperature: celsius(0) }),
      ],
      connections: [thermalLink({ id: 'l', a: 'tiny', b: 'sink', conductance: thermalConductance(10) })],
    });
    expect(() => strict.step(s0, seconds(1))).toThrow(ThermalSolverError);
  });

  it('is pure: never mutates the input state', () => {
    const s0 = deepFreeze(kettleScenario());
    const before = JSON.stringify(s0);
    const s1 = solver.step(s0, seconds(1));
    expect(JSON.stringify(s0)).toBe(before);
    expect(s1).not.toBe(s0);
  });

  it('is deterministic', () => {
    const a = sim().run(kettleScenario(), seconds(60));
    const b = sim().run(kettleScenario(), seconds(60));
    expect(a).toEqual(b);
  });
});

describe('entity factories', () => {
  it('reject non-physical values', () => {
    expect(() => thermalBody({ id: 'x', mass: kilograms(-1), specificHeat: specificHeat(1), temperature: kelvin(1) })).toThrow(RangeError);
    expect(() => reservoir({ id: 'x', temperature: kelvin(-5) })).toThrow(RangeError);
  });
});
