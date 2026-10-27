import type { LawSpec, Person } from '../../knowledge/types.js';

const HOOKE: Person = { name: { uk: 'Роберт Гук', en: 'Robert Hooke' }, born: 1635, died: 1703, wikidata: 'Q46830' };
const AMONTONS: Person = { name: { uk: 'Гійом Амонтон', en: 'Guillaume Amontons' }, born: 1663, died: 1705, wikidata: 'Q368121' };
const COULOMB: Person = { name: { uk: 'Шарль Огюстен де Кулон', en: 'Charles-Augustin de Coulomb' }, born: 1736, died: 1806, wikidata: 'Q81716' };
const GALILEO: Person = { name: { uk: 'Галілео Галілей', en: 'Galileo Galilei' }, born: 1564, died: 1642, wikidata: 'Q307' };
const HUYGENS: Person = { name: { uk: 'Крістіан Гюйгенс', en: 'Christiaan Huygens' }, born: 1629, died: 1695, wikidata: 'Q39599' };
const ARCHIMEDES: Person = { name: { uk: 'Архімед', en: 'Archimedes' }, born: -287, died: -212, wikidata: 'Q8739' };
const PASCAL: Person = { name: { uk: 'Блез Паскаль', en: 'Blaise Pascal' }, born: 1623, died: 1662, wikidata: 'Q1290' };

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
  {
    id: 'average-speed',
    kind: 'definition',
    name: { uk: 'Середня швидкість', en: 'Average speed' },
    statement: {
      novice: { uk: 'Середня швидкість показує, який шлях тіло в середньому долало щосекунди — навіть якщо воно то розганялося, то гальмувало.', en: 'Average speed tells what distance a body covered each second on average — even if it sped up and slowed down.' },
      school: { uk: 'Середня швидкість нерівномірного руху — відношення всього шляху до всього часу руху: v = l/t.', en: 'The average speed of an uneven motion is the whole path over the whole time: v = l/t.' },
    },
    history: { people: [], role: 'associated', when: '—', story: { school: { uk: 'Це означення фізичної величини.', en: 'This is the definition of a physical quantity.' } }, citations: [] },
  },
  {
    id: 'period',
    kind: 'definition',
    name: { uk: 'Період і частота', en: 'Period and frequency' },
    statement: {
      novice: { uk: 'Період — час одного оберту чи одного коливання. Щоб виміряти його точніше, рахують час багатьох обертів і ділять на їхнє число.', en: 'The period is the time of one turn or one swing. To measure it better, time many turns and divide by their number.' },
      school: { uk: 'Період T = t/N — час одного оберту (коливання); частота n = N/t = 1/T — скільки обертів за секунду. Швидкість тіла на колі радіуса R: v = 2πR/T.', en: 'The period T = t/N is the time of one turn (swing); the frequency n = N/t = 1/T is how many turns a second. The speed of a body on a circle of radius R: v = 2πR/T.' },
    },
    history: { people: [], role: 'associated', when: '—', story: { school: { uk: 'Це означення фізичних величин.', en: 'These are definitions of physical quantities.' } }, citations: [] },
  },
  {
    id: 'pendulum',
    kind: 'law',
    name: { uk: 'Період коливань маятника', en: 'The period of a pendulum' },
    statement: {
      novice: { uk: 'Маятник гойдається з тим самим ритмом, широко чи вузько, з легкою чи важкою кулькою. Змінити ритм може лише довжина нитки.', en: 'A pendulum swings in the same rhythm, wide or narrow, with a light ball or a heavy one. Only the length of the thread changes the rhythm.' },
      school: { uk: 'Період малих коливань нитяного маятника не залежить від маси тягарця й амплітуди, а залежить від довжини нитки: T = 2π·√(l/g). Учетверо коротша нитка — удвічі менший період.', en: 'The period of a thread pendulum’s small swings depends on neither the mass nor the amplitude, but on the length: T = 2π·√(l/g). A thread four times shorter — half the period.' },
    },
    history: {
      people: [GALILEO, HUYGENS],
      role: 'discovered',
      when: '1602–1673',
      story: {
        school: {
          uk: 'Галілео Галілей першим дослідив маятники — від 1602 року — і помітив, що період майже не залежить від розмаху. На цьому побудовані маятникові годинники. Крістіан Гюйгенс 1673 року опублікував теорію маятника, а Данило Бернуллі 1747 року показав, як період трохи зростає за великого розмаху.',
          en: 'Galileo Galilei was the first to study pendulums — from 1602 — and noticed that the period hardly depends on the width of the swing. Pendulum clocks are built on that. Christiaan Huygens published the theory of the pendulum in 1673, and Daniel Bernoulli showed in 1747 how the period grows a little at wide swings.',
        },
      },
      citations: [
        { source: 'wikipedia-pendulum', locator: 'History', claim: 'Galileo Galilei was the first to study the properties of pendulums, beginning around 1602; isochronism' },
        { source: 'wikipedia-pendulum', locator: 'History', claim: 'In 1673 Christiaan Huygens published his theory of the pendulum, Horologium Oscillatorium' },
        { source: 'wikipedia-pendulum', locator: 'Period of oscillation', claim: 'Daniel Bernoulli (1747) corrected for the lengthening of the period at a finite angle: 1 + θ₀²/16 + …' },
        { source: 'wikidata', locator: 'Q307, Q39599 (P569, P570)', claim: 'life dates' },
      ],
    },
    limits: {
      school: { uk: 'Формула — для малих коливань (кут до ≈ 10°) і маятника, у якого кулька мала порівняно з ниткою, а нитка не розтягується; опір повітря поступово зменшує розмах.', en: 'The formula is for small swings (up to ≈ 10°) and a pendulum whose ball is small beside the thread, which does not stretch; air slowly damps the swing.' },
    },
  },
  {
    id: 'lever',
    kind: 'law',
    name: { uk: 'Умова рівноваги важеля', en: 'The law of the lever' },
    statement: {
      novice: { uk: 'Легкий вантаж далеко від осі може врівноважити важкий — близько до неї. Тому довгим ломом легко підважити камінь.', en: 'A light load far from the axis can balance a heavy one close to it. That is why a long crowbar lifts a stone easily.' },
      school: { uk: 'Важіль у рівновазі, коли моменти сил, що обертають його в протилежні боки, рівні: F₁·l₁ = F₂·l₂. Момент сили M = F·l — сила, помножена на плече (відстань від осі до лінії дії сили).', en: 'A lever is in balance when the moments turning it opposite ways are equal: F₁·l₁ = F₂·l₂. The moment M = F·l is the force times its arm (the distance from the axis to the force’s line).' },
    },
    history: {
      people: [ARCHIMEDES],
      role: 'discovered',
      when: { uk: 'III ст. до н. е.', en: '3rd century BC' },
      story: {
        school: {
          uk: 'Найдавніші записи про важелі, що збереглися, — III століття до нашої ери, і їх приписують Архімедові. Йому ж приписують слова: «Дайте мені важіль і точку опори — і я зрушу світ».',
          en: 'The earliest writings on levers that survive date from the third century BC and are ascribed to Archimedes. So are the words: “Give me a lever and a fulcrum, and I shall move the world.”',
        },
      },
      citations: [
        { source: 'wikipedia-lever', locator: 'History', claim: 'the earliest remaining writings on levers date from the third century BC and were, by common belief, by Archimedes' },
        { source: 'wikipedia-lever', locator: 'History', claim: '“Give me a lever (long enough and a fulcrum on which to place it), and I shall move the world.”' },
        { source: 'wikipedia-lever', locator: 'Law of the lever', claim: 'the balance of moments about the fulcrum: F₁a = F₂b' },
      ],
    },
    limits: {
      school: { uk: 'Так — для важеля, що сам урівноважений (його вага не обертає його) і в якого сили діють перпендикулярно до нього; тертя в осі мале.', en: 'This holds for a lever that is balanced by itself (its own weight does not turn it), with the forces perpendicular to it and little friction at the axis.' },
    },
  },
  {
    id: 'pascal',
    kind: 'law',
    name: { uk: 'Закон Паскаля', en: 'Pascal’s law' },
    statement: {
      novice: { uk: 'Натисни на рідину в закритій посудині — і цей натиск відчує кожна її частинка, в усіх напрямках однаково.', en: 'Press on a liquid in a closed vessel — and every bit of it feels that push, equally in all directions.' },
      school: { uk: 'Тиск, створений на рідину чи газ у закритій посудині, передається в кожну їхню точку без змін. Тому в гідравлічній машині тиски під поршнями рівні: F₁/S₁ = F₂/S₂ — на більший поршень діє у стільки разів більша сила, у скільки разів більша його площа.', en: 'A pressure applied to a liquid or a gas in a closed vessel is passed on unchanged to every point of it. So in a hydraulic machine the pressures under the pistons are equal: F₁/S₁ = F₂/S₂ — the larger piston gets as many times more force as its area is larger.' },
    },
    history: {
      people: [PASCAL],
      role: 'discovered',
      when: { uk: '1653 (надруковано 1663)', en: '1653 (published 1663)' },
      story: {
        school: {
          uk: 'Французький математик і фізик Блез Паскаль сформулював цей закон 1653 року, а надрукували його працю 1663-го, уже після його смерті. На законі Паскаля працює гідравлічний прес.',
          en: 'The French mathematician and physicist Blaise Pascal stated this law in 1653; his work was printed in 1663, after his death. The hydraulic press works by Pascal’s law.',
        },
      },
      citations: [
        { source: 'wikipedia-pascal-law', locator: 'lead', claim: 'established by French mathematician Blaise Pascal in 1653 and published in 1663' },
        { source: 'wikipedia-pascal-law', locator: 'lead', claim: 'a pressure change at any point in a confined incompressible fluid is transmitted throughout the fluid' },
        { source: 'wikipedia-pascal-law', locator: 'Applications', claim: 'Pascal’s principle underlies the operation of the hydraulic press; F₂/F₁ = A₂/A₁' },
      ],
    },
    limits: {
      school: { uk: 'Так — для рідини, що стоїть (тиск її власної ваги тут додається окремо, ρ·g·h), і для поршнів без тертя: у справжніх шприцах частина сили йде на тертя.', en: 'So — for a liquid at rest (the pressure of its own weight adds separately, ρ·g·h) and for pistons without friction: in real syringes some of the force goes into friction.' },
    },
  },
  {
    id: 'efficiency',
    kind: 'definition',
    name: { uk: 'Коефіцієнт корисної дії', en: 'Efficiency' },
    statement: {
      novice: { uk: 'Жоден механізм не віддає всієї роботи, яку в нього вклали: частина йде на тертя. ККД показує, яка частка — корисна.', en: 'No machine gives back all the work put into it: part goes into friction. The efficiency tells what share is useful.' },
      school: { uk: 'ККД — відношення корисної роботи до повної (затраченої): η = A_к / A_п · 100 %. Він завжди менший за 100 %.', en: 'Efficiency is the useful work over the total work done: η = A_useful / A_done · 100 %. It is always below 100 %.' },
    },
    history: { people: [], role: 'associated', when: '—', story: { school: { uk: 'Це означення фізичної величини.', en: 'This is the definition of a physical quantity.' } }, citations: [] },
  },
];
