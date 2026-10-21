import { describe, expect, it } from 'vitest';
import { createCommandRegistry, createExperimentSession, createSimulation, seconds } from '../../src/core/index.js';
import { createElectricalSolver } from '../../src/domains/electrical/index.js';
import { createThermalSolver, isThermalBody, solubilityPer100, thermalEnergy } from '../../src/domains/thermal/index.js';
import { LAB_COMMANDS, labSetup, sampleOf, SAMPLE_ID, type LabCommand, type LabParams } from '../../src/scenarios/index.js';
import { SUBSTANCES, type SubstanceId } from '../../src/substances/index.js';

const simulation = createSimulation({ solvers: [createElectricalSolver(), createThermalSolver()], fixedDt: seconds(2) });
const commands = createCommandRegistry<LabCommand>(LAB_COMMANDS as never);
const water = (liters: number): LabParams => ({ substance: 'water', liters, startTemp: 20, roomTemp: 20, lid: false, vessel: 'pot', size: 2, material: 'steel', action: 'heat-to', target: 60, heater: { id: 'electric-hotplate', rating: 2000, knob: 0 } });
const session = (p: LabParams) => createExperimentSession<LabCommand>({ initial: labSetup(p).state, simulation, commands, sampleEvery: seconds(10) });
const add = (substance: SubstanceId, grams: number, temperature = 20, frozen = false) => ({ type: 'thermal.add', into: SAMPLE_ID, substance, mass: grams / 1000, temperature: temperature + 273.15, frozen }) as unknown as LabCommand;
const pieces = (s: ReturnType<typeof session>) => Object.keys(s.state.entities).filter((id) => id.startsWith(`${SAMPLE_ID}+`));

describe('dissolving: one rule, whatever the order or form', () => {
  it('salt into water dissolves — also a "frozen" lump at −18 °C and a hot one', () => {
    for (const [t, frozen] of [[20, false], [-18, true], [100, false]] as const) {
      const s = session(water(1));
      expect(s.apply(add('table-salt', 100, t, frozen)).ok).toBe(true);
      expect(pieces(s)).toEqual([]);
      const mix = sampleOf(s.state).state.mixture!;
      expect(mix.salt).toBeCloseTo(0.1, 6);
      expect(mix.crystals).toBe(0);
    }
  });

  it('more salt than the water takes: the rest lies as crystals; warming dissolves a little more', () => {
    const s = session(water(0.1));
    s.apply(add('table-salt', 40));
    const mix = sampleOf(s.state).state.mixture!;
    const dissolved = (mix.salt - mix.crystals) * 1000;
    expect(dissolved).toBeCloseTo(solubilityPer100(20) * (mix.water * 10), 0);
    expect(mix.crystals).toBeGreaterThan(0.003);
    expect(solubilityPer100(100)).toBeGreaterThan(solubilityPer100(20));
  });

  it('water poured onto dry salt and brine poured into water mix the same way', () => {
    const dry = session({ ...water(0), substance: 'table-salt', liters: 50 / SUBSTANCES['table-salt'].liquid.density.value });
    dry.apply(add('water', 200));
    expect(sampleOf(dry.state).state.mixture!.crystals).toBe(0);
    const s = session(water(1));
    s.apply(add('salt-water-10', 100));
    expect(sampleOf(s.state).state.mixture!.salt).toBeCloseTo(0.01, 4);
  });

  it('energy: what the salt brings is counted, nothing appears from nowhere', () => {
    const s = session(water(1));
    const before = thermalEnergy(s.state);
    const e = s.apply(add('table-salt', 100, 20));
    expect(thermalEnergy(s.state) - before).toBeCloseTo(e.ok ? e.externalEnergy : NaN, 3);
  });

  it('a metal, ice in pure water, salt in oil: no dissolving — pieces', () => {
    const s = session(water(1));
    s.apply(add('aluminium', 100, 100));
    s.apply(add('water', 20, -10, true));
    expect(pieces(s).length).toBe(2);
    const oil = session({ ...water(0.5), substance: 'sunflower-oil' });
    oil.apply(add('table-salt', 10));
    expect(pieces(oil).length).toBe(1);
    expect(isThermalBody(oil.state.entities[pieces(oil)[0] as never]!)).toBe(true);
  });
});
