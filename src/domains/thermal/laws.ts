import { msg } from '../../knowledge/messages.js';
import type { LawSpec, Person } from '../../knowledge/types.js';

/** Dates verified against Wikidata (P569/P570) on 2026-10-11. */
const CLAPEYRON: Person = { name: msg('person-clapeyron'), born: 1799, died: 1864, wikidata: 'Q313551' };
const NEWTON: Person = { name: msg('person-newton'), born: 1643, died: 1727, wikidata: 'Q935' };
const FOURIER: Person = { name: msg('person-fourier'), born: 1768, died: 1830, wikidata: 'Q8772' };
const BLACK: Person = { name: msg('person-black'), born: 1728, died: 1799, wikidata: 'Q272512' };
const MAYER: Person = { name: msg('person-mayer'), born: 1814, died: 1878, wikidata: 'Q57171' };
const JOULE: Person = { name: msg('person-joule'), born: 1818, died: 1889, wikidata: 'Q8962' };
const HELMHOLTZ: Person = { name: msg('person-helmholtz'), born: 1821, died: 1894, wikidata: 'Q60024' };

/**
 * Laws behind the thermal formulas. Texts follow docs/CONTENT_STYLE.md;
 * every historical claim is backed by `history.citations`.
 */
export const THERMAL_LAWS: readonly LawSpec[] = [
  {
    id: 'energy-conservation',
    kind: 'law',
    name: msg('law-energy-conservation'),
    statement: {
      novice: msg('law-energy-conservation-statement-novice'),
      school: msg('law-energy-conservation-statement-school'),
      advanced: msg('law-energy-conservation-statement-advanced'),
      expert: msg('law-energy-conservation-statement-expert'),
    },
    history: {
      people: [MAYER, JOULE, HELMHOLTZ],
      role: 'discovered',
      when: '1842–1847',
      work: 'H. Helmholtz, «Über die Erhaltung der Kraft» (1847)',
      story: {
        novice: msg('law-energy-conservation-story-novice'),
        school: msg('law-energy-conservation-story-school'),
        advanced: msg('law-energy-conservation-story-advanced'),
      },
      citations: [
        { source: 'wikipedia-energy-conservation', locator: 'History', claim: 'Mayer stated the principle in its modern form in 1842; quantitative monograph in 1845' },
        { source: 'wikipedia-energy-conservation', locator: 'History', claim: 'Joule independently discovered the mechanical equivalent in 1843 (paddle-wheel experiment)' },
        { source: 'wikipedia-energy-conservation', locator: 'History', claim: 'Colding did similar work, little known outside Denmark' },
        { source: 'wikipedia-energy-conservation', locator: 'History', claim: 'Helmholtz, "Über die Erhaltung der Kraft", 1847 — general acceptance' },
        { source: 'wikidata', locator: 'Q57171, Q8962, Q60024 (P569, P570)', claim: 'life dates' },
      ],
    },
    limits: {
      school: msg('law-energy-conservation-limits-school'),
    },
  },
  {
    id: 'specific-heat',
    kind: 'definition',
    name: msg('law-specific-heat'),
    statement: {
      novice: msg('law-specific-heat-statement-novice'),
      school: msg('law-specific-heat-statement-school'),
      advanced: msg('law-specific-heat-statement-advanced'),
      expert: msg('law-specific-heat-statement-expert'),
    },
    history: {
      people: [BLACK],
      role: 'discovered',
      when: '1760',
      story: {
        novice: msg('law-specific-heat-story-novice'),
        school: msg('law-specific-heat-story-school'),
        advanced: msg('law-specific-heat-story-advanced'),
      },
      citations: [
        { source: 'wikipedia-joseph-black', locator: 'Lead', claim: 'Joseph Black was a Scottish physicist and chemist (born in Bordeaux)' },
        { source: 'wikipedia-joseph-black', locator: 'Specific heat', claim: 'In 1760 Black realised the specific heat relationship from mixing experiments' },
        { source: 'wikipedia-joseph-black', locator: 'Latent heat', claim: 'Latent heat deduced in 1761' },
        { source: 'wikipedia-joseph-black', locator: 'References', claim: 'Lectures on the Elements of Chemistry, ed. John Robison, 1807 edition cited' },
        { source: 'wikidata', locator: 'Q272512 (P569, P570)', claim: 'life dates' },
      ],
    },
  },
  {
    id: 'latent-heat',
    kind: 'law',
    name: msg('law-latent-heat'),
    statement: {
      novice: msg('law-latent-heat-statement-novice'),
      school: msg('law-latent-heat-statement-school'),
      expert: msg('law-latent-heat-statement-expert'),
    },
    history: {
      people: [BLACK],
      role: 'discovered',
      when: '1761',
      story: {
        novice: msg('law-latent-heat-story-novice'),
        school: msg('law-latent-heat-story-school'),
      },
      citations: [
        { source: 'wikipedia-joseph-black', locator: 'Latent heat', claim: 'In 1761 Black observed that heat applied at the melting/boiling point increases the amount of water/steam rather than the temperature; latent heat' },
        { source: 'wikidata', locator: 'Q272512 (P569, P570)', claim: 'life dates' },
      ],
    },
    limits: {
      school: msg('law-latent-heat-limits-school'),
    },
  },
  {
    id: 'evaporation',
    kind: 'model',
    name: msg('law-evaporation'),
    statement: {
      novice: msg('law-evaporation-statement-novice'),
      school: msg('law-evaporation-statement-school'),
      advanced: msg('law-evaporation-statement-advanced'),
      expert: msg('law-evaporation-statement-expert'),
    },
    history: {
      people: [],
      role: 'associated',
      when: '—',
      story: {
        school: msg('law-evaporation-story-school'),
      },
      citations: [{ source: 'wikipedia-chilton-colburn', locator: 'Lead', claim: 'Analogy named after Thomas H. Chilton and Allan Philip Colburn; stated for turbulent flow in conduits' }],
    },
    limits: {
      school: msg('law-evaporation-limits-school'),
    },
  },
  {
    id: 'heat-balance',
    kind: 'law',
    name: msg('law-heat-balance'),
    statement: {
      novice: msg('law-heat-balance-statement-novice'),
      school: msg('law-heat-balance-statement-school'),
      advanced: msg('law-heat-balance-statement-advanced'),
    },
    history: {
      people: [BLACK],
      role: 'associated',
      when: '1760',
      story: {
        novice: msg('law-heat-balance-story-novice'),
        school: msg('law-heat-balance-story-school'),
      },
      citations: [{ source: 'wikipedia-joseph-black', locator: 'Specific heat', claim: 'Black studied mixing of substances at different temperatures (1760)' }],
    },
    limits: {
      school: msg('law-heat-balance-limits-school'),
    },
  },
  {
    id: 'linear-heat-transfer',
    kind: 'law',
    name: msg('law-linear-heat-transfer'),
    statement: {
      novice: msg('law-linear-heat-transfer-statement-novice'),
      school: msg('law-linear-heat-transfer-statement-school'),
      advanced: msg('law-linear-heat-transfer-statement-advanced'),
    },
    history: {
      people: [NEWTON, FOURIER],
      role: 'associated',
      when: '1701–1822',
      story: {
        school: msg('law-linear-heat-transfer-story-school'),
      },
      citations: [
        { source: 'wikipedia-newton-cooling', locator: 'History', claim: 'Newton published his work on cooling anonymously in 1701' },
        { source: 'wikipedia-fourier', locator: 'The Analytic Theory of Heat', claim: 'Fourier based his reasoning on Newton’s law of cooling' },
      ],
    },
  },
  {
    id: 'newton-cooling',
    kind: 'law',
    name: msg('law-newton-cooling'),
    statement: {
      novice: msg('law-newton-cooling-statement-novice'),
      school: msg('law-newton-cooling-statement-school'),
      advanced: msg('law-newton-cooling-statement-advanced'),
      expert: msg('law-newton-cooling-statement-expert'),
    },
    history: {
      people: [NEWTON],
      role: 'discovered',
      when: '1701',
      work: '«Scala graduum Caloris», Philosophical Transactions (анонімно / anonymously)',
      story: {
        novice: msg('law-newton-cooling-story-novice'),
        school: msg('law-newton-cooling-story-school'),
        advanced: msg('law-newton-cooling-story-advanced'),
      },
      citations: [
        { source: 'wikipedia-newton-cooling', locator: 'History', claim: 'Published anonymously in 1701 as "Scala graduum Caloris" in Philosophical Transactions' },
        { source: 'wikipedia-newton-cooling', locator: 'History', claim: 'Newton did not state the law in the modern form; confusion between heat and temperature' },
        { source: 'wikidata', locator: 'Q935 (P569, P570)', claim: 'life dates (Gregorian)' },
      ],
    },
    limits: {
      school: msg('law-newton-cooling-limits-school'),
    },
  },
  {
    id: 'fourier-conduction',
    kind: 'law',
    name: msg('law-fourier-conduction'),
    statement: {
      novice: msg('law-fourier-conduction-statement-novice'),
      school: msg('law-fourier-conduction-statement-school'),
      advanced: msg('law-fourier-conduction-statement-advanced'),
      expert: msg('law-fourier-conduction-statement-expert'),
    },
    history: {
      people: [FOURIER],
      role: 'discovered',
      when: '1807–1822',
      work: '«Théorie analytique de la chaleur» (1822)',
      story: {
        school: msg('law-fourier-conduction-story-school'),
        advanced: msg('law-fourier-conduction-story-advanced'),
      },
      citations: [
        { source: 'wikipedia-fourier', locator: 'The Analytic Theory of Heat', claim: 'Memoir On the Propagation of Heat in Solid Bodies presented 21 December 1807' },
        { source: 'wikipedia-fourier', locator: 'The Analytic Theory of Heat', claim: 'Théorie analytique de la chaleur published 1822' },
        { source: 'wikipedia-fourier', locator: 'The Analytic Theory of Heat', claim: 'Fourier based his reasoning on Newton’s law of cooling' },
        { source: 'wikidata', locator: 'Q8772 (P569, P570)', claim: 'life dates' },
      ],
    },
  },
  {
    id: 'power',
    kind: 'definition',
    name: msg('law-power'),
    statement: {
      novice: msg('law-power-statement-novice'),
      school: msg('law-power-statement-school'),
    },
    history: {
      people: [{ name: msg('person-power-people'), born: 1736, died: 1819, wikidata: 'Q9041' }],
      role: 'associated',
      when: msg('law-power-history-when'),
      story: {
        school: msg('law-power-story-school'),
      },
      citations: [{ source: 'wikipedia-horsepower', locator: 'History', claim: 'adopted in the late 18th century by James Watt to compare the output of steam engines with the power of draft horses; to sell engines to customers who used horses' }],
    },
  },
  {
    id: 'mass-fraction',
    kind: 'definition',
    name: msg('law-mass-fraction'),
    statement: {
      novice: msg('law-mass-fraction-statement-novice'),
      school: msg('law-mass-fraction-statement-school'),
    },
    history: { people: [], role: 'associated', when: '—', story: { school: msg('law-mass-fraction-story-school') }, citations: [] },
  },
  {
    id: 'solubility',
    kind: 'definition',
    name: msg('law-solubility'),
    statement: {
      novice: msg('law-solubility-statement-novice'),
      school: msg('law-solubility-statement-school'),
    },
    history: { people: [], role: 'associated', when: '—', story: { school: msg('law-mass-fraction-story-school') }, citations: [] },
  },
  {
    id: 'heat-of-solution',
    kind: 'definition',
    name: msg('law-heat-of-solution'),
    statement: {
      novice: msg('law-heat-of-solution-statement-novice'),
      school: msg('law-heat-of-solution-statement-school'),
    },
    history: { people: [], role: 'associated', when: '—', story: { school: msg('law-mass-fraction-story-school') }, citations: [] },
  },
  {
    id: 'ideal-gas',
    kind: 'law',
    name: msg('law-ideal-gas'),
    statement: {
      novice: msg('law-ideal-gas-statement-novice'),
      school: msg('law-ideal-gas-statement-school'),
    },
    history: {
      people: [CLAPEYRON],
      role: 'discovered',
      when: msg('law-ideal-gas-history-when'),
      story: { school: msg('law-ideal-gas-story-school') },
      citations: [
        { source: 'wikipedia-ideal-gas-law', locator: 'lead', claim: 'first stated by Benoît Paul Émile Clapeyron in 1834; p = ρ·R_specific·T, R_specific = R/M' },
        { source: 'wikidata', locator: 'Q313551 (P569, P570)', claim: 'life dates (1799 – 1864)' },
      ],
    },
    limits: { school: msg('law-ideal-gas-limits-school') },
  },
];
