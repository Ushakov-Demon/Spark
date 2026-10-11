import { describe, expect, it } from 'vitest';
import { createCommandRegistry, createSimulation, runExperiment, seconds } from '../../src/core/index.js';
import { createThermalSolver, THERMAL_COMMANDS, type ThermalCommand } from '../../src/domains/thermal/index.js';
import { renderText } from '../../src/explain/index.js';
import { goalOptions, labDebrief, labGoalReached, labSetup, lossBreakdown, paperTime, timeToGoal, type LabParams } from '../../src/scenarios/index.js';

const simulation = createSimulation({ solvers: [createThermalSolver()], fixedDt: seconds(2) });
const P: LabParams = { action: 'boil', substance: 'water', liters: 2, startTemp: 20, vessel: 'pot', size: 3, material: 'steel', lid: false, heater: { id: 'gas-hob', rating: 1000, knob: 1 }, roomTemp: 20 };
const run = (p: LabParams) =>
  runExperiment<ThermalCommand>({ initial: labSetup(p).state, simulation, commands: createCommandRegistry<ThermalCommand>(THERMAL_COMMANDS), duration: seconds(12 * 3600), sampleEvery: seconds(60), until: (s) => labGoalReached(p, s) });

describe('lab debrief', () => {
  it('paper time = c·m·ΔT / P', () => {
    const t = paperTime({ ...P, liters: 1, heater: { id: 'electric-hotplate', rating: 2000, knob: 1 } })!;
    expect(t).toBeCloseTo((4181 * 0.99705 * 80) / 2000, 6);
  });

  it.each([false, true])('losses add up to what the heater produced (lid: %s)', (lid) => {
    const b = lossBreakdown(run({ ...P, lid }));
    const sum = b.parts.reduce((s, x) => s + x.energy, 0);
    expect(Math.abs(sum - b.produced)).toBeLessThan(1e-6 * b.produced);
    expect(b.parts.find((x) => x.key === 'vapour')?.energy ?? 0).toBeGreaterThanOrEqual(0);
  });

  it('a gas flame: most of the heat goes past the pot, and that is reported separately', () => {
    const b = lossBreakdown(run(P));
    const flame = b.parts.find((x) => x.key === 'flame')!.energy / b.produced;
    expect(flame).toBeCloseTo(1 - 0.38, 2);
  });

  it('vapour takes a noticeable share in an open pot on a weak burner, much less under a lid', () => {
    const share = (lid: boolean) => {
      const b = lossBreakdown(run({ ...P, lid }));
      return (b.parts.find((x) => x.key === 'vapour')?.energy ?? 0) / b.produced;
    };
    expect(share(false)).toBeGreaterThan(0.05);
    expect(share(true)).toBeLessThan(share(false) / 2);
  });

  it('goal options really reach the goal', () => {
    const actual = timeToGoal(P, simulation);
    const target = actual * 0.8;
    const options = goalOptions(P, simulation, target, 'uk');
    expect(options.length).toBeGreaterThan(0);
    for (const o of options) expect(o.time).toBeLessThanOrEqual(target);
    expect(options.map((o) => o.label.uk).join('|')).toContain('Накрити кришкою');
  });

  it('a prediction equal to the paper calculation is recognised', () => {
    const r = run(P);
    const text = renderText(labDebrief({ params: P, result: r, reachedAt: r.final.time, expectation: { kind: 'prediction', seconds: paperTime(P)! }, ctx: { level: 'school', locale: 'uk' } }));
    expect(text).toContain('Прогноз збігається з розрахунком «на папері»');
    expect(text).toContain('забрала пара');
  });
});
