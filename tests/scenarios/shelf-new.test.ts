import { describe, expect, it } from 'vitest';
import { createCommandRegistry, createExperimentSession, createSimulation, seconds } from '../../src/core/index.js';
import { createElectricalSolver } from '../../src/domains/electrical/index.js';
import { createThermalSolver } from '../../src/domains/thermal/index.js';
import { LAB_COMMANDS, labSetup, SAMPLE_ID, type LabCommand, type LabParams } from '../../src/scenarios/index.js';
import { SUBSTANCES } from '../../src/substances/index.js';

const simulation = createSimulation({ solvers: [createElectricalSolver(), createThermalSolver()], fixedDt: seconds(2) });
const commands = createCommandRegistry<LabCommand>(LAB_COMMANDS as never);
const water: LabParams = { substance: 'water', liters: 0.2, startTemp: 20, roomTemp: 20, lid: false, vessel: 'beaker', size: 0.25, material: 'glass', action: 'heat-to', target: 60, heater: { id: 'electric-hotplate', rating: 2000, knob: 0 } };
const add = (substance: string, grams: number) => ({ type: 'thermal.add', into: SAMPLE_ID, substance, mass: grams / 1000, temperature: 293.15 }) as unknown as LabCommand;

describe('new shelf substances behave honestly', () => {
  it('sugar, baking soda, copper sulfate in water dissolve by the same rule as salt — no lump left', () => {
    for (const id of ['sugar', 'baking-soda', 'copper-sulfate']) {
      const s = createExperimentSession<LabCommand>({ initial: labSetup(water).state, simulation, commands, sampleEvery: seconds(10) });
      expect(s.apply(add(id, 10)).ok, id).toBe(true);
      const mix = (s.state.entities[SAMPLE_ID as never] as { state: { mixture?: { solutes: { component: string; crystals: number }[] } } }).state.mixture!;
      expect(mix.solutes.map((x) => x.component), id).toEqual([SUBSTANCES[id as 'sugar'].component]);
      expect(mix.solutes[0]!.crystals, id).toBe(0);
    }
  });

  it('chalk, graphite, porcelain, brick, Fe(OH)₂ in water: insoluble pieces', () => {
    for (const id of ['chalk', 'graphite', 'porcelain', 'brick', 'iron-ii-hydroxide']) {
      const s = createExperimentSession<LabCommand>({ initial: labSetup(water).state, simulation, commands, sampleEvery: seconds(10) });
      expect(s.apply(add(id, 10)).ok, id).toBe(true);
    }
  });

  it('every shelf solid can be heated dry as the sample', () => {
    for (const s of Object.values(SUBSTANCES).filter((x) => x.category.startsWith('solid.') && !x.flammable)) {
      const p: LabParams = { ...water, substance: s.id as never, liters: 20 / s.liquid.density.value, heater: { id: 'bunsen-burner', rating: 1500, knob: 1 }, vessel: 'crucible', size: 0.03, material: 'porcelain' };
      expect(labSetup(p).warnings, s.id).toEqual([]);
    }
  });
});
