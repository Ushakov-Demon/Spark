import type { Locale } from '../src/knowledge/i18n.js';
import type { Subject } from '../src/knowledge/types.js';

/** Interface strings of the web lab. Content texts (laws, formulas) live in the knowledge layer. */
export interface UiText {
  action: string;
  target: string;
  substance: string;
  amount: string;
  mass: string;
  electrodes: string;
  coolWhere: string;
  meltWith: string;
  justRoom: string;
  withLid: string;
  withoutLid: string;
  setpoint: string;
  sampleTemp: string;
  phaseState: string;
  liquid: string;
  solidShare(pct: number): string;
  salinity(pct: string): string;
  dissolvedShare(what: string, pct: string): string;
  crystals(mass: string, what?: string): string;
  supersaturated: string;
  /** The conditions of a ready-made experiment, changeable before the start. */
  varyTitle: string;
  varyReset: string;
  /** A city for the Earth's field: the example's mark, the field's hint, nothing found, whose search it is. */
  placeExample: string;
  placeHint: string;
  placeNone: string;
  placeCredit: string;
  boiledOff(g: string): string;
  surroundings: string;
  supplyWhat: string;
  weigh: {
    button: string;
    scales: string;
    /** In the protocol: "⚖ 1 234 г". */
    row(shown: string): string;
    /** The Professor after a weighing. */
    say(shown: string, tare: string | null, contents: string | null, change: string | null, same: boolean): string;
    overload(max: string): string;
    more(d: string): string;
    less(d: string): string;
  };
  measure: {
    level: string;
    levelSay(shown: string, rise: string | null): string;
    hangAir: string;
    hangLiquid: string;
    hangSay(what: string, into: 'air' | 'liquid', shown: string, buoy: string | null, floats: boolean): string;
    planLevel: string;
    planHang(what: string, into: 'air' | 'liquid'): string;
    rowLevel(shown: string): string;
    rowHang(shown: string, into: 'air' | 'liquid'): string;
  };
  /** On a solid's shelf card: it goes into the liquid. */
  putIn: string;
  guide: {
    step(k: number, n: number): string;
    weigh(again: boolean): string;
    level(again: boolean, waited?: boolean): string;
    add(what: string): string;
    dissolve(what: string): string;
    hang(what: string, into: 'air' | 'liquid'): string;
    btnWeigh: string;
    btnLevel: string;
    btnAdd(what: string): string;
    btnHang(into: 'air' | 'liquid'): string;
    dropped: string;
    floats: string;
    /** A body that neither sinks nor comes up: its density that of the liquid. */
    inside: string;
    dissolved(what: string, salty: boolean): string;
    /** A crystal dropped into a supersaturated solution set off the crystallisation. */
    seeded(what: string, crystals: string, temp: string, warmed: boolean): string;
    saltLeft(dissolved: string, left: string, t: string, per100: string, heatHelps: boolean, hot: string, what: string): string;
    btnDissolve(what: string): string;
    wait(what: string): string;
    btnWait(what: string): string;
    btnRun(what: string, kind: 'heat' | 'cool' | 'current' | 'wait'): string;
    fresh(what: string): string;
    pour(what: string, temp: string): string;
    btnPour(what: string, temp: string): string;
    running: string;
    tableTitle(rho: string): string;
    tableName: string;
    tableDensity: string;
    pick: string;
  };
  instruments: string;
  renew: string;
  sound: { on: string; off: string };
  voice: { label: string; names: Readonly<Record<string, string>>; sample: string; noSpeech: string };
  dissolves: string;
  boardEmpty: string;
  chartShow: string;
  chartHide: string;
  boardFront: string;
  boardBack: string;
  /** A long line of the Professor's, page by page: to the next page, and from the last back to the first. */
  bubbleNext: string;
  bubbleBack: string;
  quiz: {
    title: string;
    predictTitle: string;
    /** Open the choices again after one was picked (a prediction can change until the start). */
    rechoose: string;
    noted: string;
    right(choice: string): string;
    wrong(choice: string, real: string): string;
    /** An experiment with a catch: the prediction fell for it, or there was none (the common belief, the real result). */
    trickWrong(choice: string, real: string): string;
    trickNone(belief: string, real: string): string;
    /** The question asked at the end of a guided procedure. */
    conclude: string;
    /** After the experiment's own question (the choices at the end). */
    concludeAsk: string;
    /** Beside the conclusions: see the answer without picking one. */
    showAnswer: string;
    concludedRight(choice: string): string;
    /** A wrong pick from the density table. */
    concludedWrong(choice: string, real: string): string;
    /** A wrong pick of the other end questions. */
    concludedOther(choice: string, real: string): string;
    weighAir(d: string): string;
    weighScales(div: string, d: string): string;
    weighShrink: string;
    weighHeat: string;
    weighIce: string;
    weighPot(tare: string): string;
    weighQuestion: string;
    labels: { air: string; scales: string; shrink: string; heat: string; ice: string; pot: string };
  };
  rec: {
    save: string;
    namePlaceholder: string;
    saveConfirm: string;
    cancel: string;
    title: string;
    empty: string;
    replay: string;
    download: string;
    remove: string;
    import: string;
    importBad(reason: string): string;
    saved(name: string): string;
    steps(n: number): string;
    replaying(name: string, i: number, n: number): string;
    replayDone(name: string): string;
  };
  answerTitle: string;
  answerComputing: string;
  /** What the bored Professor says during his idle scenes, line by line. */
  idle: {
    pace: readonly string[];
    glasses: readonly string[];
    yawn: readonly string[];
    sleep: readonly string[];
    chalk: (idea: string) => readonly string[];
    tap: readonly string[];
    coffee: readonly string[];
  };
  /** Looking at a clean board for a while: over the shoulder, then turned round, then a hint. */
  emptyBoard: readonly string[];
  byTheWay: { say: string; button: string; fresh: string; loading: string; more: string; close: string; title: string };
  reference: string;
  lockedDuringExperiment: string;
  /** The left panel's tabs: the free sandbox and the ready-made experiments. */
  shelfTabs: { sandbox: string; experiments: string };
  presetsNone: string;
  subjects: Record<Subject, string>;
  grade(n: number): string;
  forEveryone: string;
  presetStart: string;
  inProgramme: string;
  programs: string;
  topic: string;
  /** The button under an experiment's icon: its full description. */
  presetMore: string;
  details: { aim: string; takes: string; steps: string; topic: string; formulas: string; related: string; labWork(n: string): string; experiment: string; conclusion: string; conclusionHint: string; put: string; tubeWithSand: string; thermometer: string; coil: string; printed: string; handwritten: string };
  planNext(step: string): string;
  planAdd(what: string, mass: string): string;
  planDone: string;
  prof: {
    idle: string;
    /** Nothing on the table yet: choose an experiment or build one. */
    bare: string;
    impossible: string;
    heating: string;
    cooling: string;
    boiling: string;
    freezing: string;
    melting: string;
    meltingDry: string;
    current: string;
    /** Current through a cell that gives no gas: metal settles on the cathode, the anode dissolves. */
    currentPlating: string;
    chlorine: string;
    noCurrent: string;
    reached: string;
    failed: string;
    smoke: string;
  };
  volts: string;
  amps: string;
  duration: string;
  current: string;
  supplyDetails(voltage: string, resistance: string): string;
  noCurrent: string;
  gases(list: string): string;
  batteryFlat: string;
  supplyEnergy(total: string): string;
  supplyHeat: string;
  supplyChemistry: string;
  supplyInside: string;
  meltLine: string;
  boilLine: string;
  targetLine: string;
  addTitle: string;
  /** Choosing things over the table: a picture in the middle, its neighbours at the sides; the chosen one goes on the table. */
  choose: { put: string; pour: string; putIn: string; add: string; change: string; what: string; build: string; close: string; prev: string; next: string; open: string };
  addButton: string;
  addLiquid: string;
  addFrozen: string;
  addAmount: string;
  addTemp: string;
  addDoesNotFit(free: string): string;
  addedState(name: string, solidPct: number): string;
  phaseFreezing(t: string, pct: number): string;
  phaseMelting(t: string, pct: number): string;
  phaseMeltingDry(t: string, pct: number): string;
  furnaceSetpoint: string;
  phaseBoiling(t: string, lost: string): string;
  expectNone: string;
  expectPrediction: string;
  expectGoal: string;
  expectMinutes: string;
  expectHint: string;
  computing: string;
  title: string;
  language: string;
  level: string;
  setup: string;
  device: string;
  model: string;
  vessel: string;
  size: string;
  material: string;
  lid: string;
  vesselMass: string;
  about: string;
  safety: string;
  ml: string;
  water: string;
  startTemp: string;
  room: string;
  apply: string;
  experiment: string;
  start: string;
  continueStep: string;
  sideFold: string;
  sideUnfold: string;
  shelfFold: string;
  shelfUnfold: string;
  offerTitle: string;
  offerStop: string;
  offerAfterStall: string;
  offerAfterImpossible: string;
  protocolTitle: string;
  protocolHint: string;
  protocolNext: string;
  /** The protocol's row of a measuring procedure. */
  measuring: string;
  /** An experiment settled without an answer to show. */
  answerMissing: string;
  /** Before the reasoning behind an answer. */
  whyTitle: string;
  leverLevel: string;
  leverTips: string;
  /** Steps that would tell the answer before it is predicted: shown once the experiment gets there. */
  moreSteps(n: number): string;
  /** Looking back at the end of a row of the protocol: what it was, the way back. */
  lookBack(what: string): string;
  lookBackReturn: string;
  lookBackHint: string;
  stepRunning(elapsed: string): string;
  stepReached(time: string): string;
  stepStopped(time: string): string;
  stepFailed: string;
  stepWaiting: string;
  added(what: string, mass: string): string;
  pause: string;
  reset: string;
  speed: string;
  time: string;
  waterTemp: string;
  potTemp: string;
  power: string;
  off: string;
  on: string;
  min: string;
  max: string;
  boiled(time: string): string;
  boilNote: string;
  neverBoils: string;
  energyTitle: string;
  produced(e: string): string;
  shareBody(name: string): string;
  shareSource(name: string): string;
  shareRoom: string;
  shareVapour: string;
  explain: string;
  explainHint: string;
  estimateBadge: string;
  materials: Readonly<Record<string, string>>;
  liters: string;
  kg: string;
  watt: string;
  minutes: string;
  chartTime: string;
  footer: string;
}

export const UI: Readonly<Record<Locale, UiText>> = {
  uk: {
    action: 'Що робимо',
    target: 'Цільова температура, °C',
    substance: 'Речовина',
    amount: 'Кількість, л',
    mass: 'Маса, г',
    electrodes: 'Електроди',
    coolWhere: 'Де охолоджуємо',
    meltWith: 'Чим розплавляємо',
    justRoom: 'Просто в кімнаті',
    withLid: ' з кришкою',
    withoutLid: ' без кришки',
    setpoint: 'Температура охолоджувача, °C',
    sampleTemp: 'Речовина',
    phaseState: 'Стан',
    liquid: 'рідина',
    solidShare: (p) => `тверде ${p} %`,
    salinity: (p) => `солоність ${p} %`,
    dissolvedShare: (w, p) => `${w} ${p} %`,
    crystals: (m, w) => `на дні кристалів ${w ?? 'солі'} ${m}`,
    supersaturated: 'пересичений',
    varyTitle: 'Умови:',
    varyReset: 'Як у досліді',
    placeExample: 'для прикладу — впиши своє місто',
    placeHint: 'Почни вводити назву міста',
    placeNone: 'Такого міста не знайшлося (чи немає інтернету)',
    placeCredit: 'Пошук міст: Open-Meteo, дані GeoNames (CC BY 4.0)',
    boiledOff: (g) => `випарувалося ${g}`,
    surroundings: 'Навколо',
    supplyWhat: 'Джерело струму',
    weigh: {
      button: '⚖ Зважити',
      scales: 'Ваги',
      row: (s) => `⚖ ${s}`,
      say: (s, tare, contents, change, same) =>
        `На вагах ${s}.${tare && contents ? ` Посуд важить ${tare}, отже вмісту — ${contents}.` : ''}${same ? ' Рівно стільки ж, як минулого разу!' : change ? ` ${change}` : ''}`,
      overload: (max) => `Ой! Ваги показують перевантаження: вони тримають лише ${max}. Візьми інші.`,
      more: (d) => `Це на ${d} більше, ніж минулого разу.`,
      less: (d) => `Це на ${d} менше, ніж минулого разу. Куди поділися ці грами?`,
    },
    measure: {
      level: '📏 Об’єм',
      levelSay: (s, rise) => `Рідина стоїть на позначці ${s}.${rise ? ` Рівень піднявся на ${rise} — стільки місця займає занурена частина тіла.` : ''}`,
      hangAir: '🧷 Динамометр: у повітрі',
      hangLiquid: '🧷 Динамометр: у рідині',
      hangSay: (w, into, s, buoy, floats) =>
        floats ? `${w} у рідині плаває — пружина динамометра не натягнута: ${s}.` : into === 'air' ? `${w} у повітрі: динамометр показує ${s} — це вага тіла, P = m·g.` : `${w} у рідині: ${s}.${buoy ? ` Рідина виштовхує тіло із силою ${buoy} — це архімедова сила.` : ''}`,
      planLevel: 'подивитися на поділки',
      planHang: (w, into) => `підвісити ${w} на динамометр ${into === 'air' ? 'у повітрі' : 'у рідині'}`,
      rowLevel: (s) => `📏 ${s}`,
      rowHang: (s, into) => `🧷 ${s} (${into === 'air' ? 'у повітрі' : 'у рідині'})`,
    },
    putIn: 'кладуть у рідину',
    guide: {
      step: (k, n) => `Крок ${k} з ${n}`,
      weigh: (again) => (again ? 'Зваж мензурку ще раз — тепер разом із бруском.' : 'Зваж мензурку з водою на лабораторних терезах і запиши масу.'),
      level: (again, waited) => (waited ? 'Подивись на поділки ще раз: чи змінився рівень?' : again ? 'Подивись на поділки знову: на скільки піднялася вода?' : 'Подивись на поділки: скільки води в мензурці? Очі — на рівні меніска.'),
      add: (w) => `Обережно опусти ${w} у мензурку — по стінці, щоб не розбити скло й не розплескати воду.`,
      dissolve: (w) => `Насип у воду ${w} і розмішай, поки не розчиниться.`,
      hang: (w, into) => (into === 'air' ? `Підвісь ${w} на динамометр у повітрі.` : `Опусти ${w} на динамометрі в рідину — повністю, але не торкаючись дна.`),
      btnWeigh: '⚖ Зважити',
      btnLevel: '📏 Подивитися на поділки',
      btnAdd: (w) => `⬇ Опустити: ${w}`,
      btnHang: (into) => (into === 'air' ? '🧷 Підвісити в повітрі' : '🧷 Занурити в рідину'),
      dropped: 'Бульк! Тіло лягло на дно — і вода в мензурці піднялася.',
      floats: 'Бульк! Шматок плаває — і рівень води піднявся.',
      inside: 'Бульк! Тіло зависло у воді: не тоне й не спливає.',
      seeded: (w, c, t, warmed) => `Кристалик став затравкою: з розчину одразу випало ≈ ${c} кристалів ${w}, і розчин ${warmed ? 'нагрівся' : 'охолов'} до ${t}!`,
      dissolved: (w, salty) => `${w} розчиняється — вода стає ${salty ? 'солоною і ' : ''}густішою, а її частинки не видно навіть у мікроскоп.`,
      saltLeft: (d, l, t, s, heat, hot, w) => `Розчинилося ${d} г, а ${l} г лежить на дні: при ${t} °C 100 г води розчиняє лише ≈ ${s} г ${w}. ${heat ? 'Нагрій воду — при вищій температурі розчиниться решта.' : `Нагрівання тут мало допоможе (при 100 °C — ≈ ${hot} г на 100 г води): долий води.`}`,
      btnDissolve: (w) => `🥄 Розчинити: ${w}`,
      wait: (w) => `${w} — а ти стеж за тим, що відбувається в посуді.`,
      btnWait: (w) => `⏳ ${w}`,
      btnRun: (w, k) => `${k === 'heat' ? '🔥' : k === 'cool' ? '❄️' : k === 'current' ? '⚡' : '⏳'} ${w}`,
      fresh: (w) => `Тепер для порівняння: ${w.charAt(0).toLowerCase()}${w.slice(1)}. Усе інше — так само, як першого разу.`,
      pour: (w, t) => `Обережно долий у посуд: ${w}, ${t} — і подивись, що станеться з температурою.`,
      btnPour: (w, t) => `🫗 Долити: ${w}, ${t}`,
      running: '⏳ Іде дослід… Стеж за тим, що відбувається в посуді.',
      tableTitle: (rho) => `Твоя густина: ρ ≈ ${rho}. Знайди в таблиці речовину з такою густиною:`,
      tableName: 'Речовина',
      tableDensity: 'Густина, кг/м³',
      pick: 'Це він!',
    },
    instruments: 'Вимірювальні прилади',
    renew: '🔄 Новий дослід',
    sound: { on: 'Звук увімкнено — вимкнути', off: 'Звук вимкнено — увімкнути' },
    voice: { label: 'Голос', names: { toon: 'Мультяшний професор', speech: 'Озвучення (справжня мова)', none: 'Мовчки' }, sample: 'Ну що ж, колего, почнімо дослід! Що будемо нагрівати?', noSpeech: ' — у браузері немає голосу, буде мультяшний' },
    dissolves: 'розчиняється у воді',
    boardEmpty: 'Тут з’являтимуться формули досліду',
    chartShow: '📈 Показати графік',
    chartHide: '📈 Сховати графік',
    boardFront: '👀 Подивитися на дошку',
    bubbleNext: 'Далі ›',
    bubbleBack: '‹ Назад',
    boardBack: '↩ Повернутися до досліду',
    quiz: {
      title: 'Як гадаєш?',
      predictTitle: 'Твій прогноз:',
      rechoose: 'Змінити',
      noted: 'Записав твій прогноз! Тепер натисни «Старт» — і перевіримо.',
      right: (c) => `Твій прогноз «${c}» справдився!`,
      conclude: 'Що вийшло? Обери відповідь:',
      concludeAsk: 'Обери відповідь:',
      showAnswer: 'Показати відповідь',
      concludedRight: (c) => `Твоя відповідь «${c}» — правильно!`,
      concludedWrong: (c, r) => `Ти обрав «${c}», але виміряна густина найближча до «${r}». Порівняй ще раз із таблицею.`,
      concludedOther: (c, r) => `Ти обрав «${c}», а дослід показав «${r}». Подивись на розрахунок нижче.`,
      wrong: (c, r) => `Твій прогноз: «${c}». А вийшло — «${r}». Саме для цього й роблять досліди!`,
      trickWrong: (c, r) => `Хі-хі-хі! Ось і підвох: твій прогноз — «${c}», а вийшло — «${r}». Не журись — на цьому спотикається більшість!`,
      trickNone: (b, r) => `Хі-хі-хі! А тут підвох: ${b.charAt(0).toLowerCase()}${b.slice(1, -1)}. А вийшло — «${r}»!`,
      weighAir: (d) => `Так! Ці ${d} випарувалися: вода стала парою, і пара пішла в повітря кімнати. Речовина не зникла — вона просто вийшла з каструлі.`,
      weighScales: (div, d) => `Ні, ваги точні до ${div}, а різниця — ${d}. Спробуй ще!`,
      weighShrink: 'Об’єм справді змінюється (лід навіть займає більше місця, ніж вода), але маса від цього не міняється. Спробуй ще!',
      weighHeat: 'Теплота — це енергія, а не речовина: нагрівання само не забирає з каструлі ні грама. Спробуй ще!',
      weighIce: 'Лід займає більше місця, ніж вода, але важить стільки ж: речовини в ньому не поменшало. Спробуй ще!',
      weighPot: (tare) => `Посуд як важив ${tare}, так і важить — зміна вся у вмісті. Спробуй ще!`,
      weighQuestion: 'Куди поділися ці грами?',
      labels: { air: 'Перетворилися на пару й пішли в повітря', scales: 'Ваги помилилися', shrink: 'Вода стиснулася й полегшала', heat: 'Перетворилися на теплоту', ice: 'Лід легший за воду', pot: 'Полегшала сама каструля' },
    },
    rec: {
      save: '💾 Зберегти дослід',
      namePlaceholder: 'Назва запису',
      saveConfirm: 'Зберегти',
      cancel: 'Скасувати',
      title: 'Мої записи',
      empty: 'Записів поки немає. Проведи дослід — і збережи його: потім його можна повторити крок за кроком.',
      replay: '▶ Повторити',
      download: '⬇ Файл',
      remove: '🗑',
      import: '⬆ Завантажити запис',
      importBad: (r) => `Це не запис Spark (${r}).`,
      saved: (n) => `Збережено: «${n}»`,
      steps: (n) => `${n} ${n % 10 === 1 && n % 100 !== 11 ? 'крок' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'кроки' : 'кроків'}`,
      replaying: (n, i, k) => `▶ Повтор «${n}»: крок ${i} з ${k}`,
      replayDone: (n) => `Повтор «${n}» завершено — усе як того разу!`,
    },
    answerTitle: 'Відповідь на питання досліду',
    answerComputing: 'Професор зводить результати…',
    idle: {
      pace: ['Хм… хм…', 'Що б його таке дослідити?..', 'Може, щось заморозити? Або закип’ятити?'],
      glasses: ['Так… А де ж мої окуляри?', 'Невже знову загубив?.. Кишеня… друга кишеня…', 'А, ось вони! На носі ж були.'],
      yawn: ['Аааах…', 'Може, закип’ятимо щось?'],
      sleep: ['Хррр… z-z-z…', 'Хррр…', 'Е-е?! Я не сплю! Я думаю!'],
      chalk: (idea) => ['Цікаво…', `…${idea.charAt(0).toLowerCase()}${idea.slice(1)}`, 'Спробуємо? Глянь «Досліди» ліворуч.'],
      tap: ['Тік-так…', 'Наука чекає!'],
      coffee: ['Так… час на каву.', 'Ммм… Що за наука без кави?', 'До речі, каву варять у турці — спробуй закип’ятити в ній воду!'],
    },
    emptyBoard: ['Так-так… Ану, що тут у нас…', 'Схоже, тут нічого немає, колего!?', 'Почнімо дослід — і дошка сама заповниться формулами.'],
    byTheWay: { say: 'До речі!.. Згадав одну історію. Ось, почитай.', button: '📰 Газета', fresh: 'Свіжа газета! Ану, що там пишуть…', loading: 'Шукаю газету…', more: '📰 Ще одну', close: 'Закрити', title: 'Газета Професора' },
    reference: 'Довідка',
    lockedDuringExperiment: 'Під час досліду речовину й посуд не міняють — щоб почати інший дослід, натисни «Спочатку».',
    shelfTabs: { sandbox: 'Пісочниця', experiments: 'Досліди' },
    presetsNone: 'Такого досліду поки немає.',
    subjects: { physics: 'Фізика', chemistry: 'Хімія' },
    grade: (n) => `${n} клас`,
    forEveryone: 'Для всіх',
    presetStart: '▶ Почати',
    inProgramme: 'У програмі',
    programs: 'Програми',
    topic: 'Тема',
    presetMore: 'Повний опис досліду',
    details: { aim: 'Мета', takes: 'Обладнання', steps: 'Хід роботи', topic: 'Тема', formulas: 'Опрацювання результатів', related: 'та сама ідея, інша речовина', labWork: (n) => `Лабораторна робота № ${n}`, experiment: 'Дослід', conclusion: 'Висновок', conclusionHint: 'Його запишеш сам — після досліду: що виміряли, що вийшло, чому.', put: 'Опустити', tubeWithSand: 'Пробірка з корком, сухий пісок', thermometer: 'термометр', coil: 'котушка з мідного дроту, мультиметр', printed: 'Аа Друкованим', handwritten: '✍ Від руки' },
    planNext: (s) => `Далі за планом: ${s}`,
    planAdd: (w, m) => `досипати ${m} ${w}`,
    planDone: 'План виконано! Можна експериментувати далі самостійно.',
    prof: {
      idle: 'Обери, що робимо, і тисни «Старт». Або спершу спробуй передбачити результат!',
      bare: 'Стіл порожній. Обери дослід ліворуч — або збери свій у «Пісочниці».',
      impossible: 'Хм… Так мети не досягти. Глянь підказку під графіком — я дещо придумав.',
      heating: 'Гріємо! Слідкуй за термометром.',
      cooling: 'Холоне… Тепло тікає в холодніше довкілля.',
      boiling: 'Кипить! Бачиш бульбашки? Температура більше не росте — уся теплота йде на пару.',
      freezing: 'Лід росте! Поки вода замерзає, температура стоїть на місці.',
      melting: 'Тане! Уся теплота зараз іде на плавлення льоду.',
      meltingDry: 'Плавиться! Температура стоїть, а вся теплота йде на плавлення.',
      current: 'Іде струм! Бачиш бульбашки на електродах? Це гази виділяються.',
      currentPlating: 'Іде струм! Бульбашок немає: придивись до катода — на ньому осідає метал.',
      chlorine: 'Кхе-кхе! Це хлор… У справжній лабораторії тут потрібна витяжка!',
      noCurrent: 'Струму майже немає… Може, у воді чогось бракує? Спробуй досипати солі.',
      reached: 'Можна продовжити: обери наступну дію ліворуч.',
      failed: 'Не вийшло… Але це теж результат! Подивимось, що можна змінити.',
      smoke: 'Кхе! Олія димить — далі гріти небезпечно.',
    },
    volts: 'В',
    amps: 'А',
    duration: 'Скільки часу, хв',
    current: 'Струм',
    supplyDetails: (u, r) => `${u}${r ? ` · рідина ${r}` : ''}`,
    noCurrent: 'струму немає',
    gases: (l) => `виділилось ${l}`,
    batteryFlat: 'батарейка розрядилась',
    supplyEnergy: (e) => `Джерело віддало ${e}:`,
    supplyHeat: 'нагріло рідину (теплота Джоуля–Ленца)',
    supplyChemistry: 'пішло на розклад рідини (гази)',
    supplyInside: 'нагріло саме джерело',
    meltLine: 'плавлення',
    boilLine: 'кипіння',
    targetLine: 'ціль',
    addTitle: 'Додати під час досліду',
    choose: {
      put: 'Поставити на стіл',
      pour: 'Налити в посудину',
      putIn: 'Покласти в посудину',
      change: 'Змінити',
      what: 'Що змінити?',
      build: 'Зібрати дослід',
      add: 'Додати',
      close: 'Закрити',
      prev: 'Попереднє',
      next: 'Наступне',
      open: 'Додати над столом',
    },
    addButton: 'Додати',
    addLiquid: 'рідина',
    addFrozen: 'заморожене',
    addAmount: 'Кількість, г',
    addTemp: 'Температура, °C',
    addDoesNotFit: (f) => `Не влізе: вільно лише ${f}.`,
    addedState: (n, p) => `${n}: ${p > 0 ? `тверде ${p} %` : 'розтануло'}`,
    phaseFreezing: (t, p) => `❄ Температура стоїть на ${t}: речовина замерзає й віддає приховану теплоту. Замерзло ${p} %.`,
    phaseMelting: (t, p) => `💧 Температура стоїть на ${t}: речовина тане й забирає приховану теплоту. Розтануло ${p} %.`,
    phaseMeltingDry: (t, p) => `🔥 Температура стоїть на ${t}: речовина плавиться й забирає приховану теплоту. Розплавилося ${p} %.`,
    furnaceSetpoint: 'Температура в печі, °C',
    phaseBoiling: (t, l) => `♨ Температура стоїть на ${t}: речовина кипить — уся теплота йде на пароутворення. Википіло ${l}.`,
    expectNone: 'Без прогнозу',
    expectPrediction: 'Мій прогноз',
    expectGoal: 'Моя ціль',
    expectMinutes: 'хвилин до мети',
    expectHint: 'Спробуй передбачити, скільки часу займе дослід, — або постав ціль. Після досліду буде розбір.',
    computing: 'Рахую, що можна змінити…',
    title: 'Spark · Лабораторія',
    language: 'Мова',
    level: 'Рівень пояснень',
    setup: 'Установка',
    device: 'Нагрівач',
    model: 'Модель (потужність)',
    vessel: 'Посуд',
    size: 'Об’єм посуду',
    material: 'Матеріал',
    lid: 'З кришкою',
    vesselMass: 'Маса порожнього посуду, кг',
    about: 'Що це',
    safety: 'Безпека',
    ml: 'мл',
    water: 'Вода, л',
    startTemp: 'Початкова температура, °C',
    room: 'Температура в кімнаті, °C',
    apply: 'Зібрати установку',
    experiment: 'Дослід',
    start: '▶ Старт',
    continueStep: '▶ Продовжити',
    sideFold: 'Згорнути',
    sideUnfold: '⇤ Протокол',
    shelfFold: 'Згорнути',
    shelfUnfold: 'Пісочниця · Досліди ⇥',
    offerTitle: 'Так мети не досягти. Можна зупинити дослід або змінити умови:',
    offerStop: '⏹ Зупинити дослід',
    offerAfterStall: 'Що допоможе (перевірено розрахунком):',
    offerAfterImpossible: 'Щоб досягти мети, можна продовжити з іншими умовами:',
    protocolTitle: 'Протокол досліду',
    protocolHint: 'Дослід можна продовжити: обери в «Пісочниці» ліворуч іншу дію або прилад — посуд із тим самим вмістом переставлять, і почнеться наступний крок.',
    lookBack: (what) => `Так було після кроку «${what}»`,
    lookBackReturn: '↩ До досліду',
    lookBackHint: 'Торкнися виконаного кроку, щоб повернутися до його кінця: прилади й дошка — як тоді.',
    measuring: 'Вимірювання',
    answerMissing: 'Відповіді для цього досліду не знайдено. Якщо сторінка відкрита давно — онови її (Ctrl+Shift+R).',
    whyTitle: 'Чому так?',
    leverLevel: 'рівновага',
    leverTips: 'переважує',
    moreSteps: (n) => `… і ще ${n} ${n === 1 ? 'крок' : n < 5 ? 'кроки' : 'кроків'} — побачиш, коли дійдемо`,
    protocolNext: 'Крок завершено. Що далі? Обери дію чи прилад у «Пісочниці» ліворуч або досип щось — і натисни «Продовжити».',
    stepRunning: (e) => `іде ${e}`,
    stepReached: (t) => `✓ за ${t}`,
    stepStopped: (t) => `зупинено через ${t}`,
    stepFailed: '✗ мети не досягнуто',
    stepWaiting: 'чекає на старт',
    added: (w, m) => `+ ${w}, ${m}`,
    pause: '⏸ Пауза',
    reset: '↺ Спочатку',
    speed: 'Швидкість часу',
    time: 'Час',
    waterTemp: 'Вода',
    potTemp: 'Посуд',
    power: 'Потужність',
    off: 'вимк.',
    on: 'увімк.',
    min: 'мін',
    max: 'макс',
    boiled: (t) => `Вода закипіла за ${t}!`,
    boilNote: 'Дослід зупинено, щойно мети досягнуто. Якби гріти далі, рідина википала б — модель рахує і масу, і енергію пари.',
    neverBoils: 'Схоже, вода не закипить: втрати тепла майже зрівнялися з потужністю нагрівача. Спробуй збільшити потужність або взяти менше води.',
    energyTitle: 'Куди пішла енергія',
    produced: (e) => `Нагрівач виділив ${e}:`,
    shareBody: (n) => `нагріло «${n}»`,
    shareSource: (n) => `залишилось у нагрівачі «${n}»`,
    shareRoom: 'пішло в повітря кімнати',
    shareVapour: 'забрала пара, що википіла',
    explain: '3. Пояснити, що відбулося',
    explainHint: 'Пояснення будується з того, що рушій справді обчислив у цьому досліді.',
    estimateBadge: 'оцінка',
    materials: { steel: 'сталь', aluminium: 'алюміній', iron: 'чавун', glass: 'скло' },
    liters: 'л',
    kg: 'кг',
    watt: 'Вт',
    minutes: 'хв',
    chartTime: 'час, хв',
    footer: 'Spark — відкритий некомерційний проєкт. Код: MIT, тексти: CC BY-SA 4.0. Дані мають джерела; оцінки позначено.',
  },
  en: {
    action: 'What we do',
    target: 'Target temperature, °C',
    substance: 'Substance',
    amount: 'Amount, L',
    mass: 'Mass, g',
    electrodes: 'Electrodes',
    coolWhere: 'Where we cool it',
    meltWith: 'How we melt it',
    justRoom: 'Just in the room',
    withLid: ' with the lid',
    withoutLid: ' without the lid',
    setpoint: 'Cooler temperature, °C',
    sampleTemp: 'Substance',
    phaseState: 'State',
    liquid: 'liquid',
    solidShare: (p) => `solid ${p} %`,
    salinity: (p) => `salinity ${p} %`,
    dissolvedShare: (w, p) => `${w} ${p} %`,
    crystals: (m, w) => `${w ?? 'salt'} crystals on the bottom ${m}`,
    supersaturated: 'supersaturated',
    varyTitle: 'Conditions:',
    varyReset: 'As in the experiment',
    placeExample: 'for example — type your own city',
    placeHint: 'Start typing a city’s name',
    placeNone: 'No such city found (or no internet)',
    placeCredit: 'City search: Open-Meteo, GeoNames data (CC BY 4.0)',
    boiledOff: (g) => `evaporated ${g}`,
    surroundings: 'Around it',
    supplyWhat: 'Power source',
    weigh: {
      button: '⚖ Weigh',
      scales: 'Scales',
      row: (s) => `⚖ ${s}`,
      say: (s, tare, contents, change, same) =>
        `The scales show ${s}.${tare && contents ? ` The vessel weighs ${tare}, so the contents are ${contents}.` : ''}${same ? ' Exactly as much as last time!' : change ? ` ${change}` : ''}`,
      overload: (max) => `Oops! The scales are overloaded: they hold only ${max}. Take other ones.`,
      more: (d) => `That is ${d} more than last time.`,
      less: (d) => `That is ${d} less than last time. Where did those grams go?`,
    },
    measure: {
      level: '📏 Volume',
      levelSay: (s, rise) => `The liquid stands at the ${s} mark.${rise ? ` The level rose by ${rise} — that is the room the submerged part of the body takes.` : ''}`,
      hangAir: '🧷 Dynamometer: in the air',
      hangLiquid: '🧷 Dynamometer: in the liquid',
      hangSay: (w, into, s, buoy, floats) =>
        floats ? `${w} floats in the liquid — the dynamometer’s spring is slack: ${s}.` : into === 'air' ? `${w} in the air: the dynamometer shows ${s} — that is its weight, P = m·g.` : `${w} in the liquid: ${s}.${buoy ? ` The liquid pushes it up with ${buoy} — the buoyant force.` : ''}`,
      planLevel: 'read the marks',
      planHang: (w, into) => `hang ${w} on the dynamometer ${into === 'air' ? 'in the air' : 'in the liquid'}`,
      rowLevel: (s) => `📏 ${s}`,
      rowHang: (s, into) => `🧷 ${s} (${into === 'air' ? 'in the air' : 'in the liquid'})`,
    },
    putIn: 'goes into a liquid',
    guide: {
      step: (k, n) => `Step ${k} of ${n}`,
      weigh: (again) => (again ? 'Weigh the cylinder again — now with the block in it.' : 'Weigh the cylinder with water on the laboratory balance and note the mass.'),
      level: (again, waited) => (waited ? 'Read the marks once more: did the level change?' : again ? 'Read the marks again: how far did the water rise?' : 'Read the marks: how much water is in the cylinder? Eyes level with the meniscus.'),
      add: (w) => `Gently lower ${w} into the cylinder — along the wall, so the glass does not break and the water does not splash.`,
      dissolve: (w) => `Pour ${w} into the water and stir until it dissolves.`,
      hang: (w, into) => (into === 'air' ? `Hang ${w} on the dynamometer in the air.` : `Lower ${w} on the dynamometer into the liquid — fully, without touching the bottom.`),
      btnWeigh: '⚖ Weigh',
      btnLevel: '📏 Read the marks',
      btnAdd: (w) => `⬇ Lower in: ${w}`,
      btnHang: (into) => (into === 'air' ? '🧷 Hang in the air' : '🧷 Lower into the liquid'),
      dropped: 'Plop! The body lies on the bottom — and the water in the cylinder rose.',
      floats: 'Plop! The piece floats — and the water level rose.',
      inside: 'Plop! The body hangs in the water: it neither sinks nor comes up.',
      seeded: (w, c, t, warmed) => `The crystal became a seed: ≈ ${c} of ${w} crystals came out of the solution at once, and it ${warmed ? 'warmed up' : 'cooled down'} to ${t}!`,
      dissolved: (w, salty) => `${w} is dissolving — the water turns ${salty ? 'salty and ' : ''}denser, and its particles cannot be seen even under a microscope.`,
      saltLeft: (d, l, t, s, heat, hot, w) => `${d} g dissolved, and ${l} g lies on the bottom: at ${t} °C, 100 g of water dissolves only ≈ ${s} g of ${w}. ${heat ? 'Warm the water — the rest dissolves when it is hotter.' : `Warming helps little here (≈ ${hot} g per 100 g of water at 100 °C): add more water.`}`,
      btnDissolve: (w) => `🥄 Dissolve: ${w}`,
      wait: (w) => `${w} — and watch what happens in the vessel.`,
      btnWait: (w) => `⏳ ${w}`,
      running: '⏳ The experiment is running… Watch what happens in the vessel.',
      btnRun: (w, k) => `${k === 'heat' ? '🔥' : k === 'cool' ? '❄️' : k === 'current' ? '⚡' : '⏳'} ${w}`,
      fresh: (w) => `Now to compare: ${w.charAt(0).toLowerCase()}${w.slice(1)}. Everything else as the first time.`,
      pour: (w, t) => `Carefully pour into the vessel: ${w}, ${t} — and watch the temperature.`,
      btnPour: (w, t) => `🫗 Pour in: ${w}, ${t}`,
      tableTitle: (rho) => `Your density: ρ ≈ ${rho}. Find the substance with this density in the table:`,
      tableName: 'Substance',
      tableDensity: 'Density, kg/m³',
      pick: 'This one!',
    },
    instruments: 'Measuring instruments',
    renew: '🔄 New experiment',
    sound: { on: 'Sound on — turn off', off: 'Sound off — turn on' },
    voice: { label: 'Voice', names: { toon: 'Cartoon professor', speech: 'Speech (real words)', none: 'Silent' }, sample: 'Well then, colleague, shall we start? What shall we heat?', noSpeech: ' — no voice in this browser, it will be the cartoon one' },
    dissolves: 'dissolves in water',
    boardEmpty: 'The formulas of the experiment will appear here',
    chartShow: '📈 Show the chart',
    chartHide: '📈 Hide the chart',
    boardFront: '👀 Look at the board',
    bubbleNext: 'Next ›',
    bubbleBack: '‹ Back',
    boardBack: '↩ Back to the experiment',
    quiz: {
      title: 'What do you think?',
      predictTitle: 'Your prediction:',
      rechoose: 'Change',
      noted: 'Noted your prediction! Now press “Start” — and we will check.',
      right: (c) => `Your prediction “${c}” came true!`,
      conclude: 'What came out? Pick an answer:',
      concludeAsk: 'Pick an answer:',
      showAnswer: 'Show the answer',
      concludedRight: (c) => `Your answer “${c}” is right!`,
      concludedWrong: (c, r) => `You chose “${c}”, but the measured density is nearest to “${r}”. Compare with the table again.`,
      concludedOther: (c, r) => `You chose “${c}”, and the experiment showed “${r}”. See the calculation below.`,
      wrong: (c, r) => `Your prediction: “${c}”. What happened: “${r}”. That is exactly why we do experiments!`,
      trickWrong: (c, r) => `Hee-hee-hee! There’s the catch: your prediction — “${c}”, and what happened — “${r}”. Never mind — most people trip up here!`,
      trickNone: (b, r) => `Hee-hee-hee! There is a catch here: ${b.charAt(0).toLowerCase()}${b.slice(1, -1)}. And what happened — “${r}”!`,
      weighAir: (d) => `Yes! Those ${d} evaporated: the water turned to vapour and the vapour went into the room air. The matter did not vanish — it just left the pot.`,
      weighScales: (div, d) => `No, the scales are accurate to ${div}, and the difference is ${d}. Try again!`,
      weighShrink: 'The volume does change (ice even takes more room than water), but that does not change the mass. Try again!',
      weighHeat: 'Heat is energy, not matter: heating by itself takes not a gram out of the pot. Try again!',
      weighIce: 'Ice takes more room than water but weighs the same: there is no less matter in it. Try again!',
      weighPot: (tare) => `The vessel weighed ${tare} and still does — the whole change is in the contents. Try again!`,
      weighQuestion: 'Where did those grams go?',
      labels: { air: 'They turned to vapour and went into the air', scales: 'The scales got it wrong', shrink: 'The water shrank and got lighter', heat: 'They turned into heat', ice: 'Ice is lighter than water', pot: 'The pot itself got lighter' },
    },
    rec: {
      save: '💾 Save the experiment',
      namePlaceholder: 'Recording name',
      saveConfirm: 'Save',
      cancel: 'Cancel',
      title: 'My recordings',
      empty: 'No recordings yet. Do an experiment and save it: you can replay it step by step later.',
      replay: '▶ Replay',
      download: '⬇ File',
      remove: '🗑',
      import: '⬆ Load a recording',
      importBad: (r) => `This is not a Spark recording (${r}).`,
      saved: (n) => `Saved: “${n}”`,
      steps: (n) => `${n} step${n === 1 ? '' : 's'}`,
      replaying: (n, i, k) => `▶ Replaying “${n}”: step ${i} of ${k}`,
      replayDone: (n) => `Replay of “${n}” done — just like last time!`,
    },
    answerTitle: 'The answer to the experiment’s question',
    answerComputing: 'The Professor is putting the results together…',
    idle: {
      pace: ['Hmm… hmm…', 'What shall we investigate?..', 'Freeze something, perhaps? Or boil it?'],
      glasses: ['Now… where are my glasses?', 'Lost them again?.. This pocket… that pocket…', 'Ah, there they are! On my nose all along.'],
      yawn: ['Aaah…', 'Shall we boil something?'],
      sleep: ['Zzz…', 'Snore…', 'Eh?! I’m not asleep! I’m thinking!'],
      chalk: (idea) => ['I wonder…', `…${idea.charAt(0).toLowerCase()}${idea.slice(1)}`, 'Shall we try? See “Experiments” on the left.'],
      tap: ['Tick-tock…', 'Science is waiting!'],
      coffee: ['Right… coffee time.', 'Mmm… What is science without coffee?', 'By the way, coffee is made in a cezve — try boiling water in one!'],
    },
    emptyBoard: ['Right… let’s see what we have here…', 'Looks like there’s nothing here, colleague!?', 'Let’s start an experiment — and the board will fill with formulas by itself.'],
    byTheWay: { say: 'By the way!.. I remembered something. Here, read this.', button: '📰 Newspaper', fresh: 'A fresh newspaper! Let’s see what they write…', loading: 'Looking for a newspaper…', more: '📰 One more', close: 'Close', title: 'The Professor’s newspaper' },
    reference: 'Reference',
    lockedDuringExperiment: 'The substance and the vessel stay during an experiment — press “Start over” for another one.',
    shelfTabs: { sandbox: 'Sandbox', experiments: 'Experiments' },
    presetsNone: 'No such experiment yet.',
    subjects: { physics: 'Physics', chemistry: 'Chemistry' },
    grade: (n) => `Grade ${n}`,
    forEveryone: 'For everyone',
    presetStart: '▶ Start',
    inProgramme: 'In the programme',
    programs: 'Programmes',
    topic: 'Topic',
    presetMore: 'Full description of the experiment',
    details: { aim: 'Aim', takes: 'Equipment', steps: 'Procedure', topic: 'Topic', formulas: 'Working out the results', related: 'the same idea, another substance', labWork: (n) => `Lab work No. ${n}`, experiment: 'Experiment', conclusion: 'Conclusion', conclusionHint: 'You write it yourself — after the experiment: what was measured, what came out, why.', put: 'Put in', tubeWithSand: 'A stoppered test tube, dry sand', thermometer: 'a thermometer', coil: 'a coil of copper wire, a multimeter', printed: 'Aa In print', handwritten: '✍ By hand' },
    planNext: (s) => `Next in the plan: ${s}`,
    planAdd: (w, m) => `add ${m} of ${w}`,
    planDone: 'Plan complete! Go on experimenting on your own.',
    prof: {
      idle: 'Choose what we do and press “Start”. Or try to predict the result first!',
      bare: 'The table is empty. Choose an experiment on the left — or build your own in the “Sandbox”.',
      impossible: 'Hmm… The goal can’t be reached like this. See the hint under the chart — I have an idea.',
      heating: 'Heating! Watch the thermometer.',
      cooling: 'Cooling… The heat escapes into the colder surroundings.',
      boiling: 'It’s boiling! See the bubbles? The temperature no longer rises — all the heat turns water into steam.',
      freezing: 'Ice is growing! While water freezes, the temperature stands still.',
      melting: 'Melting! All the heat goes into melting the ice now.',
      meltingDry: 'It is melting! The temperature stands still, all the heat goes into melting.',
      current: 'Current is flowing! See the bubbles at the electrodes? Those are gases.',
      currentPlating: 'Current is flowing! No bubbles: look at the cathode — metal is settling on it.',
      chlorine: 'Cough, cough! That’s chlorine… A real lab would need a fume hood here!',
      noCurrent: 'Almost no current… Maybe something is missing in the water? Try adding salt.',
      reached: 'You can go on: pick the next action on the left.',
      failed: 'Didn’t work… But that is a result too! Let’s see what we can change.',
      smoke: 'Cough! The oil is smoking — heating further is dangerous.',
    },
    volts: 'V',
    amps: 'A',
    duration: 'How long, min',
    current: 'Current',
    supplyDetails: (u, r) => `${u}${r ? ` · liquid ${r}` : ''}`,
    noCurrent: 'no current',
    gases: (l) => `released ${l}`,
    batteryFlat: 'battery flat',
    supplyEnergy: (e) => `The source gave ${e}:`,
    supplyHeat: 'heated the liquid (Joule heat)',
    supplyChemistry: 'went into splitting the liquid (gases)',
    supplyInside: 'heated the source itself',
    meltLine: 'melting',
    boilLine: 'boiling',
    targetLine: 'target',
    addTitle: 'Add during the experiment',
    choose: {
      put: 'Put it on the table',
      pour: 'Pour it in',
      putIn: 'Put it in',
      change: 'Change',
      what: 'What to change?',
      build: 'Set up an experiment',
      add: 'Add',
      close: 'Close',
      prev: 'Previous',
      next: 'Next',
      open: 'Add over the table',
    },
    addButton: 'Add',
    addLiquid: 'liquid',
    addFrozen: 'frozen',
    addAmount: 'Amount, g',
    addTemp: 'Temperature, °C',
    addDoesNotFit: (f) => `It will not fit: only ${f} free.`,
    addedState: (n, p) => `${n}: ${p > 0 ? `solid ${p} %` : 'melted'}`,
    phaseFreezing: (t, p) => `❄ The temperature stays at ${t}: the substance is freezing and giving off latent heat. Frozen: ${p} %.`,
    phaseMelting: (t, p) => `💧 The temperature stays at ${t}: the substance is melting and taking in latent heat. Melted: ${p} %.`,
    phaseMeltingDry: (t, p) => `🔥 The temperature stays at ${t}: the substance is melting and taking in latent heat. Melted: ${p} %.`,
    furnaceSetpoint: 'Temperature in the furnace, °C',
    phaseBoiling: (t, l) => `♨ The temperature stays at ${t}: the substance is boiling — all the heat goes into vaporisation. Boiled off: ${l}.`,
    expectNone: 'No prediction',
    expectPrediction: 'My prediction',
    expectGoal: 'My goal',
    expectMinutes: 'minutes to the goal',
    expectHint: 'Try to predict how long the experiment will take — or set a goal. A debrief follows the experiment.',
    computing: 'Working out what could be changed…',
    title: 'Spark · Lab',
    language: 'Language',
    level: 'Explanation level',
    setup: 'Setup',
    device: 'Heater',
    model: 'Model (power)',
    vessel: 'Vessel',
    size: 'Vessel capacity',
    material: 'Material',
    lid: 'With lid',
    vesselMass: 'Empty vessel mass, kg',
    about: 'What it is',
    safety: 'Safety',
    ml: 'mL',
    water: 'Water, L',
    startTemp: 'Starting temperature, °C',
    room: 'Room temperature, °C',
    apply: 'Build the setup',
    experiment: 'Experiment',
    start: '▶ Start',
    continueStep: '▶ Continue',
    sideFold: 'Fold',
    sideUnfold: '⇤ Protocol',
    shelfFold: 'Fold',
    shelfUnfold: 'Sandbox · Experiments ⇥',
    offerTitle: 'The goal cannot be reached like this. Stop the experiment or change the conditions:',
    offerStop: '⏹ Stop the experiment',
    offerAfterStall: 'What helps (checked by calculation):',
    offerAfterImpossible: 'To reach the goal, continue with other conditions:',
    protocolTitle: 'Experiment protocol',
    protocolHint: 'The experiment can go on: pick another action or device in the Sandbox on the left — the vessel moves with its contents and the next step begins.',
    lookBack: (what) => `As it was after “${what}”`,
    lookBackReturn: '↩ Back to the experiment',
    lookBackHint: 'Tap a step done to go back to its end: the instruments and the board as they were.',
    measuring: 'Measurements',
    answerMissing: 'No answer found for this experiment. If the page has been open long, reload it (Ctrl+Shift+R).',
    whyTitle: 'Why so?',
    leverLevel: 'balanced',
    leverTips: 'tips',
    moreSteps: (n) => `… and ${n} more step${n === 1 ? '' : 's'} — you will see them when we get there`,
    protocolNext: 'Step done. What next? Pick an action or a device in the Sandbox on the left, or add something — then press “Continue”.',
    stepRunning: (e) => `running ${e}`,
    stepReached: (t) => `✓ in ${t}`,
    stepStopped: (t) => `stopped after ${t}`,
    stepFailed: '✗ goal not reached',
    stepWaiting: 'waiting to start',
    added: (w, m) => `+ ${w}, ${m}`,
    pause: '⏸ Pause',
    reset: '↺ Restart',
    speed: 'Time speed',
    time: 'Time',
    waterTemp: 'Water',
    potTemp: 'Vessel',
    power: 'Power',
    off: 'off',
    on: 'on',
    min: 'min',
    max: 'max',
    boiled: (t) => `The water boiled in ${t}!`,
    boilNote: 'The experiment stops as soon as the goal is reached. Heating further would boil the liquid away — the model accounts for the mass and energy of the vapour.',
    neverBoils: 'It looks like the water will never boil: heat losses almost match the heater power. Try more power or less water.',
    energyTitle: 'Where the energy went',
    produced: (e) => `The heater produced ${e}:`,
    shareBody: (n) => `warmed "${n}"`,
    shareSource: (n) => `stayed in the heater "${n}"`,
    shareRoom: 'went into the room air',
    shareVapour: 'carried away by boiled-off vapour',
    explain: '3. Explain what happened',
    explainHint: 'The explanation is built from what the engine actually computed in this experiment.',
    estimateBadge: 'estimate',
    materials: { steel: 'steel', aluminium: 'aluminium', iron: 'cast iron', glass: 'glass' },
    liters: 'L',
    kg: 'kg',
    watt: 'W',
    minutes: 'min',
    chartTime: 'time, min',
    footer: 'Spark is an open non-commercial project. Code: MIT, texts: CC BY-SA 4.0. Data are sourced; estimates are marked.',
  },
};
