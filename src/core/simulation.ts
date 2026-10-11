import type { Solver, StepContext } from './solver.js';
import type { SystemState } from './state.js';
import { seconds, type Seconds } from './units.js';

export interface Simulation {
  readonly solvers: readonly Solver[];
  readonly fixedDt: Seconds;
  /** Pure: one fixed physics step of length dt through all solvers. */
  tick(state: SystemState, dt: Seconds, ctx?: StepContext): SystemState;
  /** Pure: integrates for `duration` using the fixed step, returning the final state. */
  run(state: SystemState, duration: Seconds, onStep?: (s: SystemState) => void): SystemState;
}

export interface SimulationOptions {
  readonly solvers: readonly Solver[];
  /** Fixed physics step. Decoupled from the render frame rate for determinism. */
  readonly fixedDt: Seconds;
}

export function createSimulation({ solvers, fixedDt }: SimulationOptions): Simulation {
  if (!(fixedDt > 0)) throw new RangeError(`fixedDt must be > 0, got ${fixedDt}`);

  const tick = (state: SystemState, dt: Seconds, ctx?: StepContext): SystemState => {
    if (!(dt > 0)) throw new RangeError(`dt must be > 0, got ${dt}`);
    let next = state;
    for (const solver of solvers) next = solver.step(next, dt, ctx);
    return { ...next, time: seconds(state.time + dt), step: state.step + 1 };
  };

  const run: Simulation['run'] = (state, duration, onStep) => {
    let s = state;
    const steps = Math.round(duration / fixedDt);
    for (let i = 0; i < steps; i++) {
      s = tick(s, fixedDt);
      onStep?.(s);
    }
    return s;
  };

  return { solvers, fixedDt, tick, run };
}

/**
 * Real-time driver helper for UIs: feed it wall-clock frame time, it runs as
 * many fixed steps as fit and carries the remainder. Classic "fix your timestep".
 * `timeScale` lets students speed up (x10) or slow down (x0.1) an experiment.
 */
export interface Clock {
  readonly accumulator: number;
}

export function advanceRealtime(
  sim: Simulation,
  state: SystemState,
  clock: Clock,
  frameSeconds: number,
  fixedDt: Seconds,
  { timeScale = 1, maxStepsPerFrame = 1000 }: { timeScale?: number; maxStepsPerFrame?: number } = {},
): { state: SystemState; clock: Clock } {
  let acc = clock.accumulator + frameSeconds * timeScale;
  let s = state;
  let n = 0;
  while (acc >= fixedDt && n < maxStepsPerFrame) {
    s = sim.tick(s, fixedDt);
    acc -= fixedDt;
    n++;
  }
  // If we hit the cap, drop the backlog instead of spiralling.
  return { state: s, clock: { accumulator: n === maxStepsPerFrame ? 0 : acc } };
}
