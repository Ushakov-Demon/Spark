import { describe, expect, it } from 'vitest';
import { createCommandRegistry, createSimulation, createTraceCollector, runExperiment, seconds, type FormulaApplication } from '../../../src/core/index.js';
import { celsius } from '../../../src/core/units.js';
import { bodyMass, createThermalSolver, saturationPressure, THERMAL_COMMANDS, THERMAL_FORMULAS, thermalEnergy, type ThermalCommand } from '../../../src/domains/thermal/index.js';
import { labGoalReached, labSetup, labStatus, sampleOf, type LabParams } from '../../../src/scenarios/index.js';

const sim = createSimulation({ solvers: [createThermalSolver()], fixedDt: seconds(2) });
const cmds = createCommandRegistry<ThermalCommand>(THERMAL_COMMANDS);
const absorbed = (s: ReturnType<typeof labSetup>['state']) =>
  Object.values(s.entities).reduce((sum, e) => sum + (e.kind === 'thermal.reservoir' ? (e.state as { heatAbsorbed: number }).heatAbsorbed : 0), 0);
const produced = (s: ReturnType<typeof labSetup>['state']) =>
  Object.values(s.entities).reduce((sum, e) => sum + ('energyDelivered' in (e.state as object) ? (e.state as { energyDelivered: number }).energyDelivered : 0), 0);

function run(p: LabParams, hours: number, untilGoal = true) {
  const s = labSetup(p);
  return runExperiment<ThermalCommand>({ initial: s.state, simulation: sim, commands: cmds, duration: seconds(hours * 3600), sampleEvery: seconds(60), ...(untilGoal ? { until: (x) => labGoalReached(p, x) } : {}) });
}

const GLASS: LabParams = { action: 'cool-to', target: 19, substance: 'water', liters: 0.2, startTemp: 20, vessel: 'beaker', size: 0.25, material: 'glass', lid: false, roomTemp: 20 };
const POT: LabParams = { action: 'boil', substance: 'water', liters: 2, startTemp: 20, vessel: 'pot', size: 3, material: 'steel', lid: false, heater: { id: 'gas-hob', rating: 1000, knob: 1 }, roomTemp: 20 };

describe('vapour pressure', () => {
  it('Buck equation matches the table (Wikipedia, Vapour pressure of water)', () => {
    for (const [t, kPa] of [[0, 0.6113], [20, 2.3388], [50, 12.344], [90, 70.1818], [100, 101.32]] as const) {
      expect(saturationPressure({ kind: 'buck' }, celsius(t)) / 1000).toBeCloseTo(kPa, 1);
    }
  });

  it('Antoine equation gives about 1 atm at the boiling point of ethanol', () => {
    expect(saturationPressure({ kind: 'antoine', A: 8.04494, B: 1554.3, C: 222.65 }, celsius(78.4)) / 101_325).toBeCloseTo(1, 1);
  });
});

describe('evaporation', () => {
  it('a glass of water in a room slowly loses mass and gets cooler than the room', () => {
    const r = run(GLASS, 24, false);
    const b = sampleOf(r.final);
    const lost = sampleOf(r.initial).params.mass - bodyMass(b);
    expect(lost).toBeGreaterThan(0.002);
    expect(lost).toBeLessThan(0.05);
    expect(b.state.temperature).toBeLessThan(celsius(19.5));
    expect(Math.abs(thermalEnergy(r.final) - thermalEnergy(r.initial) + absorbed(r.final))).toBeLessThan(1e-6 * absorbed(r.final) + 1e-3);
  });

  it('ethanol evaporates faster than water', () => {
    const w = run(GLASS, 2, false);
    const e = run({ ...GLASS, substance: 'ethanol' }, 2, false);
    const loss = (x: typeof w) => sampleOf(x.initial).params.mass - bodyMass(sampleOf(x.final));
    expect(loss(e)).toBeGreaterThan(2 * loss(w));
  });

  it('a lid makes water boil noticeably faster on a weak burner', () => {
    const time = (p: LabParams) => {
      const r = run(p, 12);
      const s = labStatus(p, r, sim, []);
      if (s.kind !== 'reached') throw new Error(s.kind);
      return s.at;
    };
    const open = time(POT);
    const lid = time({ ...POT, lid: true });
    expect(lid).toBeLessThan(0.85 * open);
  });

  it('energy is conserved with evaporation and boiling (open pot)', () => {
    const r = run({ ...POT, heater: { id: 'electric-hotplate', rating: 2000, knob: 1 } }, 0.5, false);
    const e = produced(r.final) - produced(r.initial);
    expect(Math.abs(thermalEnergy(r.final) - thermalEnergy(r.initial) + absorbed(r.final) - e)).toBeLessThan(1e-6 * e);
  });

  it('under a lid nothing is lost: vapour condenses and returns', () => {
    const r = run({ ...GLASS, lid: false, vessel: 'pot', size: 3, material: 'steel', liters: 2, startTemp: 80, target: 30 } as LabParams, 1, false);
    const rl = run({ ...GLASS, lid: true, vessel: 'pot', size: 3, material: 'steel', liters: 2, startTemp: 80, target: 30 } as LabParams, 1, false);
    const lost = (x: typeof r) => sampleOf(x.initial).params.mass - bodyMass(sampleOf(x.final));
    expect(lost(r)).toBeGreaterThan(0.005);
    expect(lost(rl)).toBe(0);
    expect(sampleOf(rl.final).state.temperature).toBeGreaterThan(sampleOf(r.final).state.temperature);
  });

  it('evaporation appears in the trace and matches the catalog formula', () => {
    const { records, sink } = createTraceCollector();
    let s = labSetup({ ...GLASS, startTemp: 80 }).state;
    for (let i = 0; i < 30; i++) s = sim.tick(s, seconds(2), { trace: sink });
    const ev = records.filter((r): r is FormulaApplication => r.kind === 'formula' && r.formula === 'thermal.evaporation-rate');
    expect(ev.length).toBeGreaterThan(0);
    const spec = THERMAL_FORMULAS.find((f) => f.id === 'thermal.evaporation-rate')!;
    for (const r of ev) expect(spec.compute(...r.args)).toBeCloseTo(r.output, 12);
  });
});
