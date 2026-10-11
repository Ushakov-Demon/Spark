import type { LocalizedText } from '../knowledge/i18n.js';

/**
 * What the experimenter expected — always optional.
 *
 *  - none:       "what happens if…?" — just run it; the debrief still explains the result;
 *  - prediction: "I think it will be X" — the debrief compares prediction and result;
 *  - goal:       "I want to get X" — the debrief compares and suggests what to change.
 *
 * Same machinery for all three; only the wording of the debrief differs.
 */
export type ExpectationKind = 'prediction' | 'goal';

export interface Expectation {
  readonly kind: ExpectationKind;
  /** What is observed, e.g. { entity: 'water', quantity: 'temperature' }. */
  readonly probe: Probe;
  /** Target value in engine SI units. */
  readonly value: number;
  /** Acceptable absolute deviation (same units). */
  readonly tolerance: number;
}

export interface Probe {
  readonly entity: string;
  readonly quantity: string;
}

export interface ExpectationOutcome {
  readonly expectation: Expectation;
  readonly actual: number;
  /** actual − expected */
  readonly deviation: number;
  readonly hit: boolean;
}

export function evaluateExpectation(expectation: Expectation, actual: number): ExpectationOutcome {
  const deviation = actual - expectation.value;
  return { expectation, actual, deviation, hit: Math.abs(deviation) <= expectation.tolerance };
}

/**
 * Something the experimenter could have set differently ("mass of hot water"),
 * with its physically allowed range. `run` replays the whole experiment with
 * that value and returns the observed result — possible because the engine is
 * pure and deterministic.
 */
export interface Knob {
  readonly id: string;
  readonly label: LocalizedText;
  readonly current: number;
  readonly min: number;
  readonly max: number;
  readonly unit: string;
  run(value: number): number;
}

export type KnobSolution =
  | { readonly knob: Knob; readonly status: 'found'; readonly value: number; readonly achieved: number; readonly runs: number }
  | { readonly knob: Knob; readonly status: 'unreachable'; readonly closest: number; readonly achievedAtClosest: number; readonly runs: number };

/**
 * Finds the knob value that makes the result hit `target` (within `tolerance`).
 * Bisection over [min, max]; assumes the result changes monotonically with the
 * knob, which holds for the knobs we expose (more hot water → warmer, etc.).
 */
export function solveKnob(knob: Knob, target: number, tolerance: number, maxRuns = 40): KnobSolution {
  let lo = knob.min;
  let hi = knob.max;
  let fLo = knob.run(lo) - target;
  let fHi = knob.run(hi) - target;
  let runs = 2;
  if (fLo === 0) return { knob, status: 'found', value: lo, achieved: target, runs };
  if (fHi === 0) return { knob, status: 'found', value: hi, achieved: target, runs };
  if (Math.sign(fLo) === Math.sign(fHi)) {
    const closest = Math.abs(fLo) < Math.abs(fHi) ? lo : hi;
    return { knob, status: 'unreachable', closest, achievedAtClosest: (closest === lo ? fLo : fHi) + target, runs };
  }
  while (runs < maxRuns) {
    const mid = (lo + hi) / 2;
    const fMid = knob.run(mid) - target;
    runs++;
    if (Math.abs(fMid) <= tolerance / 10 || hi - lo < 1e-9 * Math.max(1, Math.abs(mid))) {
      return { knob, status: 'found', value: mid, achieved: fMid + target, runs };
    }
    if (Math.sign(fMid) === Math.sign(fLo)) {
      lo = mid;
      fLo = fMid;
    } else {
      hi = mid;
      fHi = fMid;
    }
  }
  const mid = (lo + hi) / 2;
  return { knob, status: 'found', value: mid, achieved: knob.run(mid), runs: runs + 1 };
}
