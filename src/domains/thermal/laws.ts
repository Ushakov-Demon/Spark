import type { LawSpec, Person } from '../../knowledge/types.js';

/** Dates verified against Wikidata (P569/P570) on 2026-10-11. */
const NEWTON: Person = { name: { ru: 'Исаак Ньютон', en: 'Isaac Newton' }, born: 1643, died: 1727, wikidata: 'Q935' };
const FOURIER: Person = { name: { ru: 'Жан Батист Жозеф Фурье', en: 'Joseph Fourier' }, born: 1768, died: 1830, wikidata: 'Q8772' };
const BLACK: Person = { name: { ru: 'Джозеф Блэк', en: 'Joseph Black' }, born: 1728, died: 1799, wikidata: 'Q272512' };
const MAYER: Person = { name: { ru: 'Юлиус Роберт Майер', en: 'Julius Robert von Mayer' }, born: 1814, died: 1878, wikidata: 'Q57171' };
const JOULE: Person = { name: { ru: 'Джеймс Прескотт Джоуль', en: 'James Prescott Joule' }, born: 1818, died: 1889, wikidata: 'Q8962' };
const HELMHOLTZ: Person = { name: { ru: 'Герман фон Гельмгольц', en: 'Hermann von Helmholtz' }, born: 1821, died: 1894, wikidata: 'Q60024' };

export const THERMAL_LAWS: readonly LawSpec[] = [
  {
    id: 'energy-conservation',
    kind: 'law',
    name: { ru: 'Закон сохранения энергии', en: 'Conservation of energy' },
    statement: {
      novice: { ru: 'Энергия не появляется из ниоткуда и не исчезает бесследно — она только переходит из одного места в другое.' },
      school: { ru: 'Сколько тепла тело получило, минус сколько отдало, — ровно на столько изменилась его внутренняя энергия.' },
      advanced: { ru: 'Полная энергия замкнутой системы постоянна: энергия лишь переходит из одной формы в другую и от одних тел к другим.' },
      expert: { ru: 'Первое начало термодинамики для тела без совершения работы: ΔU = Q_получ − Q_отд. В модели выполняется по построению — каждая связь переносит +q и −q.' },
    },
    history: {
      people: [MAYER, JOULE, HELMHOLTZ],
      role: 'discovered',
      when: '1842–1847',
      work: 'Г. Гельмгольц, «О сохранении силы» (Über die Erhaltung der Kraft, 1847)',
      story: {
        novice: { ru: 'Около 180 лет назад сразу несколько учёных поняли, что тепло — это тоже энергия. Джоуль доказал это опытом: падающий груз крутил лопасти в воде, и вода от этого нагревалась.' },
        school: {
          ru: 'В 1842 году хирург Роберт Майер первым сформулировал, что теплота и механическая работа — разные формы одного и того же. В 1843 году Джеймс Джоуль подтвердил это опытом: падающий груз вращал лопасти в воде, и вода нагревалась ровно на столько, сколько энергии потерял груз. В 1847 году Герман Гельмгольц обобщил закон для всей физики.',
        },
        advanced: {
          ru: 'Майер (1842) — эквивалентность теплоты и работы, в 1845 — количественная связь. Джоуль (1843) независимо измерил механический эквивалент теплоты (опыт с лопастным колесом). Похожие результаты были у Людвига Колдинга в Дании. Общее признание принципу принесла работа Гельмгольца «О сохранении силы» (1847).',
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
      school: { ru: 'Закон выполняется всегда. Но если забыть какой-то путь утечки энергии (испарение, излучение), баланс «не сойдётся».' },
    },
  },
  {
    id: 'specific-heat',
    kind: 'definition',
    name: { ru: 'Удельная теплоёмкость', en: 'Specific heat capacity' },
    statement: {
      novice: { ru: 'Разные вещества нагреваются по-разному: воду нагреть трудно, а металл — легко.' },
      school: { ru: 'Удельная теплоёмкость — сколько джоулей нужно, чтобы нагреть 1 кг вещества на 1 °C. Чтобы нагреть тело, нужно Q = c·m·Δt.' },
      advanced: { ru: 'Количество теплоты пропорционально массе тела и изменению температуры; коэффициент — удельная теплоёмкость, свойство вещества.' },
      expert: { ru: 'c = δQ/(m·dT). В модели c считается постоянной (значения при ~25 °C), что для воды даёт ошибку < 1 % в диапазоне 0–100 °C.' },
    },
    history: {
      people: [BLACK],
      role: 'discovered',
      when: '1760',
      story: {
        novice: { ru: 'Шотландский учёный Джозеф Блэк смешивал горячие и холодные вещества и заметил, что они меняют температуру по-разному.' },
        school: {
          ru: 'В 1760 году Джозеф Блэк заметил: если смешать равные массы разных веществ с разной температурой, их температуры меняются неодинаково, хотя тепла они обменивают поровну. Так появилось понятие теплоёмкости. Он писал, что ртуть «вмещает меньше тепла», чем вода.',
        },
        advanced: {
          ru: 'Блэк ввёл теплоёмкость в 1760 году, разбирая опыты Фаренгейта со смешиванием, а в 1761 году открыл скрытую теплоту плавления и кипения. Его лекции издал Джон Робисон уже после смерти Блэка.',
        },
      },
      citations: [
        { source: 'wikipedia-joseph-black', locator: 'Specific heat', claim: 'In 1760 Black realised the specific heat relationship from mixing experiments' },
        { source: 'wikipedia-joseph-black', locator: 'Latent heat', claim: 'Latent heat deduced in 1761' },
        { source: 'wikipedia-joseph-black', locator: 'References', claim: 'Lectures on the Elements of Chemistry, ed. John Robison, 1807 edition cited' },
        { source: 'wikidata', locator: 'Q272512 (P569, P570)', claim: 'life dates' },
      ],
    },
  },
  {
    id: 'heat-balance',
    kind: 'law',
    name: { ru: 'Уравнение теплового баланса', en: 'Heat balance' },
    statement: {
      novice: { ru: 'Когда смешиваешь горячее и холодное, получается что-то среднее.' },
      school: { ru: 'Сколько тепла отдали горячие тела, столько же получили холодные: Q_отд = Q_получ.' },
      advanced: { ru: 'Следствие закона сохранения энергии для теплоизолированной системы: сумма всех полученных и отданных количеств теплоты равна нулю.' },
    },
    history: {
      people: [BLACK],
      role: 'associated',
      when: '1760',
      story: {
        novice: { ru: 'Смешивать горячее и холодное и смотреть, что получится, придумал ещё Джозеф Блэк в 1760 году.' },
        school: { ru: 'Метод смешивания — главный инструмент калориметрии со времён опытов Джозефа Блэка. Отдельного «открывателя» у уравнения нет: оно следует из закона сохранения энергии.' },
      },
      citations: [{ source: 'wikipedia-joseph-black', locator: 'Specific heat', claim: 'Black studied mixing of substances at different temperatures (1760)' }],
    },
    limits: {
      school: { ru: 'Верно только если за время смешивания тепло не уходит наружу. При доливании в модели смешивание мгновенное.' },
    },
  },
  {
    id: 'linear-heat-transfer',
    kind: 'law',
    name: { ru: 'Теплопередача от горячего к холодному', en: 'Linear heat transfer' },
    statement: {
      novice: { ru: 'Тепло всегда переходит от горячего к холодному. Чем больше разница, тем быстрее.' },
      school: { ru: 'Мощность потока тепла пропорциональна разнице температур: P = G·(t₁ − t₂). Когда температуры сравнялись, поток прекращается.' },
      advanced: { ru: 'Общая форма законов Ньютона (теплоотдача) и Фурье (теплопроводность): поток пропорционален разности температур, коэффициент — тепловая проводимость G.' },
    },
    history: {
      people: [NEWTON, FOURIER],
      role: 'associated',
      when: '1701–1822',
      story: {
        school: { ru: 'Ньютон в 1701 году описал остывание тел, а Фурье в 1807–1822 годах построил на этой идее математическую теорию теплопроводности.' },
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
    name: { ru: 'Закон охлаждения Ньютона', en: "Newton's law of cooling" },
    statement: {
      novice: { ru: 'Горячий чай сначала остывает быстро, а потом всё медленнее.' },
      school: { ru: 'Тело отдаёт тепло окружающему воздуху тем быстрее, чем сильнее оно горячее воздуха.' },
      advanced: { ru: 'Скорость теплоотдачи тела пропорциональна разности температур тела и окружающей среды и площади поверхности: P = h·A·(t − t_окр).' },
      expert: { ru: 'q = h·(T − T∞). Хорошо описывает вынужденную конвекцию; для естественной конвекции h зависит от ΔT (≈ ΔT^¼), поэтому закон — приближение.' },
    },
    history: {
      people: [NEWTON],
      role: 'discovered',
      when: '1701',
      work: '«Scala graduum Caloris», Philosophical Transactions (опубликовано анонимно)',
      story: {
        novice: { ru: 'Это заметил Исаак Ньютон — тот самый, что открыл закон всемирного тяготения.' },
        school: { ru: 'Исаак Ньютон опубликовал работу об остывании в 1701 году — анонимно, в журнале Королевского общества.' },
        advanced: {
          ru: 'Ньютон (1701, анонимно, «Scala graduum Caloris») сформулировал закон не в современном виде: он писал о скорости изменения температуры, а не о потоке тепла — в его время теплоту и температуру ещё не различали.',
        },
      },
      citations: [
        { source: 'wikipedia-newton-cooling', locator: 'History', claim: 'Published anonymously in 1701 as "Scala graduum Caloris" in Philosophical Transactions' },
        { source: 'wikipedia-newton-cooling', locator: 'History', claim: 'Newton did not state the law in the modern form; confusion between heat and temperature' },
        { source: 'wikidata', locator: 'Q935 (P569, P570)', claim: 'life dates (Gregorian)' },
      ],
    },
    limits: {
      school: { ru: 'Точен, когда разница температур невелика и нет испарения и сильного излучения.' },
    },
  },
  {
    id: 'fourier-conduction',
    kind: 'law',
    name: { ru: 'Закон теплопроводности Фурье', en: "Fourier's law" },
    statement: {
      novice: { ru: 'Через металл тепло проходит быстро, через дерево и воздух — медленно.' },
      school: { ru: 'Тепло проходит через стержень тем быстрее, чем он толще, короче и чем лучше материал проводит тепло.' },
      advanced: { ru: 'Поток тепла через материал пропорционален площади сечения и перепаду температур и обратно пропорционален толщине: P = k·A·Δt / L.' },
      expert: { ru: 'q = −k∇T. Для однородного стержня в стационаре даёт G = kA/L.' },
    },
    history: {
      people: [FOURIER],
      role: 'discovered',
      when: '1807–1822',
      work: '«Аналитическая теория тепла» (Théorie analytique de la chaleur, 1822)',
      story: {
        school: { ru: 'Французский математик Жозеф Фурье в 1807 году представил работу о распространении тепла в твёрдых телах, а в 1822 году издал книгу «Аналитическая теория тепла».' },
        advanced: { ru: 'Мемуар «О распространении тепла в твёрдых телах» — 21 декабря 1807 года; книга — 1822 год. Фурье опирался на закон охлаждения Ньютона: поток тепла между соседними частицами пропорционален малой разнице их температур.' },
      },
      citations: [
        { source: 'wikipedia-fourier', locator: 'The Analytic Theory of Heat', claim: 'Memoir On the Propagation of Heat in Solid Bodies presented 21 December 1807' },
        { source: 'wikipedia-fourier', locator: 'The Analytic Theory of Heat', claim: 'Théorie analytique de la chaleur published 1822' },
        { source: 'wikidata', locator: 'Q8772 (P569, P570)', claim: 'life dates' },
      ],
    },
  },
  {
    id: 'power',
    kind: 'definition',
    name: { ru: 'Мощность', en: 'Power' },
    statement: {
      novice: { ru: 'Мощный нагреватель за то же время даёт больше тепла.' },
      school: { ru: 'Мощность — сколько энергии выделяется за секунду. За время t нагреватель мощностью P отдаёт E = P·t.' },
    },
    history: {
      people: [],
      role: 'associated',
      when: '—',
      story: { school: { ru: 'Это не открытие, а определение физической величины.' } },
      citations: [],
    },
  },
];
