import { describe, expect, it } from 'vitest';
import { createCommandRegistry, createExperimentSession, createSimulation, entityId, seconds } from '../../../src/core/index.js';
import { celsius, kilograms } from '../../../src/core/units.js';
import { bodyMass, createThermalSolver, equilibriumTemperature, isThermalBody, THERMAL_COMMANDS, thermalEnergy, type ThermalCommand } from '../../../src/domains/thermal/index.js';
import { labSetup, SAMPLE_ID, type LabParams } from '../../../src/scenarios/index.js';

const simulation = createSimulation({ solvers: [createThermalSolver()], fixedDt: seconds(1) });
const commands = createCommandRegistry<ThermalCommand>(THERMAL_COMMANDS);
const P: LabParams = { action: 'cool-to', target: 30, substance: 'water', liters: 0.3, startTemp: 80, vessel: 'beaker', size: 0.6, material: 'glass', lid: true, roomTemp: 20 };
const body = (s: ReturnType<typeof labSetup>['state'], id: string) => {
  const e = s.entities[entityId(id)]!;
  if (!isThermalBody(e)) throw new Error(id);
  return e;
};
const absorbed = (s: ReturnType<typeof labSetup>['state']) =>
  Object.values(s.entities).reduce((sum, e) => sum + (e.kind === 'thermal.reservoir' ? (e.state as { heatAbsorbed: number }).heatAbsorbed : 0), 0);

describe('adding a substance during the experiment', () => {
  it('hot water into water mixes by heat balance', () => {
    const s0 = labSetup({ ...P, startTemp: 20 }).state;
    const r = commands.apply(s0, { type: 'thermal.add', into: SAMPLE_ID, substance: 'water', mass: kilograms(0.1), temperature: celsius(80) });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const b = body(r.value.state, SAMPLE_ID);
    const m0 = bodyMass(body(s0, SAMPLE_ID));
    expect(bodyMass(b)).toBeCloseTo(m0 + 0.1, 9);
    const c = b.params.specificHeat;
    expect(b.state.temperature).toBeCloseTo(equilibriumTemperature([{ mass: kilograms(m0), specificHeat: c, temperature: celsius(20) }, { mass: kilograms(0.1), specificHeat: c, temperature: celsius(80) }]), 9);
    expect(thermalEnergy(r.value.state) - thermalEnergy(s0)).toBeCloseTo(r.value.externalEnergy, 6);
  });

  it('an ice cube melts in hot water and cools it; energy balance closes', () => {
    const s = createExperimentSession<ThermalCommand>({ initial: labSetup(P).state, simulation, commands, sampleEvery: seconds(10) });
    const e = s.apply({ type: 'thermal.add', into: SAMPLE_ID, substance: 'water', mass: kilograms(0.03), temperature: celsius(-18), frozen: true });
    expect(e.ok).toBe(true);
    const ice = `${SAMPLE_ID}+1`;
    expect(body(s.state, ice).state.solidFraction).toBe(1);
    s.advance(1800);
    expect(body(s.state, ice).state.solidFraction).toBe(0);
    expect(body(s.state, SAMPLE_ID).state.temperature).toBeLessThan(celsius(60));
    const r = s.result();
    const external = r.externalEnergy;
    expect(Math.abs(thermalEnergy(r.final) - thermalEnergy(r.initial) - external + absorbed(r.final))).toBeLessThan(1e-6 * Math.abs(thermalEnergy(r.initial)));
  });

  it('oil forms a layer over the whole surface', () => {
    const r = commands.apply(labSetup(P).state, { type: 'thermal.add', into: SAMPLE_ID, substance: 'sunflower-oil', mass: kilograms(0.05), temperature: celsius(20) });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const link = r.value.state.connections.find((c) => c.id.startsWith(`${SAMPLE_ID}+1`))!;
    const surface = r.value.state.connections.find((c) => c.a.entity === SAMPLE_ID && (c.params as { origin?: { surface?: boolean } }).origin?.surface)!;
    expect((link.params as { origin: { area: number } }).origin.area).toBeCloseTo((surface.params as { origin: { area: number } }).origin.area, 12);
  });

  it('alcohol mixes into water (one solution), impossible ice is refused', () => {
    const s0 = labSetup(P).state;
    const a = commands.apply(s0, { type: 'thermal.add', into: SAMPLE_ID, substance: 'ethanol', mass: kilograms(0.05), temperature: celsius(20) });
    expect(a.ok).toBe(true);
    if (a.ok) expect((a.value.state.entities[SAMPLE_ID as never] as { state: { mixture?: { solutes: { component: string }[] } } }).state.mixture?.solutes.map((x) => x.component)).toEqual(['ethanol']);
    const b = commands.apply(s0, { type: 'thermal.add', into: SAMPLE_ID, substance: 'water', mass: kilograms(0.05), temperature: celsius(5), frozen: true });
    expect(b.ok).toBe(false);
  });
});
