import { msg } from '../../knowledge/messages.js';
import type { LawSpec, Person } from '../../knowledge/types.js';

const KEPLER: Person = { name: msg('person-kepler'), born: 1571, died: 1630, wikidata: 'Q8963' };
const LAMBERT: Person = { name: msg('person-lambert'), born: 1728, died: 1777, wikidata: 'Q122999' };

/**
 * Laws behind the photometry formulas: what illuminance is, a lamp's intensity, and how the light thins with
 * distance and slant. Texts follow docs/CONTENT_STYLE.md; every historical claim is backed by `history.citations`.
 */
export const OPTICS_LAWS: readonly LawSpec[] = [
  {
    id: 'illuminance',
    kind: 'definition',
    name: msg('law-illuminance'),
    statement: {
      novice: msg('law-illuminance-statement-novice'),
      school: msg('law-illuminance-statement-school'),
    },
    history: { people: [], role: 'associated', when: '—', story: { school: msg('law-illuminance-story-school') }, citations: [{ source: 'wikipedia-lux', locator: 'Lead', claim: '1 lx = 1 lm/m² = 1 cd·sr/m²' }] },
  },
  {
    id: 'luminous-intensity',
    kind: 'definition',
    name: msg('law-luminous-intensity'),
    statement: {
      novice: msg('law-luminous-intensity-statement-novice'),
      school: msg('law-luminous-intensity-statement-school'),
    },
    history: { people: [], role: 'associated', when: '—', story: { school: msg('law-luminous-intensity-story-school') }, citations: [{ source: 'wikipedia-lumen', locator: 'Explanation', claim: '1 lm = 1 cd·sr; an isotropic one-candela source emits exactly 4π lumens' }] },
  },
  {
    id: 'luminous-efficacy',
    kind: 'definition',
    name: msg('law-luminous-efficacy'),
    statement: {
      novice: msg('law-luminous-efficacy-statement-novice'),
      school: msg('law-luminous-efficacy-statement-school'),
    },
    history: { people: [], role: 'associated', when: '—', story: { school: msg('law-luminous-efficacy-story-school') }, citations: [{ source: 'wikipedia-luminous-efficacy', locator: 'Lighting efficiency, Examples', claim: 'incandescent lamps 8–14 lm/W, LED lamps 75–217 lm/W' }] },
  },
  {
    id: 'inverse-square-light',
    kind: 'law',
    name: msg('law-inverse-square-light'),
    statement: {
      novice: msg('law-inverse-square-light-statement-novice'),
      school: msg('law-inverse-square-light-statement-school'),
    },
    history: {
      people: [KEPLER, LAMBERT],
      role: 'discovered',
      when: '1604, 1760',
      work: 'Ad Vitellionem paralipomena (1604); Photometria (1760)',
      story: { school: msg('law-inverse-square-light-story-school') },
      citations: [
        { source: 'wikipedia-inverse-square-law', locator: 'History', claim: 'in Ad Vitellionem paralipomena (1604), Book 1, proposition 9, Kepler argued that the spreading of light from a point source obeys an inverse square law' },
        { source: 'wikipedia-photometria', locator: 'Lead / Contents', claim: 'published by Lambert in 1760; demonstrated the inverse square from a point source and the cosine of the incidence angle; Lambert established the second law, previous workers had pronounced the first' },
        { source: 'wikidata', locator: 'Q8963 (P569, P570)', claim: 'life dates (1571 – 1630)' },
        { source: 'wikidata', locator: 'Q122999 (P569, P570)', claim: 'life dates (1728 – 1777)' },
      ],
    },
    limits: {
      school: msg('law-inverse-square-light-limits-school'),
    },
  },
];
