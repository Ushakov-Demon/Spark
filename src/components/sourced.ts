import type { Citation, SourcedValue, Verification } from '../knowledge/types.js';

/** Shorthands for writing sourced values in component files. */
export const sv = (value: number, unit: string, conditions: string, verification: Verification, tolerance: number, citations: readonly Citation[], note?: string): SourcedValue => ({
  value,
  unit,
  conditions,
  verification,
  tolerance,
  citations,
  ...(note === undefined ? {} : { note }),
});

export const cite = (source: string, locator: string, conditions: string, value: number): Citation => ({ source, locator, conditions, value });

/** No source found: an engineering estimate with an honest range. */
export const estimate = (value: number, unit: string, conditions: string, lo: number, hi: number, note: string): SourcedValue =>
  sv(value, unit, conditions, 'estimate', 0.5, [{ source: 'spark', locator: 'estimate', conditions: 'no source found', range: [lo, hi] }], note);
