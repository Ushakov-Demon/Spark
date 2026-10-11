import type { SystemState } from './state.js';
import type { TraceSink } from './trace.js';
import type { Seconds } from './units.js';
import type { LeveledText } from '../knowledge/levels.js';

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
export interface StepContext {
  /** When present, the solver reports which formulas it applied, with what numbers. */
  readonly trace?: TraceSink;
}

/** A simplification the model makes — part of every honest explanation. */
export interface ModelAssumption {
  readonly id: string;
  readonly text: LeveledText;
}

export interface Solver {
  readonly name: string;
  /** What this solver deliberately ignores or simplifies. */
  readonly assumptions?: readonly ModelAssumption[];
  step(state: SystemState, dt: Seconds, ctx?: StepContext): SystemState;
}
