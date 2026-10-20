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
  supplyWhat: string;
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
  reference: string;
  lockedDuringExperiment: string;
  presetsButton: string;
  presetsTitle: string;
  grade(n: number): string;
  forEveryone: string;
  presetStart: string;
  inProgramme: string;
  planNext(step: string): string;
  planAdd(what: string, mass: string): string;
  planDone: string;
  prof: {
    idle: string;
    impossible: string;
    heating: string;
    cooling: string;
    boiling: string;
    freezing: string;
    melting: string;
    current: string;
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
    supplyWhat: 'Джерело струму',
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
      chalk: (idea) => ['Цікаво…', `…${idea.charAt(0).toLowerCase()}${idea.slice(1)}`, 'Спробуємо? Глянь «Досліди за класами».'],
      tap: ['Тік-так…', 'Наука чекає!'],
      coffee: ['Так… час на каву.', 'Ммм… Що за наука без кави?', 'До речі, каву варять у турці — спробуй закип’ятити в ній воду!'],
    },
    reference: 'Довідка',
    lockedDuringExperiment: 'Під час досліду речовину й посуд не міняють — щоб почати інший дослід, натисни «Спочатку».',
    presetsButton: 'Досліди за класами',
    presetsTitle: 'Готові досліди',
    grade: (n) => `${n} клас`,
    forEveryone: 'Для всіх',
    presetStart: '▶ Почати',
    inProgramme: 'У програмі',
    planNext: (s) => `Далі за планом: ${s}`,
    planAdd: (w, m) => `досипати ${m} ${w}`,
    planDone: 'План виконано! Можна експериментувати далі самостійно.',
    prof: {
      idle: 'Обери, що робимо, і тисни «Старт». Або спершу спробуй передбачити результат!',
      impossible: 'Хм… Так мети не досягти. Глянь підказку під графіком — я дещо придумав.',
      heating: 'Гріємо! Слідкуй за термометром.',
      cooling: 'Холоне… Тепло тікає в холодніше довкілля.',
      boiling: 'Кипить! Бачиш бульбашки? Температура більше не росте — уся теплота йде на пару.',
      freezing: 'Лід росте! Поки вода замерзає, температура стоїть на місці.',
      melting: 'Тане! Уся теплота зараз іде на плавлення льоду.',
      current: 'Іде струм! Бачиш бульбашки на електродах? Це гази виділяються.',
      chlorine: 'Кхе-кхе! Це хлор… У справжній лабораторії тут потрібна витяжка!',
      noCurrent: 'Струму майже немає… Може, у воді чогось бракує? Спробуй досипати солі.',
      reached: 'Вийшло! Можна продовжити: обери наступну дію ліворуч.',
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
    supplyWhat: 'Power source',
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
      chalk: (idea) => ['I wonder…', `…${idea.charAt(0).toLowerCase()}${idea.slice(1)}`, 'Shall we try? See “Experiments by grade”.'],
      tap: ['Tick-tock…', 'Science is waiting!'],
      coffee: ['Right… coffee time.', 'Mmm… What is science without coffee?', 'By the way, coffee is made in a cezve — try boiling water in one!'],
    },
    reference: 'Reference',
    lockedDuringExperiment: 'The substance and the vessel stay during an experiment — press “Start over” for another one.',
    presetsButton: 'Experiments by grade',
    presetsTitle: 'Ready-made experiments',
    grade: (n) => `Grade ${n}`,
    forEveryone: 'For everyone',
    presetStart: '▶ Start',
    inProgramme: 'In the programme',
    planNext: (s) => `Next in the plan: ${s}`,
    planAdd: (w, m) => `add ${m} of ${w}`,
    planDone: 'Plan complete! Go on experimenting on your own.',
    prof: {
      idle: 'Choose what we do and press “Start”. Or try to predict the result first!',
      impossible: 'Hmm… The goal can’t be reached like this. See the hint under the chart — I have an idea.',
      heating: 'Heating! Watch the thermometer.',
      cooling: 'Cooling… The heat escapes into the colder surroundings.',
      boiling: 'It’s boiling! See the bubbles? The temperature no longer rises — all the heat turns water into steam.',
      freezing: 'Ice is growing! While water freezes, the temperature stands still.',
      melting: 'Melting! All the heat goes into melting the ice now.',
      current: 'Current is flowing! See the bubbles at the electrodes? Those are gases.',
      chlorine: 'Cough, cough! That’s chlorine… A real lab would need a fume hood here!',
      noCurrent: 'Almost no current… Maybe something is missing in the water? Try adding salt.',
      reached: 'It worked! You can go on: pick the next action on the left.',
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
