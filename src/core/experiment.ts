import type { Command, CommandKind, CommandRegistry } from './commands.js';
import type { Simulation } from './simulation.js';
import type { SystemState } from './state.js';
import { createTraceCollector, type TraceRecord } from './trace.js';
import type { Seconds } from './units.js';

export interface ScheduledCommand<C extends Command> {
  readonly at: Seconds;
  readonly command: C;
  /** What the experimenter meant, for the log ("Выключили чайник"). */
  readonly note?: string;
}

export type ExperimentLogEntry<C extends Command> =
  | {
      readonly ok: true;
      readonly time: Seconds;
      readonly command: C;
      readonly note?: string;
      readonly kind: CommandKind;
      readonly externalEnergy: number;
      readonly trace: readonly TraceRecord[];
    }
  | { readonly ok: false; readonly time: Seconds; readonly command: C; readonly note?: string; readonly error: string };

export interface FormulaUsage {
  readonly formula: string;
  /** How many times it was applied (per tick per object). */
  readonly count: number;
  readonly entities: ReadonlySet<string>;
}

export interface ExperimentResult<C extends Command> {
  readonly initial: SystemState;
  readonly final: SystemState;
  /** Snapshots every `sampleEvery` (including t = 0 and the final state). */
  readonly samples: readonly SystemState[];
  readonly log: readonly ExperimentLogEntry<C>[];
  /** Which formulas the solvers actually used during the whole run. */
  readonly usage: ReadonlyMap<string, FormulaUsage>;
  /** Sum of energy brought in by commands, J. */
  readonly externalEnergy: number;
}

export interface ExperimentInput<C extends Command> {
  readonly initial: SystemState;
  readonly simulation: Simulation;
  readonly commands: CommandRegistry<C>;
  readonly schedule?: readonly ScheduledCommand<C>[];
  readonly duration: Seconds;
  readonly sampleEvery: Seconds;
}

/**
 * Runs a scripted experiment: physics ticks + the experimenter's commands at
 * given moments. Pure (input states are never mutated) and deterministic.
 */
export function runExperiment<C extends Command>(input: ExperimentInput<C>): ExperimentResult<C> {
  const { simulation: sim, commands, duration, sampleEvery } = input;
  const dt = sim.fixedDt;
  const schedule = [...(input.schedule ?? [])].sort((a, b) => a.at - b.at);
  const eps = dt * 1e-6;

  const usage = new Map<string, { formula: string; count: number; entities: Set<string> }>();
  const sink = {
    record(r: TraceRecord) {
      if (r.kind !== 'formula') return;
      let u = usage.get(r.formula);
      if (!u) usage.set(r.formula, (u = { formula: r.formula, count: 0, entities: new Set() }));
      u.count++;
      for (const e of r.entities) u.entities.add(e);
    },
  };

  const log: ExperimentLogEntry<C>[] = [];
  const samples: SystemState[] = [input.initial];
  const sampleSteps = Math.max(1, Math.round(sampleEvery / dt));
  const totalSteps = Math.round(duration / dt);
  let externalEnergy = 0;
  let next = 0;
  let s = input.initial;

  for (let i = 0; i < totalSteps; i++) {
    while (next < schedule.length && schedule[next]!.at <= s.time + eps) {
      const { command, note } = schedule[next++]!;
      const r = commands.apply(s, command);
      const base = { time: s.time, command, ...(note === undefined ? {} : { note }) };
      if (r.ok) {
        s = r.value.state;
        externalEnergy += r.value.externalEnergy;
        for (const t of r.value.trace) sink.record(t);
        log.push({ ...base, ok: true, kind: r.value.kind, externalEnergy: r.value.externalEnergy, trace: r.value.trace });
      } else {
        log.push({ ...base, ok: false, error: r.error });
      }
    }
    s = sim.tick(s, dt, { trace: sink });
    if (s.step % sampleSteps === 0 || i === totalSteps - 1) samples.push(s);
  }

  return { initial: input.initial, final: s, samples, log, usage, externalEnergy };
}

/** Closest snapshot at or before `time`. */
export function sampleAt(samples: readonly SystemState[], time: number): SystemState {
  let best = samples[0];
  if (!best) throw new Error('No samples');
  for (const s of samples) if (s.time <= time + 1e-9) best = s;
  return best;
}

/**
 * "Explain this moment": re-runs exactly one tick from a snapshot with full
 * tracing. Possible because the physics is pure and deterministic.
 */
export function traceTick(sim: Simulation, state: SystemState): { readonly next: SystemState; readonly records: readonly TraceRecord[] } {
  const { records, sink } = createTraceCollector();
  const next = sim.tick(state, sim.fixedDt, { trace: sink });
  return { next, records };
}
