import type { LawSpec, Person } from '../../knowledge/types.js';

const OHM: Person = { name: { uk: 'Георг Симон Ом', en: 'Georg Simon Ohm' }, born: 1789, died: 1854, wikidata: 'Q1585' };
const JOULE: Person = { name: { uk: 'Джеймс Прескотт Джоуль', en: 'James Prescott Joule' }, born: 1818, died: 1889, wikidata: 'Q8962' };
const KIRCHHOFF: Person = { name: { uk: 'Густав Кірхгоф', en: 'Gustav Kirchhoff' }, born: 1824, died: 1887, wikidata: 'Q76508' };
const LENZ: Person = { name: { uk: 'Генріх (Емілій) Ленц', en: 'Heinrich (Emil) Lenz' }, born: 1804, died: 1865, wikidata: 'Q154325' };
const FARADAY: Person = { name: { uk: 'Майкл Фарадей', en: 'Michael Faraday' }, born: 1791, died: 1867, wikidata: 'Q8750' };

/**
 * Laws behind the electrical formulas. Texts follow docs/CONTENT_STYLE.md;
 * every historical claim is backed by `history.citations`.
 */
export const ELECTRICAL_LAWS: readonly LawSpec[] = [
  {
    id: 'resistance',
    kind: 'definition',
    name: { uk: 'Електричний опір', en: 'Electrical resistance' },
    statement: {
      novice: {
        uk: 'Опір показує, як сильно речовина «заважає» струму. Метал майже не заважає, солона вода — трохи, чиста вода й олія — дуже сильно.',
        en: 'Resistance shows how much a material “gets in the way” of a current. A metal hardly does, salt water a little, pure water and oil a lot.',
      },
      school: {
        uk: 'Опір провідника R = ρ·L/S: що довший провідник і що менша площа його перерізу, то більший опір; ρ — питомий опір речовини.',
        en: 'The resistance of a conductor is R = ρ·L/S: the longer the conductor and the smaller its cross-section, the larger the resistance; ρ is the resistivity of the material.',
      },
    },
    history: {
      people: [],
      role: 'associated',
      when: '—',
      story: { school: { uk: 'Це означення фізичної величини; одиницю опору назвали на честь Георга Ома.', en: 'This is the definition of a physical quantity; its unit is named after Georg Ohm.' } },
      citations: [],
    },
  },
  {
    id: 'ohm',
    kind: 'law',
    name: { uk: 'Закон Ома', en: 'Ohm’s law' },
    statement: {
      novice: {
        uk: 'Що більша напруга, то більший струм. Що більший опір, то струм менший.',
        en: 'The higher the voltage, the larger the current. The higher the resistance, the smaller the current.',
      },
      school: {
        uk: 'Сила струму на ділянці кола прямо пропорційна напрузі на її кінцях і обернено пропорційна її опору: I = U/R.',
        en: 'The current in a section of a circuit is proportional to the voltage across it and inversely proportional to its resistance: I = U/R.',
      },
    },
    history: {
      people: [OHM],
      role: 'discovered',
      when: '1827',
      work: 'Die galvanische Kette, mathematisch bearbeitet',
      story: {
        school: {
          uk: 'Німецький учитель фізики Георг Ом замикав коло дротами різної довжини, товщини й матеріалу і вимірював струм. У 1827 році він виклав результати в книжці «Гальванічне коло, досліджене математично». Критики спершу зустріли її вороже — визнання прийшло лише в 1840-х.',
          en: 'The German physics teacher Georg Ohm closed a circuit with wires of different length, thickness and material and measured the current. In 1827 he published the results in the book “The galvanic circuit investigated mathematically”. Critics at first met it with hostility — recognition came only in the 1840s.',
        },
        advanced: {
          uk: 'Ще в 1781 році Генрі Кавендіш, досліджуючи скляні трубки із соляним розчином, дійшов подібного висновку, але його записи опублікував Максвелл лише в 1879 році.',
          en: 'As early as 1781 Henry Cavendish, experimenting with glass tubes of salt solution, came to a similar conclusion, but his notes were published by Maxwell only in 1879.',
        },
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
      school: {
        uk: 'Для рідини під струмом закон Ома трохи ускладнюється: частина напруги йде на розклад рідини, а від нагрівання її опір зменшується.',
        en: 'For a liquid under current Ohm’s law gets a little more complex: part of the voltage goes into splitting the liquid, and heating lowers its resistance.',
      },
      advanced: {
        uk: 'Закон Ома виконується для металів і розчинів за сталої температури. У рідині під струмом додається напруга розкладу, а від нагрівання опір змінюється.',
        en: 'Ohm’s law holds for metals and solutions at constant temperature. In a liquid under current a decomposition voltage adds up, and heating changes the resistance.',
      },
    },
  },
  {
    id: 'joule-lenz',
    kind: 'law',
    name: { uk: 'Закон Джоуля–Ленца', en: 'Joule–Lenz law' },
    statement: {
      novice: {
        uk: 'Струм нагріває провідник. Що більший струм і що довше він іде, то більше теплоти.',
        en: 'A current heats the conductor. The larger the current and the longer it flows, the more heat.',
      },
      school: {
        uk: 'Кількість теплоти, що виділяє струм у провіднику, дорівнює добутку квадрата сили струму, опору провідника й часу: Q = I²·R·t.',
        en: 'The heat a current releases in a conductor equals the square of the current times the resistance times the time: Q = I²·R·t.',
      },
    },
    history: {
      people: [JOULE, LENZ],
      role: 'discovered',
      when: '1840–1842',
      story: {
        school: {
          uk: 'Англійський фізик Джеймс Джоуль уперше опублікував цей закон у грудні 1840 року. Незалежно від нього в 1842 році нагрівання провідників струмом дослідив балтійський німецький фізик Генріх Ленц — тому закон називають на честь обох.',
          en: 'The English physicist James Joule first published this law in December 1840. Independently, in 1842, the Baltic German physicist Heinrich Lenz studied how currents heat conductors — that is why the law is named after both.',
        },
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
    name: { uk: 'Закон Фарадея для електролізу', en: 'Faraday’s law of electrolysis' },
    statement: {
      novice: {
        uk: 'Струм може розкладати рідини. Що більше заряду пройшло, то більше речовини виділилося на електродах.',
        en: 'A current can split liquids. The more charge passes, the more substance forms at the electrodes.',
      },
      school: {
        uk: 'Маса речовини, що виділилася на електроді під час електролізу, прямо пропорційна заряду, який пройшов через електроліт: m = k·q.',
        en: 'The mass of a substance released at an electrode in electrolysis is proportional to the charge passed through the electrolyte: m = k·q.',
      },
    },
    history: {
      people: [FARADAY],
      role: 'discovered',
      when: '1833–1834',
      story: {
        school: {
          uk: 'Майкл Фарадей опублікував закони електролізу в 1833–1834 роках. Він же ввів слова, якими ми користуємося досі: електроліз, електрод, електроліт, анод, катод, аніон і катіон. А розкласти воду струмом на водень і кисень уперше вдалося Ніколсону й Карлайлу ще в 1800 році.',
          en: 'Michael Faraday published the laws of electrolysis in 1833–1834. He also introduced the words we still use: electrolysis, electrode, electrolyte, anode, cathode, anion and cation. Splitting water by current into hydrogen and oxygen was first achieved by Nicholson and Carlisle back in 1800.',
        },
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
    name: { uk: 'Послідовне з’єднання провідників', en: 'Conductors in series' },
    statement: {
      novice: { uk: 'Провідники одне за одним: струм у них той самий, а напруга джерела ділиться між ними.', en: 'Conductors one after another: the same current in them, the source’s voltage shared between them.' },
      school: { uk: 'За послідовного з’єднання сила струму однакова в усіх провідниках: I = I₁ = I₂; загальна напруга дорівнює сумі напруг: U = U₁ + U₂; загальний опір — сумі опорів: R = R₁ + R₂.', en: 'In series the current is the same in all conductors: I = I₁ = I₂; the total voltage is the sum: U = U₁ + U₂; the total resistance is the sum: R = R₁ + R₂.' },
    },
    history: {
      people: [KIRCHHOFF],
      role: 'discovered',
      when: '1845',
      story: { school: { uk: 'Ці правила — наслідки законів, які 1845 року сформулював німецький фізик Густав Кірхгоф: скільки струму входить у вузол кола, стільки й виходить; а напруги вздовж замкненого контуру в сумі дорівнюють напрузі джерела.', en: 'These rules follow from the laws the German physicist Gustav Kirchhoff stated in 1845: as much current as flows into a junction flows out; and the voltages around a closed loop add up to the source’s.' } },
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
    name: { uk: 'Паралельне з’єднання провідників', en: 'Conductors in parallel' },
    statement: {
      novice: { uk: 'Провідники поруч, кожен — своєю гілкою: напруга на них та сама, а струм розгалужується.', en: 'Conductors side by side, each on its own branch: the same voltage across them, the current splits.' },
      school: { uk: 'За паралельного з’єднання напруга однакова на всіх провідниках: U = U₁ = U₂; сила струму в нерозгалуженій частині дорівнює сумі струмів у гілках: I = I₁ + I₂; загальний опір: 1/R = 1/R₁ + 1/R₂ — менший за найменший із них.', en: 'In parallel the voltage is the same across all conductors: U = U₁ = U₂; the current in the main line is the sum of the branch currents: I = I₁ + I₂; the total resistance: 1/R = 1/R₁ + 1/R₂ — less than the smallest of them.' },
    },
    history: {
      people: [KIRCHHOFF],
      role: 'discovered',
      when: '1845',
      story: { school: { uk: 'Ці правила — наслідки законів, які 1845 року сформулював німецький фізик Густав Кірхгоф: скільки струму входить у вузол кола, стільки й виходить; а напруги вздовж замкненого контуру в сумі дорівнюють напрузі джерела.', en: 'These rules follow from the laws the German physicist Gustav Kirchhoff stated in 1845: as much current as flows into a junction flows out; and the voltages around a closed loop add up to the source’s.' } },
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
    name: { uk: 'Потужність електричного струму', en: 'Electric power' },
    statement: {
      novice: { uk: 'Потужність показує, скільки енергії прилад бере від струму щосекунди.', en: 'Power tells how much energy a device takes from the current each second.' },
      school: { uk: 'Потужність споживача P = U·I — добуток напруги на ньому й сили струму в ньому; вимірюють у ватах (1 Вт = 1 В·А). Для резистора, за законом Ома, P = I²·R = U²/R.', en: 'A consumer’s power P = U·I — the voltage across it times the current in it, in watts (1 W = 1 V·A). For a resistor, by Ohm’s law, P = I²·R = U²/R.' },
    },
    history: { people: [], role: 'associated', when: '—', story: { school: { uk: 'Це означення фізичної величини.', en: 'This is the definition of a quantity.' } }, citations: [] },
  },
];
