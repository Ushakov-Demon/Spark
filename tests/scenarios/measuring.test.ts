import { describe, expect, it } from 'vitest';
import { createCommandRegistry, createExperimentSession, createSimulation, seconds } from '../../src/core/index.js';
import { celsius, kilograms } from '../../src/core/units.js';
import { createElectricalSolver } from '../../src/domains/electrical/index.js';
import { createThermalSolver } from '../../src/domains/thermal/index.js';
import { canHeat, HEATERS, VESSELS } from '../../src/equipment/index.js';
import { formatMeasured, LAB_COMMANDS, labGoalReached, labSetup, levelVolume, pieceShare, readingsOf, sampleOf, type LabCommand, type LabParams } from '../../src/scenarios/index.js';

const simulation = createSimulation({ solvers: [createElectricalSolver(), createThermalSolver()], fixedDt: seconds(2) });
const commands = createCommandRegistry<LabCommand>(LAB_COMMANDS as never);
const cyl: LabParams = { action: 'settle', substance: 'water', liters: 0.06, startTemp: 20, vessel: 'cylinder', size: 0.1, material: 'glass', lid: false, roomTemp: 20 };
const session = (p: LabParams = cyl) => createExperimentSession<LabCommand>({ initial: labSetup(p).state, simulation, commands, sampleEvery: seconds(10) });
const level = (s: ReturnType<typeof session>, p: LabParams = cyl) => readingsOf([s.apply({ type: 'lab.read-level', vessel: p.vessel, size: p.size })])[0]!.record;
const piece = (s: ReturnType<typeof session>, n = 1) => s.state.entities[`sample+${n}` as never] as never;

describe('measuring volume by the marks', () => {
  it('reads 60 mL of water to the nearest millilitre', () => {
    expect(level(session()).value! * 1e6).toBeCloseTo(60, 6);
  });

  it('a sinking block raises the level by its own volume: V = V₂ − V₁', () => {
    const s = session();
    const v1 = level(s).value!;
    s.apply({ type: 'thermal.add', into: 'sample', substance: 'iron', mass: kilograms(0.157), temperature: celsius(20) });
    expect(pieceShare(s.state, piece(s))).toBe(1);
    const v2 = level(s).value!;
    expect((v2 - v1) * 1e6).toBeCloseTo(20, 0); // 157 g of iron ≈ 19.9 mL
  });

  it('wood floats with ≈ half under water; ice ≈ 9/10 under; melting ice does not change the level', () => {
    const s = session();
    s.apply({ type: 'thermal.add', into: 'sample', substance: 'wood', mass: kilograms(0.005), temperature: celsius(20) });
    expect(pieceShare(s.state, piece(s))).toBeCloseTo(0.51, 2);
    const ice = session({ ...cyl, liters: 0.07 });
    ice.apply({ type: 'thermal.add', into: 'sample', substance: 'water', mass: kilograms(0.01), temperature: celsius(-5), frozen: true });
    expect(pieceShare(ice.state, piece(ice))).toBeCloseTo(0.918, 2);
    const before = levelVolume(ice.state);
    ice.advance(3600, (x) => labGoalReached({ ...cyl, liters: 0.07 }, x));
    const after = levelVolume(ice.state);
    // The melted ice takes exactly the room it pushed aside (up to a little thermal expansion and evaporation).
    expect(Math.abs(after - before) * 1e6).toBeLessThan(0.3);
  });
});

describe('the dynamometer', () => {
  const hang = (s: ReturnType<typeof session>, into: 'air' | 'liquid', substance = 'aluminium', mass = 0.1) => readingsOf([s.apply({ type: 'lab.hang', substance, mass, into })])[0]!.record;

  it('in the air shows P = m·g; in water less by the buoyant force ρ·g·V', () => {
    const s = session();
    const air = hang(s, 'air');
    expect(air.value).toBeCloseTo(1.0, 9);
    const water = hang(s, 'liquid');
    expect(water.exact).toBeCloseTo(0.1 * 9.80665 - 998 * 9.80665 * (0.1 / 2699), 2);
    expect(water.value).toBeCloseTo(0.6, 9);
  });

  it('in salt water the push is stronger; a floating body leaves the spring slack', () => {
    const fresh = hang(session(), 'liquid', 'aluminium', 0.3).exact;
    const salty = hang(session({ ...cyl, substance: 'salt-water-20' }), 'liquid', 'aluminium', 0.3).exact;
    expect(salty).toBeLessThan(fresh - 0.1);
    expect(hang(session(), 'liquid', 'wood', 0.01).value).toBe(0);
    expect(formatMeasured('force', 0.6, 0.1, 'uk')).toBe('0,6 Н');
  });

  it('a measuring cylinder is never heated', () => {
    expect(canHeat(HEATERS['electric-hotplate'], VESSELS.cylinder, 'glass').ok).toBe(false);
    expect(sampleOf(labSetup(cyl).state)).toBeDefined();
  });
});
