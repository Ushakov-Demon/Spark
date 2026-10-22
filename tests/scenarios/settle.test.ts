import { describe, expect, it } from 'vitest';
import { createCommandRegistry, createExperimentSession, createSimulation, seconds } from '../../src/core/index.js';
import { celsius, kilograms } from '../../src/core/units.js';
import { createElectricalSolver } from '../../src/domains/electrical/index.js';
import { createThermalSolver } from '../../src/domains/thermal/index.js';
import { addableTo, boardLines, LAB_COMMANDS, labGoalReached, labSetup, sampleOf, substancesFor, type LabCommand, type LabParams } from '../../src/scenarios/index.js';

const simulation = createSimulation({ solvers: [createElectricalSolver(), createThermalSolver()], fixedDt: seconds(2) });
const commands = createCommandRegistry<LabCommand>(LAB_COMMANDS as never);
const cold: LabParams = { action: 'settle', substance: 'water', liters: 0.15, startTemp: 20, vessel: 'beaker', size: 0.25, material: 'glass', lid: false, roomTemp: 20 };
const C = (s: { state: { temperature: number } }) => s.state.temperature - 273.15;

function run(add?: { substance: string; mass: number; temperature: number }) {
  const s = createExperimentSession<LabCommand>({ initial: labSetup(cold).state, simulation, commands, sampleEvery: seconds(10) });
  if (add) s.apply({ type: 'thermal.add', into: 'sample', substance: add.substance, mass: kilograms(add.mass), temperature: celsius(add.temperature) });
  const reached = s.advance(3600, (x) => labGoalReached(cold, x));
  return { s, reached, r: s.result(reached) };
}

describe('waiting for thermal equilibrium', () => {
  it('a hot block and the water meet at one temperature within minutes, below the ideal heat balance', () => {
    const { s, reached } = run({ substance: 'aluminium', mass: 0.1, temperature: 100 });
    expect(reached).toBe(true);
    expect(s.state.time).toBeLessThan(600);
    const w = C(sampleOf(s.state));
    const block = s.state.entities['sample+1' as never] as unknown as { state: { temperature: number } };
    expect(Math.abs(C(block) - w)).toBeLessThan(0.3);
    // c₁m₁(t₁ − θ) = c₂m₂(θ − t₂) with no losses: ≈ 32.6 °C; the glass and the air take a little.
    const ideal = (897 * 0.1 * 100 + 4180 * 0.1496 * 20) / (897 * 0.1 + 4180 * 0.1496);
    expect(w).toBeLessThan(ideal);
    expect(w).toBeGreaterThan(ideal - 3);
  });

  it('copper of the same mass warms the water less than aluminium (smaller specific heat)', () => {
    const al = C(sampleOf(run({ substance: 'aluminium', mass: 0.1, temperature: 100 }).s.state));
    const cu = C(sampleOf(run({ substance: 'copper', mass: 0.1, temperature: 100 }).s.state));
    expect(al).toBeGreaterThan(cu + 3);
  });

  it('with nothing put in, there is nothing to wait for', () => {
    const { s, reached } = run();
    expect(reached).toBe(true);
    expect(s.state.time).toBeLessThanOrEqual(2);
  });

  it('metals go into a liquid, never into the vessel as the sample', () => {
    expect(substancesFor('settle').some((x) => x.category === 'solid.metal')).toBe(false);
    const ids = addableTo(labSetup(cold).state, commands).map((x) => x.id);
    for (const m of ['aluminium', 'copper', 'iron']) expect(ids).toContain(m);
  });

  it('the board writes the mixture first, then the heat each body gave or took, and the balance', () => {
    const { r } = run({ substance: 'water', mass: 0.1, temperature: 80 });
    const lines = boardLines(cold, [...r.samples, r.final], 'uk', [], true, r.log);
    expect(lines[0]!.formula).toBe('θ = (m₁t₁ + m₂t₂) / (m₁ + m₂)');
    // The mixing jump is not "warming": what follows is the water cooling into the glass and the air.
    expect(lines.slice(1).map((l) => l.title)).toEqual([expect.stringMatching(/^охолодження/)]);
    const block = run({ substance: 'aluminium', mass: 0.1, temperature: 100 }).r;
    const b = boardLines(cold, [...block.samples, block.final], 'uk', [], true, block.log);
    expect(b.map((l) => l.formula)).toEqual(['Q = c·m·Δt', 'Q = c·m·Δt', 'c₁m₁(t₁ − θ) = c₂m₂(θ − t₂)']);
  });
});

describe('the calorimeter', () => {
  const inCal: LabParams = { ...cold, vessel: 'calorimeter', size: 0.25, material: 'aluminium', lid: true };
  const keep = (p: LabParams) => {
    const s = createExperimentSession<LabCommand>({ initial: labSetup(p).state, simulation, commands, sampleEvery: seconds(10) });
    s.apply({ type: 'thermal.add', into: 'sample', substance: 'water', mass: kilograms(0.1), temperature: celsius(80) });
    s.advance(600);
    return C(sampleOf(s.state));
  };

  it('keeps the heat in much better than a beaker (air gap and lid)', () => {
    const beaker = keep(cold);
    const cal = keep(inCal);
    expect(cal).toBeGreaterThan(beaker + 2);
  });

  it('is never put on a hob — heated from inside only', async () => {
    const { canHeat, HEATERS, VESSELS } = await import('../../src/equipment/index.js');
    expect(canHeat(HEATERS['electric-hotplate'], VESSELS.calorimeter, 'aluminium').ok).toBe(false);
    expect(canHeat(HEATERS['immersion-heater' as never] ?? Object.values(HEATERS).find((h) => h.spec.method === 'immersion')!, VESSELS.calorimeter, 'aluminium').ok).toBe(true);
  });
});

describe('waiting while ice melts', () => {
  it('ends once the meltwater has mixed in: the thermometer shows the common temperature', () => {
    const p: LabParams = { ...cold, vessel: 'cylinder', size: 0.1, liters: 0.07 };
    const s = createExperimentSession<LabCommand>({ initial: labSetup(p).state, simulation, commands, sampleEvery: seconds(10) });
    s.apply({ type: 'thermal.add', into: 'sample', substance: 'water', mass: kilograms(0.01), temperature: celsius(-5), frozen: true });
    let meltedAt = -1;
    while (s.state.time < 3600) {
      const ice = s.state.entities['sample+1' as never] as unknown as { state: { solidFraction?: number } };
      if (meltedAt < 0 && (ice.state.solidFraction ?? 0) <= 0) meltedAt = s.state.time;
      if (labGoalReached(p, s.state)) break;
      s.advance(2);
    }
    expect(meltedAt).toBeGreaterThan(0);
    // The cold meltwater takes a minute or two to come to the water's temperature, then it ends.
    expect(s.state.time - meltedAt).toBeLessThanOrEqual(240);
    const melt = s.state.entities['sample+1' as never] as unknown as { state: { temperature: number } };
    const water = s.state.entities['sample' as never] as unknown as { state: { temperature: number } };
    expect(Math.abs(melt.state.temperature - water.state.temperature)).toBeLessThan(0.3);
  });
});
