import type { CommandRegistry } from '../core/commands.js';
import { createExperimentSession, type ExperimentLogEntry, type ExperimentResult, type ExperimentSession } from '../core/experiment.js';
import type { Simulation } from '../core/simulation.js';
import type { SystemState } from '../core/state.js';
import { HEATERS } from '../equipment/heaters.js';
import { COOLERS } from '../equipment/coolers.js';
import { SUPPLIES } from '../equipment/supplies.js';
import { VESSELS } from '../equipment/vessels.js';
import { SUBSTANCES } from '../substances/catalog.js';
import type { LabCommand } from './lab-knowledge.js';
import { OPERATIONS } from './operations/index.js';
import { configureStep } from './protocol.js';
import { labGoalReached, labSetup, labStatus, type LabParams, type LabStatus } from './thermal-lab.js';

/**
 * A recorded experiment: the chain of steps with everything the experimenter
 * did during each (turned a knob, added salt) at the exact moment, and how each
 * step ended. The physics is deterministic, so replaying a recording gives the
 * very same result — a recording is also a ready chain to run again, share as a
 * file, or start from.
 */
export interface Recording {
  readonly format: 'spark-recording';
  readonly version: 1;
  readonly name: string;
  /** ISO date. */
  readonly created: string;
  readonly steps: readonly RecordedStep[];
}

export interface RecordedStep {
  /** The setup of this step: the whole lab parameters (the first step's also define the vessel and the sample). */
  readonly params: LabParams;
  /** What was done during the step, seconds from its start (an action at the very end belongs to the pause after it). */
  readonly commands: readonly { readonly at: number; readonly command: LabCommand }[];
  /** 'goal' — ran until the operation's goal; a number — stopped after so many seconds. */
  readonly until: 'goal' | number;
}

/** A step as it happened: its settings, its run (with the command log) and how it ended. */
export interface DoneStep {
  readonly params: LabParams;
  readonly result: ExperimentResult<LabCommand>;
  readonly status: LabStatus;
}

/** Turn the steps of an experiment into a recording. */
export function recordingOf(name: string, steps: readonly DoneStep[], created = new Date().toISOString()): Recording {
  return {
    format: 'spark-recording',
    version: 1,
    name,
    created,
    steps: steps.map((s) => {
      const start = s.result.initial.time;
      const length = s.result.final.time - start;
      // How the step really ended: it stopped itself at its goal, or it was interrupted.
      const reached = s.result.stoppedEarly;
      return {
        params: s.params,
        commands: s.result.log.filter((e): e is Extract<ExperimentLogEntry<LabCommand>, { ok: true }> => e.ok).map((e) => ({ at: Math.max(0, e.time - start), command: e.command })),
        until: reached ? 'goal' : Math.round(length * 1000) / 1000,
      };
    }),
  };
}

/** One step of a replay, driven in pieces (the page advances it frame by frame, a test in one go). */
export interface ReplayStep {
  readonly session: ExperimentSession<LabCommand>;
  readonly params: LabParams;
  /** Advance by up to `seconds` of model time, applying recorded commands exactly on time; true when the step is over. */
  advance(seconds: number): boolean;
  /** Apply what was done after the step ended (in the pause before the next one). */
  finish(): void;
  readonly done: boolean;
}

export function replayStep(step: RecordedStep, from: SystemState | null, simulation: Simulation, commands: CommandRegistry<LabCommand>, sampleEvery: number): ReplayStep {
  const placed = from ? configureStep(from, step.params) : labSetup(step.params);
  const session = createExperimentSession<LabCommand>({ initial: placed.state, simulation, commands, sampleEvery: sampleEvery as never });
  const start = placed.state.time;
  const queue = [...step.commands].sort((a, b) => a.at - b.at);
  const end = step.until === 'goal' ? Infinity : step.until;
  let next = 0;
  let done = false;
  const dt = simulation.fixedDt;
  const elapsed = () => session.state.time - start;
  // Commands due now (within half a step of their time).
  const applyDue = () => {
    while (next < queue.length && queue[next]!.at <= elapsed() + dt / 2 && queue[next]!.at < end - dt / 2) session.apply(queue[next++]!.command);
  };
  return {
    session,
    params: step.params,
    get done() {
      return done;
    },
    advance(seconds) {
      if (done) return true;
      let left = seconds;
      applyDue();
      while (left > dt / 2 && !done) {
        const toCommand = next < queue.length && queue[next]!.at < end ? queue[next]!.at - elapsed() : Infinity;
        const toEnd = end - elapsed();
        const chunk = Math.max(dt, Math.min(left, toCommand, toEnd));
        const n = Math.max(1, Math.round(chunk / dt));
        const reached = session.advance(n * dt, (s) => step.until === 'goal' && labGoalReached(step.params, s));
        left -= n * dt;
        // What was done after the step ended waits for finish() — the pause before the next step.
        if (reached || elapsed() >= end - dt / 2) done = true;
        else applyDue();
      }
      return done;
    },
    finish() {
      while (next < queue.length) session.apply(queue[next++]!.command);
    },
  };
}

/** Replay a whole recording at once (tests, previews): the same steps, the same commands, the same results. */
export function replayRecording(rec: Recording, simulation: Simulation, commands: CommandRegistry<LabCommand>, maxStepSeconds = 24 * 3600): DoneStep[] {
  const out: DoneStep[] = [];
  let state: SystemState | null = null;
  for (const step of rec.steps) {
    const r = replayStep(step, state, simulation, commands, 60);
    r.advance(maxStepSeconds);
    const result = r.session.result(step.until === 'goal' && labGoalReached(step.params, r.session.state));
    out.push({ params: step.params, result, status: labStatus(step.params, result, simulation, []) });
    r.finish();
    state = r.session.state;
  }
  return out;
}

/** Read a recording from JSON (a file someone shared); null with a reason if it is not one we can run. */
export function parseRecording(json: string): { readonly ok: true; readonly recording: Recording } | { readonly ok: false; readonly reason: string } {
  let x: unknown;
  try {
    x = JSON.parse(json);
  } catch {
    return { ok: false, reason: 'not JSON' };
  }
  const r = x as Partial<Recording>;
  if (r?.format !== 'spark-recording' || r.version !== 1 || !Array.isArray(r.steps) || !r.steps.length) return { ok: false, reason: 'not a Spark recording' };
  for (const s of r.steps) {
    const p = s?.params;
    if (!p || !(p.action in OPERATIONS) || !(p.substance in SUBSTANCES) || !(p.vessel in VESSELS)) return { ok: false, reason: 'unknown action, substance or vessel' };
    if ((p.heater && !(p.heater.id in HEATERS)) || (p.cooler && !(p.cooler.id in COOLERS)) || (p.supply && !(p.supply.id in SUPPLIES))) return { ok: false, reason: 'unknown device' };
    if (!Array.isArray(s.commands) || !(s.until === 'goal' || typeof s.until === 'number')) return { ok: false, reason: 'broken step' };
  }
  return { ok: true, recording: { ...(r as Recording), name: String(r.name ?? 'Spark'), created: String(r.created ?? '') } };
}
