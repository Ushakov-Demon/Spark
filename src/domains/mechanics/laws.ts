import type { LawSpec, Person } from '../../knowledge/types.js';

const HOOKE: Person = { name: { uk: 'Роберт Гук', en: 'Robert Hooke' }, born: 1635, died: 1703, wikidata: 'Q46830' };
const AMONTONS: Person = { name: { uk: 'Гійом Амонтон', en: 'Guillaume Amontons' }, born: 1663, died: 1705, wikidata: 'Q368121' };
const COULOMB: Person = { name: { uk: 'Шарль Огюстен де Кулон', en: 'Charles-Augustin de Coulomb' }, born: 1736, died: 1806, wikidata: 'Q81716' };
const GALILEO: Person = { name: { uk: 'Галілео Галілей', en: 'Galileo Galilei' }, born: 1564, died: 1642, wikidata: 'Q307' };
const HUYGENS: Person = { name: { uk: 'Крістіан Гюйгенс', en: 'Christiaan Huygens' }, born: 1629, died: 1695, wikidata: 'Q39599' };
const ARCHIMEDES: Person = { name: { uk: 'Архімед', en: 'Archimedes' }, born: -287, died: -212, wikidata: 'Q8739' };
const TORRICELLI: Person = { name: { uk: 'Еванджеліста Торрічеллі', en: 'Evangelista Torricelli' }, born: 1608, died: 1647, wikidata: 'Q102490' };
const STEVIN: Person = { name: { uk: 'Симон Стевін', en: 'Simon Stevin' }, born: 1548, died: 1620, wikidata: 'Q23696' };
const KEPLER: Person = { name: { uk: 'Йоганн Кеплер', en: 'Johannes Kepler' }, born: 1571, died: 1630, wikidata: 'Q8963' };
const BOYLE: Person = { name: { uk: 'Роберт Бойль', en: 'Robert Boyle' }, born: 1627, died: 1691, wikidata: 'Q43393' };
const MARIOTTE: Person = { name: { uk: 'Едм Маріотт', en: 'Edme Mariotte' }, born: 1620, died: 1684, wikidata: 'Q319749' };
const HAGEN: Person = { name: { uk: 'Готтгільф Гаген', en: 'Gotthilf Hagen' }, born: 1797, died: 1884, wikidata: 'Q62726' };
const POISEUILLE: Person = { name: { uk: 'Жан Леонар Марі Пуазейль', en: 'Jean Léonard Marie Poiseuille' }, born: 1797, died: 1869, wikidata: 'Q550943' };
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
    id: 'uniform-motion',
    kind: 'definition',
    name: { uk: 'Рівномірний рух. Швидкість', en: 'Uniform motion. Speed' },
    statement: {
      novice: { uk: 'Тіло рухається рівномірно, якщо за однакові проміжки часу проходить однаковий шлях.', en: 'A body moves uniformly if it covers the same path in equal stretches of time.' },
      school: { uk: 'Рівномірний прямолінійний рух — рух, під час якого тіло за будь-які рівні інтервали часу здійснює однакові переміщення. Його швидкість v = l/t стала, а шлях l = v·t пропорційний часу.', en: 'Uniform straight-line motion is motion in which a body makes equal displacements in any equal intervals of time. Its speed v = l/t is constant, and the path l = v·t is proportional to the time.' },
    },
    history: { people: [], role: 'associated', when: '—', story: { school: { uk: 'Це означення фізичних величин.', en: 'These are definitions of physical quantities.' } }, citations: [] },
  },
  {
    id: 'row-method',
    kind: 'definition',
    name: { uk: 'Метод рядів', en: 'The method of rows' },
    statement: {
      novice: { uk: 'Щоб виміряти щось дуже мале, беруть багато однакових тіл, складають у ряд, вимірюють увесь ряд і ділять на їх кількість.', en: 'To measure something very small, take many alike, lay them in a row, measure the whole row and divide by how many.' },
      school: { uk: 'Розмір малого тіла d = L/N, де L — довжина ряду з N тіл (ширина намотки з N витків). Похибка вимірювання ряду ділиться на N: що довший ряд, то точніший результат.', en: 'A small body’s size d = L/N, where L is the length of a row of N bodies (the width of a winding of N turns). The row’s measuring error is divided by N: the longer the row, the better the result.' },
    },
    history: { people: [], role: 'associated', when: '—', story: { school: { uk: 'Це спосіб вимірювання.', en: 'This is a way of measuring.' } }, citations: [] },
  },
  {
    id: 'turning-and-straight',
    kind: 'definition',
    name: { uk: 'Перетворення прямолінійного руху на обертальний', en: 'Straight motion into turning' },
    statement: {
      novice: { uk: 'Нитка на котушці, ворот колодязя, рейка й шестірня перетворюють рух уздовж прямої на обертання — і навпаки.', en: 'A thread on a spool, a well’s windlass, a rack and pinion turn motion along a line into turning — and back.' },
      school: { uk: 'Коли нитка змотується з котушки без проковзування, за кожен оберт вона проходить довжину кола котушки: l = π·d·n. Що менший діаметр, то більше обертів на ту саму довжину.', en: 'When a thread unwinds from a spool without slipping, each turn moves it by the spool’s circumference: l = π·d·n. The smaller the diameter, the more turns for the same length.' },
    },
    history: { people: [], role: 'associated', when: '—', story: { school: { uk: 'Це спосіб будови механізмів.', en: 'This is a way of building mechanisms.' } }, citations: [] },
  },
  {
    id: 'kepler-third',
    kind: 'law',
    name: { uk: 'Третій закон Кеплера', en: 'Kepler’s third law' },
    statement: {
      novice: { uk: 'Що далі планета від Сонця, то довше вона обходить свою орбіту — і не просто довше, а за точним правилом.', en: 'The further a planet is from the Sun, the longer it takes to go round — and not just longer, but by an exact rule.' },
      school: { uk: 'Квадрат періоду обертання планети, поділений на куб її відстані від Сонця, однаковий для всіх планет: T²/a³ = const. У роках і відстанях Землі (астрономічних одиницях) ця стала дорівнює 1.', en: 'The square of a planet’s period divided by the cube of its distance from the Sun is the same for all the planets: T²/a³ = const. In the Earth’s years and distances (astronomical units) the constant is 1.' },
    },
    history: {
      people: [KEPLER],
      role: 'discovered',
      when: { uk: '1619', en: '1619' },
      work: 'Harmonice Mundi (Гармонія світу)',
      story: { school: { uk: 'Йоганн Кеплер знайшов це правило, перебираючи спостереження планет, і опублікував його 1619 року в книзі «Гармонія світу» (Harmonice Mundi). Чому воно таке, пояснив лише закон всесвітнього тяжіння.', en: 'Johannes Kepler found the rule sifting through observations of the planets and published it in 1619 in his book Harmonice Mundi. Why it holds was explained only by the law of universal gravitation.' } },
      citations: [
        { source: 'wikipedia-kepler-laws', locator: 'Lead / Third law', claim: 'published in 1619 in Harmonice Mundi; T²/a³ the same for all objects orbiting the same primary' },
        { source: 'wikidata', locator: 'Q8963 (P569, P570)', claim: 'life dates (1571 – 1630)' },
      ],
    },
  },
  {
    id: 'sun-and-time',
    kind: 'definition',
    name: { uk: 'Видимий рух Сонця й лік часу', en: 'The Sun’s apparent motion and the keeping of time' },
    statement: {
      novice: { uk: 'Земля обертається, тож Сонце за добу обходить небо; опівдні воно на півдні й найвище, а тінь — найкоротша.', en: 'The Earth turns, so the Sun goes round the sky in a day; at noon it is due south and highest, and shadows are shortest.' },
      school: { uk: 'Земля обертається на 360° за 24 год — на 1° за 4 хв. Справжній полудень у кожному меридіані свій; годинники країни йдуть за одним (київський час — 30° сх. д.), тож полудень за годинником зсунутий на 4 хв на кожен градус довготи, плюс рівняння часу. Висота полуденного Сонця залежить від широти: φ = 90° − h + δ.', en: 'The Earth turns 360° in 24 h — 1° in 4 min. Each meridian has its own true noon; a country’s clocks keep one (Kyiv time — 30° E), so noon by the clock is shifted 4 min per degree of longitude, plus the equation of time. The noon Sun’s height depends on the latitude: φ = 90° − h + δ.' },
    },
    history: { people: [], role: 'associated', when: '—', story: { school: { uk: 'Гномон — один із найдавніших астрономічних приладів: за його тінню знаходили полудень, пори року й широту.', en: 'The gnomon is one of the oldest astronomical instruments: by its shadow noon, the seasons and the latitude were found.' } }, citations: [] },
  },
  {
    id: 'mechanical-energy',
    kind: 'definition',
    name: { uk: 'Механічна енергія та її перетворення', en: 'Mechanical energy and how it changes form' },
    statement: {
      novice: { uk: 'Підняте тіло має енергію через висоту (потенціальну), а рухоме — через швидкість (кінетичну). Падаючи, тіло міняє одну на іншу.', en: 'A raised body has energy because of its height (potential), a moving one because of its speed (kinetic). Falling, a body trades one for the other.' },
      school: { uk: 'Механічна енергія — сума потенціальної (Eп = m·g·h для піднятого тіла) і кінетичної енергій. Без тертя й ударів вона не змінюється — лише переходить з одного виду в інший. Під час непружного удару чи тертя частина її стає внутрішньою енергією: тіла нагріваються. Повна енергія при цьому зберігається.', en: 'Mechanical energy is the sum of potential (Eₚ = m·g·h for a raised body) and kinetic energy. With no friction and no impacts it stays the same — it only changes form. In an inelastic impact or with friction part of it becomes internal energy: the bodies warm up. The total energy is kept.' },
    },
    history: { people: [], role: 'associated', when: '—', story: { school: { uk: 'Це означення фізичних величин.', en: 'These are definitions of physical quantities.' } }, citations: [] },
  },
  {
    id: 'adding-forces',
    kind: 'definition',
    name: { uk: 'Додавання сил. Рівнодійна', en: 'Adding forces. The resultant' },
    statement: {
      novice: { uk: 'Кілька сил, що діють на тіло, можна замінити однією — рівнодійною. В один бік сили додаються, у протилежні — віднімаються.', en: 'Several forces on a body can be replaced by one — the resultant. The same way the forces add, opposite ways they subtract.' },
      school: { uk: 'Рівнодійна — сила, яка здійснює на тіло таку саму дію, як кілька сил, що діють одночасно. Для двох сил уздовж однієї прямої: в один бік R = F₁ + F₂, у протилежні R = F₁ − F₂ (у бік більшої). Якщо тіло в спокої, рівнодійна всіх сил на нього дорівнює нулю.', en: 'The resultant is the force that does to a body what several forces acting at once do. For two forces along one line: the same way R = F₁ + F₂, opposite ways R = F₁ − F₂ (towards the larger). If the body is at rest, the resultant of all the forces on it is zero.' },
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
    id: 'hydrostatic-paradox',
    kind: 'law',
    name: { uk: 'Гідростатичний парадокс', en: 'The hydrostatic paradox' },
    statement: {
      novice: { uk: 'Вода тисне на дно лише залежно від того, яка вона заввишки, — а не від того, скільки її в посудині.', en: 'Water presses on the bottom only by how high it stands — not by how much of it is in the vessel.' },
      school: { uk: 'Сила тиску рідини на дно F = ρ·g·h·S залежить від висоти рідини й площі дна, але не від форми посудини. Тож у посудині, що розширюється догори, вона менша за вагу рідини (решту тримають стінки), а в тій, що звужується, — більша (стінки самі тиснуть на рідину вниз).', en: 'The force of a liquid on the bottom, F = ρ·g·h·S, depends on the liquid’s height and the bottom’s area, not on the vessel’s shape. So in a vessel widening upwards it is less than the liquid’s weight (the walls hold the rest), and in a narrowing one more (the walls themselves press the liquid down).' },
    },
    history: {
      people: [STEVIN],
      role: 'discovered',
      when: { uk: 'кінець XVI ст. (праця про гідростатику — 1586)', en: 'the late 16th century (his work on hydrostatics — 1586)' },
      story: {
        school: {
          uk: 'Фламандський математик та інженер Симон Стевін відкрив, що тиск у рідині не залежить від форми посудини й площі дна, а лише від висоти рідини. 1586 року вийшла його праця про гідростатику «Основи ваги води».',
          en: 'The Flemish mathematician and engineer Simon Stevin found that the pressure in a liquid depends not on the vessel’s shape or the bottom’s area but only on the liquid’s height. His work on hydrostatics, «The Principles of the Weight of Water», came out in 1586.',
        },
      },
      citations: [
        { source: 'wikipedia-stevin', locator: 'Mechanics', claim: 'Stevin discovered the hydrostatic paradox: the pressure in a liquid is independent of the shape of the vessel and the area of the base, but depends solely on its height' },
        { source: 'wikipedia-stevin', locator: 'Publications', claim: 'De Beghinselen des Waterwichts (Principles on the weight of water), 1586, on hydrostatics' },
      ],
    },
    limits: {
      school: { uk: 'Так — для рідини, що стоїть; тиск повітря над нею додається однаково до всіх посудин.', en: 'So — for a liquid at rest; the air’s pressure above it adds alike in all the vessels.' },
    },
  },
  {
    id: 'atmospheric-pressure',
    kind: 'law',
    name: { uk: 'Атмосферний тиск', en: 'Atmospheric pressure' },
    statement: {
      novice: { uk: 'Повітря має вагу й тисне на все довкола — на нас, на стіл, на поршень шприца — з усіх боків.', en: 'Air has weight and presses on everything around — on us, the table, a syringe’s plunger — from all sides.' },
      school: { uk: 'Повітряна оболонка Землі тисне на все, що в ній, — це атмосферний тиск. Біля рівня моря він у середньому 101 325 Па (нормальний атмосферний тиск, 1013 гПа) і змінюється з погодою й висотою. Вимірюють його барометром.', en: 'The Earth’s envelope of air presses on all that is in it — the atmospheric pressure. At sea level it is 101 325 Pa on average (the standard atmosphere, 1013 hPa) and changes with the weather and the height. A barometer measures it.' },
    },
    history: {
      people: [TORRICELLI, PASCAL],
      role: 'discovered',
      when: '1643–1648',
      story: {
        school: {
          uk: 'Італієць Еванджеліста Торрічеллі 1643 року (або 1644-го) зробив перший ртутний барометр: стовп ртуті в трубці тримається тиском повітря. 1648 року Флорен Пер’є підніс такий барометр на гору Пюї-де-Дом — і вгорі ртуть стояла нижче, як і передбачав Паскаль. Барометр-анероїд, без рідини, зробив Люсьєн Віді 1844 року.',
          en: 'The Italian Evangelista Torricelli made the first mercury barometer in 1643 (or 1644): the column of mercury in the tube is held up by the air’s pressure. In 1648 Florin Périer carried such a barometer up the Puy de Dôme — and higher up the mercury stood lower, as Pascal had predicted. The aneroid barometer, with no liquid, was made by Lucien Vidi in 1844.',
        },
      },
      citations: [
        { source: 'wikipedia-barometer', locator: 'History', claim: 'Evangelista Torricelli is usually credited with inventing the mercury barometer in 1643; Middleton argues for 1644' },
        { source: 'wikipedia-barometer', locator: 'History', claim: 'in September 1648 Florin Périer carried a mercury barometer up the Puy de Dôme and found lower readings higher up, as Pascal predicted' },
        { source: 'wikipedia-barometer', locator: 'Aneroid barometers', claim: 'Lucien Vidi invented the aneroid barometer in 1844' },
        { source: 'wikipedia-atmospheric-pressure', locator: 'Standard atmosphere', claim: 'the standard atmosphere is 101 325 Pa (1013.25 hPa)' },
      ],
    },
    limits: {
      school: { uk: 'Тиск повітря біля землі не сталий: від приблизно 870 до 1085 гПа в рекордах, зазвичай — кілька десятків гектопаскалів довкола 1013. Зі шприцом він виходить трохи меншим: у носику лишається трохи повітря.', en: 'The air’s pressure at the ground is not constant: about 870 to 1085 hPa in records, usually within a few tens of hectopascals of 1013. With a syringe it comes out a little lower: a little air stays in the nozzle.' },
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
  {
    id: 'boyle-mariotte',
    kind: 'law',
    name: { uk: 'Закон Бойля — Маріотта', en: 'Boyle–Mariotte law' },
    statement: {
      novice: { uk: 'Що сильніше стискаєш газ, то менше місця він займає: удвічі більший тиск — удвічі менший об’єм.', en: 'The harder you squeeze a gas, the less room it takes: twice the pressure — half the volume.' },
      school: { uk: 'Для певної маси газу за сталої температури тиск обернено пропорційний об’єму: p₁·V₁ = p₂·V₂.', en: 'For a given mass of gas at a constant temperature the pressure is inversely proportional to the volume: p₁·V₁ = p₂·V₂.' },
    },
    history: {
      people: [BOYLE, MARIOTTE],
      role: 'discovered',
      when: { uk: '1662; незалежно — 1679', en: '1662; independently — 1679' },
      story: {
        school: {
          uk: 'Залежність тиску від об’єму першими помітили англійці Річард Таунлі й Генрі Павер, а Роберт Бойль перевірив її дослідами й надрукував 1662 року. Француз Едм Маріотт відкрив той самий закон незалежно від Бойля 1679-го — тому у Франції його звуть законом Маріотта.',
          en: 'The link between pressure and volume was first noticed by the Englishmen Richard Towneley and Henry Power; Robert Boyle confirmed it by experiment and published it in 1662. The Frenchman Edme Mariotte discovered the same law independently of Boyle in 1679 — so in France it is called Mariotte’s law.',
        },
      },
      citations: [
        { source: 'wikipedia-boyles-law', locator: 'lead', claim: 'pressure inversely proportional to the volume at constant temperature and amount of gas, in a closed system' },
        { source: 'wikipedia-boyles-law', locator: 'History', claim: 'Boyle published it in 1662; first noted by Richard Towneley and Henry Power' },
        { source: 'wikipedia-boyles-law', locator: 'History', claim: 'Mariotte discovered the same law independently of Boyle in 1679; called Mariotte’s law especially in France' },
      ],
    },
    limits: {
      school: { uk: 'Так — поки температура газу стала (стискають повільно, і газ устигає віддати теплоту) і поки газ не стиснутий так сильно, що починає зріджуватися.', en: 'So — while the gas keeps its temperature (squeezed slowly, it has time to give its heat away) and is not squeezed so hard that it starts to liquefy.' },
    },
  },
  {
    id: 'torricelli-outflow',
    kind: 'law',
    name: { uk: 'Закон Торрічеллі', en: 'Torricelli’s law' },
    statement: {
      novice: { uk: 'Вода б’є з отвору так швидко, наче впала з висоти, на якій стоїть над ним її поверхня.', en: 'Water shoots from an opening as fast as if it had fallen from the height its surface stands above it.' },
      school: { uk: 'Швидкість, з якою рідина витікає з отвору, v = √(2gH), де H — висота її поверхні над отвором: така сама, якої набуло б тіло, вільно падаючи з висоти H. Спрямований угору струмінь (без втрат) піднявся б якраз до рівня рідини в посудині.', en: 'The speed a liquid flows out of an opening at is v = √(2gH), H the height of its surface above the opening: the same a body would gain falling freely from H. A jet pointed up (without losses) would rise just to the level of the liquid in the vessel.' },
    },
    history: {
      people: [TORRICELLI],
      role: 'discovered',
      when: { uk: '1643', en: '1643' },
      story: {
        school: {
          uk: 'Італієць Еванджеліста Торрічеллі відкрив цей закон 1643 року (хоч і не в нинішньому вигляді). Згодом з’ясувалося, що це окремий випадок закону Бернуллі — збереження енергії для рідини, що тече.',
          en: 'The Italian Evangelista Torricelli discovered this law in 1643 (though not in today’s form). Later it turned out to be a particular case of Bernoulli’s principle — the conservation of energy for a flowing liquid.',
        },
      },
      citations: [
        { source: 'wikipedia-torricelli-law', locator: 'lead', claim: 'v = √(2gh), the speed a body would acquire falling freely from h' },
        { source: 'wikipedia-torricelli-law', locator: 'lead', claim: 'discovered (though not in this form) by Evangelista Torricelli in 1643; a particular case of Bernoulli’s principle' },
      ],
    },
    limits: {
      school: { uk: 'Так — без тертя. У справжньому фонтані вода треться в трубці й об повітря, тому струмінь не дістає трохи до рівня води в посудині — і що він швидший, то більше.', en: 'So — without friction. In a real fountain the water rubs in the pipe and on the air, so the jet falls a little short of the vessel’s level — the faster, the more.' },
    },
  },
  {
    id: 'hagen-poiseuille',
    kind: 'law',
    name: { uk: 'Закон Гагена — Пуазейля', en: 'Hagen–Poiseuille law' },
    statement: {
      novice: { uk: 'Рідина в трубці треться — і на це йде частина тиску, що її жене. Що вужча й довша трубка, то більше.', en: 'A liquid in a pipe rubs — and part of the pressure driving it goes into that. The narrower and longer the pipe, the more.' },
      school: { uk: 'У спокійній (ламінарній) течії рідини круглою трубою перепад тиску Δp = 8·μ·L·Q / (π·R⁴): він пропорційний в’язкості, довжині й витраті і обернено — четвертому степеню радіуса.', en: 'In a smooth (laminar) flow of a liquid through a round pipe the pressure drop Δp = 8·μ·L·Q / (π·R⁴): proportional to the viscosity, the length and the flow, and inversely to the fourth power of the radius.' },
    },
    history: {
      people: [HAGEN, POISEUILLE],
      role: 'discovered',
      when: { uk: '1838 (надруковано 1839 і 1840–1846)', en: '1838 (published 1839 and 1840–1846)' },
      story: {
        school: {
          uk: 'Німецький інженер Готтгільф Гаген і французький лікар-фізик Жан Пуазейль 1838 року незалежно один від одного знайшли цей закон дослідами. Пуазейля цікавило, як тече кров у тонких судинах. Теоретично закон обґрунтував Джордж Стокс 1845 року.',
          en: 'The German engineer Gotthilf Hagen and the French physician-physicist Jean Poiseuille found this law by experiment in 1838, independently of each other. Poiseuille wanted to know how blood flows in thin vessels. George Stokes gave it a theoretical footing in 1845.',
        },
      },
      citations: [
        { source: 'wikipedia-hagen-poiseuille', locator: 'lead', claim: 'Δp = 8μLQ/(πR⁴) for laminar flow of an incompressible Newtonian fluid in a long round pipe' },
        { source: 'wikipedia-hagen-poiseuille', locator: 'History', claim: 'derived experimentally and independently by Poiseuille and Hagen in 1838; published by Hagen in 1839, by Poiseuille in 1840–41 and 1846; Stokes’ theoretical justification in 1845' },
        { source: 'wikipedia-reynolds-number', locator: 'Flow in a pipe', claim: 'laminar flow occurs when Re_D < 2300' },
      ],
    },
    limits: {
      school: { uk: 'Лише для спокійної (ламінарної) течії — у круглій трубі, поки число Рейнольдса менше за ≈ 2300; у бурхливій (турбулентній) тертя більше.', en: 'Only for smooth (laminar) flow — in a round pipe while the Reynolds number is below ≈ 2300; in a churning (turbulent) one the friction is greater.' },
    },
  },
  {
    id: 'compressibility',
    kind: 'definition',
    name: { uk: 'Стисливість', en: 'Compressibility' },
    statement: {
      novice: { uk: 'Стисливість показує, наскільки речовина зменшується, якщо на неї сильніше тиснути. Гази стискаються легко, рідини — ледь-ледь.', en: 'Compressibility tells how much a substance shrinks when pressed harder. Gases compress easily, liquids barely.' },
      school: { uk: 'Стисливість κ — частка, на яку зменшується об’єм на кожен паскаль додаткового тиску: ΔV/V = −κ·Δp. У води κ ≈ 4,6·10⁻¹⁰ Па⁻¹; у повітря за сталої температури — 1/p, біля землі ≈ 10⁻⁵ Па⁻¹.', en: 'The compressibility κ is the share the volume shrinks by for each pascal of extra pressure: ΔV/V = −κ·Δp. For water κ ≈ 4.6·10⁻¹⁰ Pa⁻¹; for air at a constant temperature it is 1/p, near the ground ≈ 10⁻⁵ Pa⁻¹.' },
    },
    history: { people: [], role: 'associated', when: '—', story: { school: { uk: 'Це означення властивості речовини.', en: 'This is the definition of a property of a substance.' } }, citations: [] },
  },
  {
    id: 'mechanical-work',
    kind: 'definition',
    name: { uk: 'Механічна робота', en: 'Mechanical work' },
    statement: {
      novice: { uk: 'Сила виконує роботу, коли зрушує тіло. Тримаєш важку сумку на місці — втомлюєшся, але роботи (у фізиці) не виконуєш.', en: 'A force does work when it moves a body. Holding a heavy bag still tires you, but (in physics) does no work.' },
      school: { uk: 'Механічна робота сили, що діє вздовж руху, — добуток сили на шлях: A = F·s. Якщо сила напрямлена проти руху, робота від’ємна; якщо перпендикулярно — нульова.', en: 'The mechanical work of a force acting along the motion is the force times the distance: A = F·s. If the force points against the motion the work is negative; if across it, zero.' },
    },
    history: { people: [], role: 'associated', when: '—', story: { school: { uk: 'Це означення фізичної величини.', en: 'This is the definition of a physical quantity.' } }, citations: [] },
  },
];
