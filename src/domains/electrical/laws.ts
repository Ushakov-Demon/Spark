import { msg } from '../../knowledge/messages.js';
import type { LawSpec, Person } from '../../knowledge/types.js';

const OHM: Person = { name: msg('person-ohm'), born: 1789, died: 1854, wikidata: 'Q1585' };
const JOULE: Person = { name: msg('person-joule'), born: 1818, died: 1889, wikidata: 'Q8962' };
const KIRCHHOFF: Person = { name: msg('person-kirchhoff'), born: 1824, died: 1887, wikidata: 'Q76508' };
const LENZ: Person = { name: msg('person-lenz'), born: 1804, died: 1865, wikidata: 'Q154325' };
const OERSTED: Person = { name: msg('person-oersted'), born: 1777, died: 1851, wikidata: 'Q44412' };
const STURGEON: Person = { name: msg('person-sturgeon'), born: 1783, died: 1850, wikidata: 'Q472515' };
const HENRY: Person = { name: msg('person-henry'), born: 1797, died: 1878, wikidata: 'Q157043' };
const FARADAY: Person = { name: msg('person-faraday'), born: 1791, died: 1867, wikidata: 'Q8750' };

/**
 * Laws behind the electrical formulas. Texts follow docs/CONTENT_STYLE.md;
 * every historical claim is backed by `history.citations`.
 */
export const ELECTRICAL_LAWS: readonly LawSpec[] = [
  {
    id: 'resistance',
    kind: 'definition',
    name: msg('law-resistance'),
    statement: {
      novice: msg('law-resistance-statement-novice'),
      school: msg('law-resistance-statement-school'),
    },
    history: {
      people: [],
      role: 'associated',
      when: '—',
      story: { school: msg('law-resistance-story-school') },
      citations: [],
    },
  },
  {
    id: 'ohm',
    kind: 'law',
    name: msg('law-ohm'),
    statement: {
      novice: msg('law-ohm-statement-novice'),
      school: msg('law-ohm-statement-school'),
    },
    history: {
      people: [OHM],
      role: 'discovered',
      when: '1827',
      work: 'Die galvanische Kette, mathematisch bearbeitet',
      story: {
        school: msg('law-ohm-story-school'),
        advanced: msg('law-ohm-story-advanced'),
      },
      citations: [
        { source: 'wikipedia-ohms-law', locator: 'History', claim: 'Ohm published his results in 1827 as the book Die galvanische Kette, mathematisch bearbeitet' },
        { source: 'wikipedia-ohms-law', locator: 'History', claim: 'He added test wires of varying length, diameter, and material to complete the circuit' },
        { source: 'wikipedia-ohms-law', locator: 'History', claim: 'Critics reacted with hostility; his work did not become widely accepted until the 1840s' },
        { source: 'wikipedia-ohms-law', locator: 'History', claim: 'Cavendish (1781) experimented with salt-solution-filled glass tubes; published by Maxwell in 1879' },
        { source: 'wikidata', locator: 'Q1585 (P569, P570)', claim: 'life dates' },
      ],
    },
    limits: {
      school: msg('law-ohm-limits-school'),
      advanced: msg('law-ohm-limits-advanced'),
    },
  },
  {
    id: 'joule-lenz',
    kind: 'law',
    name: msg('law-joule-lenz'),
    statement: {
      novice: msg('law-joule-lenz-statement-novice'),
      school: msg('law-joule-lenz-statement-school'),
    },
    history: {
      people: [JOULE, LENZ],
      role: 'discovered',
      when: '1840–1842',
      story: {
        school: msg('law-joule-lenz-story-school'),
      },
      citations: [
        { source: 'wikipedia-joule-heating', locator: 'History', claim: 'first published in December 1840, an abstract in the Proceedings of the Royal Society' },
        { source: 'wikipedia-joule-heating', locator: 'History', claim: 'Resistive heating was independently studied by Heinrich Lenz in 1842' },
        { source: 'wikipedia-joule-heating', locator: 'Lead', claim: 'also known as the Joule–Lenz law' },
        { source: 'wikidata', locator: 'Q8962, Q154325 (P569, P570)', claim: 'life dates' },
      ],
    },
  },
  {
    id: 'faraday-electrolysis',
    kind: 'law',
    name: msg('law-faraday-electrolysis'),
    statement: {
      novice: msg('law-faraday-electrolysis-statement-novice'),
      school: msg('law-faraday-electrolysis-statement-school'),
    },
    history: {
      people: [FARADAY],
      role: 'discovered',
      when: '1833–1834',
      story: {
        school: msg('law-faraday-electrolysis-story-school'),
      },
      citations: [
        { source: 'wikipedia-faraday-electrolysis', locator: 'Lead', claim: 'electrochemical research published by Michael Faraday in 1833 (reference dated 1834)' },
        { source: 'wikipedia-electrolysis', locator: 'History', claim: 'the word "electrolysis" introduced by Faraday in 1834, with electrode, electrolyte, anode, cathode, anion and cation' },
        { source: 'wikipedia-electrolysis', locator: 'History (1800)', claim: 'Nicholson and Carlisle demonstrated the first sustained electrolysis of water into hydrogen and oxygen' },
        { source: 'wikidata', locator: 'Q8750 (P569, P570)', claim: 'life dates' },
      ],
    },
  },
  {
    id: 'series',
    kind: 'law',
    name: msg('law-series'),
    statement: {
      novice: msg('law-series-statement-novice'),
      school: msg('law-series-statement-school'),
    },
    history: {
      people: [KIRCHHOFF],
      role: 'discovered',
      when: '1845',
      story: { school: msg('law-series-story-school') },
      citations: [
        { source: 'wikipedia-kirchhoff', locator: 'lead', claim: 'first described in 1845 by Gustav Kirchhoff' },
        { source: 'wikipedia-kirchhoff', locator: 'Kirchhoff’s current law', claim: 'the algebraic sum of currents in a network of conductors meeting at a point is zero' },
        { source: 'wikipedia-kirchhoff', locator: 'Kirchhoff’s voltage law', claim: 'the directed sum of the potential differences around any closed loop is zero' },
        { source: 'wikidata', locator: 'Q76508 (P569, P570)', claim: 'life dates' },
      ],
    },
  },
  {
    id: 'parallel',
    kind: 'law',
    name: msg('law-parallel'),
    statement: {
      novice: msg('law-parallel-statement-novice'),
      school: msg('law-parallel-statement-school'),
    },
    history: {
      people: [KIRCHHOFF],
      role: 'discovered',
      when: '1845',
      story: { school: msg('law-series-story-school') },
      citations: [
        { source: 'wikipedia-kirchhoff', locator: 'lead', claim: 'first described in 1845 by Gustav Kirchhoff' },
        { source: 'wikipedia-kirchhoff', locator: 'Kirchhoff’s current law', claim: 'the algebraic sum of currents in a network of conductors meeting at a point is zero' },
        { source: 'wikipedia-kirchhoff', locator: 'Kirchhoff’s voltage law', claim: 'the directed sum of the potential differences around any closed loop is zero' },
        { source: 'wikidata', locator: 'Q76508 (P569, P570)', claim: 'life dates' },
      ],
    },
  },
  {
    id: 'electric-power',
    kind: 'definition',
    name: msg('law-electric-power'),
    statement: {
      novice: msg('law-electric-power-statement-novice'),
      school: msg('law-electric-power-statement-school'),
    },
    history: { people: [], role: 'associated', when: '—', story: { school: msg('law-electric-power-story-school') }, citations: [] },
  },
  {
    id: 'electromagnetic-induction',
    kind: 'law',
    name: msg('law-electromagnetic-induction'),
    statement: {
      novice: msg('law-electromagnetic-induction-statement-novice'),
      school: msg('law-electromagnetic-induction-statement-school'),
    },
    history: {
      people: [FARADAY, HENRY, LENZ],
      role: 'discovered',
      when: '1831–1834',
      story: {
        school: msg('law-electromagnetic-induction-story-school'),
      },
      citations: [
        { source: 'wikipedia-faraday-induction', locator: 'History', claim: 'Faraday’s notebook on August 29, 1831 describes the first demonstration of induction' },
        { source: 'wikipedia-faraday-induction', locator: 'History', claim: 'Joseph Henry made similar observations independently in 1832; Faraday published first' },
        { source: 'wikipedia-faraday-induction', locator: 'Lenz’s law', claim: 'formulated by Emil Lenz in 1834' },
        { source: 'wikipedia-faraday-induction', locator: 'Faraday’s law', claim: 'for a coil of N turns, ε = −N·dΦ/dt' },
      ],
    },
    limits: {
      school: msg('law-electromagnetic-induction-limits-school'),
    },
  },
  {
    id: 'electromagnet',
    kind: 'law',
    name: msg('law-electromagnet'),
    statement: {
      novice: msg('law-electromagnet-statement-novice'),
      school: msg('law-electromagnet-statement-school'),
    },
    history: {
      people: [OERSTED, STURGEON, HENRY],
      role: 'discovered',
      when: '1820–1830',
      story: {
        school: msg('law-electromagnet-story-school'),
      },
      citations: [
        { source: 'wikipedia-electromagnet', locator: 'History', claim: 'Ørsted discovered in 1820 that electric currents create magnetic fields' },
        { source: 'wikipedia-electromagnet', locator: 'History', claim: 'William Sturgeon invented the electromagnet in 1824' },
        { source: 'wikipedia-electromagnet', locator: 'History', claim: 'from 1830 Joseph Henry wound multiple layers of insulated wire, magnets with thousands of turns' },
        { source: 'wikipedia-electromagnet', locator: 'lead; Physics', claim: 'the field is proportional to the current and to the number of turns; a core can increase it to thousands of times that of the coil alone' },
      ],
    },
    limits: {
      school: msg('law-electromagnet-limits-school'),
    },
  },
];
