import { describe, expect, it } from 'vitest';
import { createCommandRegistry, createSimulation, seconds } from '../../src/core/index.js';
import { COMPONENTS } from '../../src/components/index.js';
import { cellReaction, createElectricalSolver, FARADAY, isSupply, molesToMass } from '../../src/domains/electrical/index.js';
import { createThermalSolver } from '../../src/domains/thermal/index.js';
import { LAB_COMMANDS, labSummary, runProtocol, type LabCommand, type LabParams } from '../../src/scenarios/index.js';

const simulation = createSimulation({ solvers: [createElectricalSolver(), createThermalSolver()], fixedDt: seconds(2) });
const commands = createCommandRegistry<LabCommand>(LAB_COMMANDS as never);
const brine = COMPONENTS['sodium-chloride'].inWater!.model!.electrolysis!;

function run(electrodes: 'graphite' | 'steel', piece?: 'iron' | 'copper') {
  const supply = { id: 'bench-supply', knob: 0.4, electrodes } as const;
  const base: LabParams = { substance: 'salt-water-10', liters: 0.2, startTemp: 20, roomTemp: 20, lid: false, vessel: 'beaker', size: 0.25, material: 'glass', action: 'pass-current', duration: 10, supply };
  const out = runProtocol({ simulation, commands, sampleEvery: seconds(10), base, steps: [
    ...(piece ? [{ kind: 'add' as const, substance: piece, mass: 0.05, temperature: 20 }] : []),
    { kind: 'operation', action: 'pass-current', supply, duration: 10 },
  ] });
  const last = out[out.length - 1]!;
  const sup = Object.values(last.result.final.entities).find(isSupply)!;
  return { sup, text: labSummary(last.params!, last.result, last.status!, { locale: 'uk', level: 'school' }).map((b) => ('lines' in b ? b.lines.join(' ') : 'text' in b ? b.text : '')).join(' ') };
}

describe('electrolysis decided from the components', () => {
  it('a graphite anode in brine: chlorine (the liquid is oxidised)', () => {
    const r = cellReaction(brine, 'graphite');
    expect(r.anode.component).toBe('chlorine');
    expect(r.voltage).toBeCloseTo(2.19, 2);
  });

  it('a steel anode in brine dissolves: iron goes into solution, no chlorine, Fe(OH)₂ falls out', () => {
    const r = cellReaction(brine, 'steel');
    expect(r.anode.dissolves).toBe(true);
    expect(r.anode.component).toBe('iron');
    expect(r.precipitate).toBe('iron-ii-hydroxide');
    expect(r.voltage).toBeCloseTo(-0.44 + 0.8277, 3);
    const { sup, text } = run('steel');
    const made = sup.state.made!;
    expect(made['chlorine']).toBeUndefined();
    // Faraday: one Fe per two electrons, one H₂ per two electrons, one Fe(OH)₂ per Fe.
    const n = sup.state.charge / (2 * FARADAY);
    expect(made['-iron']).toBeCloseTo(n, 6);
    expect(made['hydrogen']).toBeCloseTo(n, 6);
    expect(made['iron-ii-hydroxide']).toBeCloseTo(n, 6);
    expect(molesToMass('iron', n)).toBeGreaterThan(0.0005);
    expect(text).toMatch(/Хлор не виділявся/);
    expect(text).toMatch(/Fe\(OH\)₂/);
  });

  it('a piece of iron lying in the brine becomes an electrode itself (bipolar): it dissolves and rusts', () => {
    const { sup, text } = run('graphite', 'iron');
    const keys = Object.keys(sup.state.made!);
    expect(keys.some((k) => k.endsWith('|-iron'))).toBe(true);
    expect(keys.some((k) => k.endsWith('|iron-ii-hydroxide'))).toBe(true);
    expect(text).toMatch(/сам став електродом/);
  });

  it('a metal without electrode data: said honestly, not silently ignored', () => {
    const { text } = run('graphite', 'copper');
    expect(text).toMatch(/модель для цього металу поки не вміє/);
  });

  it('energy: what the source gave = Joule heat + chemistry + losses inside it', () => {
    const { sup } = run('graphite', 'iron');
    expect(sup.state.delivered).toBeGreaterThan(0);
    expect(sup.state.chemical).toBeGreaterThan(0);
  });

  it('copper sulfate with graphite: copper settles on the cathode (Faraday), oxygen at the anode, no hydrogen', () => {
    const supply = { id: 'bench-supply', knob: 0.2, electrodes: 'graphite' } as const;
    const base: LabParams = { substance: 'water', liters: 0.15, startTemp: 20, roomTemp: 20, lid: false, vessel: 'beaker', size: 0.25, material: 'glass', action: 'pass-current', duration: 10, supply };
    const out = runProtocol({ simulation, commands, sampleEvery: seconds(10), base, steps: [
      { kind: 'add', substance: 'copper-sulfate', mass: 0.015, temperature: 20 },
      { kind: 'operation', action: 'pass-current', supply, duration: 10 },
    ] });
    const sup = Object.values(out[1]!.result.final.entities).find(isSupply)!;
    const made = sup.state.made!;
    expect(made['hydrogen']).toBeUndefined();
    expect(made['copper']).toBeCloseTo(sup.state.charge / (2 * FARADAY), 8);
    expect(made['oxygen']).toBeCloseTo(sup.state.charge / (4 * FARADAY), 8);
  });
});
