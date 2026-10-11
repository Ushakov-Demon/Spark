import type { EntityId } from './ids.js';

/**
 * What the engine actually computed. Solvers (and commands) emit these records
 * only when asked to (a sink is passed), so normal runs pay nothing.
 * Explanations are built from these records, never from hand-written text,
 * so "what we say" can't drift from "what we computed".
 */
export interface FormulaApplication {
  readonly kind: 'formula';
  /** Id of a FormulaSpec in a domain catalog. */
  readonly formula: string;
  readonly entities: readonly EntityId[];
  /** Exact arguments passed to the catalog function; tests re-run them. */
  readonly args: readonly unknown[];
  readonly output: number;
}

export interface NumericsRecord {
  readonly kind: 'numerics';
  readonly solver: string;
  readonly method: string;
  readonly dt: number;
  readonly substeps: number;
}

/**
 * Something (energy, later mass or charge) moved along a connection during one
 * step. `amount` is the exact net quantity from `a` to `b` (negative = b → a).
 * Summed over a run it answers "where did it go?" in goal/result debriefs.
 */
export interface TransferRecord {
  readonly kind: 'transfer';
  readonly connection: string;
  readonly a: EntityId;
  readonly b: EntityId;
  readonly quantity: 'energy';
  readonly amount: number;
}

export type TraceRecord = FormulaApplication | NumericsRecord | TransferRecord;

export interface TraceSink {
  record(r: TraceRecord): void;
}

export function createTraceCollector(): { readonly records: TraceRecord[]; readonly sink: TraceSink } {
  const records: TraceRecord[] = [];
  return { records, sink: { record: (r) => void records.push(r) } };
}
