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

/** A solid ball's moment of inertia over m·r²: I = 2/5·m·r² — the share of its spin in rolling. */
export const SOLID_BALL_INERTIA: SourcedValue = {
  value: 0.4,
  unit: '1',
  conditions: 'a uniform solid sphere about its centre',
  verification: 'single-source',
  tolerance: 0.0001,
  citations: [{ source: 'wikipedia-rolling', locator: 'with the List of moments of inertia: a solid sphere I = 2/5·m·r²', conditions: 'uniform solid sphere', value: 0.4 }],
  note: 'Exact for a uniform solid ball.',
};

/** The Earth's mean radius, m (IUGG): the ball the distances between places are taken on. */
export const EARTH_MEAN_RADIUS: SourcedValue = {
  value: 6_371_008.8,
  unit: 'm',
  conditions: 'IUGG arithmetic mean radius',
  verification: 'single-source',
  tolerance: 0.0001,
  citations: [{ source: 'wikipedia-earth-radius', locator: 'IUGG arithmetic mean radius R₁ = 6,371.0087714 km', conditions: 'mean', value: 6_371_008.8 }],
  note: 'The Earth is a little flattened: distances on a ball of this radius are right within about half a per cent.',
};

/** The Earth's gravitational parameter μ = GM, m³/s² (the geocentric gravitational constant). */
export const EARTH_GM: SourcedValue = {
  value: 3.986004418e14,
  unit: 'm³/s²',
  conditions: 'the geocentric gravitational constant GM',
  verification: 'single-source',
  tolerance: 1e-8,
  citations: [{ source: 'wikipedia-standard-gravitational-parameter', locator: 'Solar system: «It equals (3.986004418±0.000000008)×10^14 m3⋅s−2»', conditions: 'Earth', value: 3.986004418e14 }],
  note: 'Known far better than G and the Earth’s mass apart: their product is what an orbit shows.',
};

/**
 * Grains poured into a vessel fill this share of its volume (the packing fraction); the rest is the gaps between them,
 * full of air. Same-size spheres «poured into bed» — 0.609–0.625; «dropped into bed or packed by hand» — 0.59–0.60.
 */
export const POURED_PACKING: SourcedValue = {
  value: 0.61,
  unit: '',
  conditions: 'grains poured into a vessel',
  verification: 'estimate',
  tolerance: 0.1,
  citations: [{ source: 'wikipedia-random-close-pack', locator: 'For spheres (table): «Poured random packing … 0.609 to 0.625»; «Loose random packing … 0.59 to 0.60»', conditions: 'same-size spheres', range: [0.59, 0.625] }],
  note: 'Estimate for real grains: the table is for spheres; crystals and grains of other shapes pack a little otherwise (a sugar or salt crystal, a filing), and a fine powder looser still.',
};
/** Shaken or tapped till they settle no more, grains fill this share: random close packing («the bed vibrated» — 0.625–0.641). */
export const SHAKEN_PACKING: SourcedValue = {
  value: 0.64,
  unit: '',
  conditions: 'grains shaken till they settle no more',
  verification: 'single-source',
  tolerance: 0.03,
  citations: [{ source: 'wikipedia-random-close-pack', locator: 'Lead: «gives a maximum volume fraction of about 64%»; Definition: «shaken or tapped until the objects do not compact any further, at this point the packing state is RCP»', conditions: 'same-size spheres', value: 0.64 }],
  note: 'For spheres; other shapes settle a little denser (M&M’s — 0.68, the same page).',
};
