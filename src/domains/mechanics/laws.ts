import type { LawSpec, Person } from '../../knowledge/types.js';

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
      when: 'бл. 246 р. до н. е.',
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
];
