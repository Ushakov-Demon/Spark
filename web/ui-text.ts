import type { Locale } from '../src/knowledge/i18n.js';
import { byLocale, t as tl } from '../src/knowledge/messages.js';
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
    /** Skip the optional rest of the plan. */
    skip: string;
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
    /** A liquid that did not mix: its layer on top (less dense) or at the bottom. */
    layer(what: string, top: boolean): string;
    /** A liquid that mixed in: one liquid now. */
    mixed(what: string): string;
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
  /** Going on with the vessel after a ready-made experiment's answer. */
  goOn: { title: string; now(action: string, will: string): string; first: string; change: string; repeatTitle: string; repeatText: string; repeat: string };
  sound: { on: string; off: string; musicOn: string; musicOff: string };
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
    fly: readonly string[];
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
    /** A ready-made experiment answered, then something put in (or another action picked): now it may go on. */
    goOn(button: string): string;
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
  choose: { put: string; pour: string; putIn: string; add: string; /** The button beside «Add» over the table: the action. */ actionButton: string; change: string; what: string; build: string; close: string; prev: string; next: string; open: string };
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
  /** Why «Start» waits after a ready-made experiment is answered. */
  startNeedsSomething: string;
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

export const UI: Readonly<Record<Locale, UiText>> = byLocale((lang: Locale) => ({
  action: tl(lang, 'ui-action'),
  target: tl(lang, 'ui-target'),
  substance: tl(lang, 'ui-substance'),
  amount: tl(lang, 'ui-amount'),
  mass: tl(lang, 'ui-mass'),
  electrodes: tl(lang, 'ui-electrodes'),
  coolWhere: tl(lang, 'ui-cool-where'),
  meltWith: tl(lang, 'ui-melt-with'),
  justRoom: tl(lang, 'ui-just-room'),
  withLid: tl(lang, 'ui-with-lid'),
  withoutLid: tl(lang, 'ui-without-lid'),
  setpoint: tl(lang, 'ui-setpoint'),
  sampleTemp: tl(lang, 'ui-substance'),
  phaseState: tl(lang, 'ui-phase-state'),
  liquid: tl(lang, 'ui-liquid'),
  solidShare: (p) => tl(lang, 'ui-solid-share', { p: String(p) }),
  salinity: (p) => tl(lang, 'ui-salinity', { p }),
  dissolvedShare: (w, p) => `${w} ${p} %`,
  crystals: (m, w) => tl(lang, 'ui-crystals-2', { m, w: w ?? tl(lang, 'ui-crystals') }),
  supersaturated: tl(lang, 'ui-supersaturated'),
  varyTitle: tl(lang, 'ui-vary-title'),
  varyReset: tl(lang, 'ui-vary-reset'),
  placeExample: tl(lang, 'ui-place-example'),
  placeHint: tl(lang, 'ui-place-hint'),
  placeNone: tl(lang, 'ui-place-none'),
  placeCredit: tl(lang, 'ui-place-credit'),
  boiledOff: (g) => tl(lang, 'ui-boiled-off', { g }),
  surroundings: tl(lang, 'ui-surroundings'),
  supplyWhat: tl(lang, 'ui-supply-what'),
  weigh: {
  button: tl(lang, 'ui-weigh-button'),
  scales: tl(lang, 'ui-weigh-scales'),
  row: (s) => `⚖ ${s}`,
  say: (s, tare, contents, change, same) =>
        tl(lang, 'ui-weigh-say-3', { s, tare: tare && contents ? tl(lang, 'ui-weigh-say', { tare, contents }) : '', value: same ? tl(lang, 'ui-weigh-say-2') : change ? ` ${change}` : '' }),
  overload: (max) => tl(lang, 'ui-weigh-overload', { max }),
  more: (d) => tl(lang, 'ui-weigh-more', { d }),
  less: (d) => tl(lang, 'ui-weigh-less', { d }),
},
  measure: {
  level: tl(lang, 'ui-measure-level'),
  levelSay: (s, rise) => tl(lang, 'ui-measure-level-say-2', { s, rise: rise ? tl(lang, 'ui-measure-level-say', { rise }) : '' }),
  hangAir: tl(lang, 'ui-measure-hang-air'),
  hangLiquid: tl(lang, 'ui-measure-hang-liquid'),
  hangSay: (w, into, s, buoy, floats) =>
        floats ? tl(lang, 'ui-measure-hang-say', { w, s }) : into === 'air' ? tl(lang, 'ui-measure-hang-say-2', { w, s }) : tl(lang, 'ui-measure-hang-say-4', { w, s, buoy: buoy ? tl(lang, 'ui-measure-hang-say-3', { buoy }) : '' }),
  planLevel: tl(lang, 'ui-measure-plan-level'),
  planHang: (w, into) => tl(lang, 'ui-measure-plan-hang-3', { w, value: into === 'air' ? tl(lang, 'ui-measure-plan-hang') : tl(lang, 'ui-measure-plan-hang-2') }),
  rowLevel: (s) => `📏 ${s}`,
  rowHang: (s, into) => tl(lang, 'ui-measure-row-hang', { s, value: into === 'air' ? tl(lang, 'ui-measure-plan-hang') : tl(lang, 'ui-measure-plan-hang-2') }),
},
  putIn: tl(lang, 'ui-put-in'),
  guide: {
  step: (k, n) => tl(lang, 'ui-guide-step', { k: String(k), n: String(n) }),
  skip: tl(lang, 'ui-guide-skip'),
  weigh: (again) => (again ? tl(lang, 'ui-guide-weigh') : tl(lang, 'ui-guide-weigh-2')),
  level: (again, waited) => (waited ? tl(lang, 'ui-guide-level') : again ? tl(lang, 'ui-guide-level-2') : tl(lang, 'ui-guide-level-3')),
  add: (w) => tl(lang, 'ui-guide-add', { w }),
  dissolve: (w) => tl(lang, 'ui-guide-dissolve', { w }),
  hang: (w, into) => (into === 'air' ? tl(lang, 'ui-guide-hang', { w }) : tl(lang, 'ui-guide-hang-2', { w })),
  btnWeigh: tl(lang, 'ui-weigh-button'),
  btnLevel: tl(lang, 'ui-guide-btn-level'),
  btnAdd: (w) => tl(lang, 'ui-guide-btn-add', { w }),
  btnHang: (into) => (into === 'air' ? tl(lang, 'ui-guide-btn-hang') : tl(lang, 'ui-guide-btn-hang-2')),
  dropped: tl(lang, 'ui-guide-dropped'),
  floats: tl(lang, 'ui-guide-floats'),
  layer: (what, top) => tl(lang, 'ui-guide-layer', { what, where: top ? 'top' : 'bottom' }),
  mixed: (what) => tl(lang, 'ui-guide-mixed', { what }),
  inside: tl(lang, 'ui-guide-inside'),
  seeded: (w, c, t, warmed) => tl(lang, 'ui-guide-seeded-3', { c, w, t, value: warmed ? tl(lang, 'ui-guide-seeded') : tl(lang, 'ui-guide-seeded-2') }),
  dissolved: (w, salty) => tl(lang, 'ui-guide-dissolved-2', { w, value: salty ? tl(lang, 'ui-guide-dissolved') : '' }),
  saltLeft: (d, l, t, s, heat, hot, w) => tl(lang, 'ui-guide-salt-left-3', { d, l, t, s, w, value: heat ? tl(lang, 'ui-guide-salt-left') : tl(lang, 'ui-guide-salt-left-2', { hot }) }),
  btnDissolve: (w) => tl(lang, 'ui-guide-btn-dissolve', { w }),
  wait: (w) => tl(lang, 'ui-guide-wait', { w }),
  btnWait: (w) => `⏳ ${w}`,
  btnRun: (w, k) => `${k === 'heat' ? '🔥' : k === 'cool' ? '❄️' : k === 'current' ? '⚡' : '⏳'} ${w}`,
  fresh: (w) => tl(lang, 'ui-guide-fresh', { w: w.charAt(0).toLowerCase(), w2: w.slice(1) }),
  pour: (w, t) => tl(lang, 'ui-guide-pour', { w, t }),
  btnPour: (w, t) => tl(lang, 'ui-guide-btn-pour', { w, t }),
  running: tl(lang, 'ui-guide-running'),
  tableTitle: (rho) => tl(lang, 'ui-guide-table-title', { rho }),
  tableName: tl(lang, 'ui-substance'),
  tableDensity: tl(lang, 'ui-guide-table-density'),
  pick: tl(lang, 'ui-guide-pick'),
},
  instruments: tl(lang, 'ui-instruments'),
  renew: tl(lang, 'ui-renew'),
  goOn: { title: tl(lang, 'ui-go-on-title'), now: (action, will) => tl(lang, 'ui-go-on-now', { action, will }), first: tl(lang, 'ui-go-on-first'), change: tl(lang, 'ui-go-on-change'), repeatTitle: tl(lang, 'ui-go-on-repeat-title'), repeatText: tl(lang, 'ui-go-on-repeat-text'), repeat: tl(lang, 'ui-go-on-repeat') },
  sound: {
  on: tl(lang, 'ui-sound-on'),
  off: tl(lang, 'ui-sound-off'),
  musicOn: tl(lang, 'ui-music-on'),
  musicOff: tl(lang, 'ui-music-off'),
},
  voice: {
  label: tl(lang, 'ui-voice-label'),
  names: {
  toon: tl(lang, 'ui-names-toon'),
  speech: tl(lang, 'ui-names-speech'),
  none: tl(lang, 'ui-names-none'),
},
  sample: tl(lang, 'ui-voice-sample'),
  noSpeech: tl(lang, 'ui-voice-no-speech'),
},
  dissolves: tl(lang, 'ui-dissolves'),
  boardEmpty: tl(lang, 'ui-board-empty'),
  chartShow: tl(lang, 'ui-chart-show'),
  chartHide: tl(lang, 'ui-chart-hide'),
  boardFront: tl(lang, 'ui-board-front'),
  bubbleNext: tl(lang, 'ui-bubble-next'),
  bubbleBack: tl(lang, 'ui-bubble-back'),
  boardBack: tl(lang, 'ui-board-back'),
  quiz: {
  title: tl(lang, 'ui-quiz-title'),
  predictTitle: tl(lang, 'ui-quiz-predict-title'),
  rechoose: tl(lang, 'ui-quiz-rechoose'),
  noted: tl(lang, 'ui-quiz-noted'),
  right: (c) => tl(lang, 'ui-quiz-right', { c }),
  conclude: tl(lang, 'ui-quiz-conclude'),
  concludeAsk: tl(lang, 'ui-quiz-conclude-ask'),
  showAnswer: tl(lang, 'ui-quiz-show-answer'),
  concludedRight: (c) => tl(lang, 'ui-quiz-concluded-right', { c }),
  concludedWrong: (c, r) => tl(lang, 'ui-quiz-concluded-wrong', { c, r }),
  concludedOther: (c, r) => tl(lang, 'ui-quiz-concluded-other', { c, r }),
  wrong: (c, r) => tl(lang, 'ui-quiz-wrong', { c, r }),
  trickWrong: (c, r) => tl(lang, 'ui-quiz-trick-wrong', { c, r }),
  trickNone: (b, r) => tl(lang, 'ui-quiz-trick-none', { b: b.charAt(0).toLowerCase(), b2: b.slice(1, -1), r }),
  weighAir: (d) => tl(lang, 'ui-quiz-weigh-air', { d }),
  weighScales: (div, d) => tl(lang, 'ui-quiz-weigh-scales', { div, d }),
  weighShrink: tl(lang, 'ui-quiz-weigh-shrink'),
  weighHeat: tl(lang, 'ui-quiz-weigh-heat'),
  weighIce: tl(lang, 'ui-quiz-weigh-ice'),
  weighPot: (tare) => tl(lang, 'ui-quiz-weigh-pot', { tare }),
  weighQuestion: tl(lang, 'ui-quiz-weigh-question'),
  labels: {
  air: tl(lang, 'ui-labels-air'),
  scales: tl(lang, 'ui-labels-scales'),
  shrink: tl(lang, 'ui-labels-shrink'),
  heat: tl(lang, 'ui-labels-heat'),
  ice: tl(lang, 'ui-labels-ice'),
  pot: tl(lang, 'ui-labels-pot'),
},
},
  rec: {
  save: tl(lang, 'ui-rec-save'),
  namePlaceholder: tl(lang, 'ui-rec-name-placeholder'),
  saveConfirm: tl(lang, 'ui-rec-save-confirm'),
  cancel: tl(lang, 'ui-rec-cancel'),
  title: tl(lang, 'ui-rec-title'),
  empty: tl(lang, 'ui-rec-empty'),
  replay: tl(lang, 'ui-rec-replay'),
  download: tl(lang, 'ui-rec-download'),
  remove: '🗑',
  import: tl(lang, 'ui-rec-import'),
  importBad: (r) => tl(lang, 'ui-rec-import-bad', { r }),
  saved: (n) => tl(lang, 'ui-rec-saved', { n }),
  steps: (n) => tl(lang, 'count-steps', { n }),
  replaying: (n, i, k) => tl(lang, 'ui-rec-replaying', { n, i: String(i), k: String(k) }),
  replayDone: (n) => tl(lang, 'ui-rec-replay-done', { n }),
},
  answerTitle: tl(lang, 'ui-answer-title'),
  answerComputing: tl(lang, 'ui-answer-computing'),
  idle: {
  pace: [tl(lang, 'ui-idle-pace'), tl(lang, 'ui-idle-pace-2'), tl(lang, 'ui-idle-pace-3')],
  glasses: [tl(lang, 'ui-idle-glasses'), tl(lang, 'ui-idle-glasses-2'), tl(lang, 'ui-idle-glasses-3')],
  yawn: [tl(lang, 'ui-idle-yawn'), tl(lang, 'ui-idle-yawn-2')],
  sleep: [tl(lang, 'ui-idle-sleep'), tl(lang, 'ui-idle-sleep-2'), tl(lang, 'ui-idle-sleep-3')],
  chalk: (idea) => [tl(lang, 'ui-idle-chalk'), `…${idea.charAt(0).toLowerCase()}${idea.slice(1)}`, tl(lang, 'ui-idle-chalk-2')],
  tap: [tl(lang, 'ui-idle-tap'), tl(lang, 'ui-idle-tap-2')],
  coffee: [tl(lang, 'ui-idle-coffee'), tl(lang, 'ui-idle-coffee-2'), tl(lang, 'ui-idle-coffee-3')],
  fly: [tl(lang, 'ui-idle-fly'), tl(lang, 'ui-idle-fly-2'), tl(lang, 'ui-idle-fly-3'), tl(lang, 'ui-idle-fly-4'), tl(lang, 'ui-idle-fly-5'), tl(lang, 'ui-idle-fly-6')],
},
  emptyBoard: [tl(lang, 'ui-empty-board'), tl(lang, 'ui-empty-board-2'), tl(lang, 'ui-empty-board-3')],
  byTheWay: {
  say: tl(lang, 'ui-by-the-way-say'),
  button: tl(lang, 'ui-by-the-way-button'),
  fresh: tl(lang, 'ui-by-the-way-fresh'),
  loading: tl(lang, 'ui-by-the-way-loading'),
  more: tl(lang, 'ui-by-the-way-more'),
  close: tl(lang, 'ui-by-the-way-close'),
  title: tl(lang, 'ui-by-the-way-title'),
},
  reference: tl(lang, 'ui-reference'),
  lockedDuringExperiment: tl(lang, 'ui-locked-during-experiment'),
  shelfTabs: {
  sandbox: tl(lang, 'ui-shelf-tabs-sandbox'),
  experiments: tl(lang, 'ui-shelf-tabs-experiments'),
},
  presetsNone: tl(lang, 'ui-presets-none'),
  subjects: {
  physics: tl(lang, 'ui-subjects-physics'),
  chemistry: tl(lang, 'ui-subjects-chemistry'),
},
  grade: (n) => tl(lang, 'ui-grade', { n: String(n) }),
  forEveryone: tl(lang, 'ui-for-everyone'),
  presetStart: tl(lang, 'ui-start'),
  inProgramme: tl(lang, 'ui-in-programme'),
  programs: tl(lang, 'ui-programs'),
  topic: tl(lang, 'ui-topic'),
  presetMore: tl(lang, 'ui-more'),
  details: {
  aim: tl(lang, 'ui-details-aim'),
  takes: tl(lang, 'ui-details-takes'),
  steps: tl(lang, 'ui-details-steps'),
  topic: tl(lang, 'ui-topic'),
  formulas: tl(lang, 'ui-details-formulas'),
  related: tl(lang, 'ui-details-related'),
  labWork: (n) => tl(lang, 'ui-details-lab-work', { n }),
  experiment: tl(lang, 'ui-details-experiment'),
  conclusion: tl(lang, 'ui-details-conclusion'),
  conclusionHint: tl(lang, 'ui-details-conclusion-hint'),
  put: tl(lang, 'ui-details-put'),
  tubeWithSand: tl(lang, 'ui-details-tube-with-sand'),
  thermometer: tl(lang, 'ui-details-thermometer'),
  coil: tl(lang, 'ui-details-coil'),
  printed: tl(lang, 'ui-details-printed'),
  handwritten: tl(lang, 'ui-details-handwritten'),
},
  planNext: (s) => tl(lang, 'ui-plan-next', { s }),
  planAdd: (w, m) => tl(lang, 'ui-plan-add', { m, w }),
  planDone: tl(lang, 'ui-plan-done'),
  prof: {
  idle: tl(lang, 'ui-prof-idle'),
  goOn: (button) => tl(lang, 'ui-prof-go-on', { button }),
  bare: tl(lang, 'ui-prof-bare'),
  impossible: tl(lang, 'ui-prof-impossible'),
  heating: tl(lang, 'ui-prof-heating'),
  cooling: tl(lang, 'ui-prof-cooling'),
  boiling: tl(lang, 'ui-prof-boiling'),
  freezing: tl(lang, 'ui-prof-freezing'),
  melting: tl(lang, 'ui-prof-melting'),
  meltingDry: tl(lang, 'ui-prof-melting-dry'),
  current: tl(lang, 'ui-prof-current'),
  currentPlating: tl(lang, 'ui-prof-current-plating'),
  chlorine: tl(lang, 'ui-prof-chlorine'),
  noCurrent: tl(lang, 'ui-prof-no-current'),
  reached: tl(lang, 'ui-prof-reached'),
  failed: tl(lang, 'ui-prof-failed'),
  smoke: tl(lang, 'ui-prof-smoke'),
},
  volts: tl(lang, 'ui-volts'),
  amps: tl(lang, 'ui-amps'),
  duration: tl(lang, 'ui-duration'),
  current: tl(lang, 'ui-current'),
  supplyDetails: (u, r) => tl(lang, 'ui-supply-details-2', { u, r: r ? tl(lang, 'ui-supply-details', { r }) : '' }),
  noCurrent: tl(lang, 'ui-no-current'),
  gases: (l) => tl(lang, 'ui-gases', { l }),
  batteryFlat: tl(lang, 'ui-battery-flat'),
  supplyEnergy: (e) => tl(lang, 'ui-supply-energy', { e }),
  supplyHeat: tl(lang, 'ui-supply-heat'),
  supplyChemistry: tl(lang, 'ui-supply-chemistry'),
  supplyInside: tl(lang, 'ui-supply-inside'),
  meltLine: tl(lang, 'ui-melt-line'),
  boilLine: tl(lang, 'ui-boil-line'),
  targetLine: tl(lang, 'ui-target-line'),
  addTitle: tl(lang, 'ui-add-title'),
  choose: {
  put: tl(lang, 'ui-choose-put'),
  pour: tl(lang, 'ui-choose-pour'),
  putIn: tl(lang, 'ui-choose-put-in'),
  change: tl(lang, 'ui-quiz-rechoose'),
  what: tl(lang, 'ui-choose-what'),
  build: tl(lang, 'ui-choose-build'),
  add: tl(lang, 'ui-choose-add'),
  actionButton: tl(lang, 'ui-choose-action-button'),
  close: tl(lang, 'ui-by-the-way-close'),
  prev: tl(lang, 'ui-choose-prev'),
  next: tl(lang, 'ui-choose-next'),
  open: tl(lang, 'ui-choose-open'),
},
  addButton: tl(lang, 'ui-choose-add'),
  addLiquid: tl(lang, 'ui-liquid'),
  addFrozen: tl(lang, 'ui-add-frozen'),
  addAmount: tl(lang, 'ui-add-amount'),
  addTemp: tl(lang, 'ui-add-temp'),
  addDoesNotFit: (f) => tl(lang, 'ui-add-does-not-fit', { f }),
  addedState: (n, p) => tl(lang, 'ui-added-state-2', { n, p: p > 0 ? tl(lang, 'ui-solid-share', { p: String(p) }) : tl(lang, 'ui-added-state') }),
  phaseFreezing: (t, p) => tl(lang, 'ui-phase-freezing', { t, p: String(p) }),
  phaseMelting: (t, p) => tl(lang, 'ui-phase-melting', { t, p: String(p) }),
  phaseMeltingDry: (t, p) => tl(lang, 'ui-phase-melting-dry', { t, p: String(p) }),
  furnaceSetpoint: tl(lang, 'ui-furnace-setpoint'),
  phaseBoiling: (t, l) => tl(lang, 'ui-phase-boiling', { t, l }),
  expectNone: tl(lang, 'ui-expect-none'),
  expectPrediction: tl(lang, 'ui-expect-prediction'),
  expectGoal: tl(lang, 'ui-expect-goal'),
  expectMinutes: tl(lang, 'ui-expect-minutes'),
  expectHint: tl(lang, 'ui-expect-hint'),
  computing: tl(lang, 'ui-computing'),
  title: tl(lang, 'ui-title'),
  language: tl(lang, 'ui-language'),
  level: tl(lang, 'ui-level'),
  setup: tl(lang, 'ui-setup'),
  device: tl(lang, 'ui-device'),
  model: tl(lang, 'ui-model'),
  vessel: tl(lang, 'ui-vessel'),
  size: tl(lang, 'ui-size'),
  material: tl(lang, 'ui-material'),
  lid: tl(lang, 'ui-lid'),
  vesselMass: tl(lang, 'ui-vessel-mass'),
  about: tl(lang, 'ui-about'),
  safety: tl(lang, 'ui-safety'),
  ml: tl(lang, 'ui-ml'),
  water: tl(lang, 'ui-water'),
  startTemp: tl(lang, 'ui-start-temp'),
  room: tl(lang, 'ui-room'),
  apply: tl(lang, 'ui-apply'),
  experiment: tl(lang, 'ui-details-experiment'),
  start: tl(lang, 'ui-start-2'),
  startNeedsSomething: tl(lang, 'ui-start-needs-something'),
  continueStep: tl(lang, 'ui-continue-step'),
  sideFold: tl(lang, 'ui-side-fold'),
  sideUnfold: tl(lang, 'ui-side-unfold'),
  shelfFold: tl(lang, 'ui-side-fold'),
  shelfUnfold: tl(lang, 'ui-shelf-unfold'),
  offerTitle: tl(lang, 'ui-offer-title'),
  offerStop: tl(lang, 'ui-offer-stop'),
  offerAfterStall: tl(lang, 'ui-offer-after-stall'),
  offerAfterImpossible: tl(lang, 'ui-offer-after-impossible'),
  protocolTitle: tl(lang, 'ui-protocol-title'),
  protocolHint: tl(lang, 'ui-protocol-hint'),
  lookBack: (what) => tl(lang, 'ui-look-back', { what }),
  lookBackReturn: tl(lang, 'ui-look-back-return'),
  lookBackHint: tl(lang, 'ui-look-back-hint'),
  measuring: tl(lang, 'ui-measuring'),
  answerMissing: tl(lang, 'ui-answer-missing'),
  whyTitle: tl(lang, 'ui-why-title'),
  moreSteps: (n) => tl(lang, 'ui-more-steps', { n }),
  protocolNext: tl(lang, 'ui-protocol-next'),
  stepRunning: (e) => tl(lang, 'ui-step-running', { e }),
  stepReached: (t) => tl(lang, 'ui-step-reached', { t }),
  stepStopped: (t) => tl(lang, 'ui-step-stopped', { t }),
  stepFailed: tl(lang, 'ui-step-failed'),
  stepWaiting: tl(lang, 'ui-step-waiting'),
  added: (w, m) => `+ ${w}, ${m}`,
  pause: tl(lang, 'ui-pause'),
  reset: tl(lang, 'ui-reset'),
  speed: tl(lang, 'ui-speed'),
  time: tl(lang, 'ui-time'),
  waterTemp: tl(lang, 'ui-water-temp'),
  potTemp: tl(lang, 'ui-vessel'),
  power: tl(lang, 'ui-power'),
  off: tl(lang, 'ui-off'),
  on: tl(lang, 'ui-on'),
  min: tl(lang, 'ui-min'),
  max: tl(lang, 'ui-max'),
  boiled: (t) => tl(lang, 'ui-boiled', { t }),
  boilNote: tl(lang, 'ui-boil-note'),
  neverBoils: tl(lang, 'ui-never-boils'),
  energyTitle: tl(lang, 'ui-energy-title'),
  produced: (e) => tl(lang, 'ui-produced', { e }),
  shareBody: (n) => tl(lang, 'ui-share-body', { n }),
  shareSource: (n) => tl(lang, 'ui-share-source', { n }),
  shareRoom: tl(lang, 'ui-share-room'),
  shareVapour: tl(lang, 'ui-share-vapour'),
  explain: tl(lang, 'ui-explain'),
  explainHint: tl(lang, 'ui-explain-hint'),
  estimateBadge: tl(lang, 'ui-estimate-badge'),
  materials: {
  steel: tl(lang, 'ui-materials-steel'),
  aluminium: tl(lang, 'ui-materials-aluminium'),
  iron: tl(lang, 'ui-materials-iron'),
  glass: tl(lang, 'ui-materials-glass'),
},
  liters: tl(lang, 'ui-liters'),
  kg: tl(lang, 'ui-kg'),
  watt: tl(lang, 'ui-watt'),
  minutes: tl(lang, 'ui-minutes'),
  chartTime: tl(lang, 'ui-chart-time'),
  footer: tl(lang, 'ui-footer'),
}));
