import { describe, expect, it } from 'vitest';
import { createCommandRegistry, createExperimentSession, createSimulation, seconds } from '../../src/core/index.js';
import { createElectricalSolver } from '../../src/domains/electrical/index.js';
import { bodyMass, createThermalSolver, energySplit } from '../../src/domains/thermal/index.js';
import { boardLines, LAB_COMMANDS, labGoalReached, labSetup, sampleOf, type LabCommand, type LabParams } from '../../src/scenarios/index.js';
import { SUBSTANCES } from '../../src/substances/index.js';

const simulation = createSimulation({ solvers: [createElectricalSolver(), createThermalSolver()], fixedDt: seconds(2) });
const commands = createCommandRegistry<LabCommand>(LAB_COMMANDS as never);
const ice: LabParams = { action: 'boil', substance: 'water', liters: 0.2, startTemp: -10, vessel: 'beaker', size: 0.25, material: 'glass', lid: false, roomTemp: 20, heater: { id: 'electric-hotplate', rating: 1000, knob: 1 } };

describe('the blackboard', () => {
  const s = createExperimentSession<LabCommand>({ initial: labSetup(ice).state, simulation, commands, sampleEvery: seconds(10) });
  s.advance(6 * 3600, (x) => labGoalReached(ice, x));
  s.advance(120); // and let it boil a little
  s.apply({ type: 'lab.weigh', scale: 'kitchen-scale' });
  const r = s.result(false);
  const lines = boardLines(ice, [...r.samples, r.final], 'uk', ['kitchen-scale'], true, r.log);

  it('writes each phase in the order it happened, then boiling and the weighing', () => {
    // (The reading itself is written down first: m₁ = … g.)
    expect(lines.map((l) => l.formula).filter((f) => !/^m₁ = \d/.test(f))).toEqual(['Q = c·m·Δt', 'Q = λ·m', 'Q = c·m·Δt', 'Q = L·m', 'E = P·t', 'η = Q/E', 'm = m₁ + m₂']);
    expect(lines[0]!.title).toContain('льоду');
    expect(lines[1]!.title).toMatch(/^плавлення/);
  });

  it('melting puts in the latent heat of the model and the whole mass of the ice', () => {
    const lambda = SUBSTANCES.water.freezing!.latentHeat.value;
    const m = bodyMass(sampleOf(r.initial));
    const q = Number(lines[1]!.numbers!.split('≈')[1]!.replace(/[^\d,]/g, '').replace(',', '.'));
    expect(q).toBeCloseTo((lambda * m) / 1000, -1);
  });

  it('the efficiency agrees with the energy split of the run', () => {
    const split = energySplit(r.initial, r.final);
    const sample = split.shares.filter((x) => x.role === 'body' && String(x.entity).startsWith('sample')).reduce((a, x) => a + x.energy, 0);
    const pct = Number(lines.find((l) => l.formula === 'η = Q/E')!.numbers!.match(/(\d+) %$/)![1]);
    expect(pct).toBe(Math.round((sample / split.produced) * 100));
  });

  it('every line is in both languages without broken numbers', () => {
    const en = boardLines(ice, [...r.samples, r.final], 'en', ['kitchen-scale'], true, r.log);
    expect(en.length).toBe(lines.length);
    for (const l of [...lines, ...en]) expect(`${l.formula} ${l.numbers ?? ''}`).not.toMatch(/NaN|Infinity|undefined/);
  });

  it('while a phase goes on only its formula is written; the numbers come when it is over', () => {
    // In the middle of melting: warming the ice is over, melting is still going on.
    const mid = r.samples.findIndex((x) => { const f = sampleOf(x).state.solidFraction ?? 0; return f > 0.3 && f < 0.7; });
    const now = boardLines(ice, r.samples.slice(0, mid + 1), 'uk');
    expect(now.map((l) => l.formula)).toEqual(['Q = c·m·Δt', 'Q = λ·m']);
    expect(now[0]!.numbers).toBeDefined();
    expect(now[1]!.numbers).toBeUndefined();
    expect(now[1]!.title).toBe('плавлення');
  });
});
