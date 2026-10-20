import type { Command, CommandKind, CommandRegistry } from './commands.js';
import type { Simulation } from './simulation.js';
import type { SystemState } from './state.js';
import { createTraceCollector, type TraceRecord } from './trace.js';
import type { Seconds } from './units.js';
import type { LocalizedText } from '../knowledge/i18n.js';

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
  | { readonly ok: false; readonly time: Seconds; readonly command: C; readonly note?: string; readonly error: LocalizedText };

export interface FormulaUsage {
  readonly formula: string;
  /** How many times it was applied (per tick per object). */
  readonly count: number;
  readonly entities: ReadonlySet<string>;
}

/** Net amount moved along one connection over the whole run (from `a` to `b`). */
export interface TransferTotal {
  readonly connection: string;
  readonly a: string;
  readonly b: string;
  readonly quantity: 'energy';
  readonly amount: number;
}

export interface ExperimentResult<C extends Command> {
  readonly initial: SystemState;
  readonly final: SystemState;
  /** Snapshots every `sampleEvery` (including t = 0 and the final state). */
  readonly samples: readonly SystemState[];
  readonly log: readonly ExperimentLogEntry<C>[];
  /** Which formulas the solvers actually used during the whole run. */
  readonly usage: ReadonlyMap<string, FormulaUsage>;
  /** Net transfers per connection over the whole run. */
  readonly transfers: ReadonlyMap<string, TransferTotal>;
  /** Sum of energy brought in by commands, J. */
  readonly externalEnergy: number;
  /** True when `until` ended the run before `duration`. */
  readonly stoppedEarly: boolean;
}

export interface ExperimentInput<C extends Command> {
  readonly initial: SystemState;
  readonly simulation: Simulation;
  readonly commands: CommandRegistry<C>;
  readonly schedule?: readonly ScheduledCommand<C>[];
  /** Maximum duration; the run may stop earlier via `until`. */
  readonly duration: Seconds;
  readonly sampleEvery: Seconds;
  /** Stop condition checked after every step ("until the water reaches 100 °C"). */
  readonly until?: (state: SystemState) => boolean;
}

export interface SessionInput<C extends Command> {
  readonly initial: SystemState;
  readonly simulation: Simulation;
  readonly commands: CommandRegistry<C>;
  readonly sampleEvery: Seconds;
}

/**
 * A live experiment: advance it step by step and apply the experimenter's
 * commands at any moment (turning a knob while water heats up). Records the
 * same log, samples, formula usage and transfers as a scripted run, so the
 * same explanations work for both.
 */
export interface ExperimentSession<C extends Command> {
  readonly state: SystemState;
  /** Apply a command now (between physics steps). */
  apply(command: C, note?: string): ExperimentLogEntry<C>;
  /** One fixed physics step. */
  step(): SystemState;
  /** Advance by up to `seconds` of simulated time in whole steps; stops early if `until` becomes true. Returns true if stopped. */
  advance(seconds: number, until?: (state: SystemState) => boolean): boolean;
  /** Snapshot of everything recorded so far. */
  result(stoppedEarly?: boolean): ExperimentResult<C>;
}

export function createExperimentSession<C extends Command>(input: SessionInput<C>): ExperimentSession<C> {
  const { simulation: sim, commands } = input;
  const dt = sim.fixedDt;
  const usage = new Map<string, { formula: string; count: number; entities: Set<string> }>();
  const transfers = new Map<string, { connection: string; a: string; b: string; quantity: 'energy'; amount: number }>();
  const sink = {
    record(r: TraceRecord) {
      if (r.kind === 'transfer') {
        const t = transfers.get(r.connection);
        if (t) t.amount += r.amount;
        else transfers.set(r.connection, { connection: r.connection, a: r.a, b: r.b, quantity: r.quantity, amount: r.amount });
        return;
      }
      if (r.kind !== 'formula') return;
      let u = usage.get(r.formula);
      if (!u) usage.set(r.formula, (u = { formula: r.formula, count: 0, entities: new Set() }));
      u.count++;
      for (const e of r.entities) u.entities.add(e);
    },
  };
  const log: ExperimentLogEntry<C>[] = [];
  const samples: SystemState[] = [input.initial];
  const sampleSteps = Math.max(1, Math.round(input.sampleEvery / dt));
  let externalEnergy = 0;
  let s = input.initial;
  let lastSampled = s;

  const step = (): SystemState => {
    s = sim.tick(s, dt, { trace: sink });
    if (s.step % sampleSteps === 0) {
      samples.push(s);
      lastSampled = s;
    }
    return s;
  };

  return {
    get state() {
      return s;
    },
    apply(command, note) {
      const r = commands.apply(s, command);
      const base = { time: s.time, command, ...(note === undefined ? {} : { note }) };
      let entry: ExperimentLogEntry<C>;
      if (r.ok) {
        s = r.value.state;
        externalEnergy += r.value.externalEnergy;
        for (const t of r.value.trace) sink.record(t);
        // Matter added or a state set by hand: keep the moment in the samples (a hot block's own start).
        if (r.value.kind === 'matter' || r.value.kind === 'intervention') {
          samples.push(s);
          lastSampled = s;
        }
        entry = { ...base, ok: true, kind: r.value.kind, externalEnergy: r.value.externalEnergy, trace: r.value.trace };
      } else {
        entry = { ...base, ok: false, error: r.error };
      }
      log.push(entry);
      return entry;
    },
    step,
    advance(seconds, until) {
      const n = Math.max(0, Math.floor(seconds / dt + 1e-9));
      for (let i = 0; i < n; i++) {
        step();
        if (until?.(s)) return true;
      }
      return false;
    },
    result(stoppedEarly = false) {
      const all = lastSampled === s ? [...samples] : [...samples, s];
      return {
        initial: input.initial,
        final: s,
        samples: all,
        log: [...log],
        usage: new Map(usage),
        transfers: new Map([...transfers].map(([k, v]) => [k, { ...v }])),
        externalEnergy,
        stoppedEarly,
      };
    },
  };
}

/**
 * Runs a scripted experiment: physics ticks + the experimenter's commands at
 * given moments. Pure (input states are never mutated) and deterministic.
 */
export function runExperiment<C extends Command>(input: ExperimentInput<C>): ExperimentResult<C> {
  const session = createExperimentSession(input);
  const dt = input.simulation.fixedDt;
  const schedule = [...(input.schedule ?? [])].sort((a, b) => a.at - b.at);
  const eps = dt * 1e-6;
  const totalSteps = Math.round(input.duration / dt);
  let next = 0;
  for (let i = 0; i < totalSteps; i++) {
    while (next < schedule.length && schedule[next]!.at <= session.state.time + eps) {
      const { command, note } = schedule[next++]!;
      session.apply(command, note);
    }
    const s = session.step();
    if (input.until?.(s)) return session.result(true);
  }
  return session.result(false);
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
