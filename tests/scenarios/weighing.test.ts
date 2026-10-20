import { describe, expect, it } from 'vitest';
import { getSource } from '../../src/knowledge/sources.js';
import { verifySourcedValue } from '../../src/knowledge/verify.js';
import { createCommandRegistry, createExperimentSession, createSimulation, seconds } from '../../src/core/index.js';
import { createElectricalSolver } from '../../src/domains/electrical/index.js';
import { bodyMass, createThermalSolver, isThermalBody } from '../../src/domains/thermal/index.js';
import { SCALES, scaleReading } from '../../src/equipment/scales.js';
import { formatReading, LAB_COMMANDS, labSetup, parseRecording, recordingOf, replayRecording, runProtocol, sampleOf, weigh, weighingsOf, type LabCommand, type LabParams } from '../../src/scenarios/index.js';

const simulation = createSimulation({ solvers: [createElectricalSolver(), createThermalSolver()], fixedDt: seconds(2) });
const commands = createCommandRegistry<LabCommand>(LAB_COMMANDS as never);
const litre: LabParams = { action: 'freeze', substance: 'water', liters: 1, startTemp: 20, vessel: 'pot', size: 2, material: 'steel', lid: false, roomTemp: 20, cooler: { id: 'freezer', setpoint: -18 } };
const hob = { id: 'electric-hotplate', rating: 2000, knob: 1 } as const;

describe('scales', () => {
  it('round to their division and overload above their capacity', () => {
    expect(scaleReading(SCALES['kitchen-scale'], 1.2346)).toBeCloseTo(1.235, 12);
    expect(scaleReading(SCALES['lab-balance'], 0.3123456)).toBeCloseTo(0.31235, 12);
    expect(scaleReading(SCALES['lab-balance'], 0.7)).toBeNull();
    expect(formatReading('lab-balance', 0.31235, 'en')).toBe('312.35 g');
    expect(formatReading('kitchen-scale', 1.657, 'uk')).toMatch(/^1\s657 г$/);
  });

  it('weigh the vessel with everything in it; the tare is the empty vessel', () => {
    const s = labSetup(litre).state;
    const w = weigh(s, 'kitchen-scale');
    const water = bodyMass(sampleOf(s));
    expect(water).toBeGreaterThan(0.99);
    expect(w.exact.total - w.exact.vessel).toBeCloseTo(water, 12);
    const all = Object.values(s.entities).filter(isThermalBody).reduce((m, e) => m + bodyMass(e), 0);
    expect(w.exact.total).toBeCloseTo(all, 12);
    expect(w.reading).toBeCloseTo(Math.round(all * 1000) / 1000, 12);
    // A 2 l pot with a litre of water is too heavy for the 620 g balance.
    expect(weigh(s, 'lab-balance').reading).toBeNull();
  });
});

describe('weigh → freeze → weigh → boil → weigh', () => {
  const out = runProtocol({
    base: litre,
    steps: [
      { kind: 'weigh', scale: 'kitchen-scale' },
      { kind: 'operation', action: 'freeze', cooler: { id: 'freezer', setpoint: -18 } },
      { kind: 'weigh', scale: 'kitchen-scale' },
      { kind: 'operation', action: 'boil', heater: hob },
      { kind: 'weigh', scale: 'kitchen-scale' },
    ],
    simulation,
    commands,
    sampleEvery: seconds(60),
  });
  const [w1, w2, w3] = [out[0]!, out[2]!, out[4]!].map((o) => weighingsOf([o.entry!])[0]!) as [ReturnType<typeof weighingsOf>[number], ReturnType<typeof weighingsOf>[number], ReturnType<typeof weighingsOf>[number]];

  it('each weighing is in the log with what the display showed', () => {
    for (const o of [out[0]!, out[2]!, out[4]!]) expect(o.entry?.ok).toBe(true);
    expect(w1.reading).not.toBeNull();
  });

  it('freezing does not change the mass: only what evaporated is gone', () => {
    const lost = w1.exact - w2.exact;
    const b = sampleOf(out[1]!.result.final);
    expect(lost).toBeGreaterThanOrEqual(0);
    expect(lost).toBeCloseTo((b.state.evaporated ?? 0) + (b.state.boiledOff ?? 0) - 0, 9);
  });

  it('heating to a boil: the scales show the water that went into the air', () => {
    const b = sampleOf(out[3]!.result.final);
    expect(w1.exact - w3.exact).toBeCloseTo((b.state.evaporated ?? 0) + (b.state.boiledOff ?? 0), 9);
    expect(w3.reading!).toBeLessThan(w2.reading!);
  });
});

describe('a recording keeps the weighings', () => {
  it('replays them with the same readings', () => {
    const s = createExperimentSession<LabCommand>({ initial: labSetup(litre).state, simulation, commands, sampleEvery: seconds(60) });
    s.apply({ type: 'lab.weigh', scale: 'kitchen-scale' });
    s.advance(1800);
    s.apply({ type: 'lab.weigh', scale: 'kitchen-scale' });
    const r = s.result(false);
    const rec = recordingOf('weighed', [{ params: litre, result: r, status: { kind: 'will-reach' } as never }], 'x');
    expect(rec.steps[0]!.commands.map((c) => c.command.type)).toEqual(['lab.weigh', 'lab.weigh']);
    const parsed = parseRecording(JSON.stringify(rec));
    expect(parsed.ok).toBe(true);
    const again = replayRecording(parsed.ok ? parsed.recording : rec, simulation, commands);
    expect(weighingsOf(again[0]!.result.log).map((w) => w.exact)).toEqual(weighingsOf(r.log).map((w) => w.exact));
  });
});

describe('scales data', () => {
  it.each(Object.values(SCALES).map((s) => [s.id, s] as const))('%s: capacity and division agree with their sources', (_id, s) => {
    for (const v of [s.spec.capacity, s.spec.resolution]) {
      expect(verifySourcedValue(v)).toEqual([]);
      for (const c of v.citations) expect(getSource(c.source), c.source).toBeDefined();
    }
  });
});
