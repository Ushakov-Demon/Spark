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

/** Below this Reynolds number a flow in a round pipe is laminar (Hagen–Poiseuille holds); above ≈ 2900 — turbulent. */
export const LAMINAR_REYNOLDS: SourcedValue = {
  value: 2300,
  unit: '1',
  conditions: 'fully developed flow in a round pipe',
  verification: 'single-source',
  tolerance: 0.01,
  citations: [{ source: 'wikipedia-reynolds-number', locator: 'Flow in a pipe: laminar when Re_D < 2300, turbulent when Re_D > 2900', conditions: 'round pipe', value: 2300 }],
  note: 'Between 2300 and 2900 the flow alternates; the edge is not sharp.',
};

/** The metric horsepower (кінська сила, PS), W — the unit Watt's horsepower became on the continent. */
export const METRIC_HORSEPOWER: SourcedValue = {
  value: 735.49875,
  unit: 'W',
  conditions: 'defined value',
  verification: 'single-source',
  tolerance: 0.0001,
  citations: [{ source: 'wikipedia-horsepower', locator: 'Metric horsepower (PS): 735.49875 W', conditions: 'defined', value: 735.49875 }],
  note: 'A defined unit; the imperial horsepower is a little larger, ≈ 745.7 W.',
};
/** What a healthy person's muscles give: for a short burst, and for as long as one likes, W. */
export const HUMAN_POWER_BRIEF: SourcedValue = {
  value: 890,
  unit: 'W',
  conditions: 'a healthy person, briefly',
  verification: 'single-source',
  tolerance: 0.05,
  citations: [{ source: 'wikipedia-horsepower', locator: 'a healthy human can produce about 1.2 hp (0.89 kW) briefly', conditions: 'briefly', value: 890 }],
  note: 'A rough figure: trained athletes reach about 2 kW briefly.',
};
export const HUMAN_POWER_SUSTAINED: SourcedValue = {
  value: 70,
  unit: 'W',
  conditions: 'a healthy person, indefinitely',
  verification: 'single-source',
  tolerance: 0.1,
  citations: [{ source: 'wikipedia-horsepower', locator: 'sustain about 0.1 hp (0.07 kW) indefinitely', conditions: 'indefinitely', value: 70 }],
  note: 'A rough figure; Wikipedia’s «Human power» gives about 75 W for a labourer over a working day.',
};
