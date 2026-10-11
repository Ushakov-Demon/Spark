import type { Locale } from '../src/knowledge/i18n.js';

/** Interface strings of the web lab. Content texts (laws, formulas) live in the knowledge layer. */
export interface UiText {
  action: string;
  actions: Readonly<Record<'heat-to' | 'boil' | 'cool-to' | 'freeze' | 'melt', string>>;
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
  boiledOff(g: string): string;
  surroundings: string;
  meltLine: string;
  boilLine: string;
  targetLine: string;
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
    actions: { 'heat-to': 'Нагріти до…', boil: 'Закип’ятити', 'cool-to': 'Охолодити до…', freeze: 'Заморозити', melt: 'Розплавити' },
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
    boiledOff: (g) => `випарувалося ${g}`,
    surroundings: 'Навколо',
    meltLine: 'плавлення',
    boilLine: 'кипіння',
    targetLine: 'ціль',
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
    actions: { 'heat-to': 'Heat to…', boil: 'Boil', 'cool-to': 'Cool to…', freeze: 'Freeze', melt: 'Melt' },
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
    boiledOff: (g) => `evaporated ${g}`,
    surroundings: 'Around it',
    meltLine: 'melting',
    boilLine: 'boiling',
    targetLine: 'target',
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
