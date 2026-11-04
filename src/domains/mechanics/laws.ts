import { msg } from '../../knowledge/messages.js';
import type { LawSpec, Person } from '../../knowledge/types.js';

const HOOKE: Person = { name: msg('person-hooke'), born: 1635, died: 1703, wikidata: 'Q46830' };
const AMONTONS: Person = { name: msg('person-amontons'), born: 1663, died: 1705, wikidata: 'Q368121' };
const COULOMB: Person = { name: msg('person-coulomb'), born: 1736, died: 1806, wikidata: 'Q81716' };
const GALILEO: Person = { name: msg('person-galileo'), born: 1564, died: 1642, wikidata: 'Q307' };
const HUYGENS: Person = { name: msg('person-huygens'), born: 1629, died: 1695, wikidata: 'Q39599' };
const ARCHIMEDES: Person = { name: msg('person-archimedes'), born: -287, died: -212, wikidata: 'Q8739' };
const TORRICELLI: Person = { name: msg('person-torricelli'), born: 1608, died: 1647, wikidata: 'Q102490' };
const STEVIN: Person = { name: msg('person-stevin'), born: 1548, died: 1620, wikidata: 'Q23696' };
const KEPLER: Person = { name: msg('person-kepler'), born: 1571, died: 1630, wikidata: 'Q8963' };
const BOYLE: Person = { name: msg('person-boyle'), born: 1627, died: 1691, wikidata: 'Q43393' };
const MARIOTTE: Person = { name: msg('person-mariotte'), born: 1620, died: 1684, wikidata: 'Q319749' };
const HAGEN: Person = { name: msg('person-hagen'), born: 1797, died: 1884, wikidata: 'Q62726' };
const POISEUILLE: Person = { name: msg('person-poiseuille'), born: 1797, died: 1869, wikidata: 'Q550943' };
const PASCAL: Person = { name: msg('person-pascal'), born: 1623, died: 1662, wikidata: 'Q1290' };

/**
 * Laws behind the mechanics formulas (bodies at rest in a liquid). Texts follow
 * docs/CONTENT_STYLE.md; every historical claim is backed by `history.citations`.
 */
export const MECHANICS_LAWS: readonly LawSpec[] = [
  {
    id: 'density',
    kind: 'definition',
    name: msg('law-density'),
    statement: {
      novice: msg('law-density-statement-novice'),
      school: msg('law-density-statement-school'),
    },
    history: { people: [], role: 'associated', when: '—', story: { school: msg('law-density-story-school') }, citations: [] },
  },
  {
    id: 'weight',
    kind: 'definition',
    name: msg('law-weight'),
    statement: {
      novice: msg('law-weight-statement-novice'),
      school: msg('law-weight-statement-school'),
    },
    history: { people: [], role: 'associated', when: '—', story: { school: msg('law-density-story-school') }, citations: [] },
  },
  {
    id: 'archimedes',
    kind: 'law',
    name: msg('law-archimedes'),
    statement: {
      novice: msg('law-archimedes-statement-novice'),
      school: msg('law-archimedes-statement-school'),
    },
    history: {
      people: [ARCHIMEDES],
      role: 'discovered',
      when: msg('law-archimedes-history-when'),
      work: 'Про плаваючі тіла (On Floating Bodies)',
      story: {
        school: msg('law-archimedes-story-school'),
      },
      citations: [
        { source: 'wikipedia-archimedes-principle', locator: 'Lead / History', claim: 'stated in On Floating Bodies, c. 246 BC' },
        { source: 'wikipedia-archimedes-principle', locator: 'History', claim: 'the widespread tale of “Eureka” and the gold crown: he measured its volume by the displaced water' },
        { source: 'wikidata', locator: 'Q8739 (P569, P570)', claim: 'life dates (c. 287 – 212 BC)' },
      ],
    },
    limits: {
      school: msg('law-archimedes-limits-school'),
    },
  },
  {
    id: 'hooke',
    kind: 'law',
    name: msg('law-hooke'),
    statement: {
      novice: msg('law-hooke-statement-novice'),
      school: msg('law-hooke-statement-school'),
    },
    history: {
      people: [HOOKE],
      role: 'discovered',
      when: '1676–1678',
      story: {
        school: msg('law-hooke-story-school'),
      },
      citations: [
        { source: 'wikipedia-hookes-law', locator: 'History', claim: 'He first stated the law in 1676 as a Latin anagram' },
        { source: 'wikipedia-hookes-law', locator: 'History', claim: 'He published the solution of his anagram in 1678 as: ut tensio, sic vis ("as the extension, so the force")' },
        { source: 'wikidata', locator: 'Q46830 (P569, P570)', claim: 'life dates' },
      ],
    },
    limits: {
      school: msg('law-hooke-limits-school'),
    },
  },
  {
    id: 'friction',
    kind: 'law',
    name: msg('law-friction'),
    statement: {
      novice: msg('law-friction-statement-novice'),
      school: msg('law-friction-statement-school'),
    },
    history: {
      people: [AMONTONS, COULOMB],
      role: 'discovered',
      when: '1699–1785',
      story: {
        school: msg('law-friction-story-school'),
      },
      citations: [
        { source: 'wikipedia-friction', locator: 'History', claim: 'discovered by Leonardo da Vinci in 1493; his notebooks went unpublished' },
        { source: 'wikipedia-friction', locator: 'History', claim: 'rediscovered by Guillaume Amontons in 1699' },
        { source: 'wikipedia-friction', locator: 'History', claim: 'further developed by Charles-Augustin de Coulomb (1785)' },
        { source: 'wikipedia-friction', locator: 'Laws of dry friction', claim: 'The force of friction is directly proportional to the applied load; it is independent of the apparent area of contact' },
        { source: 'wikidata', locator: 'Q368121, Q81716 (P569, P570)', claim: 'life dates' },
      ],
    },
    limits: {
      school: msg('law-friction-limits-school'),
    },
  },
  {
    id: 'pressure',
    kind: 'definition',
    name: msg('law-pressure'),
    statement: {
      novice: msg('law-pressure-statement-novice'),
      school: msg('law-pressure-statement-school'),
    },
    history: { people: [], role: 'associated', when: '—', story: { school: msg('law-density-story-school') }, citations: [] },
  },
  {
    id: 'uniform-motion',
    kind: 'definition',
    name: msg('law-uniform-motion'),
    statement: {
      novice: msg('law-uniform-motion-statement-novice'),
      school: msg('law-uniform-motion-statement-school'),
    },
    history: { people: [], role: 'associated', when: '—', story: { school: msg('law-uniform-motion-story-school') }, citations: [] },
  },
  {
    id: 'row-method',
    kind: 'definition',
    name: msg('law-row-method'),
    statement: {
      novice: msg('law-row-method-statement-novice'),
      school: msg('law-row-method-statement-school'),
    },
    history: { people: [], role: 'associated', when: '—', story: { school: msg('law-row-method-story-school') }, citations: [] },
  },
  {
    id: 'turning-and-straight',
    kind: 'definition',
    name: msg('law-turning-and-straight'),
    statement: {
      novice: msg('law-turning-and-straight-statement-novice'),
      school: msg('law-turning-and-straight-statement-school'),
    },
    history: { people: [], role: 'associated', when: '—', story: { school: msg('law-turning-and-straight-story-school') }, citations: [] },
  },
  {
    id: 'kepler-third',
    kind: 'law',
    name: msg('law-kepler-third'),
    statement: {
      novice: msg('law-kepler-third-statement-novice'),
      school: msg('law-kepler-third-statement-school'),
    },
    history: {
      people: [KEPLER],
      role: 'discovered',
      when: msg('law-kepler-third-history-when'),
      work: 'Harmonice Mundi (Гармонія світу)',
      story: { school: msg('law-kepler-third-story-school') },
      citations: [
        { source: 'wikipedia-kepler-laws', locator: 'Lead / Third law', claim: 'published in 1619 in Harmonice Mundi; T²/a³ the same for all objects orbiting the same primary' },
        { source: 'wikidata', locator: 'Q8963 (P569, P570)', claim: 'life dates (1571 – 1630)' },
      ],
    },
  },
  {
    id: 'sun-and-time',
    kind: 'definition',
    name: msg('law-sun-and-time'),
    statement: {
      novice: msg('law-sun-and-time-statement-novice'),
      school: msg('law-sun-and-time-statement-school'),
    },
    history: { people: [], role: 'associated', when: '—', story: { school: msg('law-sun-and-time-story-school') }, citations: [] },
  },
  {
    id: 'mechanical-energy',
    kind: 'definition',
    name: msg('law-mechanical-energy'),
    statement: {
      novice: msg('law-mechanical-energy-statement-novice'),
      school: msg('law-mechanical-energy-statement-school'),
    },
    history: { people: [], role: 'associated', when: '—', story: { school: msg('law-uniform-motion-story-school') }, citations: [] },
  },
  {
    id: 'adding-forces',
    kind: 'definition',
    name: msg('law-adding-forces'),
    statement: {
      novice: msg('law-adding-forces-statement-novice'),
      school: msg('law-adding-forces-statement-school'),
    },
    history: { people: [], role: 'associated', when: '—', story: { school: msg('law-density-story-school') }, citations: [] },
  },
  {
    id: 'average-speed',
    kind: 'definition',
    name: msg('law-average-speed'),
    statement: {
      novice: msg('law-average-speed-statement-novice'),
      school: msg('law-average-speed-statement-school'),
    },
    history: { people: [], role: 'associated', when: '—', story: { school: msg('law-density-story-school') }, citations: [] },
  },
  {
    id: 'period',
    kind: 'definition',
    name: msg('law-period'),
    statement: {
      novice: msg('law-period-statement-novice'),
      school: msg('law-period-statement-school'),
    },
    history: { people: [], role: 'associated', when: '—', story: { school: msg('law-uniform-motion-story-school') }, citations: [] },
  },
  {
    id: 'pendulum',
    kind: 'law',
    name: msg('law-pendulum'),
    statement: {
      novice: msg('law-pendulum-statement-novice'),
      school: msg('law-pendulum-statement-school'),
    },
    history: {
      people: [GALILEO, HUYGENS],
      role: 'discovered',
      when: '1602–1673',
      story: {
        school: msg('law-pendulum-story-school'),
      },
      citations: [
        { source: 'wikipedia-pendulum', locator: 'History', claim: 'Galileo Galilei was the first to study the properties of pendulums, beginning around 1602; isochronism' },
        { source: 'wikipedia-pendulum', locator: 'History', claim: 'In 1673 Christiaan Huygens published his theory of the pendulum, Horologium Oscillatorium' },
        { source: 'wikipedia-pendulum', locator: 'Period of oscillation', claim: 'Daniel Bernoulli (1747) corrected for the lengthening of the period at a finite angle: 1 + θ₀²/16 + …' },
        { source: 'wikidata', locator: 'Q307, Q39599 (P569, P570)', claim: 'life dates' },
      ],
    },
    limits: {
      school: msg('law-pendulum-limits-school'),
    },
  },
  {
    id: 'lever',
    kind: 'law',
    name: msg('law-lever'),
    statement: {
      novice: msg('law-lever-statement-novice'),
      school: msg('law-lever-statement-school'),
    },
    history: {
      people: [ARCHIMEDES],
      role: 'discovered',
      when: msg('law-lever-history-when'),
      story: {
        school: msg('law-lever-story-school'),
      },
      citations: [
        { source: 'wikipedia-lever', locator: 'History', claim: 'the earliest remaining writings on levers date from the third century BC and were, by common belief, by Archimedes' },
        { source: 'wikipedia-lever', locator: 'History', claim: '“Give me a lever (long enough and a fulcrum on which to place it), and I shall move the world.”' },
        { source: 'wikipedia-lever', locator: 'Law of the lever', claim: 'the balance of moments about the fulcrum: F₁a = F₂b' },
      ],
    },
    limits: {
      school: msg('law-lever-limits-school'),
    },
  },
  {
    id: 'pascal',
    kind: 'law',
    name: msg('law-pascal'),
    statement: {
      novice: msg('law-pascal-statement-novice'),
      school: msg('law-pascal-statement-school'),
    },
    history: {
      people: [PASCAL],
      role: 'discovered',
      when: msg('law-pascal-history-when'),
      story: {
        school: msg('law-pascal-story-school'),
      },
      citations: [
        { source: 'wikipedia-pascal-law', locator: 'lead', claim: 'established by French mathematician Blaise Pascal in 1653 and published in 1663' },
        { source: 'wikipedia-pascal-law', locator: 'lead', claim: 'a pressure change at any point in a confined incompressible fluid is transmitted throughout the fluid' },
        { source: 'wikipedia-pascal-law', locator: 'Applications', claim: 'Pascal’s principle underlies the operation of the hydraulic press; F₂/F₁ = A₂/A₁' },
      ],
    },
    limits: {
      school: msg('law-pascal-limits-school'),
    },
  },
  {
    id: 'hydrostatic-paradox',
    kind: 'law',
    name: msg('law-hydrostatic-paradox'),
    statement: {
      novice: msg('law-hydrostatic-paradox-statement-novice'),
      school: msg('law-hydrostatic-paradox-statement-school'),
    },
    history: {
      people: [STEVIN],
      role: 'discovered',
      when: msg('law-hydrostatic-paradox-history-when'),
      story: {
        school: msg('law-hydrostatic-paradox-story-school'),
      },
      citations: [
        { source: 'wikipedia-stevin', locator: 'Mechanics', claim: 'Stevin discovered the hydrostatic paradox: the pressure in a liquid is independent of the shape of the vessel and the area of the base, but depends solely on its height' },
        { source: 'wikipedia-stevin', locator: 'Publications', claim: 'De Beghinselen des Waterwichts (Principles on the weight of water), 1586, on hydrostatics' },
      ],
    },
    limits: {
      school: msg('law-hydrostatic-paradox-limits-school'),
    },
  },
  {
    id: 'atmospheric-pressure',
    kind: 'law',
    name: msg('law-atmospheric-pressure'),
    statement: {
      novice: msg('law-atmospheric-pressure-statement-novice'),
      school: msg('law-atmospheric-pressure-statement-school'),
    },
    history: {
      people: [TORRICELLI, PASCAL],
      role: 'discovered',
      when: '1643–1648',
      story: {
        school: msg('law-atmospheric-pressure-story-school'),
      },
      citations: [
        { source: 'wikipedia-barometer', locator: 'History', claim: 'Evangelista Torricelli is usually credited with inventing the mercury barometer in 1643; Middleton argues for 1644' },
        { source: 'wikipedia-barometer', locator: 'History', claim: 'in September 1648 Florin Périer carried a mercury barometer up the Puy de Dôme and found lower readings higher up, as Pascal predicted' },
        { source: 'wikipedia-barometer', locator: 'Aneroid barometers', claim: 'Lucien Vidi invented the aneroid barometer in 1844' },
        { source: 'wikipedia-atmospheric-pressure', locator: 'Standard atmosphere', claim: 'the standard atmosphere is 101 325 Pa (1013.25 hPa)' },
      ],
    },
    limits: {
      school: msg('law-atmospheric-pressure-limits-school'),
    },
  },
  {
    id: 'efficiency',
    kind: 'definition',
    name: msg('law-efficiency'),
    statement: {
      novice: msg('law-efficiency-statement-novice'),
      school: msg('law-efficiency-statement-school'),
    },
    history: { people: [], role: 'associated', when: '—', story: { school: msg('law-density-story-school') }, citations: [] },
  },
  {
    id: 'boyle-mariotte',
    kind: 'law',
    name: msg('law-boyle-mariotte'),
    statement: {
      novice: msg('law-boyle-mariotte-statement-novice'),
      school: msg('law-boyle-mariotte-statement-school'),
    },
    history: {
      people: [BOYLE, MARIOTTE],
      role: 'discovered',
      when: msg('law-boyle-mariotte-history-when'),
      story: {
        school: msg('law-boyle-mariotte-story-school'),
      },
      citations: [
        { source: 'wikipedia-boyles-law', locator: 'lead', claim: 'pressure inversely proportional to the volume at constant temperature and amount of gas, in a closed system' },
        { source: 'wikipedia-boyles-law', locator: 'History', claim: 'Boyle published it in 1662; first noted by Richard Towneley and Henry Power' },
        { source: 'wikipedia-boyles-law', locator: 'History', claim: 'Mariotte discovered the same law independently of Boyle in 1679; called Mariotte’s law especially in France' },
        { source: 'wikidata', locator: 'Q43393, Q319749 (P569, P570)', claim: 'life dates (Boyle 1627 – 1691; Mariotte c. 1620 – 1684)' },
      ],
    },
    limits: {
      school: msg('law-boyle-mariotte-limits-school'),
    },
  },
  {
    id: 'torricelli-outflow',
    kind: 'law',
    name: msg('law-torricelli-outflow'),
    statement: {
      novice: msg('law-torricelli-outflow-statement-novice'),
      school: msg('law-torricelli-outflow-statement-school'),
    },
    history: {
      people: [TORRICELLI],
      role: 'discovered',
      when: msg('law-torricelli-outflow-history-when'),
      story: {
        school: msg('law-torricelli-outflow-story-school'),
      },
      citations: [
        { source: 'wikipedia-torricelli-law', locator: 'lead', claim: 'v = √(2gh), the speed a body would acquire falling freely from h' },
        { source: 'wikipedia-torricelli-law', locator: 'lead', claim: 'discovered (though not in this form) by Evangelista Torricelli in 1643; a particular case of Bernoulli’s principle' },
        { source: 'wikidata', locator: 'Q102490 (P569, P570)', claim: 'life dates (1608 – 1647)' },
      ],
    },
    limits: {
      school: msg('law-torricelli-outflow-limits-school'),
    },
  },
  {
    id: 'hagen-poiseuille',
    kind: 'law',
    name: msg('law-hagen-poiseuille'),
    statement: {
      novice: msg('law-hagen-poiseuille-statement-novice'),
      school: msg('law-hagen-poiseuille-statement-school'),
    },
    history: {
      people: [HAGEN, POISEUILLE],
      role: 'discovered',
      when: msg('law-hagen-poiseuille-history-when'),
      story: {
        school: msg('law-hagen-poiseuille-story-school'),
      },
      citations: [
        { source: 'wikipedia-hagen-poiseuille', locator: 'lead', claim: 'Δp = 8μLQ/(πR⁴) for laminar flow of an incompressible Newtonian fluid in a long round pipe' },
        { source: 'wikipedia-hagen-poiseuille', locator: 'History', claim: 'derived experimentally and independently by Poiseuille and Hagen in 1838; published by Hagen in 1839, by Poiseuille in 1840–41 and 1846; Stokes’ theoretical justification in 1845' },
        { source: 'wikipedia-reynolds-number', locator: 'Flow in a pipe', claim: 'laminar flow occurs when Re_D < 2300' },
        { source: 'wikidata', locator: 'Q62726, Q550943 (P569, P570)', claim: 'life dates (Hagen 1797 – 1884; Poiseuille 1797 – 1869)' },
      ],
    },
    limits: {
      school: msg('law-hagen-poiseuille-limits-school'),
    },
  },
  {
    id: 'compressibility',
    kind: 'definition',
    name: msg('law-compressibility'),
    statement: {
      novice: msg('law-compressibility-statement-novice'),
      school: msg('law-compressibility-statement-school'),
    },
    history: { people: [], role: 'associated', when: '—', story: { school: msg('law-compressibility-story-school') }, citations: [] },
  },
  {
    id: 'mechanical-work',
    kind: 'definition',
    name: msg('law-mechanical-work'),
    statement: {
      novice: msg('law-mechanical-work-statement-novice'),
      school: msg('law-mechanical-work-statement-school'),
    },
    history: { people: [], role: 'associated', when: '—', story: { school: msg('law-density-story-school') }, citations: [] },
  },
  {
    id: 'gear-transmission',
    kind: 'law',
    name: msg('law-gear-transmission'),
    statement: {
      novice: msg('law-gear-transmission-statement-novice'),
      school: msg('law-gear-transmission-statement-school'),
    },
    history: {
      people: [],
      role: 'associated',
      when: msg('law-gear-transmission-history-when'),
      story: { school: msg('law-gear-transmission-story-school') },
      citations: [
        { source: 'wikipedia-gear-train', locator: 'Mechanical advantage; Idler gears', claim: '|ω_A|/|ω_B| = N_B/N_A; an idler reverses the direction and does not affect the ratio' },
        { source: 'wikipedia-antikythera', locator: 'lead', claim: '2nd century BC, at least 30 bronze gears' },
      ],
    },
  },
  {
    id: 'pulley',
    kind: 'law',
    name: msg('law-pulley'),
    statement: {
      novice: msg('law-pulley-statement-novice'),
      school: msg('law-pulley-statement-school'),
    },
    history: {
      people: [ARCHIMEDES],
      role: 'associated',
      when: msg('law-pulley-history-when'),
      story: {
        school: msg('law-pulley-story-school'),
      },
      citations: [
        { source: 'wikipedia-pulley', locator: 'History', claim: 'Twelfth Dynasty Egypt; Hero of Alexandria — six simple machines; Plutarch on Archimedes and the ship' },
        { source: 'wikipedia-pulley', locator: 'Mechanical advantage', claim: 'a fixed pulley changes the direction of the force; a single movable pulley has a mechanical advantage of two; the advantage equals the number of supporting rope sections' },
      ],
    },
    limits: {
      school: msg('law-pulley-limits-school'),
    },
  },
  {
    id: 'map-scale',
    kind: 'definition',
    name: msg('law-map-scale'),
    statement: {
      novice: msg('law-map-scale-statement-novice'),
      school: msg('law-map-scale-statement-school'),
    },
    history: { people: [], role: 'associated', when: '—', story: { school: msg('law-map-scale-story-school') }, citations: [] },
  },
];
