import { describe, expect, it } from 'vitest';
import { createCommandRegistry, createExperimentSession, createSimulation, runExperiment, seconds } from '../../src/core/index.js';
import { createThermalSolver, thermalEnergy, THERMAL_COMMANDS, type ThermalCommand } from '../../src/domains/thermal/index.js';
import { renderText } from '../../src/explain/index.js';
import { labGoalReached, labSetup, labStatus, labSummary, sampleOf, type LabParams } from '../../src/scenarios/index.js';
import { celsius, kilograms } from '../../src/core/units.js';

const simulation = createSimulation({ solvers: [createThermalSolver()], fixedDt: seconds(2) });
const commands = createCommandRegistry<ThermalCommand>(THERMAL_COMMANDS);

type State = ReturnType<typeof labSetup>['state'];
const absorbed = (s: State) =>
  Object.values(s.entities).reduce((sum, e) => sum + (e.kind === 'thermal.reservoir' ? (e.state as { heatAbsorbed: number }).heatAbsorbed : 0), 0);
const produced = (s: State) =>
  Object.values(s.entities).reduce((sum, e) => sum + ('energyDelivered' in (e.state as object) ? (e.state as { energyDelivered: number }).energyDelivered : 0), 0);

const SEA: LabParams = {
  action: 'evaporate',
  substance: 'sea-water',
  liters: 1,
  startTemp: 20,
  vessel: 'pot',
  size: 2,
  material: 'steel',
  lid: false,
  heater: { id: 'electric-hotplate', rating: 2000, knob: 1 },
  roomTemp: 20,
};

function run(p: LabParams, hours = 12) {
  const setup = labSetup(p);
  const result = runExperiment<ThermalCommand>({
    initial: setup.state,
    simulation,
    commands,
    duration: seconds(hours * 3600),
    sampleEvery: seconds(60),
    until: (s) => labGoalReached(p, s),
  });
  const status = labStatus(p, result, simulation, setup.warnings);
  const text = (locale: 'uk' | 'en' = 'uk') => renderText(labSummary(p, result, status, { level: 'school', locale }));
  return { status, text, result };
}

describe('salt water: a mix of water and salt', () => {
  it('boiling sea water dry leaves the salt that was dissolved in it', () => {
    const { status, text, result } = run(SEA);
    expect(status.kind).toBe('reached');
    const m0 = sampleOf(result.initial).state.mixture!;
    const m1 = sampleOf(result.final).state.mixture!;
    expect(m0.salt).toBeCloseTo(1.024 * 0.035, 3);
    expect(m1.water).toBeLessThan(1e-6);
    expect(m1.crystals).toBeCloseTo(m0.salt, 9);
    expect(text()).toMatch(/кристалів солі/);
    // Energy: everything the hotplate produced is somewhere (bodies, room, vapour).
    const e = produced(result.final);
    expect(Math.abs(thermalEnergy(result.final) - thermalEnergy(result.initial) + absorbed(result.final) - e)).toBeLessThan(1e-6 * e);
  });

  it('the boiling point rises as the water boils away', () => {
    const p: LabParams = { ...SEA };
    const setup = labSetup(p);
    const session = createExperimentSession<ThermalCommand>({ initial: setup.state, simulation, commands, sampleEvery: seconds(60) });
    session.advance(3600 * 6, (s) => (sampleOf(s).state.boiledOff ?? 0) > 0);
    const tStart = sampleOf(session.state).state.temperature;
    session.advance(3600 * 6, (s) => {
      const m = sampleOf(s).state.mixture!;
      return m.salt / (m.water + m.salt) > 0.2;
    });
    const tLater = sampleOf(session.state).state.temperature;
    expect(tStart - 273.15).toBeGreaterThan(100.3);
    expect(tStart - 273.15).toBeLessThan(101);
    expect(tLater - tStart).toBeGreaterThan(2);
  });

  it('a freezer at −18 °C freezes sea water only partly', () => {
    const p: LabParams = { ...SEA, action: 'freeze', cooler: { id: 'freezer', setpoint: -18 } };
    const { heater: _h, ...rest } = p;
    void _h;
    const { status, text, result } = run(rest as LabParams, 6);
    expect(status.kind).toBe('impossible');
    expect(text()).toMatch(/-21,1|−21,1/);
    const b = sampleOf(result.final);
    expect(b.state.solidFraction!).toBeGreaterThan(0.5);
    expect(b.state.solidFraction!).toBeLessThan(1);
  });

  it('sea water "made by hand": distilled water + table salt', () => {
    const p: LabParams = { ...SEA, substance: 'water', action: 'boil' };
    const setup = labSetup(p);
    const session = createExperimentSession<ThermalCommand>({ initial: setup.state, simulation, commands, sampleEvery: seconds(60) });
    const e0 = thermalEnergy(session.state);
    const r = session.apply({ type: 'thermal.add', into: 'sample', substance: 'table-salt', mass: kilograms(0.035 * 0.998 / 0.965), temperature: celsius(20) });
    expect(r.ok).toBe(true);
    const m = sampleOf(session.state).state.mixture!;
    expect(m.salt / (m.salt + m.water)).toBeCloseTo(0.035, 4);
    expect(thermalEnergy(session.state) - e0).toBeCloseTo(r.ok ? r.externalEnergy : NaN, 3);
    session.advance(3600, (s) => labGoalReached(p, s));
    expect(sampleOf(session.state).state.temperature - 273.15).toBeGreaterThan(100.3);
  });
});
