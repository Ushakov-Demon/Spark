import type { LawSpec, Person } from '../../knowledge/types.js';

/** Dates verified against Wikidata (P569/P570) on 2026-10-11. */
const CLAPEYRON: Person = { name: { uk: 'Бенуа Поль Еміль Клапейрон', en: 'Benoît Paul Émile Clapeyron' }, born: 1799, died: 1864, wikidata: 'Q313551' };
const NEWTON: Person = { name: { uk: 'Ісаак Ньютон', en: 'Isaac Newton' }, born: 1643, died: 1727, wikidata: 'Q935' };
const FOURIER: Person = { name: { uk: 'Жан Батист Жозеф Фур’є', en: 'Joseph Fourier' }, born: 1768, died: 1830, wikidata: 'Q8772' };
const BLACK: Person = { name: { uk: 'Джозеф Блек', en: 'Joseph Black' }, born: 1728, died: 1799, wikidata: 'Q272512' };
const MAYER: Person = { name: { uk: 'Юліус Роберт Маєр', en: 'Julius Robert von Mayer' }, born: 1814, died: 1878, wikidata: 'Q57171' };
const JOULE: Person = { name: { uk: 'Джеймс Прескотт Джоуль', en: 'James Prescott Joule' }, born: 1818, died: 1889, wikidata: 'Q8962' };
const HELMHOLTZ: Person = { name: { uk: 'Герман фон Гельмгольц', en: 'Hermann von Helmholtz' }, born: 1821, died: 1894, wikidata: 'Q60024' };

/**
 * Laws behind the thermal formulas. Texts follow docs/CONTENT_STYLE.md;
 * every historical claim is backed by `history.citations`.
 */
export const THERMAL_LAWS: readonly LawSpec[] = [
  {
    id: 'energy-conservation',
    kind: 'law',
    name: { uk: 'Закон збереження енергії', en: 'Conservation of energy' },
    statement: {
      novice: {
        uk: 'Енергія не з’являється нізвідки і не зникає — вона лише переходить від одного тіла до іншого або з одного виду в інший. Тому можна точно порахувати, куди поділася кожна її частинка.',
        en: 'Energy never appears from nothing and never vanishes — it only moves from one body to another or changes form. That is why we can account for every bit of it.',
      },
      school: {
        uk: 'Скільки теплоти тіло отримало, мінус скільки віддало, — рівно на стільки змінилася його внутрішня енергія.',
        en: 'Heat received minus heat given away equals the change of the body’s internal energy.',
      },
      advanced: {
        uk: 'Повна енергія замкненої системи стала: енергія лише перетворюється з одного виду в інший і передається від одних тіл до інших.',
        en: 'The total energy of an isolated system is constant: energy only changes form and moves between bodies.',
      },
      expert: {
        uk: 'Перший закон термодинаміки для тіла, над яким не виконують роботу: ΔU = Q_отр − Q_від. У моделі виконується за побудовою: кожен зв’язок переносить +q і −q.',
        en: 'First law of thermodynamics for a body with no work done: ΔU = Q_in − Q_out. In the model it holds by construction: every link moves +q and −q.',
      },
    },
    history: {
      people: [MAYER, JOULE, HELMHOLTZ],
      role: 'discovered',
      when: '1842–1847',
      work: 'H. Helmholtz, «Über die Erhaltung der Kraft» (1847)',
      story: {
        novice: {
          uk: 'У 1840-х роках кілька вчених майже одночасно зрозуміли, що теплота — це теж енергія. Джеймс Джоуль довів це дослідом: вантаж, опускаючись, крутив лопаті у воді, і вода від цього нагрівалася.',
          en: 'In the 1840s several scientists realised, almost at the same time, that heat is a form of energy. James Joule proved it: a falling weight turned paddles in water, and the water warmed up.',
        },
        school: {
          uk: 'У 1842 році хірург Роберт Маєр першим сформулював, що теплота і механічна робота — різні форми одного й того самого. У 1843 році Джеймс Джоуль підтвердив це дослідом: вантаж, що опускався, обертав лопаті у воді, і внутрішня енергія води зросла рівно на стільки, скільки енергії втратив вантаж. У 1847 році Герман Гельмгольц поширив закон на всю фізику.',
          en: 'In 1842 the surgeon Robert Mayer first stated that heat and mechanical work are forms of the same thing. In 1843 James Joule confirmed it: a descending weight turned paddles in water, and the water gained exactly the energy the weight lost. In 1847 Hermann Helmholtz extended the law to all of physics.',
        },
        advanced: {
          uk: 'Маєр (1842) — еквівалентність теплоти і роботи, у 1845 — кількісний зв’язок. Джоуль (1843) незалежно виміряв механічний еквівалент теплоти (дослід із лопатевим колесом). Подібні результати мав Людвіг Колдінг у Данії. Загального визнання принцип набув після праці Гельмгольца «Про збереження сили» (1847).',
          en: 'Mayer (1842) — equivalence of heat and work, quantitative relation in 1845. Joule (1843) independently measured the mechanical equivalent of heat (paddle-wheel experiment). Ludwig Colding obtained similar results in Denmark. The principle gained general acceptance with Helmholtz’s «On the Conservation of Force» (1847).',
        },
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
      school: {
        uk: 'Закон виконується завжди. Але якщо забути якийсь шлях втрати енергії (випаровування, випромінювання), баланс «не зійдеться».',
        en: 'The law always holds. But if you forget a path by which energy leaks (evaporation, radiation), the balance will not add up.',
      },
    },
  },
  {
    id: 'specific-heat',
    kind: 'definition',
    name: { uk: 'Питома теплоємність', en: 'Specific heat capacity' },
    statement: {
      novice: {
        uk: 'Різні речовини нагріваються по-різному: щоб нагріти воду, потрібно значно більше енергії, ніж для такої самої маси металу. Ця властивість речовини називається питомою теплоємністю.',
        en: 'Different substances warm up differently: heating water takes far more energy than heating the same mass of metal. This property of a substance is called specific heat capacity.',
      },
      school: {
        uk: 'Питома теплоємність показує, скільки джоулів потрібно, щоб нагріти 1 кг речовини на 1 °C. Щоб нагріти тіло, потрібно Q = c·m·Δt.',
        en: 'Specific heat capacity is how many joules it takes to warm 1 kg of a substance by 1 °C. To heat a body you need Q = c·m·Δt.',
      },
      advanced: {
        uk: 'Кількість теплоти пропорційна масі тіла і зміні температури; коефіцієнт пропорційності — питома теплоємність, властивість речовини.',
        en: 'The heat is proportional to the mass and to the temperature change; the coefficient is the specific heat capacity, a property of the substance.',
      },
      expert: {
        uk: 'c = δQ/(m·dT). У моделі c вважається сталою (значення за ~25 °C); для води це дає похибку < 1 % у діапазоні 0–100 °C.',
        en: 'c = δQ/(m·dT). The model treats c as constant (values at ~25 °C); for water this gives < 1 % error over 0–100 °C.',
      },
    },
    history: {
      people: [BLACK],
      role: 'discovered',
      when: '1760',
      story: {
        novice: {
          uk: 'Шотландський учений Джозеф Блек змішував гарячі й холодні речовини і помітив, що вони змінюють температуру по-різному.',
          en: 'The Scottish scientist Joseph Black mixed hot and cold substances and noticed that their temperatures changed by different amounts.',
        },
        school: {
          uk: 'У 1760 році Джозеф Блек помітив: якщо змішати однакові маси різних речовин з різною температурою, їхні температури змінюються неоднаково, хоча теплоти вони обмінюють порівну. Так з’явилося поняття теплоємності. Він писав, що ртуть «вміщує менше теплоти», ніж вода.',
          en: 'In 1760 Joseph Black noticed that when equal masses of different substances at different temperatures are mixed, their temperatures change unequally although they exchange equal heat. That is how the idea of heat capacity appeared. He wrote that mercury has «less capacity for the matter of heat» than water.',
        },
        advanced: {
          uk: 'Блек увів теплоємність у 1760 році, аналізуючи досліди Фаренгейта зі змішуванням, а в 1761 році відкрив приховану теплоту плавлення і кипіння. Його лекції видав Джон Робісон уже після смерті Блека.',
          en: 'Black introduced heat capacity in 1760 while analysing Fahrenheit’s mixing experiments, and in 1761 discovered latent heat of melting and boiling. His lectures were published by John Robison after Black’s death.',
        },
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
    name: { uk: 'Прихована теплота: плавлення і кипіння', en: 'Latent heat: melting and boiling' },
    statement: {
      novice: {
        uk: 'Поки лід тане або вода кипить, її температура не змінюється: уся теплота йде на перетворення — твердого на рідину чи рідини на пару.',
        en: 'While ice melts or water boils, its temperature does not change: all the heat goes into the change itself — solid to liquid or liquid to vapour.',
      },
      school: {
        uk: 'Щоб розплавити тіло масою m при температурі плавлення, потрібно Q = λ·m (λ — питома теплота плавлення); щоб випарувати при кипінні — Q = r·m (r — питома теплота пароутворення). Під час тверднення й конденсації стільки ж теплоти виділяється.',
        en: 'Melting a mass m at its melting point takes Q = λ·m (λ — specific latent heat of fusion); boiling it away takes Q = r·m (r — latent heat of vaporisation). Freezing and condensing release the same amount.',
      },
      expert: {
        uk: 'У моделі тіло зберігає ентальпію; на площадці фазового переходу температура стала, а змінюється частка твердої фази або маса (пара залишає систему разом зі своєю енергією).',
        en: 'In the model a body stores enthalpy; on a phase-change plateau the temperature is constant while the solid fraction or the mass changes (vapour leaves with its energy).',
      },
    },
    history: {
      people: [BLACK],
      role: 'discovered',
      when: '1761',
      story: {
        novice: {
          uk: 'Джозеф Блек помітив: якщо гріти лід, що тане, його температура не росте, доки весь лід не розтане.',
          en: 'Joseph Black noticed: if you heat melting ice, its temperature does not rise until all the ice has melted.',
        },
        school: {
          uk: 'У 1761 році Джозеф Блек помітив, що теплота, яку отримує лід у точці плавлення або вода в точці кипіння, не підвищує температуру, а збільшує кількість води чи пари. Він назвав цю теплоту «прихованою».',
          en: 'In 1761 Joseph Black observed that heat added to ice at its melting point, or to water at its boiling point, does not raise the temperature but increases the amount of water or steam. He called this heat «latent».',
        },
      },
      citations: [
        { source: 'wikipedia-joseph-black', locator: 'Latent heat', claim: 'In 1761 Black observed that heat applied at the melting/boiling point increases the amount of water/steam rather than the temperature; latent heat' },
        { source: 'wikidata', locator: 'Q272512 (P569, P570)', claim: 'life dates' },
      ],
    },
    limits: {
      school: {
        uk: 'Температура кипіння залежить від тиску (в горах вода кипить за нижчої температури); у моделі тиск — нормальний атмосферний.',
        en: 'The boiling point depends on pressure (water boils at a lower temperature in the mountains); the model assumes normal atmospheric pressure.',
      },
    },
  },
  {
    id: 'evaporation',
    kind: 'model',
    name: { uk: 'Випаровування', en: 'Evaporation' },
    statement: {
      novice: {
        uk: 'З поверхні рідини весь час відлітають найшвидші молекули — рідина випаровується й охолоджується. Що гарячіша рідина, то швидше вона випаровується.',
        en: 'The fastest molecules keep escaping from a liquid surface — the liquid evaporates and cools. The hotter the liquid, the faster it evaporates.',
      },
      school: {
        uk: 'Випаровування забирає теплоту: кожен кілограм пари уносить питому теплоту пароутворення. Тому гаряча вода у відкритій каструлі втрачає багато енергії, а кришка, на якій пара осідає й стікає назад, цю втрату майже прибирає.',
        en: 'Evaporation takes heat away: every kilogram of vapour carries the latent heat of vaporisation. That is why hot water in an open pot loses a lot of energy, while a lid — on which vapour condenses and drips back — almost removes this loss.',
      },
      advanced: {
        uk: 'Швидкість випаровування пропорційна площі поверхні й різниці густини насиченої пари над рідиною та пари в повітрі. Тиск насиченої пари води дуже швидко росте з температурою (рівняння Бака).',
        en: 'The evaporation rate is proportional to the surface area and to the difference between the saturated vapour density above the liquid and the vapour already in the air. The saturated vapour pressure of water grows steeply with temperature (Buck equation).',
      },
      expert: {
        uk: 'ṁ = h_m·A·(ρ_v,sat(T_s) − φ·ρ_v,sat(T_∞)); h_m = h/(ρ_air·c_p·Le^(2/3)) — аналогія Чилтона — Колберна. Вона виведена для турбулентного потоку в трубах, тож для спокійної поверхні дає оцінку порядку величини.',
        en: 'ṁ = h_m·A·(ρ_v,sat(T_s) − φ·ρ_v,sat(T_∞)); h_m = h/(ρ_air·c_p·Le^(2/3)) — the Chilton–Colburn analogy. It is derived for turbulent flow in conduits, so for a still surface it gives an order-of-magnitude estimate.',
      },
    },
    history: {
      people: [],
      role: 'associated',
      when: '—',
      story: {
        school: {
          uk: 'Швидкість випаровування в моделі оцінено за аналогією між теплообміном і масообміном (аналогія Чилтона — Колберна).',
          en: 'The evaporation rate in the model is estimated from the analogy between heat and mass transfer (the Chilton–Colburn analogy).',
        },
      },
      citations: [{ source: 'wikipedia-chilton-colburn', locator: 'Lead', claim: 'Analogy named after Thomas H. Chilton and Allan Philip Colburn; stated for turbulent flow in conduits' }],
    },
    limits: {
      school: {
        uk: 'Оцінка порядку величини: справжня швидкість залежить від руху повітря над поверхнею.',
        en: 'An order-of-magnitude estimate: the real rate depends on air movement above the surface.',
      },
    },
  },
  {
    id: 'heat-balance',
    kind: 'law',
    name: { uk: 'Рівняння теплового балансу', en: 'Heat balance' },
    statement: {
      novice: {
        uk: 'Якщо змішати гарячу і холодну воду, вийде тепла — і її температуру можна передбачити заздалегідь: скільки теплоти віддала гаряча вода, стільки отримала холодна.',
        en: 'Mix hot and cold water and you get warm water — and you can predict its temperature in advance: the heat lost by the hot water is gained by the cold.',
      },
      school: {
        uk: 'Скільки теплоти віддали гарячі тіла, стільки ж отримали холодні: Q_від = Q_отр.',
        en: 'Heat given by the hot bodies equals heat received by the cold ones: Q_out = Q_in.',
      },
      advanced: {
        uk: 'Наслідок закону збереження енергії для теплоізольованої системи: сума всіх отриманих і відданих кількостей теплоти дорівнює нулю.',
        en: 'A consequence of energy conservation for a thermally isolated system: the sum of all heat received and given is zero.',
      },
    },
    history: {
      people: [BLACK],
      role: 'associated',
      when: '1760',
      story: {
        novice: {
          uk: 'Змішувати гаряче й холодне і точно вимірювати результат почав ще Джозеф Блек у 1760 році.',
          en: 'Mixing hot and cold and carefully measuring the result goes back to Joseph Black in 1760.',
        },
        school: {
          uk: 'Метод змішування — головний інструмент калориметрії з часів дослідів Джозефа Блека. Окремого «відкривача» в рівняння немає: воно випливає із закону збереження енергії.',
          en: 'The method of mixtures has been the core tool of calorimetry since Joseph Black’s experiments. The equation has no single «discoverer»: it follows from energy conservation.',
        },
      },
      citations: [{ source: 'wikipedia-joseph-black', locator: 'Specific heat', claim: 'Black studied mixing of substances at different temperatures (1760)' }],
    },
    limits: {
      school: {
        uk: 'Правильне, лише якщо під час змішування теплота не виходить назовні. Під час доливання модель вважає змішування миттєвим.',
        en: 'Valid only if no heat escapes while mixing. When pouring, the model treats mixing as instantaneous.',
      },
    },
  },
  {
    id: 'linear-heat-transfer',
    kind: 'law',
    name: { uk: 'Теплопередача від гарячого до холодного', en: 'Heat flows from hot to cold' },
    statement: {
      novice: {
        uk: 'Теплота завжди переходить від гарячішого тіла до холоднішого — ніколи навпаки сама собою. Що більша різниця температур, то швидше.',
        en: 'Heat always flows from the hotter body to the colder one — never the other way by itself. The bigger the temperature difference, the faster.',
      },
      school: {
        uk: 'Потужність потоку теплоти пропорційна різниці температур: P = G·(t₁ − t₂). Коли температури зрівнялися, потік припиняється — настає теплова рівновага.',
        en: 'The heat flow rate is proportional to the temperature difference: P = G·(t₁ − t₂). When the temperatures are equal, the flow stops — thermal equilibrium.',
      },
      advanced: {
        uk: 'Спільна форма законів Ньютона (тепловіддача) і Фур’є (теплопровідність): потік пропорційний різниці температур, коефіцієнт — теплова провідність G.',
        en: 'The common form of Newton’s (convective) and Fourier’s (conductive) laws: flow is proportional to the temperature difference, with thermal conductance G as the coefficient.',
      },
    },
    history: {
      people: [NEWTON, FOURIER],
      role: 'associated',
      when: '1701–1822',
      story: {
        school: {
          uk: 'Ньютон у 1701 році описав охолодження тіл, а Фур’є у 1807–1822 роках побудував на цій ідеї математичну теорію теплопровідності.',
          en: 'Newton described cooling in 1701, and Fourier built a mathematical theory of heat conduction on this idea in 1807–1822.',
        },
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
    name: { uk: 'Закон охолодження Ньютона', en: "Newton's law of cooling" },
    statement: {
      novice: {
        uk: 'Гарячий чай спершу холоне швидко, а потім дедалі повільніше: що менша різниця з температурою кімнати, то слабший потік теплоти.',
        en: 'Hot tea cools fast at first and then ever more slowly: the smaller the difference from room temperature, the weaker the heat flow.',
      },
      school: {
        uk: 'Тіло віддає теплоту навколишньому повітрю тим швидше, чим більша його поверхня і чим воно гарячіше за повітря.',
        en: 'A body loses heat to the surrounding air faster the larger its surface and the hotter it is compared with the air.',
      },
      advanced: {
        uk: 'Швидкість тепловіддачі тіла пропорційна різниці температур тіла й середовища та площі поверхні: P = h·A·(t − t_сер).',
        en: 'The rate of heat loss is proportional to the temperature difference between body and surroundings and to the surface area: P = h·A·(t − t_env).',
      },
      expert: {
        uk: 'q = h·(T − T∞). Добре описує вимушену конвекцію; для природної конвекції h залежить від ΔT (≈ ΔT^¼), тому закон — наближення.',
        en: 'q = h·(T − T∞). Good for forced convection; for natural convection h depends on ΔT (≈ ΔT^¼), so the law is an approximation.',
      },
    },
    history: {
      people: [NEWTON],
      role: 'discovered',
      when: '1701',
      work: '«Scala graduum Caloris», Philosophical Transactions (анонімно / anonymously)',
      story: {
        novice: {
          uk: 'Це помітив Ісаак Ньютон — той самий, що відкрив закон всесвітнього тяжіння.',
          en: 'This was noticed by Isaac Newton — the same Newton who discovered universal gravitation.',
        },
        school: {
          uk: 'Ісаак Ньютон опублікував працю про охолодження у 1701 році — анонімно, у журналі Лондонського королівського товариства.',
          en: 'Isaac Newton published his work on cooling in 1701 — anonymously, in the journal of the Royal Society.',
        },
        advanced: {
          uk: 'Ньютон (1701, анонімно, «Scala graduum Caloris») сформулював закон не в сучасному вигляді: він писав про швидкість зміни температури, а не про потік теплоти — у його час теплоту і температуру ще не розрізняли.',
          en: 'Newton (1701, anonymously, «Scala graduum Caloris») did not state the law in its modern form: he wrote about the rate of temperature change, not heat flow — heat and temperature were not yet distinguished.',
        },
      },
      citations: [
        { source: 'wikipedia-newton-cooling', locator: 'History', claim: 'Published anonymously in 1701 as "Scala graduum Caloris" in Philosophical Transactions' },
        { source: 'wikipedia-newton-cooling', locator: 'History', claim: 'Newton did not state the law in the modern form; confusion between heat and temperature' },
        { source: 'wikidata', locator: 'Q935 (P569, P570)', claim: 'life dates (Gregorian)' },
      ],
    },
    limits: {
      school: {
        uk: 'Точний, коли різниця температур невелика і немає випаровування та сильного випромінювання.',
        en: 'Accurate when the temperature difference is small and there is no evaporation or strong radiation.',
      },
    },
  },
  {
    id: 'fourier-conduction',
    kind: 'law',
    name: { uk: 'Закон теплопровідності Фур’є', en: "Fourier's law of conduction" },
    statement: {
      novice: {
        uk: 'Крізь метал теплота проходить швидко, крізь дерево і повітря — повільно. Цю властивість називають теплопровідністю.',
        en: 'Heat passes through metal quickly and through wood or air slowly. This property is called thermal conductivity.',
      },
      school: {
        uk: 'Теплота проходить крізь стрижень тим швидше, чим він товщий, коротший і чим краще матеріал проводить теплоту.',
        en: 'Heat passes through a rod faster the thicker and shorter it is and the better its material conducts heat.',
      },
      advanced: {
        uk: 'Потік теплоти крізь матеріал пропорційний площі перерізу та перепаду температур і обернено пропорційний товщині: P = k·A·Δt / L.',
        en: 'Heat flow through a material is proportional to cross-section and temperature drop and inversely proportional to thickness: P = k·A·Δt / L.',
      },
      expert: { uk: 'q = −k∇T. Для однорідного стрижня в стаціонарі дає G = kA/L.', en: 'q = −k∇T. For a uniform rod at steady state this gives G = kA/L.' },
    },
    history: {
      people: [FOURIER],
      role: 'discovered',
      when: '1807–1822',
      work: '«Théorie analytique de la chaleur» (1822)',
      story: {
        school: {
          uk: 'Французький математик Жозеф Фур’є у 1807 році представив працю про поширення теплоти в твердих тілах, а в 1822 році видав книжку «Аналітична теорія теплоти».',
          en: 'The French mathematician Joseph Fourier presented a memoir on heat propagation in solids in 1807 and published «The Analytical Theory of Heat» in 1822.',
        },
        advanced: {
          uk: 'Мемуар «Про поширення теплоти в твердих тілах» — 21 грудня 1807 року; книжка — 1822 рік. Фур’є спирався на закон охолодження Ньютона: потік теплоти між сусідніми частинками пропорційний малій різниці їхніх температур.',
          en: 'Memoir «On the Propagation of Heat in Solid Bodies» — 21 December 1807; the book — 1822. Fourier built on Newton’s law of cooling: heat flow between neighbouring particles is proportional to their small temperature difference.',
        },
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
    name: { uk: 'Потужність', en: 'Power' },
    statement: {
      novice: {
        uk: 'Потужність показує, як швидко виконується робота чи віддається енергія. Ту саму гору бігом підіймаєшся потужніше, ніж пішки; потужніший нагрівач за той самий час дає більше теплоти.',
        en: 'Power tells how fast work is done or energy delivered. Running up the same hill is more powerful than walking; a more powerful heater gives more heat in the same time.',
      },
      school: {
        uk: 'Потужність — робота (чи енергія) за одиницю часу: N = A/t, у ватах (1 Вт = 1 Дж/с). За час t прилад потужністю P віддає E = P·t. Стара одиниця — кінська сила (≈ 736 Вт).',
        en: 'Power is the work (or energy) per unit of time: N = A/t, in watts (1 W = 1 J/s). In time t a device of power P delivers E = P·t. An old unit is the horsepower (≈ 736 W).',
      },
    },
    history: {
      people: [{ name: { uk: 'Джеймс Ватт', en: 'James Watt' }, born: 1736, died: 1819, wikidata: 'Q9041' }],
      role: 'associated',
      when: { uk: 'кінець XVIII ст.', en: 'the late 18th century' },
      story: {
        school: {
          uk: 'Це означення фізичної величини. Шотландський інженер Джеймс Ватт, щоб продавати свої парові машини тим, хто досі крутив млини кіньми, порівняв машини з кіньми — так з’явилася «кінська сила».',
          en: 'This is the definition of a physical quantity. The Scottish engineer James Watt, to sell his steam engines to those who still turned their mills with horses, compared the engines with horses — and so the «horsepower» appeared.',
        },
      },
      citations: [{ source: 'wikipedia-horsepower', locator: 'History', claim: 'adopted in the late 18th century by James Watt to compare the output of steam engines with the power of draft horses; to sell engines to customers who used horses' }],
    },
  },
  {
    id: 'mass-fraction',
    kind: 'definition',
    name: { uk: 'Масова частка розчиненої речовини', en: 'Mass fraction of a dissolved substance' },
    statement: {
      novice: { uk: 'Масова частка показує, яку частину розчину за масою становить розчинена речовина.', en: 'The mass fraction tells what part of a solution’s mass the dissolved substance makes.' },
      school: { uk: 'w = m(речовини) / m(розчину) · 100 %; маса розчину — це маса розчинника й розчиненої речовини разом.', en: 'w = m(substance) / m(solution) · 100 %; the solution’s mass is the solvent and the dissolved substance together.' },
    },
    history: { people: [], role: 'associated', when: '—', story: { school: { uk: 'Це означення фізичної величини.', en: 'This is the definition of a quantity.' } }, citations: [] },
  },
  {
    id: 'solubility',
    kind: 'definition',
    name: { uk: 'Розчинність', en: 'Solubility' },
    statement: {
      novice: { uk: 'Розчинність — скільки речовини може розчинитися у 100 г води. Для більшості твердих речовин у гарячій воді вона більша.', en: 'Solubility is how much of a substance can dissolve in 100 g of water. For most solids it is greater in hot water.' },
      school: { uk: 'Розчинність S — маса речовини, що розчиняється в 100 г розчинника за даної температури, утворюючи насичений розчин. Під час охолодження насиченого розчину надлишок випадає кристалами: m = (S₁ − S₂)·m(води) / 100 г.', en: 'Solubility S is the mass of a substance that dissolves in 100 g of solvent at a given temperature, making a saturated solution. As a saturated solution cools, the excess comes out as crystals: m = (S₁ − S₂)·m(water) / 100 g.' },
    },
    history: { people: [], role: 'associated', when: '—', story: { school: { uk: 'Це означення фізичної величини.', en: 'This is the definition of a quantity.' } }, citations: [] },
  },
  {
    id: 'heat-of-solution',
    kind: 'definition',
    name: { uk: 'Теплота розчинення', en: 'Heat of solution' },
    statement: {
      novice: { uk: 'Розчиняючись, одні речовини нагрівають воду, інші — охолоджують.', en: 'Dissolving, some substances warm the water, others cool it.' },
      school: { uk: 'Теплота розчинення — теплота, що поглинається або виділяється під час розчинення моля речовини: Q = n·ΔH. Її знак залежить від того, що переважає — руйнування кристала (енергія витрачається) чи гідратація йонів (енергія виділяється).', en: 'The heat of solution is the heat taken in or given off when a mole of a substance dissolves: Q = n·ΔH. Its sign depends on which wins — breaking the crystal (energy taken) or hydrating the ions (energy given).' },
    },
    history: { people: [], role: 'associated', when: '—', story: { school: { uk: 'Це означення фізичної величини.', en: 'This is the definition of a quantity.' } }, citations: [] },
  },
  {
    id: 'ideal-gas',
    kind: 'law',
    name: { uk: 'Рівняння стану ідеального газу', en: 'The ideal gas law' },
    statement: {
      novice: { uk: 'Тиск, об’єм і температура газу пов’язані між собою: нагрітий газ розширюється й стає легшим.', en: 'A gas’s pressure, volume and temperature are bound together: a heated gas expands and gets lighter.' },
      school: { uk: 'p·V = (m/M)·R·T, або для густини ρ = p·M/(R·T): за того самого тиску газ тим густіший, що важчі його молекули й що він холодніший.', en: 'p·V = (m/M)·R·T, or for the density ρ = p·M/(R·T): at the same pressure a gas is the denser, the heavier its molecules and the colder it is.' },
    },
    history: {
      people: [CLAPEYRON],
      role: 'discovered',
      when: { uk: '1834', en: '1834' },
      story: { school: { uk: 'Рівняння вперше записав французький інженер і фізик Еміль Клапейрон 1834 року.', en: 'The equation was first stated by the French engineer and physicist Émile Clapeyron in 1834.' } },
      citations: [
        { source: 'wikipedia-ideal-gas-law', locator: 'lead', claim: 'first stated by Benoît Paul Émile Clapeyron in 1834; p = ρ·R_specific·T, R_specific = R/M' },
        { source: 'wikidata', locator: 'Q313551 (P569, P570)', claim: 'life dates (1799 – 1864)' },
      ],
    },
    limits: { school: { uk: 'Добре справджується для більшості газів за звичайних умов; гірше — під великим тиском і близько до зрідження.', en: 'It holds well for most gases under ordinary conditions; worse under high pressure and near liquefying.' } },
  },
];
