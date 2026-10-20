import { describe, expect, it } from 'vitest';
import { createCommandRegistry, createSimulation, seconds } from '../../src/core/index.js';
import { createElectricalSolver } from '../../src/domains/electrical/index.js';
import { createThermalSolver } from '../../src/domains/thermal/index.js';
import { LAB_COMMANDS, labCourse, runProtocol, type LabCommand, type LabParams } from '../../src/scenarios/index.js';

const simulation = createSimulation({ solvers: [createElectricalSolver(), createThermalSolver()], fixedDt: seconds(2) });
const commands = createCommandRegistry<LabCommand>(LAB_COMMANDS as never);
const litre: LabParams = { action: 'boil', substance: 'water', liters: 1, startTemp: 20, vessel: 'pot', size: 2, material: 'steel', lid: false, roomTemp: 20, heater: { id: 'electric-hotplate', rating: 2000, knob: 1 } };

describe('the course of an experiment', () => {
  it('lists every step with the weighings before and after it and how it ended', () => {
    // The page keeps a weighing in the log of the step it was made in; do the same here.
    const out = runProtocol({ base: litre, steps: [{ kind: 'operation', action: 'boil', heater: litre.heater! }], simulation, commands, sampleEvery: seconds(60) });
    const s = out[0]!;
    const blocks = labCourse([{ params: s.params!, result: s.result, status: s.status! }], { locale: 'uk', level: 'school' });
    const text = JSON.stringify(blocks);
    expect(text).toContain('Хід досліду');
    expect(text).toContain('Крок 1. Закип’ятити');
    expect(text).toContain('мети досягнуто');
    expect(text).toMatch(/20 °C → (99,9|100) °C/);
  });

  it('shows the actions of a step in their places: at the start, during, after', async () => {
    const { createExperimentSession } = await import('../../src/core/index.js');
    const { labSetup, labGoalReached, labStatus } = await import('../../src/scenarios/index.js');
    const x = createExperimentSession<LabCommand>({ initial: labSetup(litre).state, simulation, commands, sampleEvery: seconds(60) });
    x.apply({ type: 'lab.weigh', scale: 'kitchen-scale' });
    x.advance(24 * 3600, (st) => labGoalReached(litre, st));
    x.apply({ type: 'lab.weigh', scale: 'kitchen-scale' });
    const r = x.result(true);
    const items = labCourse([{ params: litre, result: r, status: labStatus(litre, r, simulation, []) }], { locale: 'uk', level: 'school' }).flatMap((b) => (b.kind === 'list' ? b.items : []));
    expect(items[0]).toMatch(/^на початку — Зважили .*: 1\s657 г$/);
    expect(items[items.length - 1]).toMatch(/^після кроку — Зважили/);
  });
});
