import type { Locale } from '../src/knowledge/i18n.js';

/** Interface strings of the web lab. Content texts (laws, formulas) live in the knowledge layer. */
export interface UiText {
  action: string;
  target: string;
  substance: string;
  amount: string;
  coolWhere: string;
  meltWith: string;
  justRoom: string;
  setpoint: string;
  sampleTemp: string;
  phaseState: string;
  liquid: string;
  solidShare(pct: number): string;
  salinity(pct: string): string;
  crystals(mass: string): string;
  boiledOff(g: string): string;
  surroundings: string;
  meltLine: string;
  boilLine: string;
  targetLine: string;
  addTitle: string;
  addButton: string;
  addLiquid: string;
  addFrozen: string;
  addAmount: string;
  addTemp: string;
  addDoesNotFit(free: string): string;
  addedState(name: string, solidPct: number): string;
  phaseFreezing(t: string, pct: number): string;
  phaseMelting(t: string, pct: number): string;
  phaseBoiling(t: string, lost: string): string;
  expectNone: string;
  expectPrediction: string;
  expectGoal: string;
  expectMinutes: string;
  expectHint: string;
  computing: string;
  title: string;
  subtitle: string;
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
  offerTitle: string;
  offerStop: string;
  offerAfterStall: string;
  offerAfterImpossible: string;
  protocolTitle: string;
  protocolHint: string;
  protocolNext: string;
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
    coolWhere: 'Де охолоджуємо',
    meltWith: 'Чим розплавляємо',
    justRoom: 'Просто в кімнаті',
    setpoint: 'Температура охолоджувача, °C',
    sampleTemp: 'Речовина',
    phaseState: 'Стан',
    liquid: 'рідина',
    solidShare: (p) => `тверде ${p} %`,
    salinity: (p) => `солоність ${p} %`,
    crystals: (m) => `кристалів солі ${m}`,
    boiledOff: (g) => `випарувалося ${g}`,
    surroundings: 'Навколо',
    meltLine: 'плавлення',
    boilLine: 'кипіння',
    targetLine: 'ціль',
    addTitle: 'Додати під час досліду',
    addButton: 'Додати',
    addLiquid: 'рідина',
    addFrozen: 'заморожене',
    addAmount: 'Кількість, г',
    addTemp: 'Температура, °C',
    addDoesNotFit: (f) => `Не влізе: вільно лише ${f}.`,
    addedState: (n, p) => `${n}: ${p > 0 ? `тверде ${p} %` : 'розтануло'}`,
    phaseFreezing: (t, p) => `❄ Температура стоїть на ${t}: речовина замерзає й віддає приховану теплоту. Замерзло ${p} %.`,
    phaseMelting: (t, p) => `💧 Температура стоїть на ${t}: речовина тане й забирає приховану теплоту. Розтануло ${p} %.`,
    phaseBoiling: (t, l) => `♨ Температура стоїть на ${t}: речовина кипить — уся теплота йде на пароутворення. Википіло ${l}.`,
    expectNone: 'Без прогнозу',
    expectPrediction: 'Мій прогноз',
    expectGoal: 'Моя ціль',
    expectMinutes: 'хвилин до мети',
    expectHint: 'Спробуй передбачити, скільки часу займе дослід, — або постав ціль. Після досліду буде розбір.',
    computing: 'Рахую, що можна змінити…',
    title: 'Spark · Лабораторія',
    subtitle: 'Нагрівай і охолоджуй, кип’яти й заморожуй: обери речовину, посуд і прилад — дивись, що відбувається, і дізнайся чому.',
    language: 'Мова',
    level: 'Рівень пояснень',
    setup: '1. Установка',
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
    experiment: '2. Дослід',
    start: '▶ Старт',
    continueStep: '▶ Продовжити',
    sideFold: 'Згорнути ⇥',
    sideUnfold: '⇤ Протокол',
    offerTitle: 'Так мети не досягти. Можна зупинити дослід або змінити умови:',
    offerStop: '⏹ Зупинити дослід',
    offerAfterStall: 'Що допоможе (перевірено розрахунком):',
    offerAfterImpossible: 'Щоб досягти мети, можна продовжити з іншими умовами:',
    protocolTitle: 'Протокол досліду',
    protocolHint: 'Дослід можна продовжити: обери ліворуч іншу дію або прилад — посуд із тим самим вмістом переставлять, і почнеться наступний крок.',
    protocolNext: 'Крок завершено. Що далі? Обери дію чи прилад ліворуч або досип щось — і натисни «Продовжити».',
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
    coolWhere: 'Where we cool it',
    meltWith: 'How we melt it',
    justRoom: 'Just in the room',
    setpoint: 'Cooler temperature, °C',
    sampleTemp: 'Substance',
    phaseState: 'State',
    liquid: 'liquid',
    solidShare: (p) => `solid ${p} %`,
    salinity: (p) => `salinity ${p} %`,
    crystals: (m) => `salt crystals ${m}`,
    boiledOff: (g) => `evaporated ${g}`,
    surroundings: 'Around it',
    meltLine: 'melting',
    boilLine: 'boiling',
    targetLine: 'target',
    addTitle: 'Add during the experiment',
    addButton: 'Add',
    addLiquid: 'liquid',
    addFrozen: 'frozen',
    addAmount: 'Amount, g',
    addTemp: 'Temperature, °C',
    addDoesNotFit: (f) => `It will not fit: only ${f} free.`,
    addedState: (n, p) => `${n}: ${p > 0 ? `solid ${p} %` : 'melted'}`,
    phaseFreezing: (t, p) => `❄ The temperature stays at ${t}: the substance is freezing and giving off latent heat. Frozen: ${p} %.`,
    phaseMelting: (t, p) => `💧 The temperature stays at ${t}: the substance is melting and taking in latent heat. Melted: ${p} %.`,
    phaseBoiling: (t, l) => `♨ The temperature stays at ${t}: the substance is boiling — all the heat goes into vaporisation. Boiled off: ${l}.`,
    expectNone: 'No prediction',
    expectPrediction: 'My prediction',
    expectGoal: 'My goal',
    expectMinutes: 'minutes to the goal',
    expectHint: 'Try to predict how long the experiment will take — or set a goal. A debrief follows the experiment.',
    computing: 'Working out what could be changed…',
    title: 'Spark · Lab',
    subtitle: 'Heat and cool, boil and freeze: pick a substance, a vessel and a device — watch what happens and find out why.',
    language: 'Language',
    level: 'Explanation level',
    setup: '1. Setup',
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
    experiment: '2. Experiment',
    start: '▶ Start',
    continueStep: '▶ Continue',
    sideFold: 'Fold ⇥',
    sideUnfold: '⇤ Protocol',
    offerTitle: 'The goal cannot be reached like this. Stop the experiment or change the conditions:',
    offerStop: '⏹ Stop the experiment',
    offerAfterStall: 'What helps (checked by calculation):',
    offerAfterImpossible: 'To reach the goal, continue with other conditions:',
    protocolTitle: 'Experiment protocol',
    protocolHint: 'The experiment can go on: pick another action or device on the left — the vessel moves with its contents and the next step begins.',
    protocolNext: 'Step done. What next? Pick an action or a device on the left, or add something — then press “Continue”.',
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
