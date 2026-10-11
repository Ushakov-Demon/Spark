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
  'ua-mnp-2023-holovko': source({
    id: 'ua-mnp-2023-holovko',
    title:
      'Модельна навчальна програма «Фізика. 7–9 класи» (Головко М. В., Засєкін Д. О. та ін.), рекомендовано наказом МОН України від 16.08.2023 № 1001',
    url: 'https://osvita.ua/doc/files/news/901/90160/Fizyka_7-9_kl_Holovko_ta_in_16_08_2023.pdf',
    license: 'facts-only',
    retrieved: '2026-10-11',
    caveats: 'НУШ: one of several recommended model programmes; schools choose one. Topic placement by grade may differ slightly between programmes.',
  }),
  'ua-mon-2017-physics-7-9': source({
    id: 'ua-mon-2017-physics-7-9',
    title: 'Навчальна програма «Фізика. 7–9 класи» для загальноосвітніх навчальних закладів, МОН України (редакція 2017 р.)',
    url: 'https://phys.ippo.kubg.edu.ua/wp-content/uploads/2017/06/Physics_7-9_17.pdf',
    license: 'facts-only',
    retrieved: '2026-10-11',
    caveats: 'Pre-НУШ programme, still the reference for classes not yet on НУШ.',
  }),
  'wikipedia-properties-of-water': source({
    id: 'wikipedia-properties-of-water',
    title: 'Wikipedia, Properties of water (infobox)',
    url: 'https://en.wikipedia.org/wiki/Properties_of_water',
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
