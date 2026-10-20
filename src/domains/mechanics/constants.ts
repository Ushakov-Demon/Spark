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
