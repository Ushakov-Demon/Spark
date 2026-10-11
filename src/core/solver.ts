import type { SystemState } from './state.js';
import type { Seconds } from './units.js';

/**
 * A solver advances one physical domain by `dt`.
 *
 * Contract:
 *  - pure: never mutates `state`, returns a new one (or the same object if nothing changed);
 *  - only touches entities/connections of its own domain;
 *  - must NOT advance `state.time` — the simulation loop owns the clock.
 *
 * Multiple solvers are chained per tick (operator splitting):
 * electrical → thermal (Joule heat) → mechanical …
 */
export interface Solver {
  readonly name: string;
  step(state: SystemState, dt: Seconds): SystemState;
}
