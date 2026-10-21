import type { SourcedValue } from '../knowledge/types.js';

/**
 * Standard atomic weights (IUPAC/CIAAW abridged values, g/mol) of the elements
 * the components are made of. Add an element when a component needs it.
 */
export const ATOMIC_WEIGHTS = {
  H: 1.008,
  C: 12.011,
  N: 14.007,
  O: 15.999,
  Na: 22.99,
  Al: 26.982,
  S: 32.06,
  Cl: 35.45,
  Ca: 40.078,
  Fe: 55.845,
  Cu: 63.546,
  Zn: 65.38,
  Sn: 118.71,
} as const;

export type ElementSymbol = keyof typeof ATOMIC_WEIGHTS;

export const ATOMIC_WEIGHTS_SOURCE: SourcedValue = {
  value: 15.999,
  unit: 'g/mol',
  conditions: 'O, abridged standard atomic weight',
  verification: 'single-source',
  tolerance: 0.001,
  citations: [{ source: 'wikipedia-standard-atomic-weight', locator: 'List of standard atomic weights (abridged, IUPAC 2021)', conditions: '—', value: 15.999 }],
};

/** Molar mass from a formula, kg/mol: Σ atoms × atomic weight. */
export function molarMassOf(composition: Readonly<Partial<Record<ElementSymbol, number>>>): number {
  let grams = 0;
  for (const [el, n] of Object.entries(composition)) grams += ATOMIC_WEIGHTS[el as ElementSymbol] * (n ?? 0);
  return grams / 1000;
}
