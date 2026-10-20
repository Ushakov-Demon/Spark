import { describe, expect, it } from 'vitest';
import { createCommandRegistry, createExperimentSession, createSimulation, seconds } from '../../src/core/index.js';
import { celsius, kilograms } from '../../src/core/units.js';
import { createElectricalSolver, ELECTRICAL_COMMANDS } from '../../src/domains/electrical/index.js';
import { createThermalSolver, THERMAL_COMMANDS } from '../../src/domains/thermal/index.js';
import { configureStep, labGoalReached, labSetup, labStatus, parseRecording, recordingOf, replayRecording, sampleOf, stepParams, type DoneStep, type LabCommand, type LabParams } from '../../src/scenarios/index.js';

const simulation = createSimulation({ solvers: [createElectricalSolver(), createThermalSolver()], fixedDt: seconds(2) });
const commands = createCommandRegistry<LabCommand>([...THERMAL_COMMANDS, ...ELECTRICAL_COMMANDS] as never);
const base: LabParams = { action: 'freeze', substance: 'water', liters: 0.2, startTemp: 20, vessel: 'beaker', size: 0.25, material: 'glass', lid: false, roomTemp: 20, cooler: { id: 'freezer', setpoint: -18 } };

/** Run steps the way the page does: freeze; add salt in the pause; melt on a hob, turning the knob down halfway; stop early. */
function liveRun(): DoneStep[] {
  const done: DoneStep[] = [];
  // 1. Freeze in the freezer, until frozen.
  let s = createExperimentSession<LabCommand>({ initial: labSetup(base).state, simulation, commands, sampleEvery: seconds(60) });
  s.advance(24 * 3600, (x) => labGoalReached(base, x));
  let r = s.result(true);
  done.push({ params: base, result: r, status: labStatus(base, r, simulation, []) });
  // In the pause: a little salt on the ice (belongs to the end of step 1).
  s.apply({ type: 'thermal.add', into: 'sample', substance: 'table-salt', mass: kilograms(0.002), temperature: celsius(-18) });
  r = s.result(true);
  done[0] = { ...done[0]!, result: r };
  // 2. Melt on a hotplate; knob down after 5 min; stopped by hand after 20 min.
  const melt = stepParams(base, { kind: 'operation', action: 'melt', heater: { id: 'electric-hotplate', rating: 1000, knob: 1 } });
  s = createExperimentSession<LabCommand>({ initial: configureStep(s.state, melt).state, simulation, commands, sampleEvery: seconds(60) });
  s.advance(300);
  s.apply({ type: 'thermal.heater.set', entity: 'heater', power: 300 as never, on: true });
  s.advance(900);
  r = s.result(false);
  done.push({ params: melt, result: r, status: labStatus(melt, r, simulation, []) });
  return done;
}

describe('recording and replaying an experiment', () => {
  const original = liveRun();
  const rec = recordingOf('freeze then melt', original, '2026-10-20T00:00:00Z');

  it('records each step, the commands with their moments and how it ended', () => {
    expect(rec.steps).toHaveLength(2);
    expect(rec.steps[0]!.until).toBe('goal');
    expect(rec.steps[0]!.commands.map((c) => c.command.type)).toEqual(['thermal.add']);
    expect(rec.steps[1]!.until).toBeCloseTo(1200, 6);
    expect(rec.steps[1]!.commands[0]!.at).toBeCloseTo(300, 6);
  });

  it('a replay gives the very same result (the physics is deterministic)', () => {
    const again = replayRecording(rec, simulation, commands);
    for (const [i, s] of again.entries()) {
      expect(s.result.final.time - s.result.initial.time, `step ${i} length`).toBeCloseTo(original[i]!.result.final.time - original[i]!.result.initial.time, 6);
    }
    // The second step starts after the salt added in the pause — in both runs — and ends identically.
    const a = sampleOf(again[1]!.result.final).state;
    const b = sampleOf(original[1]!.result.final).state;
    expect(a.temperature).toBeCloseTo(b.temperature, 9);
    expect(a.solidFraction ?? 0).toBeCloseTo(b.solidFraction ?? 0, 9);
    expect(a.mixture?.salt).toBeCloseTo(b.mixture!.salt, 12);
  });

  it('survives a trip through a file, and refuses what is not a recording', () => {
    const parsed = parseRecording(JSON.stringify(rec));
    expect(parsed.ok && parsed.recording.steps.length).toBe(2);
    expect(parseRecording('{"hello": 1}').ok).toBe(false);
    expect(parseRecording(JSON.stringify({ ...rec, steps: [{ ...rec.steps[0], params: { ...base, substance: 'unobtainium' } }] })).ok).toBe(false);
  });
});
