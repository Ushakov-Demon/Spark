import type { LawSpec, Person } from '../../knowledge/types.js';

const HOOKE: Person = { name: { uk: 'Роберт Гук', en: 'Robert Hooke' }, born: 1635, died: 1703, wikidata: 'Q46830' };
const AMONTONS: Person = { name: { uk: 'Гійом Амонтон', en: 'Guillaume Amontons' }, born: 1663, died: 1705, wikidata: 'Q368121' };
const COULOMB: Person = { name: { uk: 'Шарль Огюстен де Кулон', en: 'Charles-Augustin de Coulomb' }, born: 1736, died: 1806, wikidata: 'Q81716' };
const ARCHIMEDES: Person = { name: { uk: 'Архімед', en: 'Archimedes' }, born: -287, died: -212, wikidata: 'Q8739' };

/**
 * Laws behind the mechanics formulas (bodies at rest in a liquid). Texts follow
 * docs/CONTENT_STYLE.md; every historical claim is backed by `history.citations`.
 */
export const MECHANICS_LAWS: readonly LawSpec[] = [
  {
    id: 'density',
    kind: 'definition',
    name: { uk: 'Густина речовини', en: 'Density' },
    statement: {
      novice: {
        uk: 'Густина показує, скільки важить шматочок речовини певного розміру. Залізний кубик важчий за дерев’яний такого самого розміру — у заліза більша густина.',
        en: 'Density tells how much a piece of a substance of a certain size weighs. An iron cube is heavier than a wooden one of the same size — iron is denser.',
      },
      school: {
        uk: 'Густина — маса речовини в одиниці об’єму: ρ = m/V. Її вимірюють у кг/м³ або г/см³; 1 г/см³ = 1000 кг/м³ (густина води).',
        en: 'Density is the mass of a substance per unit volume: ρ = m/V, in kg/m³ or g/cm³; 1 g/cm³ = 1000 kg/m³ (the density of water).',
      },
    },
    history: { people: [], role: 'associated', when: '—', story: { school: { uk: 'Це означення фізичної величини.', en: 'This is the definition of a physical quantity.' } }, citations: [] },
  },
  {
    id: 'weight',
    kind: 'definition',
    name: { uk: 'Вага тіла', en: 'Weight' },
    statement: {
      novice: {
        uk: 'Вага — це сила, з якою тіло тисне на опору чи тягне підвіс, бо його притягує Земля.',
        en: 'Weight is the force with which a body presses on a support or pulls on a hook, because the Earth attracts it.',
      },
      school: {
        uk: 'Тіло, що спочиває на опорі чи підвісі, діє на них із силою P = m·g, де g ≈ 9,8 Н/кг. Її вимірюють динамометром.',
        en: 'A body at rest on a support or a hook acts on it with the force P = m·g, where g ≈ 9.8 N/kg. A dynamometer measures it.',
      },
    },
    history: { people: [], role: 'associated', when: '—', story: { school: { uk: 'Це означення фізичної величини.', en: 'This is the definition of a physical quantity.' } }, citations: [] },
  },
  {
    id: 'archimedes',
    kind: 'law',
    name: { uk: 'Закон Архімеда', en: 'Archimedes’ principle' },
    statement: {
      novice: {
        uk: 'Вода виштовхує вгору все, що в неї занурили. Тому в басейні легко підняти друга, а камінь у воді здається легшим.',
        en: 'Water pushes up on anything put into it. That is why it is easy to lift a friend in a pool, and a stone feels lighter in water.',
      },
      school: {
        uk: 'На тіло, занурене в рідину, діє виштовхувальна сила, що дорівнює вазі рідини в об’ємі зануреної частини тіла: F = ρ·g·V. Якщо вона більша за вагу тіла — тіло спливає, якщо менша — тоне.',
        en: 'A body in a liquid is pushed up by a force equal to the weight of the liquid in the volume of its submerged part: F = ρ·g·V. If it is larger than the body’s weight, the body floats up; if smaller, it sinks.',
      },
    },
    history: {
      people: [ARCHIMEDES],
      role: 'discovered',
      when: { uk: 'бл. 246 р. до н. е.', en: 'c. 246 BC' },
      work: 'Про плаваючі тіла (On Floating Bodies)',
      story: {
        school: {
          uk: 'Давньогрецький учений Архімед із Сиракуз сформулював цей закон у творі «Про плаваючі тіла» близько 246 року до нашої ери. Існує відома легенда: він вигукнув «Еврика!», коли збагнув, як перевірити, чи з чистого золота корона, — але в цій історії він лише вимірював об’єм корони витісненою водою.',
          en: 'The ancient Greek scholar Archimedes of Syracuse stated this principle in his work On Floating Bodies around 246 BC. A famous tale says he cried “Eureka!” when he saw how to check whether a crown was pure gold — but in that story he only measured the crown’s volume by the water it displaced.',
        },
      },
      citations: [
        { source: 'wikipedia-archimedes-principle', locator: 'Lead / History', claim: 'stated in On Floating Bodies, c. 246 BC' },
        { source: 'wikipedia-archimedes-principle', locator: 'History', claim: 'the widespread tale of “Eureka” and the gold crown: he measured its volume by the displaced water' },
        { source: 'wikidata', locator: 'Q8739 (P569, P570)', claim: 'life dates (c. 287 – 212 BC)' },
      ],
    },
    limits: {
      school: {
        uk: 'Закон справедливий для тіла в рідині чи газі, що перебуває в спокої. Він не враховує поверхневий натяг: легка голка може лежати на воді, хоча густіша за неї.',
        en: 'It holds for a body at rest in a liquid or a gas. It ignores surface tension: a light needle can lie on water although it is denser.',
      },
    },
  },
  {
    id: 'hooke',
    kind: 'law',
    name: { uk: 'Закон Гука', en: 'Hooke’s law' },
    statement: {
      novice: { uk: 'Пружина розтягується тим більше, чим сильніше її тягнуть.', en: 'A spring stretches the more, the harder it is pulled.' },
      school: { uk: 'Сила пружності, що виникає під час пружної деформації тіла, прямо пропорційна його видовженню: F = k·x, де k — жорсткість тіла.', en: 'The elastic force arising in an elastic deformation is directly proportional to the extension: F = k·x, where k is the stiffness of the body.' },
    },
    history: {
      people: [HOOKE],
      role: 'discovered',
      when: '1676–1678',
      story: {
        school: {
          uk: 'Англійський учений Роберт Гук 1676 року записав свій закон латинською анаграмою — зашифрованим рядком літер, щоб ніхто не присвоїв відкриття. Розгадку він оприлюднив 1678 року: «ut tensio, sic vis» — «яке видовження, така й сила».',
          en: 'The English scientist Robert Hooke wrote his law down in 1676 as a Latin anagram — a scrambled row of letters, so that no one could claim the discovery. He published the solution in 1678: “ut tensio, sic vis” — “as the extension, so the force”.',
        },
      },
      citations: [
        { source: 'wikipedia-hookes-law', locator: 'History', claim: 'He first stated the law in 1676 as a Latin anagram' },
        { source: 'wikipedia-hookes-law', locator: 'History', claim: 'He published the solution of his anagram in 1678 as: ut tensio, sic vis ("as the extension, so the force")' },
        { source: 'wikidata', locator: 'Q46830 (P569, P570)', claim: 'life dates' },
      ],
    },
    limits: {
      school: { uk: 'Лише для пружних деформацій: якщо тіло розтягнути надто сильно, воно вже не повертається до початкової довжини, і закон не діє.', en: 'Only for elastic deformations: stretched too far, a body no longer returns to its length, and the law stops holding.' },
    },
  },
  {
    id: 'friction',
    kind: 'law',
    name: { uk: 'Закон тертя Амонтона — Кулона', en: 'Amontons–Coulomb law of friction' },
    statement: {
      novice: { uk: 'Що сильніше тіло притиснуте до опори, то більша сила тертя.', en: 'The harder a body is pressed to its support, the larger the friction.' },
      school: { uk: 'Сила тертя ковзання прямо пропорційна силі нормальної реакції опори: F = μ·N — і не залежить від площі, якою тіло торкається опори.', en: 'The force of sliding friction is directly proportional to the normal force: F = μ·N — and does not depend on the area with which the body touches its support.' },
    },
    history: {
      people: [AMONTONS, COULOMB],
      role: 'discovered',
      when: '1699–1785',
      story: {
        school: {
          uk: 'Леонардо да Вінчі описав ці закономірності ще 1493 року, але його записи лишилися невідомими. Заново їх відкрив французький фізик Гійом Амонтон 1699 року, а Шарль Кулон 1785 року дослідив тертя глибше.',
          en: 'Leonardo da Vinci described these rules as early as 1493, but his notes stayed unknown. The French physicist Guillaume Amontons rediscovered them in 1699, and Charles Coulomb studied friction further in 1785.',
        },
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
      school: { uk: 'Це наближений закон: μ залежить від стану поверхонь (мокрі, змащені, відшліфовані), а на дуже гладких чи дуже м’яких поверхнях пропорційність порушується.', en: 'It is an approximate law: μ depends on the state of the surfaces (wet, oiled, polished), and on very smooth or very soft surfaces the proportionality breaks down.' },
    },
  },
  {
    id: 'pressure',
    kind: 'definition',
    name: { uk: 'Тиск', en: 'Pressure' },
    statement: {
      novice: { uk: 'Тиск показує, як сильно тіло тисне на кожен шматочок опори.', en: 'Pressure shows how hard a body presses on each bit of its support.' },
      school: { uk: 'Тиск — фізична величина, що дорівнює відношенню сили, яка діє перпендикулярно до поверхні, до площі цієї поверхні: p = F/S. Одиниця — паскаль (1 Па = 1 Н/м²).', en: 'Pressure is the force acting perpendicular to a surface divided by the area of that surface: p = F/S. Its unit is the pascal (1 Pa = 1 N/m²).' },
    },
    history: { people: [], role: 'associated', when: '—', story: { school: { uk: 'Це означення фізичної величини.', en: 'This is the definition of a physical quantity.' } }, citations: [] },
  },
];
