import type { Source, SourceId } from './types.js';

const source = <const S extends Source>(s: S): S => s;

export const SOURCES = {
  wikidata: source({
    id: 'wikidata',
    title: 'Wikidata',
    url: 'https://www.wikidata.org',
    license: 'CC0-1.0',
    retrieved: '2026-10-11',
    caveats: 'Used for material properties (P2056, P2068) and life dates (P569, P570). Several statements per item; conditions often missing — always check qualifiers.',
  }),
  'openstax-cp2e': source({
    id: 'openstax-cp2e',
    title: 'OpenStax, College Physics 2e (Urone, Hinrichs, 2022), Tables 14.1 and 14.3',
    url: 'https://openstax.org/books/college-physics-2e/pages/14-2-temperature-change-and-heat-capacity',
    license: 'CC-BY-NC-SA-4.0',
    retrieved: '2026-10-11',
    caveats:
      'Values rounded for teaching. Only numbers (facts) are used — no text is copied: ShareAlike would bind derived texts, and the publisher forbids AI training on the book.',
  }),
  'wikipedia-specific-heat': source({
    id: 'wikipedia-specific-heat',
    title: 'Wikipedia, Table of specific heat capacities',
    url: 'https://en.wikipedia.org/wiki/Table_of_specific_heat_capacities',
    license: 'CC-BY-SA-4.0',
    retrieved: '2026-10-11',
    caveats: 'Secondary source; the article carries an accuracy-dispute notice.',
  }),
  'wikipedia-thermal-conductivity': source({
    id: 'wikipedia-thermal-conductivity',
    title: 'Wikipedia, List of thermal conductivities (aggregates CRC Handbook, TPRC)',
    url: 'https://en.wikipedia.org/wiki/List_of_thermal_conductivities',
    license: 'CC-BY-SA-4.0',
    retrieved: '2026-10-11',
    caveats: 'Secondary source; quotes several primary references per material.',
  }),
  'wikipedia-heat-transfer-coefficient': source({
    id: 'wikipedia-heat-transfer-coefficient',
    title: 'Wikipedia, Heat transfer coefficient',
    url: 'https://en.wikipedia.org/wiki/Heat_transfer_coefficient',
    license: 'CC-BY-SA-4.0',
    retrieved: '2026-10-11',
    caveats: 'The ranges are tagged [citation needed] — usable for orders of magnitude only.',
  }),
  'wikipedia-newton-cooling': source({
    id: 'wikipedia-newton-cooling',
    title: "Wikipedia, Newton's law of cooling (History)",
    url: 'https://en.wikipedia.org/wiki/Newton%27s_law_of_cooling',
    license: 'CC-BY-SA-4.0',
    retrieved: '2026-10-11',
  }),
  'wikipedia-fourier': source({
    id: 'wikipedia-fourier',
    title: 'Wikipedia, Joseph Fourier',
    url: 'https://en.wikipedia.org/wiki/Joseph_Fourier',
    license: 'CC-BY-SA-4.0',
    retrieved: '2026-10-11',
  }),
  'wikipedia-joseph-black': source({
    id: 'wikipedia-joseph-black',
    title: 'Wikipedia, Joseph Black',
    url: 'https://en.wikipedia.org/wiki/Joseph_Black',
    license: 'CC-BY-SA-4.0',
    retrieved: '2026-10-11',
  }),
  'wikipedia-energy-conservation': source({
    id: 'wikipedia-energy-conservation',
    title: 'Wikipedia, Conservation of energy (History)',
    url: 'https://en.wikipedia.org/wiki/Conservation_of_energy',
    license: 'CC-BY-SA-4.0',
    retrieved: '2026-10-11',
  }),
  spark: source({
    id: 'spark',
    title: 'Spark team (original text)',
    url: 'https://github.com/Ushakov-Demon/Spark',
    license: 'project',
    retrieved: '2026-10-11',
  }),
} as const satisfies Record<string, Source>;

export type KnownSourceId = keyof typeof SOURCES;

export const getSource = (id: SourceId): Source | undefined =>
  (SOURCES as Record<string, Source>)[id];
