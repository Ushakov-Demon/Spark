import { describe, expect, it } from 'vitest';
import { createCommandRegistry, createExperimentSession, createSimulation, seconds, squareMeters } from '../../src/core/index.js';
import { createElectricalSolver } from '../../src/domains/electrical/index.js';
import { createThermalSolver, radiationExcess } from '../../src/domains/thermal/index.js';
import { LAB_COMMANDS, labGoalReached, labSetup, labStatus, runProtocol, sampleOf, stallFixes, type LabCommand, type LabParams } from '../../src/scenarios/index.js';
import { SUBSTANCES } from '../../src/substances/index.js';

const simulation = createSimulation({ solvers: [createElectricalSolver(), createThermalSolver()], fixedDt: seconds(2) });
const commands = createCommandRegistry<LabCommand>(LAB_COMMANDS as never);
const grams = (id: 'table-salt' | 'tin' | 'aluminium', g: number) => ({ substance: id, liters: g / SUBSTANCES[id].liquid.density.value, startTemp: 20, roomTemp: 20, lid: false }) as const;
const crucible = { vessel: 'crucible', size: 0.03, material: 'porcelain' } as const;

function run(p: LabParams, hours = 3) {
  const placed = labSetup(p);
  const s = createExperimentSession<LabCommand>({ initial: placed.state, simulation, commands, sampleEvery: seconds(60) });
  s.advance(hours * 3600, (x) => labGoalReached(p, x));
  const r = s.result(labGoalReached(p, s.state));
  return { r, status: labStatus(p, r, simulation, placed.warnings), warnings: placed.warnings };
}

describe('heating dry solids', () => {
  it('radiation adds nothing near room temperature and dominates when red-hot', () => {
    const r = { emissivity: 0.9, area: squareMeters(0.01) };
    expect(radiationExcess(r, 313.15, 293.15)).toBeLessThan(0.2); // ≈ 0.1 W, against ≈ 1 W already in h
    expect(radiationExcess(r, 1173.15, 293.15)).toBeGreaterThan(500);
    // Colder than a room it never reverses the flow (that stays in h).
    expect(radiationExcess(r, 260, 255)).toBe(0);
  });

  it('salt heated to 100 °C in a pot on gas: reached, the pot far from its limit', () => {
    const { status } = run({ ...grams('table-salt', 100), vessel: 'pot', size: 1, material: 'aluminium', action: 'heat-to', target: 100, heater: { id: 'gas-hob', rating: 1750, knob: 1 } });
    expect(status.kind).toBe('reached');
  });

  it('salt does not melt on a gas stove; a furnace is offered and melts it', () => {
    const p: LabParams = { ...grams('table-salt', 100), vessel: 'pot', size: 1, material: 'steel', action: 'melt', heater: { id: 'gas-hob', rating: 1750, knob: 1 } };
    const { status } = run(p);
    expect(status.kind).toBe('stalls');
    const fixes = stallFixes(p, simulation);
    const furnace = fixes.find((f) => f.params.cooler?.id === 'muffle-furnace');
    expect(furnace).toBeDefined();
    expect(run(furnace!.params).status.kind).toBe('reached');
  });

  it('an aluminium pot in a hot furnace melts before the salt in it', () => {
    const { status } = run({ ...grams('table-salt', 100), vessel: 'pot', size: 1, material: 'aluminium', action: 'melt', cooler: { id: 'muffle-furnace', setpoint: 900 } });
    expect(status.kind).toBe('vessel-fails');
    if (status.kind === 'vessel-fails') expect(status.limit).toBeCloseTo(660.3, 0);
  });

  it('tin melts over a spirit lamp, with a plateau at its melting point', () => {
    const { r, status } = run({ ...grams('tin', 50), ...crucible, action: 'melt', heater: { id: 'spirit-lamp', rating: 100, knob: 1 } });
    expect(status.kind).toBe('reached');
    const mid = r.samples.map(sampleOf).filter((b) => (b.state.solidFraction ?? 0) > 0.1 && (b.state.solidFraction ?? 0) < 0.9);
    expect(mid.length).toBeGreaterThan(3);
    for (const b of mid) expect(b.state.temperature - 273.15).toBeCloseTo(231.93, 0);
  });

  it('a flame never heats a crucible above the flame itself', () => {
    const { r } = run({ ...grams('table-salt', 30), ...crucible, action: 'melt', heater: { id: 'bunsen-burner', rating: 1500, knob: 1 } }, 2);
    const wall = r.final.entities['vessel' as never] as unknown as { state: { temperature: number } };
    expect(wall.state.temperature - 273.15).toBeLessThan(1500);
  });

  it('an immersion heater is not switched on in a dry solid', () => {
    const { status, warnings } = run({ ...grams('table-salt', 100), vessel: 'pot', size: 1, material: 'steel', action: 'heat-to', target: 100, heater: { id: 'immersion-heater', rating: 1000, knob: 1 } }, 0.1);
    expect(warnings.length).toBe(1);
    expect(status.kind).toBe('no-heat');
  });

  it('an induction hob cuts out when a pan heated nearly empty gets too hot', () => {
    const { r, status } = run({ ...grams('table-salt', 100), vessel: 'pot', size: 1, material: 'steel', action: 'melt', heater: { id: 'induction-hob', rating: 2300, knob: 1 } });
    expect(status.kind).toBe('stalls');
    const wall = r.final.entities['vessel' as never] as unknown as { state: { temperature: number } };
    expect(wall.state.temperature - 273.15).toBeLessThan(300);
  });

  it('water poured onto dry salt dissolves it: brine that conducts', () => {
    const base: LabParams = { ...grams('table-salt', 100), vessel: 'pot', size: 1, material: 'steel', action: 'heat-to', target: 50, heater: { id: 'electric-hotplate', rating: 2000, knob: 1 } };
    const out = runProtocol({ simulation, commands, sampleEvery: seconds(10), base, steps: [
      { kind: 'operation', action: 'heat-to', target: 50, heater: { id: 'electric-hotplate', rating: 2000, knob: 1 } },
      { kind: 'add', substance: 'water', mass: 0.1, temperature: 20 },
      { kind: 'operation', action: 'pass-current', supply: { id: 'bench-supply', knob: 0.4 }, duration: 10 },
    ] });
    const mix = sampleOf(out[1]!.result.final).state.mixture!;
    // ≈ 36 g dissolve in 100 g of water at room temperature; the rest stays as crystals.
    expect(mix.salt - mix.crystals).toBeGreaterThan(0.034);
    expect(mix.salt - mix.crystals).toBeLessThan(0.038);
    // Heat balance of 100 g salt at ≈ 50 °C and 100 g water at 20 °C: ≈ 25 °C.
    expect(sampleOf(out[1]!.result.final).state.temperature - 273.15).toBeCloseTo(25.3, 0);
    const supply = Object.values(out[2]!.result.final.entities).find((e) => e.kind === 'electrical.supply') as unknown as { state: { current: number } };
    expect(supply.state.current).toBeGreaterThan(1);
  });
});
