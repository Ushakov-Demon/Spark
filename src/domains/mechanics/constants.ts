import type { SourcedValue } from '../../knowledge/types.js';

/** Standard acceleration of gravity, m/s² — a defined value (3rd CGPM, 1901). */
export const STANDARD_GRAVITY: SourcedValue = {
  value: 9.80665,
  unit: 'm/s²',
  conditions: 'standard (defined) value',
  verification: 'cross-checked',
  tolerance: 0,
  citations: [
    { source: 'nist-standard-gravity', locator: 'standard acceleration of gravity g_n (exact)', conditions: 'defined', value: 9.80665 },
    { source: 'wikipedia-standard-gravity', locator: 'Lead: 9.80665 m/s²', conditions: 'defined', value: 9.80665 },
  ],
};
/** The value school problems use. */
export const G = STANDARD_GRAVITY.value;

/** The standard atmosphere, Pa — a defined value (10th CGPM, 1954): the air's pressure at sea level on an average day. */
export const STANDARD_ATMOSPHERE: SourcedValue = {
  value: 101325,
  unit: 'Pa',
  conditions: 'standard (defined) value',
  verification: 'single-source',
  tolerance: 0.0001,
  citations: [{ source: 'wikipedia-standard-atmosphere', locator: 'Lead: defined as 101325 Pa', conditions: 'defined', value: 101325 }],
  note: 'A defined unit, not a measurement: the day’s pressure differs by a few per cent.',
};
