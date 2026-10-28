import type { Subject } from '../src/knowledge/types.js';
import { createCommandRegistry, createExperimentSession, createSimulation, entityId, seconds, type ExperimentSession } from '../src/core/index.js';
import { celsius, kelvin, toCelsius } from '../src/core/units.js';
import { bodyMass, createThermalSolver, energySplit, isBurner, isHeater, isThermalBody, liquidConcentration, solubilityAt, solubilityPer100, soluteBehaviour, solutionDensity, THERMAL_COMMANDS, type ThermalBody } from '../src/domains/thermal/index.js';
import {
  childrenOf,
  COOLERS,
  HEATERS,
  itemsUnder,
  powerAt,
  canHeat,
  typicalVesselMass,
  VESSELS,
  vesselGeometry,
  type CoolerId,
  type EquipmentItem,
  type HeaterId,
  type VesselId,
  EQUIPMENT,
  ELECTRODE_MATERIALS,
  type ElectrodeMaterial,
} from '../src/equipment/index.js';
import { buildMeasuredReport, buildReport, entityLabel, formatDuration, formatQuantity, renderHtml, sig, type Block, type ExplainContext } from '../src/explain/index.js';
import { isLocale, LOCALES, tr, type Locale, type LocalizedText } from '../src/knowledge/i18n.js';
import { LEVEL_INFO, LEVELS, textFor, type Level } from '../src/knowledge/levels.js';
import { getCurriculum } from '../src/knowledge/curricula.js';
import { getSource } from '../src/knowledge/sources.js';
import {
  actionUses,
  LAB_ACTIONS,
  LAB_COMMANDS,
  labCourse,
  boardLines,
  measuredLines,
  stepPlace,
  formatReading,
  weigh,
  weighingsOf,
  readingsOf,
  formatMeasured,
  pieceShare,
  floatsInside,
  tubeGlass,
  sandFull,
  TUBE_DIAMETER,
  TUBE_LENGTH,
  ROLL_PATH,
  THREAD_LENGTH,
  PENDULUM_BALLS,
  SLOPE_LENGTH,
  AMMETER,
  ZERO_METER,
  sinkLiquidName,
  type SinkLiquid,
  VOLTMETER,
  stepCommand,
  OPERATIONS,
  BENCH_TEXT,
  BENCH_SETUP,
  defaultValues,
  parsePlace,
  withValues,
  type PresetValues,
  balanceWeights,
  weightsText,
  BENCH_BLOCK,
  BENCH_SPRING_L0,
  LAB_COOLER_ID,
  LAB_HEATER_ID,
  LAB_VESSEL_ID,
  LAB_SUPPLY_ID,
  labCautions,
  labGoalReached,
  labImpossibility,
  labSetup,
  labStatus,
  labSubject,
  labDebrief,
  goalOptions,
  type LabExpectation,
  labSummary,
  stepOutcome,
  SAMPLE_ID,
  type LabAction,
  type LabParams,
  type LabStatus,
  configureStep,
  recordingOf,
  replayStep,
  parseRecording,
  type Recording,
  type ReplayStep,
  PRESET_ANSWERS,
  type PresetAnswer,
  fitChoices,
  isDrySample,
  substancesFor,
  vesselsFor,
  addableTo,
  PRESETS,
  PRESET_GRADES,
  nearestRows,
  needsThermometer,
  presetAsk,
  guidedPlan,
  freshParams,
  stepParams,
  presetPrograms,
  presetSubjects,
  presetGradesIn,
  presetTopicIn,
  type Preset,
  type ProtocolStep,
  LAB_KNOWLEDGE,
  type LabCommand,
  sampleOf,
  labFixes,
  labProgress,
  noProgress,
  stallFixes,
  type LabFix,
} from '../src/scenarios/index.js';
import type { ExperimentResult } from '../src/core/experiment.js';
import type { SystemState } from '../src/core/state.js';
import { COMPONENTS, NACL_SOLUTE, type ComponentId } from '../src/components/index.js';
import { cellReaction, cellReading, createElectricalSolver, ELECTRICAL_COMMANDS, GAS_CONSTANT, isSupply, molesToMass } from '../src/domains/electrical/index.js';
import { SUPPLIES, supplyVoltage, type SupplyId } from '../src/equipment/supplies.js';
import { MASS_SCALE_IDS, SCALE_IDS, SCALES, type ScaleId } from '../src/equipment/scales.js';
import { SUBSTANCE_FAMILIES, SUBSTANCES, type SubstanceId, type SubstanceItem } from '../src/substances/index.js';
import { createChart } from './chart.js';
import { searchPlaces } from './place-search.js';
import { catalogHtml, catalogUi, pagePath, parsePath, presetDescription, SITE, type Route } from './site.js';
import { labSheetHtml as labSheetHtmlIn, planStepLabel as planStepLabelIn, predictsFirst, TOPIC_NUMBER, unspoiledSteps } from './experiment-sheet.js';
import { createKnob } from './knob.js';
import { aboutHtml, ABOUT_UI, BUG_TEXT, bugReport, bugUrl, DEVELOPER, SAFETY_LINE } from './about.js';
import { annotate, installFootnotes } from './terms.js';
import type { BenchView } from './graphics/scene/bench.js';
import { BUSY, SLIDE } from './graphics/scene/bench-motion.js';
import { filterLibrary, LIBRARY_PAGES, LIBRARY_UI, libraryHtml, libraryRoute } from './library.js';
import { createChooser, fly, type ChooserStage } from './chooser.js';
import { deviceSvg } from './graphics/scene/devices.js';
import { baseFor, vesselGeom } from './graphics/scene/vessels.js';
import { H, W } from './graphics/scene/constants.js';
import { createScene, incandescent, liquidColor, vesselPreview, type DeviceKind, type LiquidKind, type SceneView, type VesselShape } from './scene.js';
import { icon } from './graphics/icons/index.js';
import { ballSvg, blockSvg, bottleSvg } from './graphics/shelf/pictures.js';
import { createConsole } from './console.js';
import { fetchArticle, paperHtml } from './newspaper.js';
import { babble, canSpeak, currentVoice, fizz, hum, hush, plop, setSound, setVoice, soundOn, VOICE_IDS, type VoiceId } from './sounds/index.js';
import { referenceHtml, type RefTarget } from './reference.js';
import { RECIPES, type RecipeId } from '../src/recipes/index.js';
import { UI } from './ui-text.js';

// ---------- persistent preferences (per browser, optional) ----------
const store = {
  get: (k: string): string | null => {
    try {
      return localStorage.getItem(`spark.${k}`);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string): void => {
    try {
      localStorage.setItem(`spark.${k}`, v);
    } catch {
      /* private mode etc. — preferences are optional */
    }
  },
};
const browserLocale = (): Locale => (navigator.language.toLowerCase().startsWith('en') ? 'en' : 'uk');
/** The page the address names (the site: /, /experiments/, /experiments/<id>/, the same under /en/). */
const where = parsePath(location.pathname);
let locale: Locale = (() => {
  // A page of the site is in the language of its address (it was found, or shared, in it); the lab's front door — as chosen before.
  if (where.locale) return where.locale;
  if (where.route.page !== 'lab') return 'uk';
  const s = store.get('locale');
  return s && isLocale(s) ? s : browserLocale();
})();
let level: Level = (() => {
  const s = store.get('level');
  return s && (LEVELS as readonly string[]).includes(s) ? (s as Level) : 'school';
})();

// ---------- DOM helpers ----------
const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Readonly<Record<string, unknown>> = {}, ...children: (Node | string)[]): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  Object.assign(e, props);
  e.append(...children);
  return e;
}
/** Replace an element's HTML only when it changed. */
function setHtml(sel: string, html: string) {
  const e = $(sel);
  if (e.innerHTML !== html && e.dataset['html'] !== html) {
    e.innerHTML = html;
    e.dataset['html'] = html;
  }
}
const round = (x: number, digits = 2) => Math.round(x * 10 ** digits) / 10 ** digits;

// ---------- experiment state ----------
const DT = seconds(0.5);
// The electrical solver runs first: it sets the Joule heat the thermal solver then spreads.
const simulation = createSimulation({ solvers: [createElectricalSolver(), createThermalSolver()], fixedDt: DT });
const commands = createCommandRegistry<LabCommand>(LAB_COMMANDS);

/** The sandbox as it starts (and starts again when the panel switches tabs). */
const SANDBOX_START: LabParams = {
  action: 'boil',
  substance: 'water',
  liters: 1,
  startTemp: 20,
  vessel: 'pot',
  size: 2,
  material: 'steel',
  lid: false,
  heater: { id: 'electric-hotplate', rating: 2000, knob: 0.7 },
  roomTemp: 20,
};
let params: LabParams = SANDBOX_START;
/** Remembered while the action switches between heating and cooling. */
let lastHeater: NonNullable<LabParams['heater']> = params.heater!;
let lastCooler: NonNullable<LabParams['cooler']> = { id: 'freezer', setpoint: -18 };
let lastSupply: NonNullable<LabParams['supply']> = { id: 'bench-supply', knob: 0.4 };

let session: ExperimentSession<LabCommand>;
/** State at the start of the current step (the whole experiment's start for step 1). */
let initialState: SystemState;
/** Finished steps of this experiment, oldest first; the current step is `session`. */
interface StepRecord {
  readonly params: LabParams;
  readonly result: ExperimentResult<LabCommand>;
  readonly status: LabStatus;
  readonly adds: readonly Added[];
}
interface Added {
  readonly what: LocalizedText;
  readonly mass: number; // kg
}
let history: StepRecord[] = [];
/** The current step's own settings (the shelf may already show the next step's). */
let stepP: LabParams = params;
/** Added during the current step / after it finished (those go to the next step). */
let stepAdds: Added[] = [];
let pendingAdds: Added[] = [];
/** The current step's record, frozen at the moment it finished. */
let doneRecord: Omit<StepRecord, 'adds'> | null = null;
/** A ready-made experiment in progress: its question and the steps still to do. */
let preset: Preset | null = null;
/** Setting the table up over it, thing by thing (see «choosing over the table»). */
type AssemblyStage = 'device' | 'vessel' | 'substance';
let assembly: { readonly stages: readonly AssemblyStage[]; at: number; readonly placed: Set<'device' | 'vessel' | 'liquid'> } | null = null;
/** The row of things to add during the experiment is shown. */
let adding = false;
/** Something has been set on the table: an experiment chosen, a thing taken from the shelf, a recording played. Before that it is empty. */
let tableSet = false;
/** The ready-made experiment as it was chosen: starting over begins it anew from this (its steps change params on the way). */
let presetGiven: Preset | null = null;
/** The values a ready-made experiment was started with (what may be changed in it before the start). */
let presetVals: PresetValues = {};
let plan: ProtocolStep[] = [];
/** The answer to a ready-made experiment's question, once its plan is done. */
let presetAnswer: PresetAnswer | 'computing' | null = null;
/** Changes that would make the goal reachable (offered with buttons). */
let fixes: LabFix[] | 'computing' = [];
let warnings: readonly LocalizedText[] = [];
let running = false;
let finished = false;
let speed = 60;
let acc = 0;
let lastFrame = 0;
/** Was a current flowing at the last render (the power supply humming)? */
let humFlowing = false;
let points: { sample: { t: number; v: number }[]; vessel: { t: number; v: number }[]; source: { t: number; v: number }[] } = { sample: [], vessel: [], source: [] };
let lastPointAt = -Infinity;
let checkpoint: { t: number; T: number; s: number; m: number } | null = null;
/** Headline of the finished (or stalled) experiment; re-rendered on language change. */
let headline: (() => Block[]) | null = null;
/** Optional prediction or goal: minutes to reach the action's goal. */
let expectKind: 'none' | 'prediction' | 'goal' = 'none';
let expectMinutes = 10;
let goalChoices: ReturnType<typeof goalOptions> | null | 'computing' = null;

const heaterItem = () => (params.heater ? HEATERS[params.heater.id] : undefined);
const vesselItem = () => VESSELS[params.vessel];
const substance = (): SubstanceItem => SUBSTANCES[params.substance];
const ctx = (): ExplainContext => ({ level, locale });
const t = () => UI[locale];
const currentPower = (knob: number) => {
  const h = heaterItem();
  if (!h || !params.heater) return 0;
  return canHeat(h, vesselItem(), params.material, params.size).ok ? powerAt(h, params.heater.rating, knob) : 0;
};

function sample() {
  const e = session.state.entities[entityId(SAMPLE_ID)];
  return e && isThermalBody(e) ? e : undefined;
}
function temperature(id: string): number | undefined {
  const e = session.state.entities[entityId(id)];
  return e && (isThermalBody(e) || isHeater(e)) ? e.state.temperature : undefined;
}

/** What the scene looked like at the end of each row of the protocol (a step, a measurement): to look at it again. */
let snapshots = new Map<string, SceneView>();
/** The row looked back at (its key), or null — the experiment as it is now. */
let lookingAt: string | null = null;
/** The row of the protocol whose end is on the scene now: a step just finished, a reading just taken. */
function liveRowKey(): string | null {
  if (running || instrumentBusy) return null;
  // (On the bench a row is a step that measured — the circuit reads two instruments in one; elsewhere a row is a reading.)
  const log = session.result().log;
  const rows = preset?.bench ? log.filter((e) => e.ok && readingsOf([e]).length).length : readingsOf(log).length;
  if (showingWeighing() || showingMeasure()) return `m:${history.length}:${rows - 1}`;
  return finished ? `s:${history.length}` : null;
}
/** A ready-made experiment led to its answer: it may go on freely from here (not on the bench: nothing is added there). */
const presetDone = () => !!preset?.guided && !plan.length && presetAnswer !== null && !preset.bench;
/**
 * Going on after the answer: the experiment is a free one from now on — the same vessel with what is in it,
 * the protocol and the board kept; its own question is answered.
 */
function goOnFreely() {
  if (!presetDone()) return;
  preset = null;
  plan = [];
  buildShelf();
}
/** A look at the board planned for later (when a guided procedure is measured out). */
let readTimer = 0;
/** After the last step: the readings stay on the instruments this long before the table moves aside for the board. */
const READ_BOARD_AFTER = 10_000;
/** The last step's instrument is still moving: the wait for the board starts once it is at rest. */
let readWhenSettled = false;
function readBoardSoon() {
  window.clearTimeout(readTimer);
  readTimer = window.setTimeout(() => {
    // (Not over a look back at an earlier step, nor once something runs again.)
    if (!lookingAt && !running) scene.read(true);
  }, READ_BOARD_AFTER);
}
/** A new experiment: fresh setup, empty protocol. */
function newSession() {
  // The Professor turns from the board back to the table, ready (a look at the board still due from the last one is off).
  window.clearTimeout(readTimer);
  readWhenSettled = false;
  scene.read(false);
  snapshots = new Map();
  lookingAt = null;
  answerShown = null;
  replaying = null;
  instrumentBusy = false;
  answerWhenSettled = false;
  history = [];
  pendingAdds = [];
  points = { sample: [], vessel: [], source: [] };
  lastPointAt = -Infinity;
  beginStep(labSetup(params));
}

/** Start a step from a placed state (the vessel already stands where this step needs it). */
function beginStep(placed: { readonly state: SystemState; readonly warnings: readonly LocalizedText[] }) {
  boardEpoch++;
  initialState = placed.state;
  warnings = placed.warnings;
  session = createExperimentSession<LabCommand>({ initial: initialState, simulation, commands, sampleEvery: seconds(10) });
  running = false;
  finished = false;
  headline = null;
  checkpoint = null;
  lastSolid = null;
  stepP = params;
  stepAdds = pendingAdds;
  pendingAdds = [];
  doneRecord = null;
  presetAnswer = null;
  fixes = labFixes(params);
  if (document.querySelector('#add summary')) buildAdd();
  acc = 0;
  record();
  $('#report').innerHTML = '';
  render();
}

const stepElapsed = () => session.state.time - initialState.time;
/** Has anything happened yet? (The page builds the shelf before the first session exists.) */
const experimentStarted = (): boolean => session !== undefined && (history.length > 0 || stepElapsed() > 0);

/** Close the current step (if it ran at all) and put it into the protocol. */
/** Put the vessel on the scales now (the button and the console); the reading goes to the log. */
function weighNow(scale: ScaleId): string {
  const entry = session.apply({ type: 'lab.weigh', scale });
  if (!entry.ok) return tr(entry.error, locale);
  lastWeigh = { at: session.state.time, step: session };
  boardEpoch++;
  render();
  return weighSay();
}
/** Read the marks or hang a body on the dynamometer now; the reading goes to the log. */
function measureNow(command: LabCommand): string {
  const entry = session.apply(command);
  if (!entry.ok) {
    lastMeasure = null;
    measureError = tr(entry.error, locale);
    render();
    return measureError;
  }
  measureError = '';
  lastMeasure = { at: session.state.time, step: session };
  // A circuit's key closed for a reading: the power supply hums for a moment, the louder the more current.
  if (command.type === 'lab.circuit' || command.type === 'lab.pair') {
    const amps = readingsOf([entry]).find((x) => x.record.quantity === 'current')?.record.value ?? 0;
    hum(0.3 + amps / 2, 1.6);
  }
  // An instrument that moves on the scene (a balance, a spring, a pulled block): its reading is told once it is at rest.
  instrumentBusy = entry.ok && command.type in BUSY && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  boardEpoch++;
  render();
  return measureSay();
}
/** An instrument on the scene is still on its way to its reading. */
let instrumentBusy = false;
let answerWhenSettled = false;
let lastMeasure: { readonly at: number; readonly step: ExperimentSession<LabCommand> } | null = null;
let measureError = '';
/** The mechanics bench of a preset, as its last reading left it: the spring with its weights, the block pulled or measured. */
/** The zero-centre milliammeter's reading: signed milliamperes («+26 мА», «−6 мА»). */
const inductShown = (v: number | null) => (v === null ? (locale === 'uk' ? 'зашкалює' : 'off the scale') : `${v > 0 ? '+' : ''}${formatMeasured('current', v * 1000, 1, locale).replace(/ (А|A)$/, '').replace('-', '−')} ${locale === 'uk' ? 'мА' : 'mA'}`);
function benchView(): BenchView | null {
  const kind = preset?.bench;
  if (!kind) return null;
  const log = session.result().log.filter((e) => e.ok);
  const last = [...log].reverse().find((e) => e.command.type in BENCH_TEXT || ['lab.hang', 'lab.read-level'].includes(e.command.type));
  // Reading the marks of a cylinder: the vessel itself is on the table.
  if (last?.command.type === 'lab.read-level') return null;
  const r = last ? readingsOf([last])[0]?.record : undefined;
  const c = last?.command as ({ type: string } & Record<string, unknown>) | undefined;
  const show = (q: 'force' | 'length', v: number | null | undefined) => formatMeasured(q, v ?? 0, q === 'force' ? 0.1 : 0.001, locale);
  const base = { kind, weights: 0, block: BENCH_BLOCK.edges } as const;
  // The circuit: the source's volts; the meters' needles and readings once the key is closed.
  if (kind === 'circuit') {
    const cc = c?.type === 'lab.circuit' ? (c as unknown as { source: number }) : undefined;
    const recs = last ? readingsOf([last]).map((x) => x.record) : [];
    const I = recs.find((x) => x.quantity === 'current');
    const U = recs.find((x) => x.quantity === 'voltage');
    return { ...base, kind, circuit: { source: cc?.source ?? 0, ...(cc && I && U ? { amps: { text: formatMeasured('current', I.value, 0.01, locale), share: (I.value ?? 0) / AMMETER.max.value }, volts: { text: formatMeasured('voltage', U.value, 0.1, locale), share: (U.value ?? 0) / VOLTMETER.max.value } } : {}) } };
  }
  // A body in a liquid: the vessel of the liquid this step used (or the next planned), the body at its last mark,
  // the stopwatch's last reading.
  if (kind === 'bubble' || kind === 'sink') {
    const sc = c?.type === 'lab.sink' ? (c as unknown as { body: 'bubble' | 'ball'; liquid: string; diameter: number; marks: number[] }) : undefined;
    const next = plan.find((s) => s.kind === 'bench' && s.command.type === 'lab.sink');
    const cmd = sc ?? (next?.kind === 'bench' ? (next.command as unknown as { body: 'bubble' | 'ball'; liquid: string; diameter: number; marks: number[] }) : undefined);
    const laps = last && sc ? readingsOf([last]).map((x) => x.record).filter((x) => x.quantity === 'time') : [];
    const lap = laps[laps.length - 1];
    const color = { 'washing-up': 'rgba(120,200,120,0.55)', glycerol: 'rgba(225,235,245,0.55)', 'sunflower-oil': 'rgba(240,200,80,0.6)', water: 'rgba(120,170,230,0.5)' }[cmd?.liquid ?? 'water'] ?? 'rgba(120,170,230,0.5)';
    const label = cmd ? (cmd.body === 'bubble' ? `${locale === 'uk' ? 'бульбашка' : 'bubble'} ≈ ${String(cmd.diameter * 1000).replace('.', locale === 'uk' ? ',' : '.')} ${locale === 'uk' ? 'мм' : 'mm'}` : tr({ uk: sinkLiquidName(cmd.liquid as SinkLiquid).uk, en: sinkLiquidName(cmd.liquid as SinkLiquid).en }, locale)) : undefined;
    return { ...base, kind, ...(lap ? { stopwatch: { display: formatMeasured('time', lap.value, 0.01, locale).replace(/ (с|s)$/, '') }, run: { seconds: lap.value ?? 0 } } : {}), sink: { body: cmd?.body ?? (kind === 'bubble' ? 'bubble' : 'ball'), color, marks: cmd?.marks ?? [], diameter: cmd?.diameter ?? 0.002, ...(lap ? { at: lap.inputs?.['mark'] ?? 0, speed: lap.inputs?.['speed'] ?? 0 } : {}), ...(label ? { label } : {}) } };
  }
  // Induction: the move this step made, the pole facing the coil, the meter's swing.
  if (kind === 'induct') {
    const ic = c?.type === 'lab.induct' ? (c as unknown as { move: 'still' | 'in' | 'out' | 'coil'; pole: 'N' | 'S' }) : undefined;
    const I = ic && r ? r.value : null;
    return { ...base, kind, induct: { move: ic?.move ?? 'none', pole: ic?.pole ?? 'N', swing: I === null ? 0 : I / ZERO_METER.max.value, ...(ic && r ? { read: inductShown(r.value) } : {}) } };
  }
  // The electromagnet: the current this step set, the nail in or out, the compass needle.
  if (kind === 'magnet') {
    const mc = c?.type === 'lab.magnet' ? (c as unknown as { current: number; core: boolean }) : undefined;
    const recs = last && mc ? readingsOf([last]).map((x) => x.record) : [];
    const I = recs.find((x) => x.quantity === 'current');
    const th = recs.find((x) => x.quantity === 'angle');
    return { ...base, kind, magnet: { current: mc?.current ?? 0, core: mc?.core ?? true, angle: th?.value ?? 0, ...(I ? { amps: formatMeasured('current', I.value, 0.01, locale) } : {}), ...(th ? { read: formatMeasured('angle', th.value, 1, locale) } : {}) } };
  }
  // Pascal's device: the vessel this step screwed on (or the next planned one), its water, the manometer.
  if (kind === 'vessels') {
    const vc = c?.type === 'lab.vessel' ? (c as unknown as { step: string; shape?: 'straight' | 'wide' | 'narrow'; height?: number }) : undefined;
    const next = plan.find((s) => s.kind === 'bench' && s.command.type === 'lab.vessel' && 'shape' in s.command);
    const shape = vc?.shape ?? (next?.kind === 'bench' ? (next.command as { shape?: 'straight' | 'wide' | 'narrow' }).shape : undefined);
    const recs = last && vc?.step === 'fill' ? readingsOf([last]).map((x) => x.record) : [];
    const V = recs.find((x) => x.quantity === 'volume');
    const M = recs.find((x) => x.quantity === 'length');
    return { ...base, kind, vessels: { ...(shape ? { shape } : {}), height: vc?.step === 'fill' ? (vc.height ?? 0) : 0, dh: M?.value ?? 0, ...(M ? { read: show('length', M.value) } : {}), ...(V ? { poured: formatMeasured('volume', V.value, 5e-6, locale) } : {}) } };
  }
  // The syringe: how far its plunger is out and whether its nozzle is shut; the barometer once it has been read.
  if (kind === 'atm') {
    const ac = c?.type === 'lab.atm' ? (c as unknown as { step: string; pulled?: number; air: number }) : undefined;
    const any = log.find((e) => e.command.type === 'lab.atm') ?? plan.find((s) => s.kind === 'bench' && s.command.type === 'lab.atm');
    const air = (any && 'command' in any ? (any.command as unknown as { air: number }).air : undefined) ?? 101_300;
    const b = log.find((e) => e.command.type === 'lab.atm' && (e.command as unknown as { step: string }).step === 'barometer');
    const baro = b ? readingsOf([b])[0]?.record.value : undefined;
    const pull = ac && (ac.step === 'open' || ac.step === 'sealed') && r ? show('force', r.value) : undefined;
    return { ...base, kind, atm: { pulled: ac?.step === 'sealed' ? (ac.pulled ?? 0) : ac?.step === 'open' ? 1 : 0, sealed: ac?.step === 'sealed', air, ...(pull ? { pull } : {}), ...(ac?.step === 'scale' && r ? { read: `l = ${show('length', r.value)}` } : {}), ...(baro != null ? { baro: formatMeasured('pressure', baro, 100, locale) } : {}) } };
  }
  // The hydraulic machine: the load on the wide piston (from this step, or the next one planned), the dynamometer.
  if (kind === 'press') {
    const pc = c?.type === 'lab.press' ? (c as unknown as { step: string; weights?: number }) : undefined;
    const next = plan.find((s) => s.kind === 'bench' && s.command.type === 'lab.press' && 'weights' in s.command);
    const weights = pc?.weights ?? (next?.kind === 'bench' ? ((next.command as { weights?: number }).weights ?? 0) : 0);
    const recs = last && pc ? readingsOf([last]).map((x) => x.record) : [];
    const read = pc?.step === 'diameters' ? `d₁ = ${formatMeasured('length', recs[0]?.value ?? 0, 0.001, locale)}, d₂ = ${formatMeasured('length', recs[1]?.value ?? 0, 0.001, locale)}` : pc?.step === 'travel' ? `l₂ = ${formatMeasured('length', recs[0]?.value ?? 0, 0.001, locale)}` : undefined;
    return { ...base, kind, press: { weights, pushed: pc?.step === 'travel' ? 1 : 0, ...(pc?.step === 'lift' && r ? { pull: show('force', r.value) } : {}), ...(read ? { read } : {}) } };
  }
  // The U-tube: water poured once the first step is done; the oil's and the water's columns as the ruler read them.
  if (kind === 'utube') {
    const uc = c?.type === 'lab.utube' ? (c as unknown as { poured: number }) : undefined;
    const recs = last && uc ? readingsOf([last]).map((x) => x.record) : [];
    const hO = recs.find((x) => x.inputs?.['which'] === 1)?.value ?? 0;
    const hW = recs.find((x) => x.inputs?.['which'] === 0)?.value ?? 0;
    const cmT = (m: number) => formatMeasured('length', m, 0.001, locale);
    const read = !uc ? undefined : uc.poured === 0 ? `Δh = ${cmT(recs[0]?.value ?? 0)}` : `${cmT(hO)} / ${cmT(hW)}`;
    return { ...base, kind, utube: { water: !!uc, oil: hO, over: hW, ...(read ? { read } : {}) } };
  }
  // The pressure at a depth: the funnel where this step put it, the manometer's Δh; the liquid's own colour.
  if (kind === 'depth') {
    const dc = c?.type === 'lab.depth' ? (c as unknown as { depth: number; sideways?: boolean }) : undefined;
    const liquid = params.substance as SubstanceId;
    const color = liquid === 'sunflower-oil' ? 'rgba(232,190,60,0.6)' : liquid.startsWith('salt-water') ? 'rgba(150,190,225,0.6)' : 'rgba(120,170,230,0.55)';
    return { ...base, kind, depth: { depth: dc?.depth ?? 0, sideways: !!dc?.sideways, dh: dc && r ? (r.value ?? 0) : 0, color, ...(dc && r ? { display: formatMeasured('length', r.value, 0.001, locale) } : {}) } };
  }
  // The black box: the source, which way the box stands, the milliammeter in mA (a tenth).
  if (kind === 'box') {
    const bc = c?.type === 'lab.box' ? (c as unknown as { source: number; reversed: boolean }) : undefined;
    const planned = preset?.plan?.find((s) => s.kind === 'bench' && s.command.type === 'lab.box');
    const first = planned?.kind === 'bench' ? (planned.command as { source: number }).source : 0;
    const mA = bc && r && r.value !== null ? (r.value * 1000).toFixed(1).replace('.', locale === 'uk' ? ',' : '.') : undefined;
    return { ...base, kind, box: { source: bc?.source ?? first, reversed: !!bc?.reversed, ...(mA !== undefined ? { display: mA } : {}) } };
  }
  // Two resistors: the instruments where this step reads them.
  if (kind === 'series' || kind === 'parallel') {
    const pc = c?.type === 'lab.pair' ? (c as unknown as { source: number; at: 'r1' | 'r2' | 'both' }) : undefined;
    const recs = last ? readingsOf([last]).map((x) => x.record) : [];
    const I = recs.find((x) => x.quantity === 'current');
    const U = recs.find((x) => x.quantity === 'voltage');
    const first = preset?.plan?.[0];
    const source = pc?.source ?? (first?.kind === 'bench' && first.command.type === 'lab.pair' ? first.command.source : 0);
    return { ...base, kind, pair: { source, at: pc?.at ?? 'r1', ...(pc && I && U ? { amps: { text: formatMeasured('current', I.value, 0.01, locale), share: (I.value ?? 0) / AMMETER.max.value }, volts: { text: formatMeasured('voltage', U.value, 0.1, locale), share: (U.value ?? 0) / VOLTMETER.max.value } } : {}) } };
  }
  // The lever: what hangs on it, the dynamometer's reading, how it tips.
  if (kind === 'lever') {
    const lc = c?.type === 'lab.lever' ? (c as unknown as { left: { weights: number; at: number }; right: { weights?: number; at: number; dynamometer?: true } }) : undefined;
    return { ...base, kind, ...(lc && r ? { lever: { left: lc.left, right: lc.right.dynamometer ? { at: lc.right.at, dynamometer: show('force', r.value) } : { at: lc.right.at, weights: lc.right.weights ?? 0 }, tip: r.inputs?.['tip'] ?? 0 } } : {}) };
  }
  // The motion bench: the groove, the body on a thread, the pendulum — the stopwatch with the time read, the run to play.
  const sec = (x: number | null | undefined) => formatMeasured('time', x ?? 0, 0.01, locale);
  const tapeShown = c?.type === 'lab.tape' && r ? { tape: show('length', r.value) } : {};
  if (kind === 'incline') {
    const roll = c?.type === 'lab.roll' && r;
    const stop = roll ? Number(c!['path']) / ROLL_PATH : 1;
    // As high as the experiment raises the groove (before the first roll too).
    const planned = preset?.plan?.find((s) => s.kind === 'bench' && s.command.type === 'lab.roll');
    const raise = (roll ? (c as { raise?: number }).raise : undefined) ?? (planned?.kind === 'bench' ? (planned.command as { raise?: number }).raise : undefined);
    return { ...base, kind, incline: { stop, ball: roll ? 1 : 0, ...(raise ? { raise } : {}) }, stopwatch: { display: sec(roll ? r!.value : 0) }, ...tapeShown, ...(roll ? { run: { seconds: r!.exact ?? r!.value ?? 0 } } : {}) };
  }
  if (kind === 'circle') {
    const whirl = c?.type === 'lab.whirl' && r;
    const thread = whirl ? Number(c!['thread']) : THREAD_LENGTH.value;
    return { ...base, kind, circle: { thread, angle: 0 }, stopwatch: { display: sec(whirl ? r!.value : 0) }, ...(whirl ? { run: { seconds: r!.exact ?? r!.value ?? 0, period: r!.inputs?.['period'] ?? 1, count: Number(c!['turns']) } } : {}) };
  }
  if (kind === 'pendulum') {
    const swing = c?.type === 'lab.swing' && r;
    const prev = [...log].reverse().find((e) => e.command.type === 'lab.swing')?.command as { length?: number; mass?: number } | undefined;
    const length = swing ? Number(c!['length']) : c?.type === 'lab.tape' ? Number(c['length']) : (prev?.length ?? 1);
    const mass = swing ? Number(c!['mass']) : (prev?.mass ?? PENDULUM_BALLS.light);
    return { ...base, kind, pendulum: { length, angle: 0, mass }, stopwatch: { display: sec(swing ? r!.value : 0) }, ...tapeShown, ...(swing ? { run: { seconds: r!.exact ?? r!.value ?? 0, period: r!.inputs?.['period'] ?? 2, count: Number(c!['count']), amplitude: Math.asin(Number(c!['amplitude']) / length) } } : {}) };
  }
  if (kind === 'spring') {
    const n = c?.type === 'lab.stretch' ? Number(c['weights']) : 0;
    return { ...base, weights: n, springLength: r?.exact ?? BENCH_SPRING_L0, ...(r?.inputs?.['k'] ? { stiffness: r.inputs['k'] } : {}), ...(r ? { reading: `l = ${show('length', r.value)}` } : {}) };
  }
  if (kind === 'balance') {
    const b = c?.type === 'lab.balance' ? (c as unknown as { what: string; substance?: string; label?: { uk: string; en: string } }) : undefined;
    const set = r?.value != null && b ? (balanceWeights(r.value) ?? []) : [];
    return { ...base, ...(b ? { balance: { load: b.what === 'body' ? 'body' : b.what === 'vessel' ? 'full' : 'empty', color: BODY_COLOR[b.substance ?? ''] ?? '#9aa1a8', weights: set, ...(r && r.value !== null ? { mass: r.exact } : {}), display: r?.value != null ? `${weightsText(set, locale === 'uk')} = ${formatMeasured('mass', r.value, 0.00001, locale)}` : '' } } : {}) };
  }
  if (c?.type === 'lab.hang' && r) return { ...base, hang: show('force', r.value) };
  // The slope: raised so high, the block pulled up to the top with the dynamometer's reading.
  if (kind === 'slope') {
    const sc = c?.type === 'lab.slope' && r ? (c as unknown as { height: number; weights?: number }) : undefined;
    // So many weights on the block as the experiment puts there (before the first pull too).
    const planned = preset?.plan?.find((s) => s.kind === 'bench' && s.command.type === 'lab.slope');
    const weights = sc?.weights ?? (planned?.kind === 'bench' ? (planned.command as { weights?: number }).weights : undefined) ?? 2;
    return { ...base, kind, slope: { height: sc?.height ?? 0, length: SLOPE_LENGTH.value, up: sc ? 1 : 0, weights }, ...(sc ? { pull: show('force', r!.value) } : {}) };
  }
  if (kind === 'friction') return c?.type === 'lab.pull' && r ? { ...base, weights: Number(c['weights']), pull: show('force', r.value), slide: SLIDE } : base;
  return c?.type === 'lab.edge' && r ? { ...base, edge: { index: Number(c['edge']) as 0 | 1 | 2, display: show('length', r.value) } } : base;
}
/** The latest level reading or dynamometer reading while nothing has happened since. */
function showingMeasure() {
  if (!lastMeasure || lastMeasure.step !== session || running || session.state.time !== lastMeasure.at) return null;
  const l = session.result().log;
  const last = l[l.length - 1];
  if (!last?.ok || !(last.command.type in BENCH_TEXT || ['lab.read-level', 'lab.hang'].includes(last.command.type))) return null;
  return readingsOf([last])[0] ?? null;
}
/** The multimeter's display: the coil's latest reading in this experiment, or dashes before the first. */
function ohmShown(): string {
  const last = [...allReadings()].reverse().find((x) => x.command.type === 'lab.ohm');
  return last && last.record.value !== null ? formatMeasured('resistance', last.record.value, last.record.inputs?.['division'] ?? 0.01, locale).replace(/\s*(Ом|Ω)$/, '') : '-.--';
}
/** Everything measured in this experiment, in order. */
function allReadings() {
  return [...history.map((h) => h.result.log), session.result().log].flatMap((l) => readingsOf(l));
}
const nameOfBody = (id: string) => tr(SUBSTANCES[id as SubstanceId]?.name ?? { uk: id, en: id }, locale);
/** What the Professor says about the latest level or dynamometer reading. */
function measureSay(): string {
  const u = t().measure;
  const m = showingMeasure();
  if (!m) return '';
  const all = allReadings();
  const i = all.findIndex((x) => x.record === m.record);
  const r = m.record;
  if (m.command.type === 'lab.read-level') {
    const div = r.inputs?.['division'] ?? 1e-6;
    const prev = [...all.slice(0, i)].reverse().find((x) => x.record.quantity === 'volume' && x.record.value !== null);
    const rise = prev && r.value !== null && r.value - prev.record.value! > div / 2 ? formatMeasured('volume', r.value - prev.record.value!, div, locale) : null;
    return u.levelSay(formatMeasured('volume', r.value, div, locale), rise);
  }
  // The bench: the ruler at the spring or the block, the dynamometer pulling the block.
  const uk = locale === 'uk';
  if (instrumentBusy && BUSY[m.command.type]) return tr(BUSY[m.command.type]!, locale);
  const cm = (x: number) => formatMeasured('length', x, 0.001, locale);
  if (m.command.type === 'lab.stretch') {
    const n = (m.command as { weights: number }).weights;
    const l0 = [...all.slice(0, i)].find((x) => x.command.type === 'lab.stretch' && (x.command as { weights: number }).weights === 0)?.record.value;
    if (n === 0 || r.value === null) return uk ? `Довжина пружини без вантажу l₀ = ${cm(r.value ?? 0)}.` : `The spring’s length with no load l₀ = ${cm(r.value ?? 0)}.`;
    const x = l0 !== undefined && l0 !== null ? r.value - l0 : null;
    return uk ? `З ${n === 1 ? 'тягарцем' : `${n} тягарцями`} пружина завдовжки l = ${cm(r.value)}${x !== null ? `: видовження x = l − l₀ = ${cm(x)}` : ''}.` : `With ${n === 1 ? 'one weight' : `${n} weights`} the spring is l = ${cm(r.value)} long${x !== null ? `: the extension x = l − l₀ = ${cm(x)}` : ''}.`;
  }
  if (m.command.type === 'lab.pull') {
    const n = (m.command as { weights: number }).weights;
    return uk ? `Брусок${n ? ` із ${n} тягарц${n === 1 ? 'ем' : 'ями'}` : ''} ковзає рівномірно — динамометр показує ${formatMeasured('force', r.value, 0.1, locale)}. Це і є сила тертя ковзання.` : `The block${n ? ` with ${n} weight${n === 1 ? '' : 's'}` : ''} slides steadily — the dynamometer shows ${formatMeasured('force', r.value, 0.1, locale)}. That is the force of sliding friction.`;
  }
  if (m.command.type === 'lab.balance') {
    if (r.value === null) return uk ? 'Важків із набору не вистачає — тіло завелике для цих терезів (до 211 г).' : 'The set of weights is not enough — the load is too heavy for this balance (up to 211 g).';
    const set = balanceWeights(r.value) ?? [];
    return uk ? `Терези в рівновазі: ${weightsText(set, true)} = ${formatMeasured('mass', r.value, 0.00001, locale)}.` : `The balance is level: ${weightsText(set, false)} = ${formatMeasured('mass', r.value, 0.00001, locale)}.`;
  }
  // The motion bench: what the tape and the stopwatch showed.
  const sec = (x: number | null) => formatMeasured('time', x ?? 0, 0.01, locale);
  const cmd = m.command as unknown as Record<string, number | string>;
  if (m.command.type === 'lab.circuit' || m.command.type === 'lab.pair') {
    const recs = readingsOf([session.result().log[session.result().log.length - 1]!]).map((x) => x.record);
    const I = recs.find((x) => x.quantity === 'current')?.value ?? 0;
    const U = recs.find((x) => x.quantity === 'voltage')?.value ?? 0;
    return uk ? `Ключ замкнено: амперметр показує ${formatMeasured('current', I, 0.01, locale)}, вольтметр — ${formatMeasured('voltage', U, 0.1, locale)}.` : `The key is closed: the ammeter shows ${formatMeasured('current', I, 0.01, locale)}, the voltmeter ${formatMeasured('voltage', U, 0.1, locale)}.`;
  }
  if (m.command.type === 'lab.slope') return uk ? `Брусок іде вгору рівномірно — динамометр показує ${formatMeasured('force', r.value, 0.1, locale)}.` : `The block goes up steadily — the dynamometer shows ${formatMeasured('force', r.value, 0.1, locale)}.`;
  if (m.command.type === 'lab.lever') {
    if (r.instrument === 'dynamometer') return uk ? `Важіль горизонтально — динамометр показує ${formatMeasured('force', r.value, 0.1, locale)}.` : `The lever is level — the dynamometer shows ${formatMeasured('force', r.value, 0.1, locale)}.`;
    const tip = r.inputs?.['tip'] ?? 0;
    return tip === 0 ? (uk ? 'Важіль у рівновазі — стоїть горизонтально!' : 'The lever balances — it stands level!') : uk ? `Важіль переважує ${tip < 0 ? 'ліворуч' : 'праворуч'}.` : `The lever tips to the ${tip < 0 ? 'left' : 'right'}.`;
  }
  if (m.command.type === 'lab.tape') return uk ? `${cmd['what'] === 'path' ? 'Шлях кульки' : 'Довжина маятника'}: l = ${cm(r.value ?? 0)}.` : `${cmd['what'] === 'path' ? 'The ball’s path' : 'The pendulum’s length'}: l = ${cm(r.value ?? 0)}.`;
  if (m.command.type === 'lab.roll') return uk ? `Кулька докотилася до циліндра за ${sec(r.value)}.` : `The ball reached the cylinder in ${sec(r.value)}.`;
  if (m.command.type === 'lab.whirl') return uk ? `${cmd['turns']} обертів — ${sec(r.value)}: один оберт ≈ ${sig((r.value ?? 0) / Number(cmd['turns']), 3, locale)} с.` : `${cmd['turns']} turns — ${sec(r.value)}: one turn ≈ ${sig((r.value ?? 0) / Number(cmd['turns']), 3, locale)} s.`;
  if (m.command.type === 'lab.swing') return uk ? `${cmd['count']} коливань — ${sec(r.value)}: одне коливання ≈ ${sig((r.value ?? 0) / Number(cmd['count']), 3, locale)} с.` : `${cmd['count']} swings — ${sec(r.value)}: one swing ≈ ${sig((r.value ?? 0) / Number(cmd['count']), 3, locale)} s.`;
  if (m.command.type === 'lab.edge') {
    const e = (m.command as { edge: number }).edge;
    const what = uk ? ['Довжина', 'Ширина', 'Висота'][e] : ['Length', 'Width', 'Height'][e];
    return `${what} ${uk ? 'бруска' : 'of the block'}: ${cm(r.value ?? 0)}.`;
  }
  // The coil on the multimeter: its resistance at the water's temperature, and how much it grew since the first reading.
  if (m.command.type === 'lab.ohm') {
    const Om = (x: number) => formatMeasured('resistance', x, r.inputs?.['division'] ?? 0.01, locale);
    const t = sig(r.inputs?.['temperature'] ?? 20, 3, locale);
    const first = all.find((x) => x.command.type === 'lab.ohm' && x.record.value !== null);
    if (r.value === null) return '';
    if (!first || first.record === r) return uk ? `Вода — ${t} °C, мультиметр показує R = ${Om(r.value)}.` : `The water is at ${t} °C, the multimeter shows R = ${Om(r.value)}.`;
    const dr = r.value - first.record.value!;
    return uk ? `Вода — ${t} °C, а опір уже ${Om(r.value)}: на ${Om(dr)} більше, ніж спочатку.` : `The water is at ${t} °C, and the resistance is ${Om(r.value)}: ${Om(dr)} more than at first.`;
  }
  // The cathode on the balance: its mass, and after the current — how much heavier it came out.
  if (m.command.type === 'lab.cathode') {
    const g = (x: number) => formatReading('lab-balance', x, locale);
    const before = [...all.slice(0, i)].reverse().find((x) => x.command.type === 'lab.cathode' && x.record.value !== null);
    if (r.value === null) return '';
    if (!before) return uk ? `Катод (пластина «−») важить ${g(r.value)}.` : `The cathode (the “−” plate) weighs ${g(r.value)}.`;
    const dm = r.value - before.record.value!;
    return uk ? `Тепер катод важить ${g(r.value)} — на ${g(dm)} більше: на ньому осіла мідь.` : `Now the cathode weighs ${g(r.value)} — ${g(dm)} more: copper has settled on it.`;
  }
  // A body in a liquid: the last mark's time — and the speed it gives.
  if (m.command.type === 'lab.sink') {
    const sc = m.command as { body: string };
    const laps = readingsOf([...session.result().log].reverse().filter((e) => e.ok && e.command.type === 'lab.sink').slice(0, 1)).map((x) => x.record).filter((x) => x.quantity === 'time');
    const lp = laps[laps.length - 1];
    if (!lp) return '';
    const s = Math.round((lp.inputs?.['mark'] ?? 0) * 100);
    const T = formatMeasured('time', lp.value, 0.01, locale);
    return sc.body === 'bubble' ? (uk ? `Бульбашка пройшла ${s} см за ${T}.` : `The bubble went ${s} cm in ${T}.`) : uk ? `Кулька пройшла ${s} см за ${T}.` : `The ball went ${s} cm in ${T}.`;
  }
  // Induction: the needle's swing — which way and how far.
  if (m.command.type === 'lab.induct') {
    const ic = m.command as { move: string };
    const v = r.value ?? 0;
    if (Math.abs(v) < 1e-9) return ic.move === 'still' ? (uk ? 'Магніт не рухається — стрілка стоїть на нулі.' : 'The magnet does not move — the needle stays at zero.') : uk ? 'Стрілка ледь здригнулася.' : 'The needle hardly twitched.';
    return uk ? `Стрілка відхилилася ${v > 0 ? 'вправо' : 'вліво'}: ${inductShown(v)}.` : `The needle swung to the ${v > 0 ? 'right' : 'left'}: ${inductShown(v)}.`;
  }
  // The electromagnet: the compass needle's turn — and which way.
  if (m.command.type === 'lab.magnet') {
    const mc = m.command as { current: number; core: boolean; reversed?: boolean };
    const th = readingsOf([...session.result().log].reverse().filter((e) => e.ok && e.command.type === 'lab.magnet').slice(0, 1)).map((x) => x.record).find((x) => x.quantity === 'angle');
    const deg = Math.abs(th?.value ?? 0);
    if (mc.current === 0) return uk ? 'Струму немає — стрілка дивиться на північ.' : 'No current — the needle looks north.';
    if (!mc.core) return uk ? `Без цвяха стрілка ${deg < 2 ? 'майже не ворухнулася' : `відхилилася лише на ${deg}°`}.` : `Without the nail the needle ${deg < 2 ? 'hardly moved' : `turned only ${deg}°`}.`;
    if (mc.reversed) return uk ? `Стрілка відхилилася на ${deg}° — але в інший бік!` : `The needle turned ${deg}° — but the other way!`;
    return uk ? `Стрілка компаса відхилилася на ${deg}°.` : `The compass needle turned ${deg}°.`;
  }
  // Pascal's device: the bottom; the water each vessel took and the manometer's reading.
  if (m.command.type === 'lab.vessel') {
    const vc = m.command as { step: string; shape?: 'straight' | 'wide' | 'narrow' };
    if (vc.step === 'bottom') return uk ? `Дно — ${cm(r.value ?? 0)} у діаметрі, однакове в усіх посудин.` : `The bottom is ${cm(r.value ?? 0)} across, the same for all the vessels.`;
    const recs = readingsOf([...session.result().log].reverse().filter((e) => e.ok && e.command.type === 'lab.vessel').slice(0, 1)).map((x) => x.record);
    const V = formatMeasured('volume', recs.find((x) => x.quantity === 'volume')?.value ?? 0, 5e-6, locale);
    const dh = cm(recs.find((x) => x.quantity === 'length')?.value ?? 0);
    return uk ? `Пішло ${V} води, а манометр показує ${dh}.` : `${V} of water went in, and the manometer shows ${dh}.`;
  }
  // The syringe: its scale, the barometer, the force on its plunger — and the pressure it gives.
  if (m.command.type === 'lab.atm') {
    const ac = m.command as { step: string; pulled?: number };
    if (ac.step === 'scale') return uk ? `Шкала від 0 до 1 мл займає ${cm(r.value ?? 0)}.` : `The scale from 0 to 1 mL is ${cm(r.value ?? 0)} long.`;
    if (ac.step === 'barometer') return uk ? `Барометр показує ${formatMeasured('pressure', r.value, 100, locale)}.` : `The barometer shows ${formatMeasured('pressure', r.value, 100, locale)}.`;
    const F = formatMeasured('force', r.value, 0.1, locale);
    if (ac.step === 'open') return uk ? `З відкритим носиком поршень іде легко: ${F}.` : `With the nozzle open the plunger goes easily: ${F}.`;
    const v = String(ac.pulled ?? 0).replace('.', uk ? ',' : '.');
    return uk ? `Закритий носик, поршень до ${v} мл — динамометр показує ${F}!` : `The nozzle shut, the plunger to ${v} mL — the dynamometer shows ${F}!`;
  }
  // The hydraulic machine: the pistons, the force the load needed, how far the wide piston rose.
  if (m.command.type === 'lab.press') {
    const pc = m.command as { step: string; weights?: number };
    const recs = readingsOf([...session.result().log].reverse().filter((e) => e.ok && e.command.type === 'lab.press').slice(0, 1)).map((x) => x.record);
    if (pc.step === 'diameters') return uk ? `Вузький поршень — ${cm(recs[0]?.value ?? 0)} у діаметрі, широкий — ${cm(recs[1]?.value ?? 0)}.` : `The narrow piston is ${cm(recs[0]?.value ?? 0)} across, the wide one ${cm(recs[1]?.value ?? 0)}.`;
    if (pc.step === 'lift') {
      const F2 = r.inputs?.['load'] ?? 0;
      return uk ? `Вантаж ${formatMeasured('force', F2, 0.1, locale)} пішов угору, коли динамометр показав лише ${formatMeasured('force', r.value, 0.1, locale)}!` : `The ${formatMeasured('force', F2, 0.1, locale)} load went up when the dynamometer showed only ${formatMeasured('force', r.value, 0.1, locale)}!`;
    }
    return uk ? `Вузький поршень пройшов 6 см, а широкий піднявся лише на ${cm(r.value ?? 0)}.` : `The narrow piston went 6 cm, and the wide one rose only ${cm(r.value ?? 0)}.`;
  }
  // The U-tube: the levels alike with water alone; with oil — both columns above the boundary.
  if (m.command.type === 'lab.utube') {
    const recs = readingsOf([...session.result().log].reverse().filter((e) => e.ok && e.command.type === 'lab.utube').slice(0, 1)).map((x) => x.record);
    const ml = (m.command as { poured: number }).poured;
    if (ml === 0) return uk ? 'Вода в обох колінах стоїть на одному рівні!' : 'The water stands at one level in both arms!';
    const hO = recs.find((x) => x.inputs?.['which'] === 1)?.value ?? 0;
    const hW = recs.find((x) => x.inputs?.['which'] === 0)?.value ?? 0;
    return uk ? `Олії ${ml} мл: її стовп — ${cm(hO)}, а вода справа стоїть над межею лише на ${cm(hW)}.` : `${ml} mL of oil: its column is ${cm(hO)}, and the water on the right stands only ${cm(hW)} above the boundary.`;
  }
  // The manometer: how far apart its water levels are at this depth; sideways — the same as with the film down.
  if (m.command.type === 'lab.depth') {
    if (r.value === null) return '';
    const dc = m.command as { depth: number; sideways?: boolean };
    const d = cm(dc.depth);
    if (dc.sideways) return uk ? `Плівка вбік на ${d} — а рівні в манометрі різняться так само: на ${cm(r.value)}!` : `The film sideways at ${d} — and the manometer’s levels differ just the same: by ${cm(r.value)}!`;
    return uk ? `Плівка на глибині ${d}: рівні води в манометрі різняться на ${cm(r.value)}.` : `The film ${d} deep: the water levels in the manometer differ by ${cm(r.value)}.`;
  }
  // The black box: what the milliammeter shows, one way or turned round.
  if (m.command.type === 'lab.box') {
    if (r.value === null) return '';
    const back = !!(m.command as { reversed?: boolean }).reversed;
    const mA = `${(r.value * 1000).toFixed(1).replace('.', uk ? ',' : '.')} ${uk ? 'мА' : 'mA'}`;
    const zero = r.value < (r.inputs?.['division'] ?? 0.0001);
    return back
      ? zero ? (uk ? 'Скриньку перевернули — і міліамперметр показує нуль!' : 'The box turned round — and the milliammeter shows zero!') : uk ? `Скриньку перевернули — міліамперметр показує ${mA}.` : `The box turned round — the milliammeter shows ${mA}.`
      : uk ? `Ключ замкнено: міліамперметр показує ${mA}.` : `The key is closed: the milliammeter shows ${mA}.`;
  }
  // (Only the dynamometer from here on; another instrument without its own line says nothing rather than something wrong.)
  if (m.command.type !== 'lab.hang') return '';
  const c = m.command as Extract<LabCommand, { type: 'lab.hang' }>;
  const what = c.label ? tr(c.label, locale) : nameOfBody(c.substance);
  const air = c.into === 'liquid' ? [...all.slice(0, i)].reverse().find((x) => x.command.type === 'lab.hang' && (x.command as typeof c).into === 'air' && (x.command as typeof c).substance === c.substance && (x.command as typeof c).mass === c.mass) : undefined;
  const buoy = air && air.record.value !== null && r.value !== null ? formatMeasured('force', air.record.value - r.value, 0.1, locale) : null;
  return u.hangSay(what, c.into, formatMeasured('force', r.value, 0.1, locale), buoy, c.into === 'liquid' && (r.inputs?.['share'] ?? 1) < 1);
}

/** The latest weighing, while nothing has happened since (the scales stay on the drawing). */
let lastWeigh: { readonly at: number; readonly step: ExperimentSession<LabCommand> } | null = null;
let scale: ScaleId = (MASS_SCALE_IDS as string[]).includes(store.get('scale') ?? '') ? (store.get('scale') as ScaleId) : 'kitchen-scale';

/** Every weighing of this experiment, in order. */
function allWeighings() {
  return [...history.map((h) => h.result.log), session.result().log].flatMap((l) => weighingsOf(l));
}
const grams = (kg: number, sc: ScaleId) => formatReading(sc, kg, locale);
/** What the Professor says about the latest weighing: the reading, the tare, the change since last time. */
function weighSay(): string {
  const u = t().weigh;
  const all = allWeighings();
  const w = all[all.length - 1];
  if (!w) return '';
  if (w.reading === null) return u.overload(grams(SCALES[w.scale].spec.capacity.value, w.scale));
  const now = weigh(session.state, w.scale);
  const prev = [...all.slice(0, -1)].reverse().find((x) => x.reading !== null && x.scale === w.scale);
  const d = prev ? w.reading - prev.reading! : 0;
  const tiny = SCALES[w.scale].spec.resolution.value / 2;
  const change = prev && Math.abs(d) > tiny ? (d > 0 ? u.more(grams(d, w.scale)) : u.less(grams(-d, w.scale))) : null;
  const tare = now.tare;
  return u.say(grams(w.reading, w.scale), tare === null ? null : grams(tare, w.scale), tare === null ? null : grams(w.reading - tare, w.scale), change, !!prev && !change);
}

function closeStep() {
  // The result as it was at the end, with the whole log (also what was done in the pause after it).
  if (doneRecord) return void history.push({ ...doneRecord, result: { ...doneRecord.result, log: session.result().log }, adds: stepAdds });
  if (stepElapsed() <= 0 && !stepAdds.length) return;
  const result = session.result(labGoalReached(stepP, session.state));
  history.push({ params: stepP, result, status: labStatus(stepP, result, simulation, warnings), adds: stepAdds });
}

/**
 * The action or the device changed. Before anything happened it is still the setup;
 * once the experiment is under way the vessel moves on: the current step closes and
 * the next one starts with the same contents.
 */
function stepChanged() {
  tableSet = true;
  replaying = null;
  goOnFreely();
  buildShelf();
  const done = session.result().log;
  if (!history.length && stepElapsed() === 0 && !stepAdds.length && !done.length) return newSession();
  // No time passed in this step: it is still being set up. Set it up anew and do again what was
  // done in it (salt added, the vessel weighed) — the same state gives the same result.
  if (stepElapsed() === 0) {
    pendingAdds = stepAdds;
    beginStep(configureStep(initialState, params));
    for (const e of done) if (e.ok) session.apply(e.command);
    return render();
  }
  closeStep();
  beginStep(configureStep(session.state, params));
}

function record() {
  const time = session.state.time;
  if (time - lastPointAt < 5 && time !== 0) return;
  lastPointAt = time;
  const m = time / 60;
  const s = temperature(SAMPLE_ID);
  const v = temperature(LAB_VESSEL_ID);
  const h = temperature(LAB_HEATER_ID);
  if (s !== undefined) points.sample.push({ t: m, v: toCelsius(kelvin(s)) });
  if (v !== undefined) points.vessel.push({ t: m, v: toCelsius(kelvin(v)) });
  if (h !== undefined && heaterItem()?.spec.method === 'contact') points.source.push({ t: m, v: toCelsius(kelvin(h)) });
}

// ---------- knob / switch ----------
let knobTimer: number | undefined;
/** What the knob turns: a heater's power or a lab supply's voltage. */
const knobTurns = (): 'heater' | 'supply' | null =>
  params.supply ? (SUPPLIES[params.supply.id].spec.control === 'knob' ? 'supply' : null) : params.heater ? 'heater' : null;
const knob = createKnob(
  (v) => knobChanged(v),
  (v) =>
    knobTurns() === 'supply'
      ? formatQuantity(supplyVoltage(SUPPLIES[params.supply!.id], v), 'V', { locale, level: 'school' })
      : v === 0
        ? t().off
        : formatQuantity(currentPower(v), 'W', { locale, level: 'school' }),
);
function knobChanged(v: number) {
    const what = knobTurns();
    if (!what) return;
    if (what === 'supply') {
      params = { ...params, supply: { ...params.supply!, knob: v } };
      lastSupply = params.supply!;
    } else {
      params = { ...params, heater: { ...params.heater!, knob: v } };
      lastHeater = params.heater!;
    }
    window.clearTimeout(knobTimer);
    // Before the start the knob is part of the setup; afterwards it is an action in the log.
    if (stepElapsed() === 0 && !history.length) return newSession();
    knobTimer = window.setTimeout(() => (what === 'supply' ? sendVoltage(v) : sendPower(v)), running ? 150 : 0);
    render();
}

function sendVoltage(v: number) {
  session.apply({ type: 'electrical.supply.set', entity: LAB_SUPPLY_ID, voltage: supplyVoltage(SUPPLIES[params.supply!.id], v) });
  headline = null;
  checkpoint = null;
  render();
}

function sendPower(v: number) {
  const power = currentPower(v);
  session.apply({ type: 'thermal.heater.set', entity: LAB_HEATER_ID, on: power > 0, power: power as never });
  headline = null;
  checkpoint = null;
  render();
}

// ---------- the Professor gets bored ----------
/**
 * When nobody touches anything for a while (and no experiment is running), the
 * Professor plays a little scene: paces, loses his glasses, yawns, dozes off,
 * tosses chalk, taps his foot. Any action of the user ends it at once.
 */
// ?idle=3 in the address: start after 3 s (to see the scenes without waiting).
const IDLE_START = (Number(new URLSearchParams(location.search).get('idle')) || 25) * 1000;
interface IdleAct {
  readonly name: 'pace' | 'glasses' | 'yawn' | 'sleep' | 'chalk' | 'tap' | 'coffee' | 'bytheway' | 'empty-board';
  readonly mood: SceneView['professor']['mood'];
  readonly length: number; // ms, matches the CSS animation
  readonly lines: readonly string[];
  readonly started: number;
}
const ACTS: readonly { name: Exclude<IdleAct['name'], 'bytheway' | 'empty-board'>; mood: IdleAct['mood']; length: number }[] = [
  { name: 'pace', mood: 'thinking', length: 9000 },
  { name: 'glasses', mood: 'thinking', length: 9000 },
  { name: 'yawn', mood: 'neutral', length: 6000 },
  { name: 'sleep', mood: 'neutral', length: 10_000 },
  { name: 'chalk', mood: 'thinking', length: 7000 },
  { name: 'tap', mood: 'neutral', length: 6000 },
  { name: 'coffee', mood: 'neutral', length: 9000 },
];
let lastActivity = performance.now();
let nextActAt = lastActivity + IDLE_START;
let idleAct: IdleAct | null = null;
/** Since when the Professor reads the board (ms), and whether he has already found it empty this time. */
let readingSince: number | null = null;
let emptyBoardSeen = false;
const EMPTY_BOARD_AFTER = 3000;
let lastActName = '';
let idleLine = -1;
/** Idle scenes since the last newspaper: after two, the Professor remembers something to read. */
let boredScenes = 0;

// ---------- "By the way!.." — the Professor's newspaper ----------
const paper = $<HTMLDialogElement>('#paper');
let paperToken = 0;
/** The newspaper comes on its own only to the lab page itself, and not over another window (the notebook page, «Про проєкт»…). */
const mayInterrupt = () => !libraryRoute(location.hash) && !aboutRoute() && !document.querySelector('dialog[open]');
/** He exclaims, the newspaper opens when its article has come (from Wikipedia, or a story offline). */
function byTheWay(now = performance.now(), asked = false) {
  const u = t();
  boredScenes = 0;
  // Asked for it (the button): "a fresh newspaper!"; remembered by himself: "by the way!.."
  idleAct = { name: 'bytheway', mood: asked ? 'happy' : 'surprised', length: 2600, lines: [asked ? u.byTheWay.fresh : u.byTheWay.say], started: now };
  idleLine = 0;
  const token = ++paperToken;
  const shown = Date.now();
  void fetchArticle(locale, LAB_KNOWLEDGE.laws, level).then((a) => {
    if (token !== paperToken) return;
    // Let the "By the way!" be read first.
    window.setTimeout(() => {
      // (Remembered by himself, it waits for another time if the pupil has gone elsewhere meanwhile.)
      if (token !== paperToken || (!asked && !mayInterrupt())) return;
      showPaper(paperHtml(a, locale));
    }, Math.max(0, 1500 - (Date.now() - shown)));
  });
  render();
}
function showPaper(html: string) {
  const u = t().byTheWay;
  paper.setAttribute('aria-label', u.title);
  $('#paper-body').innerHTML = html;
  $('#paper-more').textContent = u.more;
  $('#paper-close').textContent = u.close;
  if (!paper.open) paper.showModal();
}
$('#paper-close').onclick = () => paper.close();
// Sound: on unless turned off (remembered).
setSound(store.get('sound') !== 'off');
const renderSound = () => {
  const b = $<HTMLButtonElement>('#sound');
  b.textContent = soundOn() ? '🔊' : '🔇';
  b.title = soundOn() ? t().sound.on : t().sound.off;
  b.setAttribute('aria-label', b.title);
  b.setAttribute('aria-pressed', String(soundOn()));
};
// The Professor's voice: chosen in the header (remembered); a choice is heard at once.
const savedVoice = store.get('voice');
if (savedVoice && (VOICE_IDS as string[]).includes(savedVoice)) setVoice(savedVoice as VoiceId);
const voiceSel = $<HTMLSelectElement>('#voice');
const renderVoice = () => {
  const u = t().voice;
  $('#lbl-voice').textContent = u.label;
  const opts = VOICE_IDS.map((v) => `<option value="${v}"${v === currentVoice() ? ' selected' : ''}>${u.names[v] ?? v}${v === 'speech' && !canSpeak(locale) ? u.noSpeech : ''}</option>`).join('');
  if (voiceSel.dataset['html'] !== opts) {
    voiceSel.innerHTML = opts;
    voiceSel.dataset['html'] = opts;
  }
};
// The browser's voices load a little later: the list says then whether real speech is there.
if (typeof speechSynthesis !== 'undefined') speechSynthesis.addEventListener('voiceschanged', () => renderVoice());
voiceSel.onchange = () => {
  setVoice(voiceSel.value as VoiceId);
  store.set('voice', voiceSel.value);
  if (!soundOn()) {
    setSound(true);
    store.set('sound', 'on');
    renderSound();
  }
  scene.talk(babble(t().voice.sample, currentVoice(), locale));
};
$('#sound').onclick = () => {
  setSound(!soundOn());
  store.set('sound', soundOn() ? 'on' : 'off');
  renderSound();
};
// The newspaper on the table: read it any time (he also brings it himself when bored).
const newsButton = el('button', { type: 'button', className: 'news-button' });
const addOverButton = el('button', { type: 'button', className: 'news-button add-over' });
addOverButton.onclick = () => openAdding();
newsButton.onclick = () => byTheWay(performance.now(), true);
$('#paper-more').onclick = () => {
  $('#paper-body').innerHTML = `<p class="paper-loading">${t().byTheWay.loading}</p>`;
  const token = ++paperToken;
  void fetchArticle(locale, LAB_KNOWLEDGE.laws, level).then((a) => token === paperToken && paper.open && showPaper(paperHtml(a, locale)));
};
// A click on the dimmed page around the paper closes it.
paper.addEventListener('click', (e) => {
  if (e.target === paper) paper.close();
});
paper.addEventListener('close', () => {
  paperToken++;
  lastActivity = performance.now();
  nextActAt = lastActivity + IDLE_START;
});
const touched = () => {
  lastActivity = performance.now();
  nextActAt = lastActivity + IDLE_START;
  if (idleAct) {
    idleAct = null;
    idleLine = -1;
    render();
  }
};
for (const ev of ['pointerdown', 'keydown', 'wheel', 'touchstart']) window.addEventListener(ev, touched, { passive: true, capture: true });

/** Start, advance or end an idle scene; true when the picture or the line changed. */
function idleTick(now: number): boolean {
  // A scene that is playing (also one called from the console during a run) plays to its end.
  if (idleAct) {
    const t = now - idleAct.started;
    if (t >= idleAct.length) {
      idleAct = null;
      idleLine = -1;
      // A pause between scenes, a little different every time.
      nextActAt = now + IDLE_START + Math.random() * IDLE_START * 0.8;
      return true;
    }
    const line = Math.min(idleAct.lines.length - 1, Math.floor((t / idleAct.length) * idleAct.lines.length));
    if (line === idleLine) return false;
    idleLine = line;
    return true;
  }
  // Looking at a clean board for a while: the Professor mutters over his shoulder, then turns round, puzzled.
  if (!scene.reading) {
    readingSince = null;
    emptyBoardSeen = false;
  } else if (!running && !paper.open) {
    readingSince ??= now;
    if (!emptyBoardSeen && now - readingSince >= EMPTY_BOARD_AFTER && !boardNow().length) {
      emptyBoardSeen = true;
      idleAct = { name: 'empty-board', mood: 'surprised', length: 9000, lines: t().emptyBoard, started: now };
      idleLine = 0;
      return true;
    }
  }
  // New scenes only when nothing is going on.
  if (running || document.hidden || now < nextActAt || scene.reading || paper.open) return false;
  if (boredScenes >= 2 && mayInterrupt()) {
    byTheWay(now);
    return true;
  }
  boredScenes++;
  const pool = ACTS.filter((a) => a.name !== lastActName);
  const a = pool[Math.floor(Math.random() * pool.length)]!;
  lastActName = a.name;
  const u = t();
  const idea = PRESETS[Math.floor(Math.random() * PRESETS.length)]!;
  const lines = a.name === 'chalk' ? u.idle.chalk(tr(idea.title, locale)) : u.idle[a.name];
  idleAct = { ...a, lines, started: now };
  idleLine = 0;
  return true;
}

// ---------- main loop ----------
function frame(now: number) {
  const realDt = Math.min(0.1, (now - (lastFrame || now)) / 1000);
  lastFrame = now;
  if (running && !finished) {
    acc += realDt * speed;
    const steps = Math.floor(acc / DT);
    acc -= steps * DT;
    // A replay applies the recorded actions exactly on time and ends each step as it ended then.
    const reached = replaying ? replaying.step.advance(steps * DT) : session.advance(steps * DT, (s) => labGoalReached(stepP, s));
    record();
    if (reached) stop();
    else if (!replaying && stalled()) stop();
    idleTick(now);
    render();
  } else if (idleTick(now)) render();
  requestAnimationFrame(frame);
}

// ---------- the chart: folded while the experiment runs, unfolded with a pointing hand at the end ----------
let chartOpen = false;
function setChart(open: boolean, point = false) {
  chartOpen = open;
  const box = $('#chart-box');
  box.classList.toggle('collapsed', !open);
  $('#chart-toggle').setAttribute('aria-expanded', String(open));
  $('#chart-toggle').textContent = open ? t().chartHide : t().chartShow;
  // "Look down: the results are here" — a blinking hand for a few seconds.
  const hand = $('#look-down');
  hand.classList.remove('on');
  if (point) {
    void hand.offsetWidth;
    hand.classList.add('on');
  }
}
$('#chart-toggle').onclick = () => setChart(!chartOpen);

function stop() {
  running = false;
  finished = true;
  setChart(true, true);
  if (replaying) window.setTimeout(nextReplayStep, 1500);
  // The end of a run is news: give the reader time before the Professor gets bored.
  lastActivity = performance.now();
  nextActAt = lastActivity + IDLE_START;
  const result = session.result(labGoalReached(stepP, session.state));
  doneRecord = { params: stepP, result, status: labStatus(stepP, result, simulation, warnings) };
  // Heating that stalls: find what helps by re-running in the mind (after the headline is on screen).
  if ((doneRecord.status.kind === 'stalls' && OPERATIONS[stepP.action].direction === 'heating') || doneRecord.status.kind === 'vessel-fails') {
    fixes = 'computing';
    const p = stepP;
    window.setTimeout(() => {
      fixes = stallFixes(p, simulation);
      render();
    }, 30);
  } else if (doneRecord.status.kind === 'reached') fixes = [];
  // Weighings left at the end of a plan: the Professor puts the vessel on the scales right away.
  if (preset && plan.length && plan.every((s) => s.kind === 'weigh')) {
    for (const s of plan.splice(0)) if (s.kind === 'weigh') session.apply({ type: 'lab.weigh', scale: s.scale });
    lastWeigh = { at: session.state.time, step: session };
  }
  // A ready-made experiment whose plan is done: answer its question from what happened (may re-run in the mind).
  if (!plan.length) answerPreset();
  setHeadline();
}

/** A ready-made experiment whose plan is done: answer its question from what happened (may re-run in the mind). */
function answerPreset() {
  const answerOf = preset ? PRESET_ANSWERS[preset.id] : undefined;
  if (!answerOf) return;
  presetAnswer = 'computing';
  // A guided procedure runs no operation: the step so far stands for itself.
  const now = session.result(false);
  const done = doneRecord ? { ...doneRecord, result: { ...doneRecord.result, log: now.log } } : { params: stepP, result: now, status: labStatus(stepP, now, simulation, warnings) };
  const steps = [...history, done].map((h) => ({ params: h.params, result: h.result as never, status: h.status }));
  const readings = allReadings() as never;
  window.setTimeout(() => {
    presetAnswer = answerOf({ steps, simulation, readings });
    render();
  }, 30);
}

/** No progress for 30 simulated minutes — the outcome will not change, explain it. */
function stalled(): boolean {
  const b = sample();
  if (!b) return false;
  const now = { t: session.state.time, ...labProgress(session.state) };
  if (!checkpoint) {
    checkpoint = now;
    return false;
  }
  if (now.t - checkpoint.t < 1800) return false;
  const still = noProgress(stepP, checkpoint, now);
  checkpoint = now;
  return still;
}

function setHeadline() {
  const p = stepP;
  const result = doneRecord?.result ?? session.result(labGoalReached(p, session.state));
  const status = doneRecord?.status ?? labStatus(p, result, simulation, warnings);
  const reachedAt = status.kind === 'reached' ? status.at : undefined;
  const expectation: LabExpectation | undefined = expectKind === 'none' ? undefined : { kind: expectKind, seconds: expectMinutes * 60 };
  goalChoices = null;
  // "What to change" needs several re-runs: compute it after the headline is on screen.
  if (expectation?.kind === 'goal' && (reachedAt === undefined || reachedAt > expectation.seconds * 1.1)) {
    goalChoices = 'computing';
    window.setTimeout(() => {
      goalChoices = goalOptions(p, simulation, expectation.seconds, locale);
      render();
      if ($('#report').innerHTML) explain();
    }, 30);
  }
  // In a ready-made experiment, ending the way it is meant to (sea water freezing only partly) is not a failure.
  const expected = preset && !history.length && status.kind === preset.expect && status.kind !== 'reached';
  headline = () => [
    ...labSummary(p, result, status, ctx()).map((b) => (expected && b.kind === 'summary' && b.tone === 'failure' ? { ...b, tone: 'neutral' as const } : b)),
    ...(actionUses(p.action) !== 'cooler' || expectation
      ? labDebrief({
          params: p,
          result,
          reachedAt,
          ...(expectation ? { expectation } : {}),
          ...(Array.isArray(goalChoices) ? { options: goalChoices } : {}),
          ctx: ctx(),
        })
      : []),
    ...(goalChoices === 'computing' ? [{ kind: 'paragraph' as const, text: t().computing }] : []),
  ];
}

// ---------- prediction / goal ----------
function buildExpect() {
  const u = t();
  const box = $('#expect');
  box.innerHTML = '';
  const chips = el('div', { className: 'chips' });
  for (const [k, label] of [['none', u.expectNone], ['prediction', u.expectPrediction], ['goal', u.expectGoal]] as const) {
    const b = el('button', { type: 'button', className: `chip${expectKind === k ? ' selected' : ''}` }, label);
    b.setAttribute('aria-pressed', String(expectKind === k));
    b.onclick = () => {
      expectKind = k;
      buildExpect();
    };
    chips.append(b);
  }
  box.append(chips);
  if (expectKind !== 'none') {
    const i = el('input', { type: 'number', value: String(expectMinutes), min: '0.1', max: '1440', step: '0.5', inputMode: 'decimal' });
    i.onchange = () => {
      const v = Number(i.value);
      if (Number.isFinite(v) && v > 0) expectMinutes = v;
      else i.value = String(expectMinutes);
    };
    box.append(el('label', { className: 'mini-field inline' }, i, el('span', {}, u.expectMinutes)));
  }
  box.append(el('p', { className: 'muted small' }, u.expectHint));
}

// ---------- add a substance during the experiment ----------
let addSub: SubstanceId = 'water';
let addFrozen = true;
let addGrams = 30;
let addTemp = -18;
let addError = '';

/** Pick what to add, with sensible amounts: a metal block from boiling water, a small wooden block, a pinch of salt… */
function chooseAdd(id: SubstanceId) {
  addSub = id;
  ({ frozen: addFrozen, temp: addTemp, grams: addGrams } = addDefaults(id));
}
function addDefaults(id: SubstanceId): { frozen: boolean; temp: number; grams: number } {
  const sub = SUBSTANCES[id];
  const frozen = addFrozen && canFreezeHere(sub);
  return { frozen, temp: sub.category === 'solid.metal' ? 100 : frozen ? -18 : 20, grams: sub.category === 'solid.metal' ? 100 : sub.category.startsWith('solid.') ? 10 : 30 };
}
/** A guided procedure stands between its steps: nothing has run yet, the next step will set the device. */
const waitingForPlan = () => !!preset?.guided && plan.some((s) => s.kind === 'operation') && !running && stepElapsed() === 0;

/** The colour dissolved substances give the water (copper sulfate: blue, the deeper the stronger). */
function tintOf(mix: ThermalBody['state']['mixture']): string | undefined {
  if (!mix) return undefined;
  const liquid = mix.water - mix.ice + mix.salt - mix.crystals;
  for (const x of mix.solutes) {
    const tint = COMPONENTS[x.component as ComponentId]?.inWater?.tint;
    if (!tint || !(liquid > 0)) continue;
    const share = (x.mass - x.crystals) / liquid;
    return `rgba(${tint[0]}, ${tint[1]}, ${tint[2]}, ${Math.min(0.85, 0.25 + share * 3).toFixed(2)})`;
  }
  return undefined;
}

/** A solid that dissolves in water (salt, sugar, copper sulfate) — asked from its component's data. */
const dissolves = (s: SubstanceItem) => s.category.startsWith('solid.') && !!s.component && soluteBehaviour(s.component) !== undefined;

/** "Цукор розчиняється…" — for whatever was just poured in. */
function droppedDissolves(): string {
  const l = session.result().log;
  const c = l[l.length - 1]?.command as { substance?: string } | undefined;
  const sub = c?.substance ? SUBSTANCES[c.substance as SubstanceId] : undefined;
  return t().guide.dissolved(sub ? tr(sub.name, locale) : '', sub?.component === 'sodium-chloride');
}

/** Not all of it dissolved: how much did, how much lies on the bottom, and what would help — warming or more water. */
/** What is dissolved and what lies on the bottom: "солоність 3,5 %" for brine, "цукру 16 %" and so on otherwise. */
function solutionLines(mix: NonNullable<ThermalBody['state']['mixture']>, temperature?: number): string[] {
  const u = t();
  const kg = (m: number) => formatQuantity(m, 'kg', { locale, level: 'school' });
  const name = (c: string) => lowerFirst(tr(COMPONENTS[c as ComponentId]?.genitive ?? COMPONENTS[c as ComponentId]?.name ?? { uk: c, en: c }, locale));
  const liquid = mix.water - mix.ice + mix.salt - mix.crystals;
  const out: string[] = [];
  if (mix.solutes.length === 1 && mix.solutes[0]!.component === 'sodium-chloride') out.push(u.salinity(sig(liquidConcentration(mix) * 100, 3, locale)));
  else for (const x of mix.solutes) if (x.mass - x.crystals > 1e-9 && liquid > 0) out.push(u.dissolvedShare(name(x.component), sig(((x.mass - x.crystals) / liquid) * 100, 3, locale)));
  for (const x of mix.solutes) if (x.crystals > 1e-6) out.push(u.crystals(kg(x.crystals), name(x.component)));
  // More dissolved than the solubility allows: a supersaturated solution (it is waiting for a seed).
  if (temperature !== undefined && mix.solutes.some((x) => x.crystals <= 0 && x.mass > ((solubilityAt(x.component, temperature - 273.15) / 100) * (mix.water - mix.ice)) * 1.01)) out.push(u.supersaturated);
  return out;
}

function seededSay(): string {
  const l = session.result().log;
  const last = l[l.length - 1]!;
  const b = sampleOf(session.state);
  const id = SUBSTANCES[(last.command as unknown as { substance: SubstanceId }).substance].component!;
  const own = b.state.mixture!.solutes.find((x) => x.component === id)!;
  const c = COMPONENTS[id as ComponentId];
  const name = lowerFirst(tr(c?.genitive ?? c?.name ?? { uk: id, en: id }, locale));
  const T = b.state.temperature;
  // Crystallising gives back the heat its dissolving took: a substance that cools water as it dissolves warms it as it crystallises.
  return t().guide.seeded(name, `${sig(own.crystals * 1000, 2, locale)} ${locale === 'uk' ? 'г' : 'g'}`, `${sig(T - 273.15, 3, locale)} °C`, (c?.inWater?.enthalpyOfSolution?.value ?? 0) >= 0);
}
function saltLeftSay(): string {
  const mix = sampleOf(session.state).state.mixture!;
  const T = sampleOf(session.state).state.temperature - 273.15;
  const g = (kg: number) => sig(kg * 1000, 3, locale);
  // The solute that lies on the bottom (the one just poured in, usually).
  const left = [...mix.solutes].sort((a, b) => b.crystals - a.crystals)[0]!;
  const now = solubilityAt(left.component, T);
  const hot = solubilityAt(left.component, 100);
  const heatHelps = left.mass <= (mix.water * hot) / 100;
  const name = lowerFirst(tr(COMPONENTS[left.component as ComponentId]?.genitive ?? COMPONENTS[left.component as ComponentId]?.name ?? { uk: left.component, en: left.component }, locale));
  return t().guide.saltLeft(g(left.mass - left.crystals), g(left.crystals), sig(T, 3, locale), sig(now, 3, locale), heatHelps, sig(hot, 3, locale), name);
}
const lowerFirst = (x: string) => x.charAt(0).toLowerCase() + x.slice(1);

/** A solid picked on the shelf: get it ready in the "add" panel and show the panel. */
/** How much of a dry sample (salt, a metal) to take at first, g. */
const DRY_GRAMS = 50;

function prepareAdd(id: SubstanceId) {
  chooseAdd(id);
  addFrozen = false;
  buildAdd();
  const box = $<HTMLDetailsElement>('#add');
  box.open = true;
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  box.classList.remove('flash');
  void box.offsetWidth;
  box.classList.add('flash');
}

/** Can it be frozen within the temperatures the page offers (down to −30 °C)? Ethanol (−114 °C) cannot. */
// Only a liquid can be added frozen (ice); a metal or salt is solid anyway — its melting data are not "freezing".
const canFreezeHere = (s: SubstanceItem) => !s.category.startsWith('solid.') && s.freezing !== undefined && s.freezing.point.value > -30;

/** Volume taken by everything in the vessel now, litres. */
function usedVolume(): number {
  let v = 0;
  for (const e of Object.values(session.state.entities)) {
    if (!isThermalBody(e) || !(e.id === SAMPLE_ID || e.id.startsWith(`${SAMPLE_ID}+`))) continue;
    const mix = e.state.mixture;
    if (mix) {
      // Solution + ice + crystals, each with its own density.
      const solution = mix.water - mix.ice + mix.salt - mix.crystals;
      const crystals = mix.solutes.reduce((a, x) => a + x.crystals / (soluteBehaviour(x.component)?.density ?? 1000), 0);
      v += (solution / solutionDensity(mix) + mix.ice / COMPONENTS.water.phases.solid!.density!.value + crystals) * 1000;
      continue;
    }
    const sub = 'substance' in e.params && e.params.substance ? SUBSTANCES[e.params.substance as SubstanceId] : undefined;
    const density = sub ? ((e.state.solidFraction ?? 0) >= 1 ? (sub.freezing?.solidDensity?.value ?? sub.liquid.density.value) : sub.liquid.density.value) : 1000;
    v += (bodyMass(e) / density) * 1000;
  }
  return v;
}

/** Put a portion into the vessel now (the "add" panel and the console both use it); returns an error or null. */
function addPortion(id: SubstanceId, grams: number, tempC: number, frozen: boolean): string | null {
  const u = t();
  const sub = SUBSTANCES[id];
  const density = frozen ? (sub.freezing?.solidDensity?.value ?? sub.liquid.density.value) : sub.liquid.density.value;
  const free = params.size - usedVolume();
  if (((grams / 1000) / density) * 1000 > free + 1e-9) return u.addDoesNotFit(free < 1 ? `${Math.round(free * 1000)} ${u.ml}` : `${sig(free, 3, locale)} ${u.liters}`);
  const entry = session.apply({ type: 'thermal.add', into: SAMPLE_ID, substance: id, mass: (grams / 1000) as never, temperature: celsius(tempC), ...(frozen ? { frozen: true } : {}) });
  if (!entry.ok) return tr(entry.error, locale);
  (finished ? pendingAdds : stepAdds).push({ what: sub.name, mass: grams / 1000 });
  // The Professor comments on what was put in (salt dissolving, or some left on the bottom) — in free play too.
  lastDrop = { at: session.state.time, step: session };
  splash(id, grams / 1000, frozen);
  boardEpoch++;
  headline = null;
  checkpoint = null;
  buildAdd();
  render();
  return null;
}

function buildAdd() {
  const u = t();
  const box = $<HTMLDetailsElement>('#add');
  const open = box.open;
  box.innerHTML = '';
  box.append(el('summary', {}, u.addTitle));
  const sub = SUBSTANCES[addSub];
  const sel = el('select', {});
  // Only what the engine can really put into these contents (a dry run of the add command).
  const addable = new Set(addableTo(session.state, commands).map((x) => x.id));
  if (!addable.has(addSub)) addSub = ([...addable][0] as SubstanceId | undefined) ?? addSub;
  for (const f of SUBSTANCE_FAMILIES) {
    const g = el('optgroup', { label: tr(f.name, locale) });
    for (const x of Object.values(SUBSTANCES).filter((y) => f.categories.includes(y.category) && addable.has(y.id))) g.append(el('option', { value: x.id, selected: x.id === addSub }, tr(x.name, locale)));
    if (g.children.length) sel.append(g);
  }
  sel.onchange = () => {
    chooseAdd(sel.value as SubstanceId);
    buildAdd();
  };
  const state = el('div', { className: 'chips' });
  for (const [frozen, label] of [[false, u.addLiquid], [true, u.addFrozen]] as const) {
    if (sub.category.startsWith('solid.')) break;
    if (frozen && !canFreezeHere(sub)) continue;
    const b = el('button', { type: 'button', className: `chip${addFrozen === frozen ? ' selected' : ''}` }, frozen && sub.solidName ? `${label} (${tr(sub.solidName, locale).toLowerCase()})` : label);
    b.onclick = () => {
      addFrozen = frozen;
      addTemp = frozen ? Math.min(addTemp, Math.round((sub.freezing?.point.value ?? 0) - 18)) : Math.max(addTemp, 20);
      buildAdd();
    };
    state.append(b);
  }
  const num = (value: number, min: number, max: number, step: number, set: (v: number) => void) => {
    const i = el('input', { type: 'number', value: String(value), min: String(min), max: String(max), step: String(step), inputMode: 'decimal' });
    i.onchange = () => {
      const v = Number(i.value);
      if (Number.isFinite(v) && v >= min && v <= max) set(v);
      else i.value = String(value);
    };
    return i;
  };
  const button = el('button', { type: 'button', className: 'primary' }, u.addButton);
  button.onclick = () => {
    addError = addPortion(addSub, addGrams, addTemp, addFrozen) ?? '';
    buildAdd();
    render();
  };
  // A solid body can also be hung on the dynamometer — in the air, or lowered into the liquid.
  const hangs = sub.category.startsWith('solid.') && !dissolves(sub)
    ? (['air', 'liquid'] as const).map((into) => {
        const b = el('button', { type: 'button' }, into === 'air' ? u.measure.hangAir : u.measure.hangLiquid);
        b.onclick = () => void measureNow({ type: 'lab.hang', substance: addSub, mass: addGrams / 1000, into });
        return b;
      })
    : [];
  box.append(
    el('div', { className: 'add-grid' },
      el('label', { className: 'mini-field' }, el('span', {}, u.substance), sel),
      state,
      el('label', { className: 'mini-field' }, el('span', {}, u.addAmount), num(addGrams, 1, 5000, 1, (v) => (addGrams = v))),
      el('label', { className: 'mini-field' }, el('span', {}, u.addTemp), num(addTemp, -30, 300, 1, (v) => (addTemp = v))),
      button,
      ...(hangs.length ? [el('div', { className: 'hang-buttons' }, ...hangs)] : []),
    ),
  );
  if (addError) box.append(el('p', { className: 'add-error' }, `⚠ ${addError}`));
  box.open = open;
}

/** What is happening on a phase-change plateau right now (for the live banner). */
let lastSolid: number | null = null;
function phaseNote(): { text: string; pct: number } | null {
  const b = sample();
  if (!b || stepElapsed() === 0) return null;
  const u = t();
  const s = b.state.solidFraction ?? 0;
  const T = formatQuantity(b.state.temperature, 'K', { locale, level: 'school' });
  const trend = lastSolid === null ? 0 : s - lastSolid;
  lastSolid = s;
  if (s > 0 && s < 1) {
    const freezing = trend > 0 || (trend === 0 && OPERATIONS[params.action].direction === 'cooling');
    return freezing ? { text: u.phaseFreezing(T, Math.round(s * 100)), pct: s * 100 } : { text: (substance().melt ? u.phaseMeltingDry : u.phaseMelting)(T, Math.round((1 - s) * 100)), pct: (1 - s) * 100 };
  }
  // Counted within this step: earlier steps may have boiled some off already.
  const before = sampleOf(initialState).state.boiledOff ?? 0;
  const boiled = (b.state.boiledOff ?? 0) - before;
  if (boiled > 0) {
    const share = boiled / (bodyMass(sampleOf(initialState)) || b.params.mass);
    return { text: u.phaseBoiling(T, formatQuantity(boiled, 'kg', { locale, level: 'school' })), pct: share * 100 };
  }
  return null;
}

// ---------- rendering ----------
const chart = createChart();
const scene = createScene();
scene.element.querySelector('.table-buttons')!.prepend(addOverButton, newsButton);
// Turning the bubble's page: the Professor reads the page now shown (cutting the one before).
scene.onTurn((page) => {
  hush();
  window.clearTimeout(sayTimer);
  scene.talk(babble(page, currentVoice(), locale));
});
/** Bulk boiling in the last frames (boiled-off mass grew) — for the bubbles and the Professor. */
let lastBoiled = 0;
let boilingNow = false;

/** How a shelf liquid looks: by the family of its component (a recipe of water + salt looks like brine). */
function liquidKindOf(sub: SubstanceItem): LiquidKind {
  if (sub.recipe) return 'salt';
  const group = sub.component ? COMPONENTS[sub.component as keyof typeof COMPONENTS]?.group : undefined;
  return group === 'water' || group === 'salt' || group === 'alcohol' || group === 'acid' || group === 'oil' ? group : 'other';
}

/** What the scene should show right now: read from the state, nothing computed here. */
function sceneView(): SceneView {
  const u = t();
  const b = sample();
  const sub = substance();
  const sup = Object.values(session.state.entities).find(isSupply);
  const heaterEntity = session.state.entities[entityId(LAB_HEATER_ID)];
  // Any power source is drawn as a supply with electrodes; its own look is for the shelf icon.
  const device: DeviceKind = (params.supply
    ? 'supply'
    : params.heater
      ? HEATERS[params.heater.id].look
      : params.cooler
        ? COOLERS[params.cooler.id].look
        : 'none') as DeviceKind;
  const power = heaterEntity && (isHeater(heaterEntity) || isBurner(heaterEntity)) && heaterEntity.params.on ? heaterEntity.params.power : 0;
  const maxPower = params.heater ? Math.max(...HEATERS[params.heater.id].spec.ratings) : 1;
  const T = b ? b.state.temperature - 273.15 : params.startTemp;
  const mix = b && 'mixture' in b.state ? b.state.mixture : undefined;
  const boiled = b?.state.boiledOff ?? 0;
  if (boiled > lastBoiled + 1e-7) boilingNow = true;
  else if (!running) boilingNow = boilingNow && finished && power > 0;
  else boilingNow = false;
  lastBoiled = boiled;
  const electrolysis = b ? cellReading(b).electrolysis : undefined;
  const liquid: LiquidKind = mix ? 'salt' : liquidKindOf(sub);
  const s = b?.state.solidFraction ?? 0;
  // What the cell does now (a steel anode dissolves: no chlorine, no gas at it).
  const cellNow = sup && electrolysis ? cellReaction(electrolysis, sup.params.electrodes?.material) : undefined;
  const current = sup ? { amps: sup.state.current, volts: sup.state.current > 0 ? sup.state.decomposition + sup.state.current * ((sup.state.resistance ?? 0) + sup.params.internalResistance) : sup.params.voltage, toxicGas: cellNow?.anode.component === 'chlorine', electrodes: (sup.params.electrodes?.material === 'steel' || sup.params.electrodes?.material === 'copper' ? sup.params.electrodes.material : 'graphite') as 'steel' | 'graphite' | 'copper', anodeGas: !cellNow?.anode.dissolves, cathodeGas: cellNow ? COMPONENTS[cellNow.cathode.component]?.stateAtRoom === 'gas' : true, ...((sup.state.made?.['copper'] ?? 0) > 1e-5 ? { cathodeCoat: '#c46b3c' } : {}) } : undefined;
  // A sludge the current made (grams of every solid product, the anode's and a metal piece's).
  const sludgeGrams = sup ? Object.entries(sup.state.made ?? {}).reduce((a, [k, n]) => {
    const c = (k.includes('|') ? k.split('|')[1] : k) as ComponentId;
    return COMPONENTS[c]?.stateAtRoom === 'solid' && !c.startsWith('-') ? a + molesToMass(c, n) * 1000 : a;
  }, 0) : 0;
  // The Professor: what is going on, in one line.
  const st = doneRecord?.status;
  // What came of the step just finished, in the Professor's words (every step, every experiment).
  const outcome = doneRecord ? stepOutcome(doneRecord.params, doneRecord.result, doneRecord.status, locale) : null;
  const nextLabel = plan.length ? planLabel(plan) : '';
  const weighShown = showingWeighing();
  const measured = showingMeasure();
  const quiz = quizNow();
  const reply = quizReply(quiz);
  const verdict = predictionVerdict();
  const professor: SceneView['professor'] = idleAct
    ? idleAct.name === 'empty-board' && idleLine <= 0
      ? // The first line still over the shoulder, reading; then he turns round.
        { mood: 'thinking', says: idleAct.lines[0] ?? '', act: 'empty-board-look' }
      : { mood: idleAct.mood, says: idleAct.lines[Math.max(0, idleLine)] ?? '', act: idleAct.name }
    : reply
    ? { mood: quiz!.options.find((o) => o.id === picked.ids[picked.ids.length - 1])?.right === false ? 'thinking' : 'happy', says: reply }
    : verdict && presetAnswer && presetAnswer !== 'computing'
    ? { mood: verdict === predictionVerdictRight() ? 'happy' : 'surprised', says: `${tr(presetAnswer.say, locale)} ${verdict}` }
    : measureError && !running
    ? { mood: 'thinking', says: measureError }
    : showingDrop()
    ? { mood: 'surprised', says: showingDrop() === 'salt' ? droppedDissolves() : showingDrop() === 'salt-left' ? saltLeftSay() : showingDrop() === 'seeded' ? seededSay() : showingDrop() === 'float' ? u.guide.floats : showingDrop() === 'inside' ? u.guide.inside : u.guide.dropped }
    : measured
    ? { mood: measured.record.value === null ? 'surprised' : 'happy', says: measureSay() }
    : weighShown
    ? { mood: weighShown.reading === null ? 'surprised' : 'happy', says: weighSay() }
    : presetAnswer && presetAnswer !== 'computing' && tr(presetAnswer.say, locale)
    ? { mood: 'happy', says: tr(presetAnswer.say, locale) }
    : preset && !running && stepElapsed() === 0 && !history.length && !st
    ? { mood: 'thinking', says: tr(preset.question, locale) }
    : st && nextLabel
    ? { mood: st.kind === 'reached' ? 'happy' : 'thinking', says: [outcome, u.planNext(nextLabel)].filter(Boolean).join(' ') }
    : st && preset && !plan.length && st.kind === 'reached' && history.length
    ? { mood: 'happy', says: [outcome, u.planDone].filter(Boolean).join(' ') }
    : st
    ? st.kind === 'reached'
      ? { mood: 'happy', says: [outcome, u.prof.reached].filter(Boolean).join(' ') }
      : st.kind === 'decomposes'
        ? { mood: 'sooty', says: u.prof.smoke }
        : { mood: 'thinking', says: u.prof.failed }
    : !running && stepElapsed() === 0
      ? !preset && !tableSet
        ? { mood: 'neutral', says: u.prof.bare }
        : labImpossibility(params) && !waitingForPlan()
        ? { mood: 'thinking', says: u.prof.impossible }
        : OPERATIONS[params.action].needsAdded && !preset?.guided && !session.result().log.some((e) => e.ok && e.kind === 'matter')
        ? { mood: 'thinking', says: tr(OPERATIONS[params.action].needsAdded!, locale) }
        : { mood: 'neutral', says: u.prof.idle }
      : current && current.amps > 0.005
        ? current.toxicGas && current.amps > 0.05
          ? { mood: 'sooty', says: u.prof.chlorine }
          : // No gas at either electrode (copper plates in copper sulfate): the cathode is being plated.
            !current.anodeGas && !current.cathodeGas
            ? { mood: 'surprised', says: u.prof.currentPlating }
            : { mood: 'surprised', says: u.prof.current }
        : params.supply
          ? { mood: 'thinking', says: u.prof.noCurrent }
          : boilingNow
            ? { mood: 'surprised', says: u.prof.boiling }
            : OPERATIONS[params.action].says
            ? { mood: 'thinking', says: tr(OPERATIONS[params.action].says!, locale) }
            : s > 0 && s < 1
              ? OPERATIONS[params.action].direction === 'cooling'
                ? { mood: 'neutral', says: u.prof.freezing }
                : { mood: 'neutral', says: sub.melt ? u.prof.meltingDry : u.prof.melting }
              : OPERATIONS[params.action].direction === 'cooling'
                ? { mood: 'neutral', says: u.prof.cooling }
                : { mood: 'neutral', says: u.prof.heating };
  const evaporating = Math.max(0, (T - 45) / 60);
  const vesselBody = session.state.entities[entityId(LAB_VESSEL_ID)];
  // Salt poured in dry is white grains; a metal its own colour; molten — shiny, glowing when red-hot.
  // (Dry salt with water poured on it is brine now: a liquid again.)
  const dry = isDrySample(sub) && !mix
    ? { solid: BODY_COLOR[sub.id] ?? '#9aa1a8', melt: incandescent(T) ?? (sub.category === 'solid.salt' ? 'rgba(235, 240, 245, 0.9)' : '#d9dde2') }
    : undefined;
  return {
    device,
    ...(!preset && !tableSet ? { bare: true } : {}),
    ...(preset && !needsThermometer(preset) ? { noThermometer: true } : {}),
    on: params.supply ? (sup?.state.current ?? 0) > 0 : params.heater ? power > 0 : !!params.cooler,
    intensity: params.heater ? Math.min(1, power / maxPower) : 1,
    ...(heaterEntity && isHeater(heaterEntity) ? { deviceTemp: heaterEntity.state.temperature - 273.15 } : {}),
    vessel: (vesselItem().look ?? 'pot') as VesselShape,
    material: params.material,
    lid: params.lid,
    liquid,
    ...(tintOf(mix) ? { tint: tintOf(mix)! } : {}),
    // Being set up over the table: what is not on it yet is not drawn, the liquid not yet poured.
    ...(assembly ? { away: { device: !assembly.placed.has('device'), vessel: !assembly.placed.has('vessel') } } : {}),
    fill: assembly && !assembly.placed.has('liquid') ? 0 : Math.min(1, usedVolume() / params.size),
    temperature: T,
    solid: mix && mix.water <= 1e-9 ? 0 : s,
    crystals: mix && mix.salt > 0 ? mix.crystals / mix.salt : 0,
    ...(crystalTintOf(mix) ? { crystalTint: crystalTintOf(mix)! } : {}),
    boiling: boilingNow,
    // A dry sample (salt, a metal) gives no steam; a hot one glows.
    steam: dry || s >= 1 ? 0 : boilingNow ? (params.lid ? 0.5 : 1) : Math.min(0.6, evaporating) * (params.lid ? 0.3 : 1),
    ...(dry ? { dry } : {}),
    ...(vesselBody && isThermalBody(vesselBody) ? { wallTemp: vesselBody.state.temperature - 273.15 } : {}),
    // Oil past its smoke point smokes instead of steaming.
    ...(sub.decomposes && T >= sub.decomposes.value - 2 ? { smoke: true } : {}),
    ...(current ? { current } : {}),
    ...(sludgeGrams > 0.01 ? { sludge: { color: 'rgba(110, 138, 80, 0.92)', amount: Math.min(1, sludgeGrams / 2) } } : {}),
    ...(params.cooler ? { setpoint: params.cooler.setpoint } : {}),
    running,
    decimal: locale === 'uk' ? ',' : '.',
    professor,
    pieces: Object.values(session.state.entities).flatMap((e): NonNullable<SceneView['pieces']>[number][] => {
      if (!isThermalBody(e) || !e.id.startsWith(`${SAMPLE_ID}+`)) return [];
      const id = 'substance' in e.params ? (e.params.substance as SubstanceId | undefined) : undefined;
      const sub = id ? SUBSTANCES[id] : undefined;
      if (!sub) return [];
      // Solid bodies and ice cubes are drawn; a liquid layer (oil) is part of the liquid.
      // A melting cube is the ice left in it: it shrinks and fades as it melts, not "just gone".
      const s = e.state.solidFraction ?? 0;
      const ice = s > 0 && !sub.category.startsWith('solid.');
      if (!sub.category.startsWith('solid.') && !ice) return [];
      // A stoppered test tube with sand: upright, the sand at the bottom — on the bottom, inside the water or coming up.
      if (e.params.volume) {
        const shape = VESSELS[params.vessel].spec.shape;
        const geo = vesselGeometry(shape, params.size, params.liters);
        const sand = Math.max(0, bodyMass(e) - tubeGlass()) / sandFull();
        return [{ color: '#d8bf86', volume: e.params.volume, share: pieceShare(session.state, e), tube: { width: TUBE_DIAMETER.value / geo.opening, height: TUBE_LENGTH.value / geo.height, sand: sand * 0.88 }, inside: floatsInside(session.state, e) }];
      }
      const density = ice ? (sub.freezing?.solidDensity?.value ?? sub.liquid.density.value) : sub.liquid.density.value;
      return [{ color: ice ? 'rgba(225, 242, 255, 0.9)' : (BODY_COLOR[sub.id] ?? '#9aa1a8'), volume: (bodyMass(e) * (ice ? s : 1)) / density, share: pieceShare(session.state, e), ...(ice ? { melting: Math.min(1, s * 4) } : {}), ...(!ice && sub.bodyShape === 'ball' ? { ball: true } : {}) }];
    }),
    ...(measured?.command.type === 'lab.hang'
      ? { hang: { display: formatMeasured('force', measured.record.value, 0.1, locale), into: measured.command.into, color: BODY_COLOR[measured.command.substance] ?? '#9aa1a8', volume: measured.record.inputs?.['volume'] ?? 1e-5, share: measured.record.inputs?.['share'] ?? 1, ...(SUBSTANCES[measured.command.substance as SubstanceId]?.bodyShape === 'ball' ? { ball: true } : {}) } }
      : {}),
    // The coil on the multimeter: the latest reading stays on its display (dashes before the first).
    ...(preset?.plan?.some((s) => s.kind === 'bench' && s.command.type === 'lab.ohm') ? { ohmmeter: { display: ohmShown() } } : {}),
    ...(measured?.command.type === 'lab.read-level' ? { levelMark: formatMeasured('volume', measured.record.value, measured.record.inputs?.['division'] ?? 1e-6, locale) } : {}),
    dissolve: dissolveKey,
    board: { empty: u.boardEmpty, front: u.boardFront, back: u.boardBack, lines: boardNow() },
    bubble: { next: u.bubbleNext, back: u.bubbleBack },
    ...(benchView() ? { bench: benchView()! } : {}),
    // The cathode taken out and weighed: on the laboratory balance beside the beaker (the cell stays where it is).
    ...(measured?.command.type === 'lab.cathode' ? { scale: { look: 'lab-balance', display: measured.record.value === null ? 'O-Ld' : formatReading('lab-balance', measured.record.value, locale), load: 'cathode' } } : {}),
    ...(weighShown ? { scale: { look: SCALES[weighShown.scale].look === 'lab-balance' ? 'lab-balance' : 'kitchen-scale', display: weighShown.reading === null ? 'O-Ld' : formatReading(weighShown.scale, weighShown.reading, locale) } } : {}),
  };
}

// ---------- questions with choices ----------
interface QuizOption {
  readonly id: string;
  readonly text: string;
  /** For a question the page can judge at once; a prediction is judged by the run. */
  readonly right?: boolean;
  readonly reply: string;
}
interface Quiz {
  readonly key: string;
  readonly title: string;
  readonly options: readonly QuizOption[];
  /** A prediction: one choice, changeable until the start. */
  readonly predict: boolean;
  /** The question itself, after the title («Твій прогноз: Чи замерзне спирт у морозилці?»). */
  readonly ask?: string;
}
/** What was picked in the question on screen (key), in order. */
let picked: { key: string; ids: string[] } = { key: '', ids: [] };
/** A ready-made experiment whose answer was asked for without picking a conclusion (picking is never a must). */
let answerShown: string | null = null;
/** The experiment's question is settled: a conclusion picked, or the answer asked for. */
const concluded = () => !!preset && (prediction?.preset === preset.id || answerShown === preset.id);
/** The prediction for a ready-made experiment, judged when its answer comes. */
let prediction: { readonly preset: string; readonly choice: string } | null = null;

/** The question the Professor is asking now, with its choices — or none. */
function quizNow(): Quiz | null {
  const u = t().quiz;
  if (preset?.choices && preset.choicesAt !== 'end' && !running && stepElapsed() === 0 && !history.length && !doneRecord && (!preset.guided || plan.length === planTotal)) {
    // Which choice is right only the run will tell, so a prediction offers all of them (at most four), shuffled.
    const key = `p:${preset.id}`;
    return { key, title: u.predictTitle, ask: tr(presetAsk(preset), locale), predict: true, options: pickChoices(preset.choices.map((c) => ({ id: c.id, text: tr(c.label, locale), reply: u.noted })), key) };
  }
  // "Where did those grams go?" — after a weighing that shows less than the one before.
  const w = showingWeighing();
  if (!w || w.reading === null) return null;
  const all = allWeighings();
  const prev = [...all.slice(0, -1)].reverse().find((x) => x.reading !== null && x.scale === w.scale);
  const d = prev ? prev.reading! - w.reading : 0;
  if (!prev || d <= SCALES[w.scale].spec.resolution.value / 2) return null;
  const g = formatReading(w.scale, d, locale);
  const key = `w:${all.length}:${w.time}`;
  const tare = weigh(session.state, w.scale).tare;
  // The model has one way for matter to leave the vessel: evaporating and boiling off into the air.
  const pool: QuizOption[] = [
    { id: 'air', text: u.labels.air, right: true, reply: u.weighAir(g) },
    { id: 'heat', text: u.labels.heat, right: false, reply: u.weighHeat },
    { id: 'scales', text: u.labels.scales, right: false, reply: u.weighScales(formatReading(w.scale, SCALES[w.scale].spec.resolution.value, locale), g) },
    { id: 'shrink', text: u.labels.shrink, right: false, reply: u.weighShrink },
    { id: 'ice', text: u.labels.ice, right: false, reply: u.weighIce },
    ...(tare === null ? [] : [{ id: 'pot', text: u.labels.pot, right: false, reply: u.weighPot(formatReading(w.scale, tare, locale)) }]),
  ];
  return { key, title: u.weighQuestion, predict: false, options: pickChoices(pool, key) };
}

/** A small seeded random generator: the same question keeps the same choices on every frame. */
function seeded(key: string): () => number {
  let h = 2166136261;
  for (const c of key) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}
/** Up to four choices in a random order; the right one (if known) is always among them. */
function pickChoices(pool: readonly QuizOption[], key: string, n = 4): QuizOption[] {
  const rnd = seeded(key);
  const shuffle = <T,>(a: T[]) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j]!, a[i]!];
    }
    return a;
  };
  const right = pool.filter((o) => o.right);
  const others = shuffle(pool.filter((o) => !o.right)).slice(0, Math.max(0, n - right.length));
  return shuffle([...right, ...others]);
}
/** The Professor's reply to the latest choice in the question on screen. */
function quizReply(q: Quiz | null): string | null {
  if (!q || picked.key !== q.key || !picked.ids.length) return null;
  return q.options.find((o) => o.id === picked.ids[picked.ids.length - 1])?.reply ?? null;
}
/**
 * Something went into the liquid: a body falls in — "plop" as it hits the water; salt is poured —
 * it sinks and dissolves in a little cloud, with a fizz. (Liquids poured in just mix.)
 */
let dissolveKey = 0;
function splash(id: SubstanceId, mass: number, frozen: boolean) {
  const sub = SUBSTANCES[id];
  if (dissolves(sub)) {
    dissolveKey++;
    fizz();
    return;
  }
  if (!sub.category.startsWith('solid.') && !frozen) return;
  // A body of 10 cm³ is the "1"; it hits the water about when its fall ends.
  const size = Math.cbrt(mass / (frozen ? (sub.freezing?.solidDensity?.value ?? 917) : sub.liquid.density.value) / 1e-5);
  window.setTimeout(() => plop(size), 430);
}

/** The Professor's last line: a new one is spoken (after a short pause, in case it changes again). */
let lastSaid = '';
let sayTimer = 0;

/** "New experiment": the board is wiped with a sponge, then all is set up again from the start. */
const renewButton = () => `<button type="button" class="renew" data-renew="1">${t().renew}</button>`;
function renew() {
  running = false;
  scene.read(false);
  scene.wipe(() => {
    resetExperiment();
    boardCache = null;
    render();
  });
}

/** The steps of a guided procedure: how many in all (set when the preset starts). */
let planTotal = 0;
/** The latest thing put into the vessel during a guided procedure (the Professor comments on it). */
let lastDrop: { readonly at: number; readonly step: ExperimentSession<LabCommand> } | null = null;
/** What was just put in, while nothing has happened since: a body that sank or floats, or salt that dissolved. */
function showingDrop(): 'body' | 'float' | 'inside' | 'salt' | 'salt-left' | 'seeded' | null {
  if (!lastDrop || lastDrop.step !== session || running || session.state.time !== lastDrop.at) return null;
  const l = session.result().log;
  const c = l[l.length - 1]?.command;
  if (c?.type !== 'thermal.add') return null;
  if (dissolves(SUBSTANCES[c.substance as SubstanceId])) {
    const mix = sampleOf(session.state).state.mixture;
    const own = mix?.solutes.find((x) => x.component === SUBSTANCES[c.substance as SubstanceId].component);
    // More crystals than was poured in: it was a seed, and a supersaturated solution crystallised on it.
    if (own && own.crystals > Number(c['mass']) * 1.05 + 1e-6) return 'seeded';
    return (mix?.crystals ?? 0) > 1e-5 ? 'salt-left' : 'salt';
  }
  const pieces = Object.values(session.state.entities).filter((e) => isThermalBody(e) && e.id.startsWith(`${SAMPLE_ID}+`));
  const last = pieces[pieces.length - 1];
  if (last && isThermalBody(last) && floatsInside(session.state, last)) return 'inside';
  return last && isThermalBody(last) && pieceShare(session.state, last) < 1 ? 'float' : 'body';
}
/** The density measured so far: the change of the scales over the change of the level (both around the drop). */
function measuredDensity(): number | null {
  const all = allReadings();
  const m = all.filter((x) => x.record.quantity === 'mass' && x.record.value !== null);
  const v = all.filter((x) => x.record.quantity === 'volume' && x.record.value !== null);
  // Hydrostatic weighing: the weight in the air over the buoyant force, times the liquid's density.
  const f = all.filter((x) => x.record.quantity === 'force' && x.record.value !== null);
  const into = (x: (typeof f)[number]) => (x.command as { into?: string }).into;
  const air = f.find((x) => into(x) === 'air');
  const wet = [...f].reverse().find((x) => into(x) === 'liquid');
  if (air && wet && m.length < 2) {
    const fa = air.record.value! - wet.record.value!;
    return fa > 0 ? (air.record.value! / fa) * (wet.record.inputs?.['rhoLiquid'] ?? 1000) : null;
  }
  if (m.length < 2 || v.length < 2) return null;
  const dm = m[m.length - 1]!.record.value! - m[0]!.record.value!;
  const dv = v[v.length - 1]!.record.value! - v[0]!.record.value!;
  return dv > 0 ? dm / dv : null;
}
/**
 * The conditions of a ready-made experiment, in one row under the scene: what it lets change (an amount, a
 * temperature, a material) — only before it starts. Changing one starts it again with the new values;
 * "↺" brings back its own.
 */
function renderVary() {
  const box = $('#vary');
  const chosen = presetGiven;
  const fresh = !running && stepElapsed() === 0 && !history.length && !doneRecord && plan.length === planTotal && !session.result().log.some((e) => e.ok && e.command.type !== 'thermal.add');
  if (!preset || !chosen?.vary || chosen.id !== preset.id || !fresh) {
    if (box.innerHTML) box.innerHTML = '';
    box.hidden = true;
    return;
  }
  const key = `${locale}|${chosen.id}|${JSON.stringify(presetVals)}`;
  box.hidden = false;
  if (box.dataset['k'] === key) return;
  box.dataset['k'] = key;
  const u = t();
  const vals = { ...defaultValues(chosen, locale), ...presetVals };
  const changed = JSON.stringify(vals) !== JSON.stringify(defaultValues(chosen, locale));
  const controls = chosen.vary.controls
    .map((c) => {
      const label = `<span>${tr(c.label, locale)}</span>`;
      const unit = c.kind === 'number' ? (locale === 'uk' ? c.unit : c.unit.replace('мл', 'mL').replace(/^г$/, 'g')) : '';
      // A city: typed with suggestions (the Earth's field is worked out for it); the default is an example.
      if (c.kind === 'place') {
        const pl = parsePlace(vals[c.id]);
        const example = vals[c.id] === c.value || vals[c.id] === c.en;
        return `<label class="vary-item vary-place">${label}<input type="text" data-vary-place="${c.id}" list="vary-places" value="${escAttr(pl?.name ?? '')}" placeholder="${escAttr(u.placeHint)}" autocomplete="off" spellcheck="false"/><datalist id="vary-places"></datalist></label><span class="vary-note muted" data-place-note="1">${example ? u.placeExample : ''}</span><span class="vary-credit muted">${u.placeCredit}</span>`;
      }
      return c.kind === 'number'
        ? `<label class="vary-item">${label}<input type="number" data-vary="${c.id}" min="${c.min}" max="${c.max}" step="${c.step}" value="${vals[c.id]}"/><span class="muted">${unit}</span></label>`
        : `<label class="vary-item">${label}<select data-vary="${c.id}">${c.options.map((o) => `<option value="${o.id}"${o.id === vals[c.id] ? ' selected' : ''}>${tr(o.label, locale)}</option>`).join('')}</select></label>`;
    })
    .join('');
  box.innerHTML = `<span class="vary-title">${u.varyTitle}</span>${controls}${changed ? `<button type="button" class="vary-reset" data-vary-reset="1" title="${u.varyReset}" aria-label="${u.varyReset}">↺</button>` : ''}`;
}
$('#vary').addEventListener('change', (e) => {
  const place = (e.target as HTMLElement).closest<HTMLInputElement>('[data-vary-place]');
  if (place) {
    void choosePlace(place, place.dataset['varyPlace']!);
    return;
  }
  const el = (e.target as HTMLElement).closest<HTMLInputElement | HTMLSelectElement>('[data-vary]');
  if (!el || !presetGiven?.vary) return;
  const c = presetGiven.vary.controls.find((x) => x.id === el.dataset['vary']);
  if (!c || c.kind === 'place') return;
  // A number is kept within the experiment's frame (and on its step).
  const value = c.kind === 'number' ? Math.min(c.max, Math.max(c.min, Math.round(Number(el.value) / c.step) * c.step)) : el.value;
  startPreset(presetGiven, { ...presetVals, [c.id]: Number.isFinite(value as number) || typeof value === 'string' ? value : c.value });
});
// The city field: suggestions as one types (from three letters, a moment after the last key), the place once chosen.
const placeFound = new Map<string, string>();
let placeTimer = 0;
$('#vary').addEventListener('input', (e) => {
  const el = (e.target as HTMLElement).closest<HTMLInputElement>('[data-vary-place]');
  if (!el) return;
  window.clearTimeout(placeTimer);
  placeTimer = window.setTimeout(async () => {
    const found = await searchPlaces(el.value, locale);
    for (const f of found) placeFound.set(f.label, f.value);
    const list = $('#vary-places');
    list.innerHTML = found.map((f) => `<option value="${escAttr(f.label)}"></option>`).join('');
  }, 300);
});
async function choosePlace(el: HTMLInputElement, id: string) {
  if (!presetGiven) return;
  const text = el.value.trim();
  const value = placeFound.get(text) ?? (await searchPlaces(text, locale))[0]?.value;
  const note = $('#vary').querySelector<HTMLElement>('[data-place-note]');
  if (!value) {
    if (note) note.textContent = t().placeNone;
    return;
  }
  startPreset(presetGiven, { ...presetVals, [id]: value });
}
$('#vary').addEventListener('click', (e) => {
  if (!(e.target as HTMLElement).closest('[data-vary-reset]') || !presetGiven) return;
  startPreset(presetGiven);
});
/** A guided procedure under the scene: the step, what to do, one button — and at the end the table to look the result up in. */
function renderGuide(): boolean {
  if (!preset?.guided) return false;
  const u = t().guide;
  if (running) {
    setHtml('#quiz', `<div class="guide"><span class="guide-step">${u.step(planTotal - plan.length, planTotal)}</span><p>${u.running}</p></div>`);
    return true;
  }
  if (plan.length) {
    const s = plan[0]!;
    const k = planTotal - plan.length + 1;
    const done = allReadings();
    const added = session.result().log.some((e) => e.ok && e.command.type === 'thermal.add');
    const again = (q: 'mass' | 'volume') => done.some((x) => x.record.quantity === q);
    const what = s.kind === 'add' || s.kind === 'hang' ? tr(('label' in s && s.label) || SUBSTANCES[s.substance].name, locale).toLowerCase() : '';
    // Salt is poured in and dissolves; a body is lowered in; a liquid is poured in.
    const salt = s.kind === 'add' && dissolves(SUBSTANCES[s.substance]);
    const liquid = s.kind === 'add' && !s.frozen && SUBSTANCES[s.substance].category.startsWith('liquid.');
    const temp = s.kind === 'add' ? `${s.temperature} °C` : '';
    const opKind = s.kind === 'operation' ? (OPERATIONS[s.action].uses === 'supply' ? 'current' : s.heater || OPERATIONS[s.action].uses === 'heater' || (s.cooler && COOLERS[s.cooler.id].spec.hot) ? 'heat' : s.cooler || OPERATIONS[s.action].uses === 'cooler' ? 'cool' : 'wait') : 'wait';
    // «Нагріти до 40 °C», not «Нагріти до…»: the step's own target.
    const op = s.kind === 'operation' ? (s.label ? tr(s.label, locale) : s.target !== undefined && OPERATIONS[s.action].target ? `${tr(OPERATIONS[s.action].label, locale).replace('…', '')} ${s.target} °C` : tr(OPERATIONS[s.action].label, locale)) : '';
    // Time has passed since the last look at the marks (the ice melted): did the level change?
    const lastLevel = [...done].reverse().find((x) => x.record.quantity === 'volume');
    const waited = !!lastLevel && session.state.time > lastLevel.time + 1e-9 || history.length > 0 && !!lastLevel;
    const fresh = s.kind === 'fresh' ? tr(s.label ?? { uk: 'Почати знову', en: 'Start afresh' }, locale) : '';
    const bench = s.kind === 'bench' ? BENCH_TEXT[s.command.type](s.command) : null;
    const say = bench ? tr(bench.say, locale) : s.kind === 'fresh' ? u.fresh(fresh) : s.kind === 'weigh' ? u.weigh(again('mass') && added) : s.kind === 'level' ? u.level(again('volume') && added, waited) : s.kind === 'add' ? (salt ? u.dissolve(what) : liquid ? u.pour(what, temp) : u.add(what)) : s.kind === 'hang' ? u.hang(what, s.into) : u.wait(op);
    const btn = bench ? tr(bench.button, locale) : s.kind === 'fresh' ? `🔄 ${fresh}` : s.kind === 'weigh' ? u.btnWeigh : s.kind === 'level' ? u.btnLevel : s.kind === 'add' ? (salt ? u.btnDissolve(what) : liquid ? u.btnPour(what, temp) : u.btnAdd(what)) : s.kind === 'hang' ? u.btnHang(s.into) : u.btnRun(op, opKind);
    // Before the first step: the prediction, if the experiment asks for one.
    const q = k === 1 ? quizNow() : null;
    setHtml('#quiz', `${q ? quizHtml(q) : ''}<div class="guide"><span class="guide-step">${u.step(k, planTotal)}</span><p>${say}</p><button type="button" class="primary" data-plan="1"${instrumentBusy ? ' disabled' : ''}>${btn}</button></div>`);
    return true;
  }
  // Measured out: the answer to the question (and the verdict on the prediction), here under the scene.
  if (preset.choiceTable !== 'density') {
    // The question asked at the end: the conclusion is picked from the choices, then judged against the run.
    if (preset.choicesAt === 'end' && preset.choices && !concluded()) {
      const q = t().quiz;
      const buttons = preset.choices.map((c) => `<button type="button" data-choice="${c.id}">${tr(c.label, locale)}</button>`).join('');
      const ask = tr(presetAsk(preset), locale);
      setHtml('#quiz', `<div class="quiz"><p class="quiz-head">${ask ? `<span class="quiz-ask">${ask}</span> <span class="quiz-title">${q.concludeAsk}</span>` : `<span class="quiz-title">${q.conclude}</span>`}</p><div class="quiz-options">${buttons}${showAnswerButton()}</div></div>`);
      return true;
    }
    // Settled, yet no answer (an experiment without one, or a page left behind its code): said, not a blank.
    if (!presetAnswer) return (setHtml('#quiz', concluded() && !PRESET_ANSWERS[preset.id] ? `<div class="guide"><p class="muted">${t().answerMissing}</p>${renewButton()}</div>` : ''), true);
    const text = presetAnswer === 'computing' ? `<p class="muted">${t().answerComputing}</p>` : `${predictionVerdict() ? `<p class="verdict">${predictionVerdict()}</p>` : ''}<p class="answer-text">${tr(presetAnswer.text, locale)}</p>${whyHtml()}`;
    setHtml('#quiz', `<div class="guide"><span class="guide-step">${t().answerTitle}</span>${text}${renewButton()}</div>`);
    return true;
  }
  if (preset.choiceTable === 'density' && preset.choices) {
    const rho = measuredDensity();
    const chosen = prediction?.preset === preset.id ? prediction.choice : null;
    // Asked for without a pick: the right row is marked, the answer shown.
    const revealed = !!chosen || answerShown === preset.id;
    const right = presetAnswer && presetAnswer !== 'computing' ? presetAnswer.correct : undefined;
    // The rows nearest to what was measured; once one is picked, only it and the right one stay (the answer asked for — the right one).
    const near = nearestRows(preset.choices, rho, (id) => SUBSTANCES[id as SubstanceId].liquid.density.value);
    const rows = preset.choices
      .filter((c) => (chosen ? c.id === chosen || c.id === right : revealed ? c.id === right : near.includes(c)))
      .map((c) => {
        const x = SUBSTANCES[c.id as SubstanceId];
        const cls = chosen === c.id ? (right === undefined ? 'picked' : right === c.id ? 'right' : 'wrong') : right && revealed && right === c.id ? 'right' : '';
        return `<tr class="${cls}"><td>${tr(c.label, locale)}</td><td class="num">${sig(x.liquid.density.value, 4, locale)}</td><td>${revealed ? (cls === 'right' ? '✓' : cls === 'wrong' ? '✗' : '') : `<button type="button" data-choice="${c.id}">${u.pick}</button>`}</td></tr>`;
      })
      .join('');
    const rhoText = rho === null ? '—' : `${sig(rho / 1000, 3, locale)} ${locale === 'uk' ? 'г/см³' : 'g/cm³'} = ${sig(rho, 3, locale)} ${locale === 'uk' ? 'кг/м³' : 'kg/m³'}`;
    const verdict = predictionVerdict();
    const answer = revealed && presetAnswer && presetAnswer !== 'computing' ? `${verdict ? `<p class="verdict">${verdict}</p>` : ''}<p class="answer-text">${tr(presetAnswer.text, locale)}</p>${whyHtml()}` : '';
    setHtml('#quiz', `<div class="guide table"><p class="guide-title">${u.tableTitle(rhoText)}</p>${answer}<table class="density-table"><thead><tr><th>${u.tableName}</th><th class="num">${u.tableDensity}</th><th></th></tr></thead><tbody>${rows}</tbody></table>${revealed ? renewButton() : showAnswerButton()}</div>`);
    return true;
  }
  return false;
}
function renderQuiz(q: Quiz | null) {
  setHtml('#quiz', q ? quizHtml(q) : '');
}
function quizHtml(q: Quiz): string {
  const mine = picked.key === q.key ? picked.ids : [];
  const solved = !q.predict && q.options.some((o) => o.right && mine.includes(o.id));
  // Once picked, the choices fold: the prediction shows only itself (and "Change" until the start), a solved question only the right answer.
  const folded = (q.predict && mine.length > 0) || solved;
  const buttons = q.options
    .filter((o) => !folded || (q.predict ? mine[mine.length - 1] === o.id : o.right && mine.includes(o.id)))
    .map((o) => {
      const was = mine.includes(o.id);
      const cls = q.predict ? (was && mine[mine.length - 1] === o.id ? 'picked' : '') : was ? (o.right ? 'right' : 'wrong') : '';
      const off = !q.predict && (folded || was);
      return `<button type="button" class="${cls}" data-choice="${o.id}"${off ? ' disabled' : ''}>${cls === 'right' ? '✓ ' : cls === 'wrong' ? '✗ ' : ''}${o.text}</button>`;
    })
    .join('');
  const change = q.predict && folded ? `<button type="button" class="link" data-rechoose="1">${t().quiz.rechoose}</button>` : '';
  return `<div class="quiz" data-key="${q.key}"><p class="quiz-head"><span class="quiz-title">${q.title}</span>${q.ask ? ` <span class="quiz-ask">${q.ask}</span>` : ''}</p><div class="quiz-options">${buttons}${change}</div></div>`;
}
const predictionVerdictRight = () => (prediction && presetAnswer && presetAnswer !== 'computing' && prediction.choice === presetAnswer.correct ? predictionVerdict() : null);
/** Beside the conclusions: the answer without picking one (picking is an invitation, not a must). */
function showAnswerButton(): string {
  return `<button type="button" class="link show-answer" data-show-answer="1">${t().quiz.showAnswer}</button>`;
}
/** «Чому так?»: the reasoning behind the answer, when it has one. */
function whyHtml(): string {
  // (ρ_тіла, F_A: subscripts, as on the board.)
  const why = presetAnswer && presetAnswer !== 'computing' && presetAnswer.why ? tr(presetAnswer.why, locale).replace(/_([^\s/·=()+−<>;,—&]+)/g, '<sub>$1</sub>') : '';
  return why ? `<div class="answer-why"><strong>${t().whyTitle}</strong> ${why}</div>` : '';
}
/** The verdict on a prediction, once the run has answered the question. */
function predictionVerdict(): string {
  if (!prediction || !preset || prediction.preset !== preset.id || !presetAnswer || presetAnswer === 'computing' || !presetAnswer.correct) return '';
  const label = (id: string) => tr(preset!.choices?.find((c) => c.id === id)?.label ?? { uk: id, en: id }, locale);
  const q = t().quiz;
  // Chosen at the end it is the conclusion of the experiment, not a prediction.
  if (preset.choicesAt === 'end') return prediction.choice === presetAnswer.correct ? q.concludedRight(label(prediction.choice)) : (preset.choiceTable === 'density' ? q.concludedWrong : q.concludedOther)(label(prediction.choice), label(presetAnswer.correct));
  return prediction.choice === presetAnswer.correct ? q.right(label(prediction.choice)) : q.wrong(label(prediction.choice), label(presetAnswer.correct));
}

/** The blackboard: recomputed a few times a second while running (it walks the step's recorded states). */
let boardCache: { at: number; key: string; lines: ReturnType<typeof boardLines> } | null = null;
/** Bumped by whatever changes the step without time passing (a weighing, salt added, a new step). */
let boardEpoch = 0;
/** The steps already done stay on the board: each new step adds its lines below theirs (a new experiment wipes it). */
let pastCache: { key: string; lines: ReturnType<typeof boardLines> } | null = null;
function pastBoard(): ReturnType<typeof boardLines> {
  const key = `${locale}|${history.length}|${history[0]?.result.initial.time ?? ''}`;
  if (pastCache?.key === key) return pastCache.lines;
  const lines = history.flatMap((h, i) => stepBoard(h.params, [...h.result.samples, h.result.final], h.result.log, true).map((l) => stepLine(l, h.params, i)));
  pastCache = { key, lines };
  return lines;
}
/** The board's lines of a step: all it worked out, or — where the experiment says so — only what was measured. */
function stepBoard(p: LabParams, states: SystemState[], log: ExperimentResult<LabCommand>['log'], done: boolean): ReturnType<typeof boardLines> {
  return preset?.board === 'measurements' ? measuredLines(log, locale) : boardLines(p, states, locale, weighingsOf(log).map((w) => w.scale), done, log);
}
/** A line of step `i`: its own id; when the steps differ only in the lid, its title says which. */
function stepLine(l: ReturnType<typeof boardLines>[number], p: LabParams, i: number): ReturnType<typeof boardLines>[number] {
  const lids = new Set([...history.map((h) => !!h.params.lid), !!params.lid]);
  const u = t();
  return { ...l, id: `${i}:${l.id}`, title: lids.size > 1 ? `${l.title},${p.lid ? u.withLid : u.withoutLid}` : l.title };
}
function boardNow(): ReturnType<typeof boardLines> {
  // The answer to the question asked at the end is not written before it is picked: those lines show the formula only.
  const hidden = preset?.answerOnBoard && !concluded() ? preset.answerOnBoard : null;
  const key = `${locale}|${boardEpoch}|${session.state.time}|${finished}|${hidden ? 'hidden' : ''}|${instrumentBusy}`;
  const now = performance.now();
  if (boardCache && (boardCache.key === key || (running && now - boardCache.at < 250))) return boardCache.lines;
  const r = session.result();
  const lines = [...pastBoard(), ...stepBoard(stepP, [...r.samples, r.final], r.log, finished).map((l) => stepLine(l, stepP, history.length))].map((l) => {
    if (!hidden || !l.numbers || !hidden.some((h) => l.id.split(':').slice(1).join(':').startsWith(h))) return l;
    const { numbers: _, ...rest } = l;
    return rest;
  });
  // While an instrument is still moving, what it will show is not on the board yet.
  const busy = instrumentBusy ? `:${r.log.length - 1}` : null;
  const shown = busy ? lines.filter((l) => !l.id.endsWith(busy)) : lines;
  boardCache = { at: now, key, lines: shown };
  return shown;
}

/** The latest weighing while nothing has happened since: the vessel still stands on the scales. */
function showingWeighing() {
  if (!lastWeigh || lastWeigh.step !== session || running || session.state.time !== lastWeigh.at) return null;
  const l = session.result().log;
  const last = l[l.length - 1];
  return last?.ok && last.command.type === 'lab.weigh' ? (weighingsOf([last])[0] ?? null) : null;
}

/** How solid bodies look in the vessel. */
const BODY_COLOR: Partial<Record<string, string>> = { 'table-salt': 'rgba(246, 246, 242, 0.97)', 'ammonium-chloride': '#f7f7f3', 'caustic-soda': '#f3f3ee', 'sodium-acetate': '#f6f6f1', sugar: '#fbfbf8', 'baking-soda': '#f4f4f0', 'copper-sulfate': '#2f7fd6', chalk: '#f1eee6', 'iron-ii-hydroxide': '#7f9a63', graphite: '#3a3d42', porcelain: '#f6f3ec', brick: '#b5553a', 'stearic-acid': '#f3efe4', tin: '#c8ccd0', aluminium: '#c9ced4', copper: '#c46b3c', iron: '#6d7177', steel: '#8d949c', brass: '#c9a43a', wood: '#c8995a', glass: 'rgba(170, 220, 230, 0.75)' };
const formulaOf = (x: SubstanceItem) =>
  x.recipe ? RECIPES[x.recipe as RecipeId].parts.map((p) => COMPONENTS[p.component].formula ?? '').join('+') : (x.component && COMPONENTS[x.component as keyof typeof COMPONENTS]?.formula) || '';
/** The colour of the crystals on the bottom: of the substance with most of them, as its shelf picture is drawn. */
function crystalTintOf(mix: { readonly solutes: readonly { readonly component: string; readonly crystals: number }[] } | undefined): string | undefined {
  const most = mix?.solutes.filter((x) => x.crystals > 0).sort((a, b) => b.crystals - a.crystals)[0];
  const item = most && Object.values(SUBSTANCES).find((x) => x.component === most.component);
  return item ? BODY_COLOR[item.id] : undefined;
}
/** The shelf's picture of a substance: a bottle of a liquid or a powder, a block or a ball of a solid. */
const shelfPic = (x: SubstanceItem): string =>
  x.category.startsWith('liquid.')
    ? bottleSvg(liquidKindOf(x), formulaOf(x))
    : dissolves(x) || x.category === 'solid.salt'
      ? bottleSvg('salt', formulaOf(x), true)
      : x.bodyShape === 'ball'
        ? ballSvg(BODY_COLOR[x.id] ?? '#9aa1a8')
        : blockSvg(BODY_COLOR[x.id] ?? '#9aa1a8', formulaOf(x));

/**
 * A part of the page is shown only when it has something to show: no chart without a curve, no readouts of
 * the vessel's temperature or the "predict the minutes" card when nothing runs in time (a bench of springs
 * and weights), no "add during the experiment" on the bench, no "explain" before there is anything to explain.
 */
/** Does anything in this experiment run in time (heating, waiting, a current)? A measuring procedure does not. */
function timedExperiment(): boolean {
  return !preset?.guided || [...(presetGiven?.plan ?? []), ...plan].some((s) => s.kind === 'operation') || history.some((h) => h.result.final.time > h.result.initial.time);
}
function showOnlyWhatMatters() {
  const bench = !!preset?.bench;
  const timed = timedExperiment();
  const hide = (sel: string, h: boolean) => {
    const el = document.querySelector<HTMLElement>(sel);
    if (el && el.hidden !== h) el.hidden = h;
  };
  // Answered, the ready-made experiment is over: the knob and the readouts have nothing more to do.
  const over = !!preset && !plan.length && !!presetAnswer && presetAnswer !== 'computing' && !running;
  // (Nothing runs in time — a measuring procedure: no knob, no clock.)
  hide('.controls', bench || over || !timed);
  // No thermometer in the vessel: no temperatures under the scene either.
  const noThermo = !!preset && !needsThermometer(preset);
  hide('#r-water', noThermo);
  hide('#r-pot', noThermo);
  hide('.kitchen-head .weigh', bench);
  hide('.kitchen-head .speed', !timed);
  hide('#chart-box', points.sample.length < 2);
  hide('#energy', bench);
  // The prediction / goal card is put aside for now (it confused more than it helped).
  document.querySelector('#expect')?.closest<HTMLElement>('section.card')?.toggleAttribute('hidden', true);
  document.querySelector('#add')?.closest<HTMLElement>('section.card')?.toggleAttribute('hidden', bench);
  hide('.add-over', bench || (!preset && !tableSet) || !!assembly);
  const somethingToExplain = stepsSoFar().some((x) => x.result.final.time > x.result.initial.time) || allReadings().length > 0;
  // (Not while an instrument is still on its way to its reading: that reading belongs in the explanation.)
  document.querySelector('#explain')?.closest<HTMLElement>('section.card')?.toggleAttribute('hidden', !somethingToExplain || instrumentBusy);
}

function render() {
  const u = t();
  // Nothing on the table yet: no step, no instruments, no readings — only the choice.
  document.body.classList.toggle('table-bare', !preset && !tableSet);
  renderVary();
  document.documentElement.lang = locale;
  document.title = pageTitle();
  $('#title').textContent = u.title;
  $('#subtitle').textContent = u.subtitle;
  $('#lbl-language').textContent = u.language;
  $('#lbl-level').textContent = u.level;
  // A ready-made experiment is named: «2. Дослід: Як розтягується пружина?»
  $('#exp-title').textContent = preset ? `${u.experiment}: ${tr(preset.title, locale)}` : u.experiment;
  // The running experiment's page of the lab notebook, from its title.
  const sheetBtn = $<HTMLButtonElement>('#exp-sheet');
  sheetBtn.hidden = !preset;
  sheetBtn.title = u.presetMore;
  sheetBtn.setAttribute('aria-label', u.presetMore);
  renderSite();
  $('#explain').textContent = u.explain;
  $('#explain-hint').textContent = u.explainHint;
  $('#footer').textContent = u.footer;
  renderSide();

  // On the bench the vessel is not what the experiment is about: what stands on the table is named instead.
  $('#setup-line').textContent = preset?.bench && preset.bench !== 'balance' ? tr(BENCH_SETUP[preset.bench], locale) : preset?.bench === 'balance' ? `${tr(BENCH_SETUP.balance, locale)}; ${labSubject(params, locale, session.state)}` : labSubject(params, locale, session.state);
  showOnlyWhatMatters();
  const sub = substance();
  const b = sample();
  const C = (k: number | undefined) => (k === undefined ? '—' : formatQuantity(k, 'K', { locale, level: 'school' }));
  const stateText = (() => {
    if (!b) return '—';
    const parts: string[] = [];
    const s = b.state.solidFraction ?? 0;
    const mix = b.state.mixture;
    if (mix && mix.water > 1e-9) parts.push(s >= 1 ? tr(sub.solidName ?? { uk: 'тверде', en: 'solid' }, locale).toLowerCase() : s > 0 ? u.solidShare(Math.round(s * 100)) : u.liquid);
    else if (!mix) parts.push(s >= 1 ? tr(sub.solidName ?? { uk: 'тверде', en: 'solid' }, locale).toLowerCase() : s > 0 ? u.solidShare(Math.round(s * 100)) : u.liquid);
    if (mix && s < 1 && mix.water - mix.ice > 1e-9) parts.push(...solutionLines(mix, b.state.temperature));
    for (const e of Object.values(session.state.entities)) {
      if (!isThermalBody(e) || !e.id.startsWith(`${SAMPLE_ID}+`) || !e.label) continue;
      // A block (no melting in the lab): its temperature; a piece of ice: how much of it is still solid.
      if (!('phase' in e.params && e.params.phase)) parts.push(`${tr(e.label, locale)}: ${C(e.state.temperature)}`);
      else parts.push(u.addedState(tr(e.label, locale), Math.round((e.state.solidFraction ?? 0) * 100)));
    }
    const lost = (b.state.boiledOff ?? 0) + (b.state.evaporated ?? 0);
    if (lost > 1e-4) parts.push(u.boiledOff(formatQuantity(lost, 'kg', { locale, level: 'school' })));
    // Gases of electrolysis so far (Faraday's law from the charge that passed).
    const supplyNow = Object.values(session.state.entities).find(isSupply);
    // What the cell made so far (counted at each electrode — and at a metal piece in the liquid).
    const made = supplyNow?.state.made ?? {};
    const gasMoles = (c: string) => Object.entries(made).reduce((a, [k, n]) => (k === c || k.endsWith(`|${c}`) ? a + n : a), 0);
    const gasList = (['hydrogen', 'chlorine', 'oxygen'] as const)
      .map((c) => ({ c, v: (gasMoles(c) * GAS_CONSTANT * celsius(params.roomTemp)) / 101_325 }))
      .filter((x) => x.v > 5e-8);
    if (gasList.length) parts.push(u.gases(gasList.map((x) => `${formatQuantity(x.v * 1e6, 'mL', { locale, level: 'school' })} ${tr(COMPONENTS[x.c].genitive ?? COMPONENTS[x.c].name, locale).toLowerCase()}`).join(locale === 'uk' ? ' і ' : ' and ')));
    return parts.join(', ');
  })();
  $('#r-time').innerHTML = `<span>${u.time}</span><strong>${formatDuration(Math.floor(session.state.time), locale)}</strong>`;
  $('#r-water').innerHTML = `<span>${tr(b?.state.mixture && b.label ? b.label : sub.name, locale)}</span><strong>${C(b?.state.temperature)}</strong><small>${stateText}</small>`;
  $('#r-pot').innerHTML = `<span>${u.potTemp}</span><strong>${C(temperature(LAB_VESSEL_ID))}</strong>`;
  const sup = Object.values(session.state.entities).find(isSupply);
  if (params.supply && sup) {
    const I = sup.state.current;
    const U = sup.state.current > 0 ? sup.state.decomposition + I * ((sup.state.resistance ?? 0) + sup.params.internalResistance) : sup.params.voltage;
    const flat = sup.params.capacity !== undefined && sup.state.charge >= sup.params.capacity;
    const R = sup.state.resistance === null ? '' : formatQuantity(sup.state.resistance, 'Ω', { locale, level: 'school' });
    $('#r-power').innerHTML = `<span>${u.current}</span><strong>${I > 1e-4 ? formatQuantity(I, 'A', { locale, level: 'school' }) : flat ? u.batteryFlat : u.noCurrent}</strong><small>${u.supplyDetails(formatQuantity(U, 'V', { locale, level: 'school' }), R)}</small>`;
  } else if (params.heater) {
    const src = session.state.entities[entityId(LAB_HEATER_ID)];
    const pw = src && (isHeater(src) || isBurner(src)) && src.params.on ? src.params.power : 0;
    const thermo = Object.values(session.state.entities).find((e) => e.kind === 'thermal.thermostat') as { state: { heating: boolean } } | undefined;
    const blocked = thermo && !thermo.state.heating;
    $('#r-power').innerHTML = `<span>${u.power}</span><strong>${pw > 0 && !blocked ? formatQuantity(pw, 'W', { locale, level: 'school' }) : u.off}</strong>${thermo ? `<small>${locale === 'uk' ? 'терморегулятор' : 'thermostat'}</small>` : ''}`;
  } else {
    const around = params.cooler ? params.cooler.setpoint : params.roomTemp;
    const name = params.cooler ? tr(COOLERS[params.cooler.id].name, locale) : u.justRoom;
    $('#r-power').innerHTML = `<span>${u.surroundings}</span><strong>${C(celsius(around))}</strong><small>${name}</small>`;
  }

  const startBtn = $<HTMLButtonElement>('#start');
  startBtn.textContent = running ? u.pause : finished || history.length ? u.continueStep : u.start;
  // A guided procedure is led by its steps, not by "Start" — until it is answered: then it may go on.
  startBtn.hidden = !!preset?.guided && !presetDone();
  $<HTMLButtonElement>('#reset').textContent = u.reset;
  $<HTMLButtonElement>('#weigh').textContent = u.weigh.button;
  $<HTMLButtonElement>('#read-level').textContent = u.measure.level;
  renderSound();
  renderVoice();
  newsButton.textContent = u.byTheWay.button;
  addOverButton.textContent = `➕ ${u.choose.add}`;
  addOverButton.title = u.choose.open;
  $('#chart-toggle').textContent = chartOpen ? u.chartHide : u.chartShow;
  const scaleSel = $<HTMLSelectElement>('#scale');
  scaleSel.setAttribute('aria-label', u.weigh.scales);
  const scaleOpts = MASS_SCALE_IDS.map((id) => `<option value="${id}"${id === scale ? ' selected' : ''}>${tr(SCALES[id].name, locale)}</option>`).join('');
  if (scaleSel.dataset['html'] !== scaleOpts) {
    scaleSel.innerHTML = scaleOpts;
    scaleSel.dataset['html'] = scaleOpts;
  }
  $('#console-toggle').title = locale === 'uk' ? 'Консоль команд' : 'Command console';
  $('#console-grip').setAttribute('aria-label', locale === 'uk' ? 'Потягни, щоб змінити висоту консолі' : 'Drag to resize the console');
  $('#lbl-speed').textContent = u.speed;

  // Knob, switch or nothing (cooling has no knob: the cooler holds its setpoint).
  const h = heaterItem();
  const turns = knobTurns();
  $('#knob-wrap').hidden = turns === 'supply' ? false : !h || h.spec.control !== 'knob';
  $('#switch-wrap').hidden = turns === 'supply' || !h || h.spec.control !== 'switch';
  const on = (params.heater?.knob ?? 0) > 0;
  $<HTMLButtonElement>('#switch').textContent = on ? `⏻ ${u.on}` : `⏻ ${u.off}`;
  $('#switch').classList.toggle('is-on', on);
  if (turns === 'supply') {
    const sp = SUPPLIES[params.supply!.id].spec.voltage;
    knob.setDisabled(finished);
    knob.value = params.supply!.knob;
    knob.setLabels({ min: u.min, max: u.max, off: u.off }, Array.from({ length: 7 }, (_, i) => String(Math.round(sp.min + (i * (sp.max - sp.min)) / 6))));
    knob.element.setAttribute('aria-label', locale === 'uk' ? 'Напруга' : 'Voltage');
  } else if (h && params.heater) {
    knob.setDisabled(finished);
    knob.value = params.heater.knob;
    knob.setLabels({ min: u.min, max: u.max, off: u.off }, h.spec.minFraction > 0 ? ['0', u.min, '', '', u.max] : ['0', '1', '2', '3', '4', '5', '6']);
    knob.element.setAttribute('aria-label', u.power);
  }

  // Something goes on again: back from looking at an earlier row.
  if (running) lookingAt = null;
  // (The snapshot first: the protocol offers the row as soon as its end is kept.)
  const live = sceneView();
  const row = liveRowKey();
  if (row) snapshots.set(row, live);
  renderProtocol();
  const view = (lookingAt && snapshots.get(lookingAt)) || live;
  scene.render(view);
  // While a current flows (electrolysis, heating by current), the power supply hums; quiet once it stops.
  const flowing = running && !lookingAt && view.current && view.current.amps > 0 ? view.current.amps : 0;
  if (flowing) hum(0.3 + flowing / 2);
  else if (humFlowing) hum(0);
  humFlowing = flowing > 0;
  renderLookBack();
  // A new line of the Professor: he burbles it (the same line again stays quiet).
  // Lines that change several times in a moment (the board filling up): only the last one is spoken.
  if (view.professor.says !== lastSaid) {
    hush();
    window.clearTimeout(sayTimer);
    // A long line is read page by page: now its first page, the rest as the bubble's pages are turned.
    const line = scene.page;
    if (line && !scene.reading && !lookingAt) sayTimer = window.setTimeout(() => scene.talk(babble(line, currentVoice(), locale)), 140);
  }
  lastSaid = view.professor.says;
  if (!renderGuide()) {
    const q = quizNow();
    // The experiment is over (nothing left in its plan, no question on screen): offer a new one.
    if (!q && finished && !plan.length && !running) setHtml('#quiz', `<div class="renew-bar">${renewButton()}</div>`);
    else renderQuiz(q);
  }

  // Messages: impossibility before the start, headline after, warnings.
  const msg: string[] = [];
  const offer: string[] = [];
  const fixButtons = () =>
    Array.isArray(fixes) ? fixes.map((f, i) => `<button type="button" data-fix="${i}">${tr(f.label, locale)}</button>`).join('') : `<span class="muted small">${u.computing}</span>`;
  if (headline) {
    msg.push(renderHtml(headline()));
    // A guided procedure answers in its own panel under the scene; once is enough.
    if (presetAnswer && !preset?.guided) {
      msg.push(
        presetAnswer === 'computing'
          ? `<div class="answer"><h4>${u.answerTitle}</h4><p class="muted">${u.answerComputing}</p></div>`
          : `<div class="answer"><h4>${u.answerTitle}</h4>${preset ? `<p class="q">${tr(preset.question, locale)}</p>` : ''}<p>${tr(presetAnswer.text, locale)}</p>${whyHtml()}${predictionVerdict() ? `<p class="verdict">${predictionVerdict()}</p>` : ''}</div>`,
      );
    }
    // A ready-made experiment goes on along its plan.
    if (plan.length && !preset?.guided) offer.push(`<div class="offer plan"><p>${u.planNext(planLabel(plan))}</p><div class="fixes"><button type="button" class="primary" data-plan="1">▶ ${planLabel(plan)}</button></div></div>`);
    // The goal was not reached: offer what would reach it — the experiment continues from where it is.
    if (fixes === 'computing' || fixes.length) offer.push(`<div class="offer"><p>${doneRecord?.status.kind === 'stalls' || doneRecord?.status.kind === 'vessel-fails' ? u.offerAfterStall : u.offerAfterImpossible}</p><div class="fixes">${fixButtons()}</div></div>`);
  } else {
    // A flat line on the chart is not "nothing happens": say what is going on and how far it got.
    const phase = phaseNote();
    if (phase) msg.push(`<div class="phase"><p>${phase.text}</p><div class="progress"><span style="--p:${phase.pct}%"></span></div></div>`);
    for (const w of warnings) msg.push(`<p>⚠ ${tr(w, locale)}</p>`);
    // Between the steps of a guided procedure the setup only waits for the next one (a crucible on the table before the furnace).
    const impossible = waitingForPlan() ? undefined : labImpossibility(stepP);
    if (impossible) {
      // No point going on as it is: say why, offer to stop or to change the conditions.
      const stop = running || stepElapsed() > 0 ? `<button type="button" class="stop" data-stop="1">${u.offerStop}</button>` : '';
      offer.push(`<div class="offer"><p>⚠ ${tr(impossible, locale)}</p><p>${u.offerTitle}</p><div class="fixes">${fixButtons()}${stop}</div></div>`);
    }
    for (const c of labCautions(params)) msg.push(`<p>⚠ ${tr(c, locale)}</p>`);
  }
  setHtml('#messages', msg.join(''));
  // Buttons must not be rebuilt every frame, or a click may land on a replaced element.
  setHtml('#offer', offer.join(''));

  // Energy.
  const split = energySplit(initialState, session.state);
  const E = (j: number) => formatQuantity(j, 'J', { locale, level: 'school' });
  const sup0 = sup ? initialState.entities[sup.id] : undefined;
  if (sup && sup0 && isSupply(sup0) && sup.state.delivered - sup0.state.delivered > 1) {
    // A current: the source's energy goes into Joule heat, chemistry (gases) and its own warming.
    const total = sup.state.delivered - sup0.state.delivered;
    const chem = sup.state.chemical - sup0.state.chemical;
    const inside = sup.state.internal - sup0.state.internal;
    const rows = [
      [total - chem - inside, u.supplyHeat],
      [chem, u.supplyChemistry],
      [inside, u.supplyInside],
    ]
      .filter(([j]) => (j as number) > 1)
      .map(([j, what]) => `<li><span class="bar" style="--w:${((100 * (j as number)) / total).toFixed(1)}%"></span><b>${((100 * (j as number)) / total).toFixed(0)} %</b> ${what} <small>(${E(j as number)})</small></li>`);
    $('#energy').innerHTML = `<h3>${u.energyTitle}</h3><p>${u.supplyEnergy(E(total))}</p><ul class="shares">${rows.join('')}</ul>`;
  } else if (split.produced > 0) {
    const label = (id: string) => entityLabel(session.state, id, locale);
    const rows = split.shares
      .filter((s) => Math.abs(s.energy) > 1)
      .map((s) => {
        const pct = (100 * s.energy) / split.produced;
        const what = s.role === 'room' ? u.shareRoom : s.role === 'vapour' ? u.shareVapour : s.role === 'source' ? u.shareSource(label(s.entity)) : u.shareBody(label(s.entity));
        return `<li><span class="bar" style="--w:${Math.max(0, pct).toFixed(1)}%"></span><b>${pct.toFixed(0)} %</b> ${what} <small>(${E(s.energy)})</small></li>`;
      });
    $('#energy').innerHTML = `<h3>${u.energyTitle}</h3><p>${u.produced(E(split.produced))}</p><ul class="shares">${rows.join('')}</ul>`;
  } else {
    const gave = -(split.shares.find((s) => s.entity === SAMPLE_ID)?.energy ?? 0);
    $('#energy').innerHTML = gave > 1 ? `<h3>${u.energyTitle}</h3><p>${locale === 'uk' ? `Речовина віддала навколишньому ${E(gave)} теплоти.` : `The substance gave ${E(gave)} of heat to its surroundings.`}</p>` : '';
  }

  // Chart with the phase temperatures of this substance.
  // Only the temperatures that matter for this action, so the interesting part is not squeezed.
  const markers: { v: number; label: string }[] = [];
  const op = OPERATIONS[params.action];
  const heating = op.direction === 'heating';
  if (sub.freezing && op.markers.includes('freezing') && (!heating || params.startTemp <= sub.freezing.point.value)) markers.push({ v: sub.freezing.point.value, label: `${u.meltLine} ${sub.freezing.point.value} °C` });
  if (sub.boiling && op.markers.includes('boiling')) markers.push({ v: sub.boiling.point.value, label: `${u.boilLine} ${sub.boiling.point.value} °C` });
  if (!sub.boiling && sub.decomposes && op.markers.includes('smoke')) markers.push({ v: sub.decomposes.value, label: `${locale === 'uk' ? 'димлення' : 'smoke'} ${sub.decomposes.value} °C` });
  if (params.target !== undefined && op.target) markers.push({ v: params.target, label: `${u.targetLine} ${params.target} °C` });
  const sampleName = tr(b?.state.mixture && b.label ? b.label : sub.name, locale);
  $('#legend').innerHTML = [['water', sampleName], ['pot', u.potTemp], ...(h?.spec.method === 'contact' ? [['source', tr(h.name, locale)]] : [])]
    .map(([c, n]) => `<span class="key ${c}">${n}</span>`)
    .join('');
  chart.render(
    [
      { name: sampleName, className: 'water', points: points.sample },
      { name: u.potTemp, className: 'pot', points: points.vessel },
      { name: h ? tr(h.name, locale) : '', className: 'source', points: points.source },
    ],
    u.chartTime,
    markers,
  );
}

// ---------- protocol (right panel) ----------
function renderProtocol() {
  const u = t();
  const D = (s: number) => formatDuration(s, locale);
  const place = (p: LabParams) =>
    p.supply ? `${tr(SUPPLIES[p.supply.id].name, locale)}, ${formatQuantity(supplyVoltage(SUPPLIES[p.supply.id], p.supply.knob), 'V', { locale, level: 'school' })}` : p.heater ? tr(HEATERS[p.heater.id].name, locale) : p.cooler ? `${tr(COOLERS[p.cooler.id].name, locale)}, ${p.cooler.setpoint} °C` : u.justRoom;
  // When the steps differ only in the lid (the lid experiment), each row says which one it was.
  const lids = new Set([...history.map((h) => !!h.params.lid), !!params.lid]);
  const lidNote = (p: LabParams) => (lids.size > 1 ? (p.lid ? u.withLid : u.withoutLid) : '');
  const what = (p: LabParams) =>
    `${tr(OPERATIONS[p.action].label, locale).replace('…', '')}${lidNote(p)}${p.target !== undefined && OPERATIONS[p.action].target ? ` ${p.target} °C` : ''}${p.duration !== undefined && OPERATIONS[p.action].duration ? `, ${p.duration} ${locale === 'uk' ? 'хв' : 'min'}` : ''}`;
  const adds = (a: readonly Added[]) => a.map((x) => `<span class="added">${u.added(tr(x.what, locale).toLowerCase(), formatQuantity(x.mass, 'kg', { locale, level: 'school' }))}</span>`).join('');
  const outcome = (st: LabStatus, r: ExperimentResult<LabCommand>, p: LabParams) =>
    st.kind === 'reached' && OPERATIONS[p.action].duration ? `✓ ${D(st.at)}` : st.kind === 'reached' ? u.stepReached(D(st.at)) : st.kind === 'will-reach' ? u.stepStopped(D(r.final.time - r.initial.time)) : u.stepFailed;
  // Weighings before the step ran, and after it (in the pause before the next one).
  const weighed = (log: ExperimentResult<LabCommand>['log'], start: number, before: boolean, step: number) =>
    readingsOf(log)
      .map((w, i) => ({ ...w, look: lookAttr(`m:${step}:${i}`) }))
      .filter((w) => (w.time <= start + 1e-9) === before)
      .map(({ command: c, record: r, look }) => {
        const text =
          c.type === 'lab.weigh' ? u.weigh.row(formatReading(c.scale, r.value, locale))
          : c.type === 'lab.read-level' ? u.measure.rowLevel(formatMeasured('volume', r.value, r.inputs?.['division'] ?? 1e-6, locale))
          : c.type === 'lab.hang' ? u.measure.rowHang(formatMeasured('force', r.value, 0.1, locale), c.into)
          : c.type === 'lab.ohm' ? `Ω ${formatMeasured('resistance', r.value, r.inputs?.['division'] ?? 0.01, locale)} (${sig(r.inputs?.['temperature'] ?? 20, 3, locale)} °C)`
          : '';
        return `<span class="weighed"${look}>${text}</span>`;
      })
      .join('');
  const timed = timedExperiment();
  const rows = history.map((h, i) => {
    // A run of a measuring procedure (before «почати знову»): what was put in and measured.
    if (!timed) return `<li class="done"><span class="what">${u.measuring}</span>${adds(h.adds)}${weighed(h.result.log, h.result.initial.time, true, i)}</li>`;
    const ok = h.status.kind === 'reached' || h.status.kind === 'will-reach';
    const t0 = h.result.initial.time;
    const ran = h.result.final.time > t0;
    return `<li class="${ok ? 'done' : 'failed'}"${lookAttr(`s:${i}`)}><span class="what">${what(h.params)}</span><span class="where">${place(h.params)}</span>${adds(h.adds)}${weighed(h.result.log, t0, true, i)}<span class="outcome">${outcome(h.status, h.result, h.params)}</span>${ran ? weighed(h.result.log, t0, false, i) : ''}</li>`;
  });
  const curLog = session.result().log;
  // A measuring procedure on the bench: the protocol is its measurements, each with what it showed.
  if (preset?.bench) {
    const done = curLog.filter((e) => e.ok && readingsOf([e]).length).map((e, i) => {
      const c = e.command as LabCommand;
      const r = readingsOf([e])[0]!.record;
      const label = 'type' in c && c.type in BENCH_TEXT ? tr(BENCH_TEXT[c.type as keyof typeof BENCH_TEXT](c as never).plan, locale) : c.type === 'lab.hang' ? (c.into === 'air' ? u.measure.hangAir : u.measure.hangLiquid) : u.measure.level;
      // (Weights on both sides of the lever: no instrument — it balances or tips.)
      const leverShown = c.type === 'lab.lever' && r.instrument === 'lever' ? ((r.inputs?.['tip'] ?? 0) === 0 ? u.leverLevel : u.leverTips) : null;
      // (The circuit reads two instruments at once: both are written.)
      const both = c.type === 'lab.circuit' || c.type === 'lab.pair' ? readingsOf([e]).map((x) => formatMeasured(x.record.quantity, x.record.value, x.record.quantity === 'current' ? 0.01 : 0.1, locale)).join(' · ') : null;
      // (The black box's milliammeter: milliamperes to a tenth.)
      // (A body in a liquid: the times at the marks.)
      const sShown = c.type === 'lab.sink' ? readingsOf([e]).map((x) => x.record).filter((x) => x.quantity === 'time').map((x) => formatMeasured('time', x.value, 0.01, locale)).join(' · ') : null;
      // (Induction: the milliammeter's signed milliamperes.)
      const iShown = c.type === 'lab.induct' ? inductShown(r.value) : null;
      // (The electromagnet: the ammeter and the compass.)
      const mRecs = c.type === 'lab.magnet' ? readingsOf([e]).map((x) => x.record) : [];
      const mShown = c.type === 'lab.magnet' ? mRecs.map((x) => formatMeasured(x.quantity, x.value, x.quantity === 'current' ? 0.01 : 1, locale)).join(' · ') : null;
      // (Pascal's device: the water poured and the manometer.)
      const vRecs = c.type === 'lab.vessel' ? readingsOf([e]).map((x) => x.record) : [];
      const vShown = c.type === 'lab.vessel' && vRecs.length === 2 ? `${formatMeasured('volume', vRecs[0]!.value, 5e-6, locale)} · Δh ${formatMeasured('length', vRecs[1]!.value, 0.001, locale)}` : null;
      // (The pistons' two diameters.)
      const pRecs = c.type === 'lab.press' ? readingsOf([e]).map((x) => x.record) : [];
      const pShown = c.type === 'lab.press' && pRecs.length === 2 ? `${formatMeasured('length', pRecs[0]!.value, 0.001, locale)} · ${formatMeasured('length', pRecs[1]!.value, 0.001, locale)}` : null;
      // (The U-tube with oil: both columns.)
      const uRecs = c.type === 'lab.utube' ? readingsOf([e]).map((x) => x.record) : [];
      const uShown = c.type === 'lab.utube' && uRecs.length === 2 ? (locale === 'uk' ? `олія ${formatMeasured('length', uRecs[0]!.value, 0.001, locale)}, вода ${formatMeasured('length', uRecs[1]!.value, 0.001, locale)}` : `oil ${formatMeasured('length', uRecs[0]!.value, 0.001, locale)}, water ${formatMeasured('length', uRecs[1]!.value, 0.001, locale)}`) : null;
      const boxShown = c.type === 'lab.box' && r.value !== null ? `${(r.value * 1000).toFixed(1).replace('.', locale === 'uk' ? ',' : '.')} ${locale === 'uk' ? 'мА' : 'mA'}` : null;
      const shown = both ?? leverShown ?? boxShown ?? uShown ?? pShown ?? vShown ?? mShown ?? iShown ?? sShown ?? (r.quantity === 'pressure' ? formatMeasured('pressure', r.value, 100, locale) : r.quantity === 'mass' ? formatMeasured('mass', r.value, 0.00001, locale) : r.quantity === 'length' ? formatMeasured('length', r.value, 0.001, locale) : r.quantity === 'time' ? formatMeasured('time', r.value, 0.01, locale) : r.quantity === 'volume' ? formatMeasured('volume', r.value, r.inputs?.['division'] ?? 1e-6, locale) : formatMeasured('force', r.value, 0.1, locale));
      return `<li class="done"${lookAttr(`m:${history.length}:${i}`)}><span class="what">${lowerFirst(label).replace(/^./, (x) => x.toUpperCase())}</span><span class="outcome">${shown}</span></li>`;
    });
    const next = plan.map((s) => `<li class="planned"><span class="what">${s.kind === 'bench' ? tr(BENCH_TEXT[s.command.type](s.command).button, locale) : s.kind === 'level' ? u.measure.level : s.kind === 'hang' ? (s.into === 'air' ? u.measure.hangAir : u.measure.hangLiquid) : ''}</span></li>`);
    $('#protocol-title').textContent = u.protocolTitle;
    $('#protocol').innerHTML = [...done, ...next].join('');
    $('#protocol-hint').textContent = snapshots.size && !instrumentBusy ? u.lookBackHint : '';
    // (Recording a bench procedure is not supported yet.)
    const save = document.querySelector<HTMLButtonElement>('.rec-save-btn');
    if (save) save.disabled = true;
    return;
  }
  const now = doneRecord ? outcome(doneRecord.status, doneRecord.result, doneRecord.params) : running || stepElapsed() > 0 ? u.stepRunning(formatDuration(Math.floor(stepElapsed()), locale)) : u.stepWaiting;
  const cur = history.length;
  // A measuring procedure (nothing runs in time): one row of what was measured, not a step waiting for its start.
  // A guided procedure before its operation has begun: the operation is in the plan below, in its place —
  // here only what was already put in or measured (nothing yet — no row), not the same step a second time.
  const ahead = !!preset?.guided && timed && !running && stepElapsed() === 0 && !doneRecord && plan.some((s) => s.kind === 'operation');
  const doneHere = stepAdds.length > 0 || readingsOf(curLog).length > 0;
  if (ahead) {
    if (doneHere) rows.push(`<li class="done"><span class="what">${u.measuring}</span>${adds(stepAdds)}${weighed(curLog, initialState.time, true, cur)}</li>`);
  } else rows.push(
    timed
      ? `<li class="current"${finished ? lookAttr(`s:${cur}`) : ''}><span class="what">${what(stepP)}</span><span class="where">${place(stepP)}</span>${adds(stepAdds)}${weighed(curLog, initialState.time, true, cur)}<span class="outcome">${now}</span>${weighed(curLog, initialState.time, false, cur)}${adds(pendingAdds)}</li>`
      : `<li class="${plan.length ? 'current' : 'done'}"><span class="what">${u.measuring}</span>${adds(stepAdds)}${weighed(curLog, initialState.time, true, cur)}${weighed(curLog, initialState.time, false, cur)}${adds(pendingAdds)}</li>`,
  );
  const { shown, hidden } = unspoiled(plan);
  for (const s of shown) rows.push(`<li class="planned"><span class="what">${planStepLabel(s)}</span></li>`);
  if (hidden) rows.push(`<li class="planned more"><span class="what">${u.moreSteps(hidden)}</span></li>`);
  $('#protocol-title').textContent = u.protocolTitle;
  $('#protocol').innerHTML = rows.join('');
  $('#protocol-hint').textContent = replaying ? u.rec.replaying(replaying.rec.name, replaying.index + 1, replaying.rec.steps.length) : preset?.guided && !presetDone() ? (snapshots.size && !running ? u.lookBackHint : '') : [snapshots.size && !running ? u.lookBackHint : '', finished ? u.protocolNext : u.protocolHint].filter(Boolean).join(' ');
  // The save button follows the experiment; the list is rebuilt only on its own events.
  const saveBtn = document.querySelector<HTMLButtonElement>('.rec-save-btn');
  if (saveBtn) saveBtn.disabled = !history.length && stepElapsed() <= 0 && !doneRecord;
}

/** The steps to come that may be shown before a prediction is answered (experiment-sheet.ts). */
function unspoiled(steps: readonly ProtocolStep[], p: Preset | null = preset): { shown: readonly ProtocolStep[]; hidden: number } {
  return unspoiledSteps(steps, !!p && predictsFirst(p) && (p !== preset || presetAnswer === null));
}
const planStepLabel = (s: ProtocolStep) => planStepLabelIn(s, locale);
/** A row of the protocol that can be looked back at: its key, and marked when it is on the scene now. Only in a pause or at the end — not while the experiment runs or an instrument is moving. */
function lookAttr(key: string): string {
  return snapshots.has(key) && !running && !instrumentBusy ? ` data-look="${key}"${lookingAt === key ? ' data-looking="1"' : ''}` : '';
}
/** Over the scene while an earlier row is looked at: which one, and the way back. */
function renderLookBack() {
  const bar = $('#look-back');
  const row = lookingAt ? document.querySelector<HTMLElement>(`#protocol [data-look="${lookingAt}"]`) : null;
  bar.hidden = !row;
  if (!row) return;
  const what = (row.querySelector('.what')?.textContent ?? row.textContent ?? '').trim();
  setHtml('#look-back', `<span>👁 ${t().lookBack(what)}</span><button type="button" data-look-return="1">${t().lookBackReturn}</button>`);
}
$('#protocol').addEventListener('click', (e) => {
  const row = (e.target as HTMLElement).closest<HTMLElement>('[data-look]');
  if (!row || running || instrumentBusy) return;
  // The same row again: back to the experiment as it is now.
  const key = row.dataset['look']!;
  lookingAt = lookingAt === key ? null : key;
  // The table back in front: it is the instruments one comes to look at.
  if (lookingAt) scene.read(false);
  render();
});
$('#look-back').addEventListener('click', (e) => {
  if (!(e.target as HTMLElement).closest('[data-look-return]')) return;
  lookingAt = null;
  render();
});

// ---------- choosing over the table ----------
/**
 * Setting the table up thing by thing: the action chosen, its device, then the vessel, then the
 * substance are offered in a row over the table; each chosen one flies down to its place. Under way,
 * only the device (the vessel and its contents stay). What is not placed yet is not drawn.
 */
const stage = scene.element.querySelector<HTMLElement>('.scene-stage')!;
const chooser = createChooser(stage, () => ({ prev: t().choose.prev, next: t().choose.next, close: t().choose.close }));

/** The picture over the table: the device as it is drawn on the table, an empty vessel, a bottle or a block. */
function choicePic(c: Choice): string {
  if ('device' in c.look) {
    if (c.look.device === 'none') return `<span class="dev-pic">${icon(c.look.icon, 'ic huge')}</span>`;
    const shape = (vesselItem().look ?? 'pot') as VesselShape;
    const g = vesselGeom(shape, baseFor(c.look.device, shape));
    // (Without the ids: those belong to the drawing on the table.)
    return `<svg data-fit viewBox="0 0 ${W} ${H}" aria-hidden="true"><g>${deviceSvg(c.look.device, g).replace(/ id="[^"]*"/g, '')}</g></svg>`;
  }
  if ('vessel' in c.look) return vesselPreview(c.look.vessel, c.look.material, liquidKindOf(substance()), 0);
  return shelfPic(c.look.substance);
}

function startAssembly() {
  adding = false;
  scene.read(false);
  const started = experimentStarted();
  assembly = { stages: started ? ['device'] : ['device', 'vessel', 'substance'], at: 0, placed: new Set(started ? ['vessel', 'liquid'] : []) };
  render();
  showAssembly();
}
function showAssembly() {
  const a = assembly;
  if (!a) return;
  const u = t();
  const at = a.stages[a.at]!;
  const flat = (gs: readonly ChoiceGroup[]) => gs.flatMap((g) => g.items);
  const devices = at === 'device' ? deviceChoices() : null;
  const choices = devices ? flat(devices.groups) : at === 'vessel' ? flat(vesselChoices()) : flat(substanceChoices()).filter((x) => x.sample);
  if (!choices.length) return nextAssembly();
  const view: ChooserStage = {
    title: devices ? devices.title : at === 'vessel' ? u.vessel : u.substance,
    step: { at: a.at, of: a.stages.length },
    start: Math.max(0, choices.findIndex((x) => x.selected)),
    cards: choices.map((x) => ({
      key: x.key,
      name: tr(x.name, locale),
      note: x.note,
      pic: choicePic(x),
      action: 'substance' in x.look ? (x.look.substance.category.startsWith('liquid.') ? u.choose.pour : u.choose.putIn) : u.choose.put,
    })),
  };
  chooser.show(view, (card, pic) => void place(choices.find((x) => x.key === card.key)!, pic, at), endAssembly);
}
/** The chosen thing is set on the table (still not drawn), flies to where it now stands, and shows. */
async function place(x: Choice, pic: HTMLElement, at: AssemblyStage) {
  x.pick();
  if (!assembly) return;
  await fly(stage, pic, scene.rectOf(at === 'device' ? 'device' : 'vessel'), at === 'substance');
  if (!assembly) return;
  assembly.placed.add(at === 'substance' ? 'liquid' : at);
  render();
  nextAssembly();
}
function nextAssembly() {
  if (!assembly) return;
  assembly.at++;
  if (assembly.at >= assembly.stages.length) return endAssembly();
  showAssembly();
}
/** Closed or done: everything chosen stands on the table. */
function endAssembly() {
  assembly = null;
  chooser.hide();
  render();
}
/** Something taken from the shelf directly: no row over the table any more. */
function closeChooser() {
  if (!assembly && !adding) return;
  assembly = null;
  adding = false;
  chooser.hide();
}

/** What can be put into the contents now, in a row over the table; the chosen one is dropped (or poured) in. */
function openAdding(error?: string) {
  assembly = null;
  adding = true;
  scene.read(false);
  const u = t();
  const addable = new Set(addableTo(session.state, commands).map((x) => x.id));
  const list = SUBSTANCE_FAMILIES.flatMap((f) => Object.values(SUBSTANCES).filter((x) => f.categories.includes(x.category) && addable.has(x.id)));
  const g = (x: number) => `${sig(x, 3, locale)} ${locale === 'uk' ? 'г' : 'g'}`;
  // The one chosen in the "add" panel keeps its settings there; another comes with its usual ones.
  const portion = (id: SubstanceId) => (id === addSub ? { frozen: addFrozen, temp: addTemp, grams: addGrams } : addDefaults(id));
  chooser.show(
    {
      title: u.addTitle,
      start: Math.max(0, list.findIndex((x) => x.id === addSub)),
      ...(error ? { error } : {}),
      cards: list.map((x) => {
        const p = portion(x.id as SubstanceId);
        // Frozen — a piece of ice, not the bottle.
        const pic = p.frozen ? blockSvg('#dff1ff', formulaOf(x)) : shelfPic(x);
        return { key: x.id, name: tr(x.name, locale), note: `${g(p.grams)} · ${String(p.temp).replace('-', '−')} °C${p.frozen ? ` · ${u.addFrozen}` : ''}`, pic, action: u.choose.add };
      }),
    },
    (card, pic) => void dropIn(card.key as SubstanceId, pic),
    () => {
      adding = false;
      render();
    },
  );
  render();
}
async function dropIn(id: SubstanceId, pic: HTMLElement) {
  if (id !== addSub) chooseAdd(id);
  const sub = SUBSTANCES[id];
  // A liquid or a powder is poured from its bottle; a block or ice is dropped in.
  const pour = !addFrozen && !(sub.category.startsWith('solid.') && !dissolves(sub));
  await fly(stage, pic, scene.rectOf('vessel'), pour);
  if (!adding) return;
  const error = addPortion(addSub, addGrams, addTemp, addFrozen);
  buildAdd();
  if (error) return openAdding(error);
  adding = false;
  chooser.hide();
  render();
}

// ---------- shelf (left panel) ----------
/** Which group is open in each shelf section (substances, devices, vessels, instruments) — by its label. */
const openFamilies: Record<string, string> = (() => {
  try {
    return JSON.parse(store.get('families') ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
})();
const openSections = new Set<string>((store.get('open') ?? 'action,substance,vessel,device,instruments,conditions').split(','));
let query = '';

function buildShelf() {
  const u = t();
  const root = $('#setup');
  const shelf = $('#shelf');
  const scroll = shelf.scrollTop;
  root.innerHTML = '';
  const rebuild = freshSetup;
  const matches = (name: LocalizedText) => !query || name.uk.toLowerCase().includes(query) || name.en.toLowerCase().includes(query);

  const section = (id: string, title: string, chosen: string, ...content: HTMLElement[]) => {
    const d = el('details', { className: 'shelf-section', open: openSections.has(id) || !!query });
    d.append(el('summary', {}, el('span', {}, title), el('span', { className: 'chosen' }, chosen)), ...content);
    d.addEventListener('toggle', () => {
      if (d.open) openSections.add(id);
      else openSections.delete(id);
      store.set('open', [...openSections].join(','));
    });
    root.append(d);
  };
  const chips = (options: readonly (readonly [string, string])[], selected: string, onPick: (v: string) => void) =>
    el(
      'div',
      { className: 'chips' },
      ...options.map(([v, label]) => {
        const b = el('button', { type: 'button', className: `chip${v === selected ? ' selected' : ''}` }, label);
        b.setAttribute('aria-pressed', String(v === selected));
        b.onclick = () => onPick(v);
        return b;
      }),
    );
  const number = (label: string, value: number, min: number, max: number, step: number, apply: (v: number) => void, after: () => void = rebuild) => {
    const i = el('input', { type: 'number', value: String(value), min: String(min), max: String(max), step: String(step), inputMode: 'decimal' });
    i.onchange = () => {
      const v = Number(i.value);
      if (Number.isFinite(v) && v >= min && v <= max) {
        apply(v);
        after();
      } else i.value = String(value);
    };
    return el('label', { className: 'mini-field' }, el('span', {}, label), i);
  };
  /** One selectable card with a picture; the "i" button opens the reference card. */
  const card = (o: { name: LocalizedText; note?: string | undefined; badge?: string; selected: boolean; pic: string; ref?: string; onPick: () => void }) => {
    const li = el('li', { className: 'card-li' });
    const b = el('button', { type: 'button', className: `card-item${o.selected ? ' selected' : ''}` });
    b.setAttribute('aria-pressed', String(o.selected));
    b.innerHTML = `<span class="card-pic">${o.pic}</span>`;
    b.append(el('span', { className: 'card-name' }, tr(o.name, locale)), ...(o.badge ? [el('span', { className: 'badge' }, o.badge)] : []), ...(o.note ? [el('span', { className: 'card-note' }, o.note)] : []));
    // Anything picked on the shelf (even what is already chosen) sets the table.
    b.onclick = () => {
      const was = tableSet;
      tableSet = true;
      closeChooser();
      o.onPick();
      if (!was) render();
    };
    li.append(b);
    if (o.ref) {
      const info = el('button', { type: 'button', className: 'info', title: u.reference }, 'i');
      info.setAttribute('aria-label', `${u.reference}: ${tr(o.name, locale)}`);
      info.dataset['ref'] = o.ref;
      li.append(info);
    }
    return li;
  };
  const describe = (i: { description: Parameters<typeof textFor>[0]; safety?: Parameters<typeof textFor>[0]; modelNotes?: readonly LocalizedText[] }): HTMLElement[] => [
    el('p', {}, tr(textFor(i.description, level), locale)),
    ...(i.safety ? [el('p', { className: 'safety' }, `⚠ ${u.safety}: ${tr(textFor(i.safety, level), locale)}`)] : []),
  ];
  /** Cards in groups; the selected card's settings follow the cards. */
  /**
   * The substances: one family open at a time (the sample's, or the one opened last), the others
   * folded into a header with their count; inside, a carousel of cards two at a time. While searching,
   * every family with a match is open.
   */
  const familyShelf = (key: string, groups: readonly { label: string; cards: HTMLElement[] }[], detail?: HTMLElement[]) => {
    const out: HTMLElement[] = [];
    const shown = groups.filter((g) => g.cards.length);
    // Open: the group last opened here, else the one with the chosen card, else the first.
    if (openFamilies[key] !== '' && !shown.some((g) => g.label === openFamilies[key])) openFamilies[key] = shown.find((g) => g.cards.some((c) => c.querySelector('.selected')))?.label ?? shown[0]?.label ?? '';
    // What is said about the chosen item (its description, settings) comes right under its family — not after all the others.
    const home = shown.find((g) => g.cards.some((c) => c.querySelector('.selected')));
    const info = detail?.length ? el('div', { className: 'item-detail' }, ...detail) : null;
    for (const g of shown) {
      const open = query ? true : g.label === openFamilies[key];
      const head = el('button', { type: 'button', className: `family-head${open ? ' open' : ''}` }, el('span', {}, g.label), el('span', { className: 'family-count' }, String(g.cards.length)));
      head.setAttribute('aria-expanded', String(open));
      head.onclick = () => {
        openFamilies[key] = open && !query ? '' : g.label;
        store.set('families', JSON.stringify(openFamilies));
        buildShelf();
      };
      out.push(head);
      if (open) out.push(...carousel(g.cards, 2, Math.max(0, g.cards.findIndex((c) => c.querySelector('.selected')))));
      if (info && g === home) out.push(info);
    }
    if (info && !home) out.push(info);
    return out;
  };
  const cardGroups = (groups: readonly { label: string; cards: HTMLElement[] }[], detail?: HTMLElement[]) => {
    const out: HTMLElement[] = [];
    for (const g of groups) {
      if (!g.cards.length) continue;
      out.push(el('div', { className: 'group-label' }, g.label), el('ul', { className: 'cards' }, ...g.cards));
    }
    if (detail?.length) out.push(el('div', { className: 'item-detail' }, ...detail));
    return out;
  };
  const volume = (l: number) => (l < 1 ? `${Math.round(l * 1000)} ${u.ml}` : `${num(l)} ${u.liters}`);
  const num = (x: number) => sig(x, 4, locale);
  /** Once the experiment is under way, the vessel and its contents stay: only what fits them is offered. */
  const started = experimentStarted();
  const sub = substance();
  const v = vesselItem();
  const pick = pickParams;

  /**
   * A carousel: `perPage` items at a time, arrows and page dots; it opens on the page with item `start`.
   * Long lists stay short on screen — actions, and the substances of a family.
   */
  const carousel = (items: readonly HTMLElement[], perPage: number, start: number): HTMLElement[] => {
    const track = el('ul', { className: 'car-track' });
    track.style.setProperty('--per', String(perPage));
    track.append(...items);
    const prev = el('button', { type: 'button', className: 'car-btn' }, '‹');
    const next = el('button', { type: 'button', className: 'car-btn' }, '›');
    prev.setAttribute('aria-label', locale === 'uk' ? 'Попередні' : 'Previous');
    next.setAttribute('aria-label', locale === 'uk' ? 'Наступні' : 'Next');
    const pages = Math.ceil(items.length / perPage);
    const dots = el('div', { className: 'car-dots' }, ...Array.from({ length: pages > 1 ? pages : 0 }, () => el('span')));
    const sync = () => {
      const page = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
      [...dots.children].forEach((d, i) => d.classList.toggle('on', i === page));
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    };
    prev.onclick = () => track.scrollBy({ left: -track.clientWidth, behavior: 'smooth' });
    next.onclick = () => track.scrollBy({ left: track.clientWidth, behavior: 'smooth' });
    track.addEventListener('scroll', sync, { passive: true });
    requestAnimationFrame(() => {
      track.scrollLeft = Math.floor(Math.max(0, start) / perPage) * track.clientWidth;
      sync();
    });
    return [el('div', { className: 'carousel' }, prev, track, next), dots];
  };

  // 1. What we do: a carousel of tiles, two at a time (like every card on the shelf).
  const actions = LAB_ACTIONS.filter((a) => !started || (OPERATIONS[a].accepts?.(sub) ?? true));
  const tiles = actions.map((a) => {
    const b = el('button', { type: 'button', className: `tile${a === params.action ? ' selected' : ''}` });
    b.innerHTML = `${icon(OPERATIONS[a].icon, 'ic big')}<span>${tr(OPERATIONS[a].label, locale)}</span>`;
    b.setAttribute('aria-pressed', String(a === params.action));
    // The action chosen, its things are chosen over the table one by one.
    b.onclick = () => {
      setAction(a);
      startAssembly();
    };
    return el('li', { className: 'car-li' }, b);
  });
  const actionContent: HTMLElement[] = carousel(tiles, 2, actions.indexOf(params.action));
  const op = OPERATIONS[params.action];
  if (op.target) {
    actionContent.push(number(u.target, params.target ?? op.target.default, op.target.min, op.target.max, 1, (x) => (params = { ...params, target: x }), stepChanged));
  }
  if (op.duration) {
    actionContent.push(number(u.duration, params.duration ?? op.duration.default, op.duration.min, op.duration.max, 1, (x) => (params = { ...params, duration: x }), stepChanged));
  }
  if (!query) section('action', u.action, tr(op.label, locale), ...actionContent);

  // 2. The device — it decides which vessels can be used.
  const devPic = (look: string | undefined) => `<span class="dev-pic">${icon(look, 'ic huge')}</span>`;
  const asCard = (c: Choice, pic: string) => card({ name: c.name, note: c.note, ...(c.badge ? { badge: c.badge } : {}), ...(c.ref ? { ref: c.ref } : {}), selected: c.selected, pic, onPick: c.pick });
  const shelfPicOf = (c: Choice) => ('device' in c.look ? devPic(c.look.icon) : 'vessel' in c.look ? vesselPreview(c.look.vessel, c.look.material, liquidKindOf(sub)) : shelfPic(c.look.substance));
  const cardsOf = (groups: readonly ChoiceGroup[]) => groups.map((g) => ({ label: g.label, cards: g.items.map((c) => asCard(c, shelfPicOf(c))) }));
  const devices = deviceChoices(matches);
  const uses = actionUses(params.action);
  if (uses === 'supply') {
    // What the electrodes are made of: graphite does not react; a steel anode dissolves.
    const electrodeChips = params.supply
      ? [el('span', { className: 'muted small' }, u.electrodes), chips(ELECTRODE_MATERIALS.map((m) => [m, tr(COMPONENTS[m].name, locale)] as const), params.supply.electrodes ?? 'graphite', (m) => {
          lastSupply = { ...params.supply!, electrodes: m as ElectrodeMaterial };
          pick({ ...params, supply: lastSupply }, stepChanged);
        })]
      : [];
    section('device', devices.title, params.supply ? tr(SUPPLIES[params.supply.id].name, locale) : '—', ...familyShelf('device', cardsOf(devices.groups), electrodeChips));
  } else if (uses === 'heater' || uses === 'either') {
    const h = params.heater ? HEATERS[params.heater.id] : undefined;
    const furnace = params.cooler && COOLERS[params.cooler.id].spec.hot ? COOLERS[params.cooler.id] : undefined;
    const furnaceDetail = furnace
      ? [number(`${u.furnaceSetpoint} (${furnace.spec.setpoint.min}…${furnace.spec.setpoint.max})`, params.cooler!.setpoint, furnace.spec.setpoint.min, furnace.spec.setpoint.max, 10, (sp) => {
          params = { ...params, cooler: { ...params.cooler!, setpoint: sp } };
        }, stepChanged)]
      : [];
    const detail = furnace ? furnaceDetail : h && params.heater && h.spec.ratings.length > 1
      ? [el('span', { className: 'muted small' }, u.model), chips(h.spec.ratings.map((r) => [String(r), formatQuantity(r, 'W', { locale, level: 'school' })] as const), String(params.heater.rating), (r) => {
          lastHeater = { ...params.heater!, rating: Number(r) };
          pick({ ...params, heater: lastHeater }, stepChanged);
        })]
      : [];
    section('device', devices.title, h ? tr(h.name, locale) : furnace ? tr(furnace.name, locale) : u.justRoom, ...familyShelf('device', cardsOf(devices.groups), detail));
  } else {
    const cool = params.cooler ? COOLERS[params.cooler.id] : undefined;
    const detail = cool && cool.spec.setpoint.max > cool.spec.setpoint.min
      ? [number(`${u.setpoint} (${cool.spec.setpoint.min}…${cool.spec.setpoint.max})`, params.cooler!.setpoint, cool.spec.setpoint.min, cool.spec.setpoint.max, 1, (sp) => {
          lastCooler = { ...params.cooler!, setpoint: sp };
          params = { ...params, cooler: lastCooler };
        }, stepChanged)]
      : [];
    section('device', devices.title, cool ? tr(cool.name, locale) : u.justRoom, ...familyShelf('device', cardsOf(devices.groups), detail));
  }

  // 3. Substance — only what the chosen operation can be done with.
  const small = params.size < 0.1;
  section(
    'substance',
    u.substance,
    tr(sub.name, locale),
    // What the substance is (and what is only an estimate about it), in words, first; then the cards with their numbers.
    el('div', { className: 'item-detail item-about' }, ...describe(sub)),
    ...familyShelf(
      'substance',
      cardsOf(substanceChoices(matches)),
      [
        ...(started
          ? [el('p', { className: 'muted small' }, u.lockedDuringExperiment)]
          : [
              isDrySample(sub)
                ? number(u.mass, Math.round(params.liters * sub.liquid.density.value), 1, Math.floor(params.size * sub.liquid.density.value), 1, (g) => (params = { ...params, liters: g / sub.liquid.density.value }))
                : number(`${u.amount} (≤ ${volume(params.size)})`, params.liters, small ? 0.001 : 0.01, params.size, small ? 0.001 : 0.01, (x) => (params = { ...params, liters: x })),
              number(u.startTemp, params.startTemp, -30, 300, 1, (x) => (params = { ...params, startTemp: x })),
            ]),
      ],
    ),
  );

  // 4. Vessel — only what the chosen device can work with.
  const fit = vesselsFor(params).find((f) => f.vessel.id === params.vessel);
  section(
    'vessel',
    u.vessel,
    `${tr(v.name, locale)}, ${volume(params.size)}`,
    ...familyShelf(
      'vessel',
      cardsOf(vesselChoices(matches)),
      started || !fit
        ? [el('p', { className: 'muted small' }, started ? u.lockedDuringExperiment : '')]
        : [
            el('span', { className: 'muted small' }, u.size),
            chips(fit.sizes.map((z) => [String(z), volume(z)] as const), String(params.size), (z) => {
              const size = Number(z);
              const q = { ...params, size, liters: params.liters <= size ? params.liters : round(size * 0.7, size < 0.1 ? 3 : 2) };
              delete (q as { vesselMass?: number }).vesselMass;
              pick(q, rebuild);
            }),
            ...(fit.materials.length > 1
              ? [el('span', { className: 'muted small' }, u.material), chips(fit.materials.map((m) => [m, u.materials[m] ?? m] as const), params.material, (m) => pick({ ...params, material: m }, rebuild))]
              : []),
            number(u.vesselMass, params.vesselMass ?? typicalVesselMass(v, params.size), 0.01, 20, 0.01, (m) => (params = { ...params, vesselMass: m })),
            ...(v.spec.lid === 'optional'
              ? (() => {
                  const lid = el('input', { type: 'checkbox', checked: params.lid });
                  lid.onchange = () => pick({ ...params, lid: lid.checked }, rebuild);
                  return [el('label', { className: 'check' }, lid, el('span', {}, u.lid))];
                })()
              : []),
          ],
    ),
  );

  // 5. Measuring instruments: the scales to weigh on, and the dynamometer (a body is hung on it in the "add" panel).
  section(
    'instruments',
    u.instruments,
    tr(SCALES[scale].name, locale),
    ...familyShelf(
      'instruments',
      childrenOf('device.measuring').map((c) => ({
        label: tr(c.name, locale),
        cards: SCALE_IDS.filter((id) => SCALES[id].category === c.id && matches(SCALES[id].name)).map((id) => {
          const x = SCALES[id];
          const force = x.spec.quantity === 'force';
          const unit = force ? 'force' : 'mass';
          return card({
            name: x.name,
            pic: devPic(x.look),
            ref: `equipment:${id}`,
            note: `${force ? `${num(x.spec.capacity.value)} ${locale === 'uk' ? 'Н' : 'N'}` : formatReading(id, x.spec.capacity.value, locale)} · ${locale === 'uk' ? 'поділка' : 'division'} ${formatMeasured(unit, x.spec.resolution.value, x.spec.resolution.value, locale)}`,
            selected: !force && id === scale,
            onPick: () => {
              if (force) {
                // A body is hung on it: the "add" panel has the body and the buttons.
                const solid = SUBSTANCES[addSub].category.startsWith('solid.') && !dissolves(SUBSTANCES[addSub]);
                prepareAdd(solid ? addSub : 'aluminium');
                return;
              }
              scale = id;
              store.set('scale', id);
              buildShelf();
              render();
            },
          });
        }),
      })),
    ),
  );

  // 6. Conditions.
  if (!query) section('conditions', locale === 'uk' ? 'Умови' : 'Conditions', `${params.roomTemp} °C`, number(u.room, params.roomTemp, -20, 45, 1, (x) => (params = { ...params, roomTemp: x })));

  shelf.scrollTop = scroll;
}

/** Another substance or vessel: a new, free experiment (a ready-made one's plan no longer fits). */
function freshSetup() {
  tableSet = true;
  preset = null;
  plan = [];
  buildShelf();
  newSession();
}
const pickParams = (next: LabParams, after: () => void) => {
  params = fitChoices(next);
  after();
};

/**
 * A thing to choose for the table — on the shelf a card, over the table a picture that flies down
 * onto it. The shelf and the row over the table offer the same things, made here.
 */
interface Choice {
  readonly key: string;
  readonly name: LocalizedText;
  readonly note?: string | undefined;
  readonly badge?: string;
  readonly ref?: string;
  readonly selected: boolean;
  /** How it looks: a device (its drawing on the table, its shelf icon), a vessel, a substance. */
  readonly look: { readonly device: DeviceKind; readonly icon: string | undefined } | { readonly vessel: VesselShape; readonly material: string } | { readonly substance: SubstanceItem };
  /** A substance that becomes the sample (a liquid poured in, salt heated dry) — not one put into it. */
  readonly sample?: boolean;
  readonly pick: () => void;
}
interface ChoiceGroup {
  readonly label: string;
  readonly items: readonly Choice[];
}
type Matches = (name: LocalizedText) => boolean;
const everything: Matches = () => true;

/** The devices the action works with (a heater, a cooler, a power supply — or just the room), in their families. */
function deviceChoices(matches: Matches = everything): { title: string; groups: ChoiceGroup[] } {
  const u = t();
  const uses = actionUses(params.action);
  const started = experimentStarted();
  const v = vesselItem();
  const room = (selected: boolean, pick: () => void): Choice[] =>
    matches({ uk: UI.uk.justRoom, en: UI.en.justRoom }) ? [{ key: 'room', name: { uk: UI.uk.justRoom, en: UI.en.justRoom }, look: { device: 'none', icon: 'room' }, note: `${params.roomTemp} °C`, selected, pick }] : [];
  if (uses === 'supply') {
    return {
      title: u.supplyWhat,
      groups: childrenOf('device.power').map((c) => ({
        label: tr(c.name, locale),
        items: Object.values(SUPPLIES)
          .filter((x) => x.category === c.id && matches(x.name))
          .map((x) => ({
            key: x.id,
            name: x.name,
            look: { device: 'supply', icon: x.look },
            ref: `equipment:${x.id}`,
            note: `${x.spec.voltage.min === x.spec.voltage.max ? `${x.spec.voltage.max} ${u.volts}` : `${x.spec.voltage.min}–${x.spec.voltage.max} ${u.volts}`} · ≤ ${sig(x.spec.currentLimit.value, 3, locale)} ${u.amps}`,
            ...([x.spec.currentLimit, x.spec.internalResistance].some((d) => d?.verification === 'estimate') ? { badge: u.estimateBadge } : {}),
            selected: x.id === params.supply?.id,
            pick: () => {
              lastSupply = { id: x.id as SupplyId, knob: lastSupply.knob, ...(lastSupply.electrodes ? { electrodes: lastSupply.electrodes } : {}) };
              pickParams({ ...params, supply: lastSupply }, stepChanged);
            },
          })),
      })),
    };
  }
  if (uses === 'heater' || uses === 'either') {
    const groups: ChoiceGroup[] = childrenOf('device.heater').map((c) => ({
      label: tr(c.name, locale),
      items: itemsUnder(c.id)
        .filter((x): x is NonNullable<ReturnType<typeof heaterItem>> => x.kind === 'heater' && matches(x.name))
        // During an experiment the vessel stays: only heaters that work with it.
        .filter((x) => !started || canHeat(x, v, params.material, params.size).ok)
        .map((x) => ({
          key: x.id,
          name: x.name,
          look: { device: x.look as DeviceKind, icon: x.look },
          ref: `equipment:${x.id}`,
          note: x.spec.ratings.map((r) => formatQuantity(r, 'W', { locale, level: 'school' })).join(' / '),
          ...(x.spec.ratingData.verification === 'estimate' ? { badge: u.estimateBadge } : {}),
          selected: x.id === params.heater?.id,
          pick: () => {
            lastHeater = { id: x.id as HeaterId, rating: x.spec.defaultRating, knob: x.spec.control === 'switch' ? 0 : lastHeater.knob || 0.7 };
            // A flame instead of a furnace.
            const { cooler: _c, ...rest } = params;
            void _c;
            pickParams({ ...rest, heater: lastHeater }, stepChanged);
          },
        })),
    }));
    if (uses === 'either') {
      groups.unshift({
        label: locale === 'uk' ? 'Без нагрівача' : 'No heater',
        items: room(!params.heater && !params.cooler, () => {
          const { heater: _h, cooler: _c, ...rest } = params;
          void _h;
          void _c;
          pickParams(rest, stepChanged);
        }),
      });
      // Hot surroundings instead of a flame: a muffle furnace holds its temperature around the vessel.
      for (const c of childrenOf('device.furnace')) {
        groups.push({
          label: tr(c.name, locale),
          items: itemsUnder(c.id)
            .filter((x): x is (typeof COOLERS)[CoolerId] => x.kind === 'cooler' && matches(x.name))
            .map((x) => ({
              key: x.id,
              name: x.name,
              look: { device: x.look as DeviceKind, icon: x.look },
              ref: `equipment:${x.id}`,
              note: `${x.spec.setpoint.min}…${x.spec.setpoint.max} °C`,
              selected: x.id === params.cooler?.id,
              pick: () => {
                const { heater: _h, ...rest } = params;
                void _h;
                // (Not remembered as "the cooler": cooling down in a furnace makes no sense.)
                pickParams({ ...rest, cooler: { id: x.id as CoolerId, setpoint: x.spec.setpoint.default } }, stepChanged);
              },
            })),
        });
      }
    }
    return { title: uses === 'either' ? u.meltWith : u.device, groups };
  }
  return {
    title: u.coolWhere,
    groups: [
      {
        label: locale === 'uk' ? 'Без охолоджувача' : 'No cooler',
        items: room(!params.cooler, () => {
          const { cooler: _c, ...rest } = params;
          void _c;
          pickParams(rest, stepChanged);
        }),
      },
      ...childrenOf('device.cooler').map((c) => ({
        label: tr(c.name, locale),
        items: itemsUnder(c.id)
          .filter((x): x is (typeof COOLERS)[CoolerId] => x.kind === 'cooler' && matches(x.name))
          .map((x): Choice => ({
            key: x.id,
            name: x.name,
            look: { device: x.look as DeviceKind, icon: x.look },
            ref: `equipment:${x.id}`,
            note: x.spec.setpoint.max > x.spec.setpoint.min ? `${x.spec.setpoint.min}…${x.spec.setpoint.max} °C` : `${x.spec.setpoint.default} °C`,
            selected: x.id === params.cooler?.id,
            pick: () => {
              lastCooler = { id: x.id as CoolerId, setpoint: x.spec.setpoint.default };
              pickParams({ ...params, cooler: lastCooler }, stepChanged);
            },
          })),
      })),
    ],
  };
}

/** The vessels the device can work with (none once the experiment is under way: the vessel stays). */
function vesselChoices(matches: Matches = everything): ChoiceGroup[] {
  const u = t();
  const volume = (l: number) => (l < 1 ? `${Math.round(l * 1000)} ${u.ml}` : `${sig(l, 4, locale)} ${u.liters}`);
  const fits = experimentStarted() ? [] : vesselsFor(params);
  return childrenOf('vessel').map((c) => ({
    label: tr(c.name, locale),
    items: fits
      .filter((f) => f.vessel.category === c.id && matches(f.vessel.name))
      .map((f) => ({
        key: f.vessel.id,
        name: f.vessel.name,
        look: { vessel: (f.vessel.look ?? 'pot') as VesselShape, material: f.vessel.id === params.vessel ? params.material : f.materials[0]! },
        ref: `equipment:${f.vessel.id}`,
        note: `${f.materials.map((m) => u.materials[m] ?? m).join(', ')} · ${volume(f.sizes[0]!)}${f.sizes.length > 1 ? `–${volume(f.sizes.at(-1)!)}` : ''}`,
        selected: f.vessel.id === params.vessel,
        pick: () => {
          const size = f.sizes.includes(f.vessel.spec.defaultSize) ? f.vessel.spec.defaultSize : f.sizes[0]!;
          const material = f.materials.includes(f.vessel.spec.defaultMaterial) ? f.vessel.spec.defaultMaterial : f.materials[0]!;
          const q = { ...params, vessel: f.vessel.id as VesselId, size, material, lid: false, liters: round(size * 0.7, size < 0.1 ? 3 : 2) };
          delete (q as { vesselMass?: number }).vesselMass;
          pickParams(q, freshSetup);
        },
      })),
  }));
}

/**
 * Everything in the catalog, by family. A liquid is poured into the vessel as the sample (before the
 * start, and only what the chosen action can do something with); a solid — a block, salt — is put into
 * the liquid or hung on the dynamometer: picking it gets it ready in the "add" panel.
 */
function substanceChoices(matches: Matches = everything): ChoiceGroup[] {
  const u = t();
  const num = (x: number) => sig(x, 4, locale);
  const hasEstimate = (vals: readonly ({ verification: string } | undefined)[]) => vals.some((v) => v?.verification === 'estimate');
  const started = experimentStarted();
  const sub = substance();
  const accepted = new Set(substancesFor(params.action).map((x) => x.id));
  /** A solid this action can take as the sample itself (salt heated dry, tin melted in a crucible). */
  const asSample = (x: SubstanceItem) => !started && accepted.has(x.id) && isDrySample(x);
  return SUBSTANCE_FAMILIES.map((f) => ({
    label: tr(f.name, locale),
    items: Object.values(SUBSTANCES)
      .filter((x) => f.categories.includes(x.category) && matches(x.name))
      .filter((x) => (x.category.startsWith('liquid.') ? !started && accepted.has(x.id) : true))
      .map((x): Choice =>
        x.category.startsWith('liquid.')
          ? {
              key: x.id,
              name: x.name,
              look: { substance: x },
              ref: `substance:${x.id}`,
              note: [x.freezing ? `${u.meltLine} ${num(x.freezing.point.value)} °C` : null, x.boiling ? `${u.boilLine} ${num(x.boiling.point.value)} °C` : null].filter(Boolean).join(' · ') || undefined,
              ...(hasEstimate([x.liquid.specificHeat, x.freezing?.point, x.boiling?.point]) ? { badge: u.estimateBadge } : {}),
              selected: x.id === params.substance,
              sample: true,
              // From a dry sample back to a liquid: a usual amount of it.
              pick: () => pickParams({ ...params, substance: x.id as SubstanceId, startTemp: OPERATIONS[params.action].startTemp(x), ...(isDrySample(sub) ? { liters: Math.round(params.size * 0.7 * 1000) / 1000 } : {}) }, freshSetup),
            }
          : {
              key: x.id,
              name: x.name,
              look: { substance: x },
              ref: `substance:${x.id}`,
              note: `ρ ${num(x.liquid.density.value)} ${locale === 'uk' ? 'кг/м³' : 'kg/m³'} · ${dissolves(x) ? u.dissolves : u.putIn}`,
              ...(hasEstimate([x.liquid.density, x.liquid.specificHeat]) ? { badge: u.estimateBadge } : {}),
              // Heating or melting it dry: it becomes the sample itself; otherwise it is put into the liquid.
              selected: asSample(x) ? x.id === params.substance : x.id === addSub && $<HTMLDetailsElement>('#add').open,
              sample: asSample(x),
              pick: () => (asSample(x) ? pickParams({ ...params, substance: x.id as SubstanceId, liters: Math.min(params.size * 0.8, DRY_GRAMS / x.liquid.density.value), startTemp: OPERATIONS[params.action].startTemp(x) }, freshSetup) : prepareAdd(x.id as SubstanceId)),
            },
      ),
  }));
}

function setAction(a: LabAction) {
  const op = OPERATIONS[a];
  const uses = op.uses;
  // Freezing and cooling take hours of model time: such operations start faster.
  speed = op.speed;
  $<HTMLSelectElement>('#speed').value = String(speed);
  let next: LabParams = { ...params, action: a, startTemp: op.startTemp(substance()) };
  if (op.target) next = { ...next, target: op.target.default };
  else {
    const { target: _t, ...rest } = next;
    void _t;
    next = rest;
  }
  {
    const { duration: _d, ...rest } = next;
    void _d;
    next = op.duration ? { ...rest, duration: op.duration.default } : rest;
  }
  // Each operation brings its own device: a heater, a cooler, a power supply (or none).
  const { cooler: _c, heater: _h, supply: _s, ...bare } = next;
  void _c;
  void _h;
  void _s;
  next = uses === 'heater' ? { ...bare, heater: lastHeater } : uses === 'cooler' ? { ...bare, cooler: lastCooler } : uses === 'supply' ? { ...bare, supply: lastSupply } : bare;
  const started = experimentStarted();
  if (started && next.heater && !canHeat(HEATERS[next.heater.id], vesselItem(), next.material, next.size).ok) {
    // The vessel stays during an experiment: take the first heater that works with it.
    const ok = (Object.keys(HEATERS) as HeaterId[]).find((id) => canHeat(HEATERS[id], vesselItem(), next.material, next.size).ok);
    if (ok) next = { ...next, heater: { id: ok, rating: HEATERS[ok].spec.defaultRating, knob: 1 } };
  }
  if (!started) next = fitChoices(next);
  params = next;
  stepChanged();
}

// ---------- about the project, "found a mistake?" ----------
function buildInfo() {
  const a = ABOUT_UI[locale];
  const b = BUG_TEXT[locale];
  $('#about-open').textContent = `ⓘ ${a.about}`;
  $('#bug-open').textContent = `🐞 ${a.bug}`;
  $('#about-open-2').textContent = a.about;
  $('#bug-open-2').textContent = a.bug;
  const lib = LIBRARY_UI[locale];
  $('#library-open').textContent = `📚 ${lib.open}`;
  $('#library-links').innerHTML = [`<a href="${siteHref(pagePath({ page: 'catalog' }, locale))}" data-catalog="1">${catalogUi(locale).title}</a>`, ...LIBRARY_PAGES.map((p) => `<a href="#${p}">${lib.tabs[p]}</a>`)].join('');
  $('#safety').textContent = `⚠ ${SAFETY_LINE[locale]}`;
  $('#made-by').innerHTML = `${a.madeBy} <a href="${DEVELOPER.url}" target="_blank" rel="noopener">${DEVELOPER.name}</a>`;
  $('#about-back').textContent = lib.back;
  $('#bug-close').setAttribute('aria-label', a.close);
  $('#about-body').innerHTML = aboutHtml(locale);
  $('#bug-title').textContent = b.title;
  $('#bug-intro').textContent = b.intro;
  $<HTMLTextAreaElement>('#bug-text').placeholder = b.placeholder;
  $('#bug-attach-label').textContent = b.attach;
  $('#bug-send').textContent = b.send;
  $('#bug-copy').textContent = b.copy;
  $('#bug-note').textContent = b.note;
}
/** The experiment as plain text for a report: setup, protocol, settings — nothing personal. */
function bugContext(): string {
  const text = (sel: string) => (document.querySelector<HTMLElement>(sel)?.innerText ?? '').trim();
  return [
    `Spark · ${new Date().toISOString().slice(0, 10)} · ${locale} · ${level}`,
    `${text('#exp-title')}: ${text('#setup-line')}`,
    preset ? `preset: ${preset.id}` : 'free play',
    `params: ${JSON.stringify(params)}`,
    text('#protocol').replace(/\n+/g, ' / '),
    text('#messages').replace(/\n+/g, ' / ').slice(0, 600),
    navigator.userAgent,
  ].filter(Boolean).join('\n');
}
function openBug() {
  $('#bug-error').textContent = '';
  $('#bug-context').textContent = $<HTMLInputElement>('#bug-attach').checked ? bugContext() : '';
  $<HTMLDialogElement>('#bug').showModal();
}
function bugReportNow(): ReturnType<typeof bugReport> | null {
  const what = $<HTMLTextAreaElement>('#bug-text').value;
  if (!what.trim()) {
    $('#bug-error').textContent = BUG_TEXT[locale].empty;
    return null;
  }
  return bugReport(what, $<HTMLInputElement>('#bug-attach').checked ? bugContext() : null);
}
$('#about-open').onclick = $('#about-open-2').onclick = () => (location.hash = 'about');
$('#bug-open').onclick = $('#bug-open-2').onclick = openBug;
$('#bug-close').onclick = () => $<HTMLDialogElement>('#bug').close();
$<HTMLInputElement>('#bug-attach').onchange = () => ($('#bug-context').textContent = $<HTMLInputElement>('#bug-attach').checked ? bugContext() : '');
$('#bug-send').onclick = () => {
  const r = bugReportNow();
  if (r) window.open(bugUrl(r), '_blank', 'noopener');
};
$('#bug-copy').onclick = async () => {
  const r = bugReportNow();
  if (!r) return;
  try {
    await navigator.clipboard.writeText(`${r.title}\n\n${r.body}`);
    $('#bug-copy').textContent = BUG_TEXT[locale].copied;
    window.setTimeout(() => ($('#bug-copy').textContent = BUG_TEXT[locale].copy), 2000);
  } catch {
    $('#bug-error').textContent = `${r.title}\n\n${r.body}`;
  }
};
/** "About the project" is a page of its own (…/#about), like the library: the lab steps aside. */
function aboutRoute(): boolean {
  return location.hash === '#about';
}
function renderAbout() {
  const on = aboutRoute();
  const was = document.body.classList.contains('in-about');
  document.body.classList.toggle('in-about', on);
  $('#about-page').hidden = !on;
  if (on && !was) window.scrollTo(0, 0);
}
window.addEventListener('hashchange', () => renderAbout());

// ---------- the site: all the experiments, an experiment's own address, sharing it ----------
/** A link within the site: the same under a folder, on a server and in dev. */
const siteHref = (path: string) => `${where.root}${path}`;
/** Served (not a file opened from the disk): the address can follow what is on the screen. */
const onServer = /^https?:$/.test(location.protocol);
let onCatalog = where.route.page === 'catalog';
/** The page as it is now: the catalogue, the chosen experiment, or the lab. */
const siteRoute = (): Route => (onCatalog ? { page: 'catalog' } : preset && presetGiven ? { page: 'experiment', id: presetGiven.id } : { page: 'lab' });
function pageTitle(): string {
  const lib = libraryRoute(location.hash);
  if (lib) return `${LIBRARY_UI[locale].tabs[lib.page]} · Spark`;
  if (aboutRoute()) return `${ABOUT_UI[locale].about} · Spark`;
  const r = siteRoute();
  if (r.page === 'catalog') return `${catalogUi(locale).title} · ${SITE.name}`;
  if (r.page === 'experiment') return `${tr(presetGiven!.title, locale)} · ${SITE.name}`;
  return t().title;
}
/** The address of a page of the site, in full (to share); none for a lab opened from a file, unless the site's address is known. */
function siteUrl(r: Route): string | null {
  const path = pagePath(r, locale);
  if (onServer) return new URL(siteHref(path), location.origin).href;
  return SITE.url ? `${SITE.url.replace(/\/$/, '')}/${path}` : null;
}
let catalogKey = '';
/** The catalogue page, the share button, the address. */
function renderSite() {
  const c = catalogUi(locale);
  const cat = $('#catalog-open') as HTMLAnchorElement;
  cat.textContent = c.all;
  cat.href = siteHref(pagePath({ page: 'catalog' }, locale));
  document.body.classList.toggle('in-catalog', onCatalog);
  $('#catalog').hidden = !onCatalog;
  if (onCatalog && catalogKey !== locale) {
    catalogKey = locale;
    $('#catalog').innerHTML = catalogHtml(locale, siteHref);
    filterCatalog();
  }
  // Nothing to share from a file opened from the disk, while the site's address is not known.
  $('#catalog').classList.toggle('no-share', !siteUrl({ page: 'catalog' }));
  const p = preset && presetGiven ? presetGiven : null;
  const share = $<HTMLButtonElement>('#exp-share');
  share.hidden = !p || !siteUrl({ page: 'experiment', id: p.id });
  share.title = c.share;
  share.setAttribute('aria-label', c.share);
  // The address follows the screen, so that it can be copied, bookmarked or shared as it is.
  if (onServer) {
    const want = `${siteHref(pagePath(siteRoute(), locale))}${location.search}${location.hash}`;
    if (want !== `${location.pathname}${location.search}${location.hash}`) window.history.replaceState(window.history.state, '', want);
  }
}
/** To the catalogue, or from it: a page of its own (the browser's "back" returns). */
function showCatalog(on: boolean) {
  if (onCatalog === on) return;
  onCatalog = on;
  if (onServer) window.history.pushState(null, '', siteHref(pagePath(siteRoute(), locale)));
  render();
  window.scrollTo(0, 0);
}
const toCatalog = (e: Event) => {
  e.preventDefault();
  if (location.hash) window.history.replaceState(window.history.state, '', location.pathname + location.search);
  renderLibrary();
  renderAbout();
  showCatalog(true);
};
$('#catalog-open').addEventListener('click', toCatalog);
$('#library-links').addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('[data-catalog]')) toCatalog(e);
});
/** What the catalogue's filters are set to; the cards (and then empty groups) that do not fit are hidden. */
const catalogFilter = { subject: '', grade: '', program: '', query: '' };
function filterCatalog() {
  const root = $('#catalog');
  const f = catalogFilter;
  const q = f.query.trim().toLowerCase();
  root.querySelectorAll<HTMLElement>('.cat-subject').forEach((sec) => (sec.hidden = !!f.subject && sec.id !== `cat-${f.subject}`));
  const shown = new Set<string>();
  root.querySelectorAll<HTMLElement>('.cat-item').forEach((card) => {
    const hit =
      !card.closest<HTMLElement>('.cat-subject')!.hidden &&
      (!f.grade || (card.dataset['grades'] ?? '').split(' ').includes(f.grade)) &&
      (!f.program || (card.dataset['programs'] ?? '').split(' ').includes(f.program)) &&
      (!q || (card.textContent ?? '').toLowerCase().includes(q));
    card.hidden = !hit;
    if (hit) shown.add(card.dataset['id']!);
  });
  root.querySelectorAll<HTMLElement>('.cat-grade').forEach((g) => (g.hidden = !g.querySelector('.cat-item:not([hidden])')));
  root.querySelectorAll<HTMLElement>('[data-subject], [data-grade]').forEach((chip) => {
    const on = chip.dataset['subject'] !== undefined ? chip.dataset['subject'] === f.subject : chip.dataset['grade'] === f.grade;
    chip.classList.toggle('selected', on);
    chip.setAttribute('aria-pressed', String(on));
  });
  const pick = root.querySelector<HTMLSelectElement>('.cat-program');
  if (pick) pick.value = f.program;
  const search = root.querySelector<HTMLInputElement>('.cat-search');
  if (search && search.value !== f.query) search.value = f.query;
  const c = catalogUi(locale);
  const count = root.querySelector('.cat-count');
  // (An experiment of both subjects is in each: counted once.)
  if (count) count.textContent = shown.size === PRESETS.length ? c.count(PRESETS.length) : c.shown(shown.size, PRESETS.length);
  root.querySelector<HTMLElement>('.cat-nothing')!.hidden = shown.size > 0;
}
$('#catalog').addEventListener('input', (e) => {
  const t = e.target as HTMLElement;
  if (t.matches('.cat-search')) catalogFilter.query = (t as HTMLInputElement).value;
  else if (t.matches('.cat-program')) catalogFilter.program = (t as HTMLSelectElement).value;
  else return;
  filterCatalog();
});
$('#catalog').addEventListener('click', (e) => {
  const el = e.target as HTMLElement;
  const chip = el.closest<HTMLElement>('[data-subject], [data-grade]');
  if (chip) {
    if (chip.dataset['subject'] !== undefined) catalogFilter.subject = chip.dataset['subject'];
    else catalogFilter.grade = chip.dataset['grade']!;
    return filterCatalog();
  }
  const byId = (id: string | undefined) => PRESETS.find((p) => p.id === id);
  // «Детальніше»: the experiment's page of the notebook, with its own «Почати».
  const more = el.closest<HTMLElement>('[data-sheet]');
  if (more) return void openLabSheet(byId(more.dataset['sheet'])!);
  const share = el.closest<HTMLButtonElement>('[data-share]');
  if (share) return void shareExperiment(byId(share.dataset['share'])!, share);
  // An experiment opens in the lab here (the links stay real addresses — for robots, and for "open in a new tab").
  const a = el.closest<HTMLAnchorElement>('a[href]');
  if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
  const to = parsePath(new URL(a.href, location.href).pathname).route;
  if (to.page === 'catalog') return;
  e.preventDefault();
  if (to.page === 'experiment') startPreset(byId(to.id)!);
  else showCatalog(false);
});
window.addEventListener('popstate', () => {
  const to = parsePath(location.pathname).route;
  onCatalog = to.page === 'catalog';
  if (to.page === 'experiment' && presetGiven?.id !== to.id) startPreset(PRESETS.find((p) => p.id === to.id)!);
  else render();
});
/** Share an experiment's link: on a phone, the system's own "share" (messengers, mail…); elsewhere the link is copied, and the button says so. */
async function shareExperiment(p: Preset, button: HTMLButtonElement) {
  const url = siteUrl({ page: 'experiment', id: p.id });
  if (!url) return;
  try {
    if (navigator.share) return void (await navigator.share({ title: tr(p.title, locale), text: presetDescription(p, locale), url }));
    await navigator.clipboard.writeText(url);
    const was = button.textContent;
    button.textContent = '✓';
    button.title = catalogUi(locale).copied;
    window.setTimeout(() => ((button.textContent = was), (button.title = catalogUi(locale).share)), 2000);
  } catch {
    /* the share sheet was closed, or no clipboard: nothing to do */
  }
}
$('#exp-share').onclick = () => presetGiven && void shareExperiment(presetGiven, $<HTMLButtonElement>('#exp-share'));

function buildHeader() {
  const lang = $<HTMLSelectElement>('#language');
  lang.innerHTML = '';
  const names: Record<Locale, string> = { uk: 'Українська', en: 'English' };
  for (const l of LOCALES) lang.append(el('option', { value: l, selected: l === locale }, names[l]));
  lang.onchange = () => {
    locale = lang.value as Locale;
    store.set('locale', locale);
    buildHeader();
    buildInfo();
    buildShelf();
    buildExpect();
    buildAdd();
    buildShelfTabs();
    renderRecords();
    render();
    if (refTarget) openRef(refTarget);
    renderLibrary(false);
    renderAbout();
    renderSite();
    if ($('#report').innerHTML) explain();
  };
  const lv = $<HTMLSelectElement>('#level');
  lv.innerHTML = '';
  for (const l of LEVELS) lv.append(el('option', { value: l, selected: l === level, title: tr(LEVEL_INFO[l].audience, locale) }, tr(LEVEL_INFO[l].name, locale)));
  lv.onchange = () => {
    level = lv.value as Level;
    store.set('level', level);
    buildShelf();
    if (refTarget) openRef(refTarget);
    renderLibrary(false);
    renderAbout();
    if ($('#report').innerHTML) explain();
  };
}

function explain() {
  running = false;
  // Every step with all that was done in it (weighed, salted, the knob turned); the last one in detail.
  const steps = stepsSoFar();
  const ran = steps.filter((x) => x.result.final.time > x.result.initial.time);
  const last = ran[ran.length - 1];
  // Nothing ran in time — a measuring procedure: what was measured, and the laws behind it.
  if (!last) {
    if (!allReadings().length) return;
    const formulas = (preset?.formulas ?? []).map((id) => LAB_KNOWLEDGE.formulas.find((f) => f.id === id)).filter((f): f is NonNullable<typeof f> => !!f);
    const answer = presetAnswer && presetAnswer !== 'computing' ? [{ kind: 'paragraph', text: tr(presetAnswer.text, locale) } as Block, ...(presetAnswer.why ? [{ kind: 'paragraph', text: `${t().whyTitle} ${tr(presetAnswer.why, locale)}` } as Block] : [])] : [];
    $('#report').innerHTML = renderHtml(
      buildMeasuredReport({
        title: locale === 'uk' ? 'Що виміряли і чому так вийшло' : 'What was measured and why it came out so',
        level,
        locale,
        country: 'UA',
        summary: answer,
        measured: boardNow().map((l) => `${l.title}: ${l.formula}${l.numbers ? ` ${l.numbers}` : ''}`),
        formulas,
        laws: LAB_KNOWLEDGE.laws,
      }),
    );
    render();
    $('#report').scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  const result = last.result;
  if (!headline) setHeadline();
  const uk = locale === 'uk';
  const ctx = { locale, level };
  const title = uk ? 'Що відбулося і чому' : 'What happened and why';
  const notes: Block[] = (substance().modelNotes ?? []).map((n) => ({ kind: 'note', tone: 'info', text: tr(n, locale) }));
  const course = steps.length > 1 || result.log.length ? labCourse(steps, ctx) : [];
  const n = steps.indexOf(last) + 1;
  const lastTitle: Block[] = steps.length > 1 ? [{ kind: 'heading', depth: 2, text: uk ? `Крок ${n} докладно` : `Step ${n} in detail` }] : [];
  // The earlier steps, each with its own explanation, folded.
  const earlier: Block[] = ran.slice(0, -1).map((x) => ({
    kind: 'details',
    summary: `${uk ? 'Крок' : 'Step'} ${steps.indexOf(x) + 1}. ${tr(OPERATIONS[x.params.action].label, locale).replace('…', '')} — ${uk ? 'розібрати докладно' : 'explain in detail'}`,
    blocks: buildReport({ title: stepPlace(x.params, locale), level, locale, country: 'UA', result: x.result, simulation, domain: LAB_KNOWLEDGE, focusTime: (x.result.initial.time + x.result.final.time) / 2, summary: labSummary(x.params, x.result, x.status, ctx) }),
  }));
  $('#report').innerHTML = renderHtml([
    ...buildReport({ title, level, locale, country: 'UA', result, simulation, domain: LAB_KNOWLEDGE, focusTime: (result.initial.time + result.final.time) / 2, summary: [...headline!(), ...notes, ...course, ...lastTitle] }),
    ...(earlier.length ? [{ kind: 'heading', depth: 2, text: uk ? 'Попередні кроки' : 'Earlier steps' } as Block, ...earlier] : []),
  ]);
  render();
  $('#report').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** "Add salt, then pass a current": the next steps of the plan up to and including an operation. */
function planLabel(steps: readonly ProtocolStep[]): string {
  const u = t();
  const parts: string[] = [];
  for (const s of steps) {
    if (s.kind === 'bench') {
      parts.push(tr(BENCH_TEXT[s.command.type](s.command).plan, locale));
      break;
    }
    if (s.kind === 'weigh' || s.kind === 'level' || s.kind === 'hang') {
      parts.push(s.kind === 'weigh' ? (locale === 'uk' ? 'зважити' : 'weigh') : s.kind === 'level' ? u.measure.planLevel : u.measure.planHang((s.label ? tr(s.label, locale) : nameOfBody(s.substance)).toLowerCase(), s.into));
      // A measurement is a stop of its own: the reading first.
      break;
    }
    if (s.kind === 'add') {
      const what = SUBSTANCES[s.substance];
      const mass = formatQuantity(s.mass, 'kg', { locale, level: 'school' });
      // Its own name ("кристалик-затравка") is a noun of its own: said with the amount in brackets.
      parts.push(s.label ? `${tr(s.label, locale).toLowerCase()} (${mass})` : u.planAdd(tr(what.genitive ?? what.name, locale).toLowerCase(), mass));
      continue;
    }
    if (s.kind === 'fresh') {
      parts.push(tr(s.label ?? { uk: 'почати знову', en: 'start afresh' }, locale).toLowerCase());
      break;
    }
    // The step's own name, or the operation's — with its target ("охолодити до 22 °C").
    parts.push(s.label ? lowerFirst(tr(s.label, locale)) : `${tr(OPERATIONS[s.action].label, locale).replace('…', '').toLowerCase()}${s.target !== undefined ? ` ${s.target} °C` : ''}`);
    break;
  }
  return parts.join(locale === 'uk' ? ', потім ' : ', then ');
}

/** Do the next plan steps: additions at once, then the operation runs as a new protocol step. */
function nextPlanStep() {
  // An instrument still on its way to its reading: the next step waits (as one waits for a spring to settle).
  if (instrumentBusy) return;
  lookingAt = null;
  while (plan.length) {
    const s = plan.shift()!;
    if (s.kind === 'add') {
      const entry = session.apply(stepCommand(s, params));
      if (entry.ok) splash(s.substance, s.mass, !!s.frozen);
      if (entry.ok) (finished ? pendingAdds : stepAdds).push({ what: s.label ?? SUBSTANCES[s.substance].name, mass: s.mass });
      boardEpoch++;
      // In a guided procedure dropping the body is a step of its own: watch it go in.
      if (preset?.guided) {
        lastDrop = { at: session.state.time, step: session };
        break;
      }
      continue;
    }
    if (s.kind === 'weigh' || s.kind === 'level' || s.kind === 'hang' || s.kind === 'bench') {
      // Stop at the instrument: the reading (and the Professor's question) first, the next step on the next press.
      if (s.kind === 'weigh') weighNow(s.scale);
      else measureNow(stepCommand(s, params));
      // The plan ended with a measurement: the question can be answered now (or once the table is looked into).
      if (!plan.length && preset?.choicesAt !== 'end') {
        // An instrument still moving: the answer comes once it is at rest.
        if (instrumentBusy) answerWhenSettled = true;
        else answerPreset();
      }
      // A guided procedure is measured out: once the readings have been seen, the table moves aside — the whole board is there to read.
      if (!plan.length && preset?.guided) {
        if (instrumentBusy) readWhenSettled = true;
        else readBoardSoon();
      }
      break;
    }
    if (s.kind === 'fresh') {
      // A second run beside the first: the same setup from the start (cold vessel, fresh contents),
      // changed as said; the first run stays in the protocol, the chart starts again.
      params = freshParams(params, s);
      closeStep();
      points = { sample: [], vessel: [], source: [] };
      lastPointAt = -Infinity;
      beginStep(labSetup(params));
      buildShelf();
      break;
    }
    params = stepParams(params, s);
    if (params.heater) lastHeater = params.heater;
    // (A furnace is not remembered as "the cooler".)
    if (params.cooler && !COOLERS[params.cooler.id].spec.hot) lastCooler = params.cooler;
    if (params.supply) lastSupply = params.supply;
    speed = s.speed ?? OPERATIONS[s.action].speed;
    $<HTMLSelectElement>('#speed').value = String(speed);
    stepChanged();
    running = true;
    setChart(false);
    lastFrame = 0;
    break;
  }
  render();
}

// ---------- ready-made experiments ----------
const escAttr = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
/** Physics, chemistry…: the ready-made experiments by subject, then by grade (both remembered). */
let presetSubject: Subject = store.get('subject') === 'chemistry' ? 'chemistry' : 'physics';
const gradeStored = store.get('grade');
let presetGrade: number | null = gradeStored === 'all' ? null : gradeStored ? Number(gradeStored) : (PRESET_GRADES[0] ?? null);
/** The left panel shows the free sandbox or the ready-made experiments (remembered). */
let shelfTab: 'sandbox' | 'experiments' = store.get('shelfTab') === 'sandbox' ? 'sandbox' : 'experiments';
function buildShelfTabs() {
  const u = t();
  const tabs = $('#shelf-tabs');
  tabs.innerHTML = '';
  for (const id of ['experiments', 'sandbox'] as const) {
    const b = el('button', { type: 'button', className: `shelf-tab${id === shelfTab ? ' selected' : ''}`, role: 'tab' }, u.shelfTabs[id]);
    b.setAttribute('aria-selected', String(id === shelfTab));
    b.onclick = () => {
      if (id === shelfTab) return;
      shelfTab = id;
      store.set('shelfTab', id);
      clearTable();
      buildShelfTabs();
    };
    tabs.append(b);
  }
  $('#shelf-jump').textContent = `${u.shelfTabs.experiments} ↓`;
  $('#setup').hidden = shelfTab !== 'sandbox';
  $('#presets').hidden = shelfTab !== 'experiments';
  $<HTMLInputElement>('#search').placeholder =
    shelfTab === 'sandbox' ? (locale === 'uk' ? 'Пошук: речовина, посуд, прилад…' : 'Search: substance, vessel, device…') : locale === 'uk' ? 'Пошук: дослід, тема…' : 'Search: experiment, topic…';
  if (shelfTab === 'experiments') buildPresets();
}
// On a phone the panel stands below the scene: a button in the header goes down to the experiments.
$('#shelf-jump').onclick = () => {
  if (shelfTab !== 'experiments') clearTable();
  shelfTab = 'experiments';
  store.set('shelfTab', shelfTab);
  if (store.get('shelf') === 'folded') store.set('shelf', 'open'), renderSide();
  buildShelfTabs();
  $('#shelf').scrollIntoView({ behavior: 'smooth' });
};
/**
 * From the ready-made experiments to the sandbox or back: the table is cleared — no experiment, nothing
 * on it, the sandbox's choices as at the start, no report.
 */
function clearTable() {
  closeChooser();
  tableSet = false;
  preset = null;
  presetGiven = null;
  presetVals = {};
  prediction = null;
  plan = [];
  planTotal = 0;
  params = SANDBOX_START;
  lastHeater = params.heater!;
  speed = OPERATIONS[params.action].speed;
  $<HTMLSelectElement>('#speed').value = String(speed);
  $('#report').innerHTML = '';
  buildShelf();
  newSession();
}
function buildPresets() {
  const u = t();
  const tabs = $('#presets-tabs');
  tabs.innerHTML = '';
  // A search looks through all of them; otherwise a subject, then a grade (or those for everyone).
  tabs.hidden = !!query;
  const inSubject = PRESETS.filter((p) => presetSubjects(p).includes(presetSubject));
  // (An experiment stands under each grade its programmes put it in.)
  const gradesOf = (p: Preset) => presetGradesIn(p, presetSubject);
  const grades = [...new Set(inSubject.flatMap(gradesOf))].sort((a, b) => (a ?? 99) - (b ?? 99));
  if (!grades.includes(presetGrade)) presetGrade = grades[0] ?? null;
  const subjects = el('div', { className: 'subject-tabs' });
  for (const sub of ['physics', 'chemistry'] as const) {
    const b = el('button', { type: 'button', className: `subject-tab${sub === presetSubject ? ' selected' : ''}` }, u.subjects[sub]);
    b.onclick = () => {
      presetSubject = sub;
      store.set('subject', sub);
      buildPresets();
    };
    subjects.append(b);
  }
  tabs.append(subjects);
  for (const g of grades) {
    const b = el('button', { type: 'button', className: `chip${g === presetGrade ? ' selected' : ''}` }, g === null ? u.forEveryone : u.grade(g));
    b.onclick = () => {
      presetGrade = g;
      store.set('grade', g === null ? 'all' : String(g));
      buildPresets();
    };
    tabs.append(b);
  }
  const list = $('#presets-list');
  list.innerHTML = '';
  const formulas = new Map(LAB_KNOWLEDGE.formulas.map((f) => [f.id, f]));
  const found = (p: Preset) => [p.title, p.question, p.topic].some((x) => tr(x, locale).toLowerCase().includes(query));
  const graded = query ? PRESETS.filter(found) : inSubject.filter((x) => gradesOf(x).includes(presetGrade));
  // Those under one heading stand together (in the order the headings first come).
  const headOf = (p: Preset) => (query ? '' : presetTopicIn(p, presetSubject, locale).replace(TOPIC_NUMBER, ''));
  const heads = [...new Set(graded.map(headOf))];
  const shown = [...graded].sort((a, b) => heads.indexOf(headOf(a)) - heads.indexOf(headOf(b)));
  if (!shown.length) list.append(el('p', { className: 'muted small' }, u.presetsNone));
  let topic = '';
  for (const p of shown) {
    const heading = query ? `${presetSubjects(p).map((x) => u.subjects[x]).join(', ')} · ${p.grade === null ? u.forEveryone : u.grade(p.grade)} · ${tr(p.topic, locale)}` : headOf(p);
    if (heading !== topic) {
      topic = heading;
      list.append(el('h3', { className: 'presets-topic' }, topic));
    }
    // Where it is in the programme: the formulas' curriculum quotes (newest programme first).
    const quotes = [...new Set(p.formulas.flatMap((id) => (formulas.get(id)?.curriculum ?? []).filter((c) => c.program === 'ua-nus-2023-holovko' && (!p.quoteHas || c.quote.includes(p.quoteHas))).map((c) => c.quote)))];
    // Which programmes it is in: a chip each (the exact wording on hover); "≈" — the same idea, another substance.
    const programs = presetPrograms(p)
      .map((x) => {
        const c = getCurriculum(x.program)!;
        const label = `${tr(c.short ?? c.name, locale)}${x.grade !== undefined ? ` · ${u.grade(x.grade)}` : ''}${x.item ? ` · ${x.item}` : ''}${x.match === 'related' ? ' ≈' : ''}`;
        const book = x.textbook ? getSource(x.textbook.source) : undefined;
        const hint = [x.topic, `«${x.quote}»`, book && x.textbook ? `${book.title.split('. —')[0]}: ${x.textbook.at}` : ''].filter(Boolean).join('\n');
        return `<span class="program-chip" title="${escAttr(hint)}" data-program="${x.program}">${label}</span>${x.topic ? `<span class="program-topic muted small">${escAttr(x.topic)}${x.textbook ? ` · ${escAttr(x.textbook.at)}` : ''}</span>` : ''}`;
      })
      .join('');
    // The topic of the programme it is in (of this subject first): «Тема 3. Взаємодія тіл. Сили в природі».
    const progs = presetPrograms(p).filter((x) => x.match !== 'related');
    const topicOf = (x: (typeof progs)[number]) => x.topic ?? (x.item?.startsWith('Тема') ? x.item : undefined);
    const topicLine = [...progs.filter((x) => getCurriculum(x.program)?.subject === presetSubject), ...progs].map(topicOf).find(Boolean)?.replace(TOPIC_NUMBER, '');
    // The programmes in one line, cut with «…»; opened — each with its topic and the textbook's page.
    const programLine = presetPrograms(p).map((x) => `${tr(getCurriculum(x.program)!.short ?? getCurriculum(x.program)!.name, locale)}${x.grade !== undefined ? ` · ${u.grade(x.grade)}` : ''}`).join(', ');
    const card = el('article', { className: `preset${preset && presetGiven?.id === p.id ? ' current' : ''}` });
    card.innerHTML = `<div class="preset-side"><div class="preset-ic">${icon(OPERATIONS[p.params.action].icon, 'ic')}</div><button type="button" class="preset-more-btn" aria-haspopup="dialog" title="${escAttr(u.presetMore)}" aria-label="${escAttr(u.presetMore)}">ⓘ</button></div>
      <div><h4>${tr(p.title, locale)}</h4><p class="preset-q" title="${escAttr(tr(p.question, locale))}">${tr(p.question, locale)}</p>${quotes.length && p.grade !== null ? `<p class="muted small preset-quote">${u.inProgramme}: «${quotes.join(' ')}»</p>` : ''}${topicLine ? `<p class="preset-topic small"><span class="muted">${u.topic}:</span> ${escAttr(topicLine)}</p>` : ''}${programs ? `<details class="programs"><summary><span class="muted">${u.programs}:</span> <span class="programs-line">${escAttr(programLine)}</span></summary><div class="programs-all">${programs}</div></details>` : ''}</div>`;
    const go = el('button', { type: 'button', className: 'primary preset-go' }, u.presetStart);
    go.onclick = () => startPreset(p);
    card.append(go);
    // The full description: a page of a lab notebook, in the middle of the screen.
    card.querySelector<HTMLButtonElement>('.preset-more-btn')!.onclick = () => openLabSheet(p);
    list.append(card);
  }
}

/** «Тема 3. Взаємодія тіл» → «Взаємодія тіл»: the number belongs to the programme's own order. */
/**
 * Everything about a ready-made experiment before it starts, written as a lab work is written in a notebook:
 * its number (in the programme that numbers it), title, topic, aim, equipment, the course of the work, how the
 * results are worked out, and a place for the conclusion; the programmes it is in at the foot of the page.
 */
function labSheetHtml(p: Preset, running = false): string {
  return labSheetHtmlIn(p, locale, { running, predicting: unspoiled(guidedPlan(p), p).hidden > 0 });
}
let labSheetFor: Preset | null = null;
/** The page is written by hand; it can be read in print instead (remembered). */
function renderLabSheetHand() {
  const printed = store.get('sheet') === 'print';
  const u = t().details;
  $('.lab-sheet').classList.toggle('printed', printed);
  const b = $('#lab-sheet-hand');
  b.textContent = printed ? u.handwritten : u.printed;
  b.setAttribute('aria-pressed', String(printed));
}
function openLabSheet(p: Preset, running = false) {
  labSheetFor = p;
  $('#lab-sheet-body').innerHTML = labSheetHtml(p, running);
  renderLabSheetHand();
  $<HTMLDialogElement>('#lab-sheet').showModal();
}
$('#lab-sheet-hand').onclick = () => {
  store.set('sheet', store.get('sheet') === 'print' ? 'hand' : 'print');
  renderLabSheetHand();
};
$('#lab-sheet-close').onclick = () => $<HTMLDialogElement>('#lab-sheet').close();
// (The running one: its steps as they are; those that tell the answer stay hidden until it is given.)
$('#exp-sheet').onclick = () => preset && openLabSheet(preset, true);
$('#lab-sheet').addEventListener('click', (e) => {
  const dlg = $<HTMLDialogElement>('#lab-sheet');
  // A click past the page (on the backdrop) closes it.
  if (e.target === dlg) return dlg.close();
  if ((e.target as HTMLElement).closest('[data-ls-start]') && labSheetFor) {
    dlg.close();
    startPreset(labSheetFor);
  }
});

function startPreset(chosen: Preset, chosenValues: PresetValues = {}) {
  closeChooser();
  // (A place's example follows the language: Kyiv, New York.)
  const values = { ...defaultValues(chosen, locale), ...chosenValues };
  // Chosen in the catalogue: to the lab, on the experiment's address (the browser's "back" returns to the catalogue).
  if (onCatalog) {
    onCatalog = false;
    if (onServer) window.history.pushState(null, '', siteHref(pagePath({ page: 'experiment', id: chosen.id }, locale)));
    window.scrollTo(0, 0);
  }
  tableSet = true;
  presetGiven = chosen;
  presetVals = chosenValues;
  // Built with the values chosen under the scene (its amounts, materials), within its own frame.
  const given = withValues(chosen, values);
  // Led step by step: what goes in first, the operation, the rest — no "Start" (see guidedPlan).
  const p: Preset = { ...given, guided: true, plan: guidedPlan(given) };
  delete (p as { setup?: unknown }).setup;
  preset = p;
  prediction = null;
  plan = [...(p.plan ?? [])];
  planTotal = plan.length;
  params = p.params;
  if (params.heater) lastHeater = params.heater;
  if (params.cooler && !COOLERS[params.cooler.id].spec.hot) lastCooler = params.cooler;
  if (params.supply) lastSupply = params.supply;
  // (The prediction / goal card is put aside for now: nothing is expected there.)
  expectKind = 'none';
  speed = OPERATIONS[p.params.action].speed;
  $<HTMLSelectElement>('#speed').value = String(speed);
  // Chosen from the library page: back to the lab.
  if (libraryRoute(location.hash)) location.hash = '';
  buildShelf();
  buildPresets();
  buildExpect();
  newSession();
  presetSetup();
  // On a phone the panel stands above the scene: go down to it.
  if (matchMedia('(max-width: 900px)').matches) $('.kitchen').scrollIntoView({ behavior: 'smooth' });
}
/** What a ready-made experiment puts into the vessel before the start (hot water, a block from boiling water). */
function presetSetup() {
  for (const s of preset?.setup ?? []) {
    if (s.kind === 'fresh') continue;
    const entry = session.apply(stepCommand(s, params));
    if (entry.ok && s.kind === 'add') stepAdds.push({ what: s.label ?? SUBSTANCES[s.substance].name, mass: s.mass });
  }
  if (preset?.setup?.length) {
    boardEpoch++;
    buildAdd();
    render();
  }
}

/** Apply an offered change: the vessel moves on with its contents and the experiment goes on at once. */
function applyFix(f: LabFix) {
  params = f.params;
  if (params.heater) lastHeater = params.heater;
  if (params.cooler && !COOLERS[params.cooler.id].spec.hot) lastCooler = params.cooler;
  if (params.supply) lastSupply = params.supply;
  stepChanged();
  running = true;
  lastFrame = 0;
  render();
}

// ---------- recordings: save, replay, share ----------
let replaying: { readonly rec: Recording; index: number; step: ReplayStep } | null = null;
let savingName: string | null = null;
let recordsNote = '';
const loadRecords = (): Recording[] => {
  try {
    const x = JSON.parse(store.get('recordings') ?? '[]') as unknown[];
    return x.map((r) => parseRecording(JSON.stringify(r))).flatMap((r) => (r.ok ? [r.recording] : []));
  } catch {
    return [];
  }
};
const saveRecords = (list: readonly Recording[]) => store.set('recordings', JSON.stringify(list));

/** The steps of the experiment so far, the current one included (as it is now). */
function stepsSoFar() {
  const steps = history.map((h) => ({ params: h.params, result: h.result, status: h.status }));
  if (doneRecord) steps.push({ params: doneRecord.params, result: { ...doneRecord.result, log: session.result().log }, status: doneRecord.status });
  else if (stepElapsed() > 0 || stepAdds.length) {
    const result = session.result(labGoalReached(stepP, session.state));
    steps.push({ params: stepP, result, status: labStatus(stepP, result, simulation, warnings) });
  }
  return steps;
}
function saveRecording(name: string): string {
  const steps = stepsSoFar();
  if (!steps.length) return t().rec.empty;
  const rec = recordingOf(name.trim() || labSubject(params, locale), steps);
  saveRecords([rec, ...loadRecords()]);
  return t().rec.saved(rec.name);
}

/** Replay a recording on the page: the first step from a fresh setup, then each from where the last ended. */
function startReplay(rec: Recording) {
  closeChooser();
  tableSet = true;
  preset = null;
  plan = [];
  closeRef();
  params = rec.steps[0]!.params;
  history = [];
  pendingAdds = [];
  points = { sample: [], vessel: [], source: [] };
  lastPointAt = -Infinity;
  buildShelf();
  beginReplayStep(rec, 0, null);
}
function beginReplayStep(rec: Recording, index: number, from: SystemState | null) {
  const step = replayStep(rec.steps[index]!, from, simulation, commands, 10);
  params = step.params;
  if (params.heater) lastHeater = params.heater;
  if (params.cooler && !COOLERS[params.cooler.id].spec.hot) lastCooler = params.cooler;
  if (params.supply) lastSupply = params.supply;
  beginStep({ state: step.session.state, warnings: [] });
  // beginStep made a new session; the replay's own one carries the recorded actions.
  session = step.session;
  replaying = { rec, index, step };
  running = true;
  setChart(false);
  lastFrame = 0;
  buildShelf();
  render();
}
function nextReplayStep() {
  const r = replaying;
  if (!r || running) return;
  // What was done in the pause after this step (salt on the ice…).
  const before = session.result().log.length;
  r.step.finish();
  const fin = session.result().log;
  const lastE = fin[fin.length - 1];
  if (fin.length > before && lastE?.ok && lastE.command.type === 'lab.weigh') lastWeigh = { at: session.state.time, step: session };
  for (const e of session.result().log.slice(before)) {
    if (e.ok && e.command.type === 'thermal.add') pendingAdds.push({ what: SUBSTANCES[e.command.substance as SubstanceId].name, mass: e.command.mass });
  }
  if (r.index + 1 >= r.rec.steps.length) {
    recordsNote = t().rec.replayDone(r.rec.name);
    replaying = null;
    renderRecords();
    return render();
  }
  closeStep();
  const from = session.state;
  beginReplayStep(r.rec, r.index + 1, from);
}

function download(rec: Recording) {
  const blob = new Blob([JSON.stringify(rec, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${rec.name.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'spark'}.spark.json`;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function renderRecords() {
  const u = t().rec;
  const box = $('#records');
  const list = loadRecords();
  box.innerHTML = '';
  if (savingName !== null) {
    const input = el('input', { type: 'text', value: savingName, placeholder: u.namePlaceholder });
    const ok = el('button', { type: 'button', className: 'primary' }, u.saveConfirm);
    const no = el('button', { type: 'button' }, u.cancel);
    const save = () => {
      recordsNote = saveRecording(input.value);
      savingName = null;
      renderRecords();
    };
    ok.onclick = save;
    input.onkeydown = (e) => e.key === 'Enter' && save();
    no.onclick = () => {
      savingName = null;
      renderRecords();
    };
    box.append(el('div', { className: 'rec-save' }, input, ok, no));
    window.setTimeout(() => input.select(), 0);
  } else {
    const b = el('button', { type: 'button', className: 'rec-save-btn' }, u.save);
    b.disabled = !history.length && stepElapsed() <= 0 && !doneRecord;
    b.onclick = () => {
      savingName = labSubject(params, locale);
      renderRecords();
    };
    box.append(b);
  }
  if (recordsNote) box.append(el('p', { className: 'muted small' }, recordsNote));
  box.append(el('h4', { className: 'rec-title' }, u.title));
  if (!list.length) box.append(el('p', { className: 'muted small' }, u.empty));
  const ul = el('ul', { className: 'rec-list' });
  for (const [i, r] of list.entries()) {
    const ops = r.steps.map((s) => tr(OPERATIONS[s.params.action].label, locale).replace('…', '')).join(' → ');
    const play = el('button', { type: 'button', className: 'primary' }, u.replay);
    play.onclick = () => startReplay(r);
    const file = el('button', { type: 'button' }, u.download);
    file.onclick = () => download(r);
    const del = el('button', { type: 'button', title: locale === 'uk' ? 'Видалити' : 'Delete' }, u.remove);
    del.onclick = () => {
      saveRecords(list.filter((_, j) => j !== i));
      renderRecords();
    };
    ul.append(el('li', {}, el('div', { className: 'rec-name' }, r.name), el('div', { className: 'muted small' }, `${u.steps(r.steps.length)}: ${ops}`), el('div', { className: 'rec-buttons' }, play, file, del)));
  }
  box.append(ul);
  const imp = el('input', { type: 'file', accept: '.json,application/json', className: 'rec-file' });
  imp.onchange = async () => {
    const f = imp.files?.[0];
    if (!f) return;
    const r = parseRecording(await f.text());
    recordsNote = r.ok ? u.saved(r.recording.name) : u.importBad(r.reason);
    if (r.ok) saveRecords([r.recording, ...list]);
    renderRecords();
  };
  box.append(el('label', { className: 'rec-import' }, el('span', {}, u.import), imp));
}

// ---------- reference card ----------
let refTarget: RefTarget | null = null;
function openRef(target: RefTarget) {
  refTarget = target;
  $('#ref-body').innerHTML = referenceHtml(target, { locale, level });
  const r = $('#ref');
  r.classList.add('open');
  r.setAttribute('aria-hidden', 'false');
  $('#ref-body').scrollTop = 0;
  $<HTMLButtonElement>('#ref-close').focus();
}
function closeRef() {
  refTarget = null;
  const r = $('#ref');
  r.classList.remove('open');
  r.setAttribute('aria-hidden', 'true');
}
/** "substance:water", "equipment:pot", "component:sodium-chloride" → what to show. */
function refFor(key: string): RefTarget | null {
  const [kind, id] = key.split(':') as [string, string];
  if (kind === 'substance' && id in SUBSTANCES) return { kind: 'substance', item: SUBSTANCES[id as SubstanceId] };
  if (kind === 'component' && id in COMPONENTS) return { kind: 'component', id: id as keyof typeof COMPONENTS };
  const eq = EQUIPMENT.find((e) => e.id === id);
  return kind === 'equipment' && eq ? { kind: 'equipment', item: eq } : null;
}
document.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>('[data-ref]');
  if (!b) return;
  const target = refFor(b.dataset['ref']!.includes(':') ? b.dataset['ref']! : `component:${b.dataset['ref']}`);
  if (target) openRef(target);
});
$('#ref-close').onclick = closeRef;
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && refTarget) closeRef();
});

// ---------- side panel: fold / unfold ----------
// Both side panels fold from a button in their own header row into a narrow strip that opens them again.
function renderSide() {
  const u = t();
  const folded = store.get('side') === 'folded';
  $('.main').classList.toggle('side-folded', folded);
  const b = $<HTMLButtonElement>('#side-toggle');
  b.textContent = '⇥';
  b.title = u.sideFold;
  b.setAttribute('aria-label', u.sideFold);
  b.setAttribute('aria-expanded', String(!folded));
  $('#side-open').textContent = u.sideUnfold;
  const shelfFolded = store.get('shelf') === 'folded';
  $('.app').classList.toggle('shelf-folded', shelfFolded);
  $('#shelf').classList.toggle('folded', shelfFolded);
  const f = $<HTMLButtonElement>('#shelf-fold');
  f.textContent = '⇤';
  f.title = u.shelfFold;
  f.setAttribute('aria-label', u.shelfFold);
  f.setAttribute('aria-expanded', String(!shelfFolded));
  $('#shelf-open').textContent = u.shelfUnfold;
}
const flip = (key: string) => () => {
  store.set(key, store.get(key) === 'folded' ? 'open' : 'folded');
  renderSide();
};
$('#side-toggle').onclick = flip('side');
$('#side-open').onclick = flip('side');
$('#shelf-fold').onclick = flip('shelf');
$('#shelf-open').onclick = flip('shelf');

// ---------- console ----------
const labConsole = createConsole({
  locale: () => locale,
  params: () => params,
  started: () => experimentStarted(),
  setAction: (a) => setAction(a),
  choose(next, kind) {
    if (next.heater) lastHeater = next.heater;
    if (next.cooler) lastCooler = next.cooler;
    if (next.supply) lastSupply = next.supply;
    if (kind === 'experiment') {
      tableSet = true;
      // Another substance, vessel or conditions: a new, free experiment.
      preset = null;
      plan = [];
      params = fitChoices(next);
      buildShelf();
      newSession();
      return;
    }
    params = experimentStarted() ? next : fitChoices(next);
    stepChanged();
  },
  setSpeed(x) {
    speed = x;
    $<HTMLSelectElement>('#speed').value = String(x);
  },
  setKnob(x) {
    if (!knobTurns()) return false;
    knob.value = x;
    knobChanged(x);
    return true;
  },
  toggleStart: () => toggleStart(),
  isRunning: () => running,
  reset: () => resetExperiment(),
  add: (id, grams, tempC, frozen) => addPortion(id, grams, tempC, frozen),
  addable: () => addableTo(session.state, commands),
  predict(minutes) {
    expectKind = 'prediction';
    expectMinutes = minutes;
    buildExpect();
  },
  status() {
    const u = t();
    const b = sample();
    const lines = [`${u.time}: ${formatDuration(Math.floor(session.state.time), locale)}`];
    if (b) {
      lines.push(`${tr(b.state.mixture && b.label ? b.label : substance().name, locale)}: ${formatQuantity(b.state.temperature, 'K', { locale, level: 'school' })}`);
      const s = b.state.solidFraction ?? 0;
      if (s > 0) lines.push(u.solidShare(Math.round(s * 100)));
      const mix = b.state.mixture;
      if (mix && mix.water - mix.ice > 1e-9) lines.push(...solutionLines(mix, b.state.temperature));
      const lost = (b.state.boiledOff ?? 0) + (b.state.evaporated ?? 0);
      if (lost > 1e-4) lines.push(u.boiledOff(formatQuantity(lost, 'kg', { locale, level: 'school' })));
    }
    const sup = Object.values(session.state.entities).find(isSupply);
    if (sup) lines.push(`${u.current}: ${formatQuantity(sup.state.current, 'A', { locale, level: 'school' })}${sup.state.resistance !== null ? ` · ${formatQuantity(sup.state.resistance, 'Ω', { locale, level: 'school' })}` : ''}`);
    lines.push(`${u.setup}: ${labSubject(params, locale, session.state)}`);
    lines.push(running ? (locale === 'uk' ? '▶ іде' : '▶ running') : finished ? (locale === 'uk' ? '■ крок завершено' : '■ step done') : locale === 'uk' ? '⏸ стоїть' : '⏸ paused');
    return lines;
  },
  explain: () => explain(),
  openRef(key) {
    const target = refFor(key);
    if (target) openRef(target);
    return !!target;
  },
  startPreset: (p) => startPreset(p),
  scenes: () => ACTS.map((a) => a.name),
  news: () => byTheWay(),
  weigh: (sc) => weighNow(sc ?? scale),
  voices: () => VOICE_IDS.map((v) => `${v}${v === currentVoice() ? ' ◀' : ''} — ${t().voice.names[v]}`),
  voice(v) {
    if (!(VOICE_IDS as string[]).includes(v)) return false;
    voiceSel.value = v;
    voiceSel.onchange?.(new Event('change'));
    return true;
  },
  level: () => measureNow({ type: 'lab.read-level', vessel: params.vessel, size: params.size }),
  hang: (id, grams, into) => measureNow({ type: 'lab.hang', substance: id, mass: grams / 1000, into }),
  save: (name) => {
    const note = saveRecording(name);
    renderRecords();
    return note;
  },
  records: () => loadRecords().map((r) => `${r.name} — ${t().rec.steps(r.steps.length)}`),
  replay(n) {
    const r = loadRecords()[n - 1];
    if (r) startReplay(r);
    return !!r;
  },
  playScene(name) {
    const a = ACTS.find((x) => x.name === name);
    if (!a) return;
    // Played at once, as if he got bored right now (the next key or click still ends it).
    const u = t();
    const idea = PRESETS[Math.floor(Math.random() * PRESETS.length)]!;
    idleAct = { ...a, lines: a.name === 'chalk' ? u.idle.chalk(tr(idea.title, locale)) : u.idle[a.name], started: performance.now() };
    lastActName = a.name;
    idleLine = 0;
    render();
  },
});
// A dock at the bottom of the window: slides up, its top edge is a handle to drag it taller or lower.
$('#console-wrap').append(labConsole);
let consoleHeight = Number(store.get('console-h')) || 260;
const clampConsole = (h: number) => Math.round(Math.max(120, Math.min(window.innerHeight * 0.85, h)));
function layoutConsole() {
  const open = $('#console-wrap').classList.contains('open');
  consoleHeight = clampConsole(consoleHeight);
  document.documentElement.style.setProperty('--console-h', `${consoleHeight}px`);
  // Room at the end of the page, so the dock never hides the last lines.
  document.body.style.paddingBottom = open ? `${consoleHeight}px` : '';
  document.body.classList.toggle('console-open', open);
}
function setConsole(open: boolean) {
  const wrap = $('#console-wrap');
  wrap.classList.toggle('open', open);
  wrap.setAttribute('aria-hidden', String(!open));
  $('#console-toggle').setAttribute('aria-expanded', String(open));
  store.set('console', open ? 'open' : 'closed');
  layoutConsole();
  if (open) wrap.querySelector('input')?.focus();
}
$('#console-toggle').onclick = () => setConsole(!$('#console-wrap').classList.contains('open'));
$('#console-wrap').addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    setConsole(false);
    $<HTMLButtonElement>('#console-toggle').focus();
  }
});
const grip = $('#console-grip');
grip.addEventListener('pointerdown', (e) => {
  grip.setPointerCapture(e.pointerId);
  const move = (ev: PointerEvent) => {
    consoleHeight = clampConsole(window.innerHeight - ev.clientY);
    layoutConsole();
  };
  const up = () => {
    grip.removeEventListener('pointermove', move);
    store.set('console-h', String(consoleHeight));
  };
  grip.addEventListener('pointermove', move);
  grip.addEventListener('pointerup', up, { once: true });
  grip.addEventListener('pointercancel', up, { once: true });
});
grip.addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
  consoleHeight = clampConsole(consoleHeight + (e.key === 'ArrowUp' ? 30 : -30));
  layoutConsole();
  store.set('console-h', String(consoleHeight));
  e.preventDefault();
});
window.addEventListener('resize', layoutConsole);
setConsole(store.get('console') === 'open');

// ---------- wiring ----------
$('#quiz').addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('button[data-renew]')) return renew();
  if ((e.target as HTMLElement).closest('button[data-rechoose]')) {
    // The prediction opened again: all the choices, to pick anew.
    picked = { key: '', ids: [] };
    prediction = null;
    return render();
  }
  const step = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-plan]');
  if (step) return nextPlanStep();
  if ((e.target as HTMLElement).closest('button[data-show-answer]') && preset) {
    answerShown = preset.id;
    answerPreset();
    return render();
  }
  if (preset?.guided && !plan.length) {
    const pick = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-choice]');
    if (!pick) return;
    // The conclusion of the procedure: what the table says — judged against the run.
    prediction = { preset: preset.id, choice: pick.dataset['choice']! };
    answerPreset();
    return render();
  }
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-choice]');
  const q = quizNow();
  if (!b || !q) return;
  const id = b.dataset['choice']!;
  if (picked.key !== q.key) picked = { key: q.key, ids: [] };
  if (q.predict) {
    picked.ids = [id];
    prediction = { preset: preset!.id, choice: id };
  } else if (!picked.ids.includes(id)) picked.ids.push(id);
  render();
});
$('#offer').addEventListener('click', (e) => {
  const target = (e.target as HTMLElement).closest<HTMLElement>('[data-fix], [data-stop], [data-plan]');
  if (!target) return;
  if (target.dataset['stop']) return stop();
  if (target.dataset['plan']) return nextPlanStep();
  const f = Array.isArray(fixes) ? fixes[Number(target.dataset['fix'])] : undefined;
  if (f) applyFix(f);
});
// An instrument has come to rest: tell its reading, write it on the board.
scene.element.addEventListener('instrument-settled', () => {
  if (!instrumentBusy) return;
  instrumentBusy = false;
  if (readWhenSettled) {
    readWhenSettled = false;
    readBoardSoon();
  }
  boardEpoch++;
  if (answerWhenSettled) {
    answerWhenSettled = false;
    answerPreset();
  }
  render();
});
$('#knob-wrap').append(knob.element);
$('#chart').append(chart.element);
$('#scene').append(scene.element);
$('#start').onclick = () => ((lookingAt = null), toggleStart());
function toggleStart() {
  tableSet = true;
  goOnFreely();
  // A finished step: the next one continues with the same contents (the user may have changed nothing).
  if (finished) {
    closeStep();
    beginStep(configureStep(session.state, params));
    running = true;
    setChart(false);
    lastFrame = 0;
    return render();
  }
  running = !running;
  if (running) setChart(false);
  lastFrame = 0;
  render();
}
// Starting over wipes the board with the sponge, like «Новий дослід».
$('#reset').onclick = () => renew();
$('#weigh').onclick = () => void weighNow(scale);
$('#read-level').onclick = () => void measureNow({ type: 'lab.read-level', vessel: params.vessel, size: params.size });
$<HTMLSelectElement>('#scale').onchange = (e) => {
  scale = (e.target as HTMLSelectElement).value as ScaleId;
  store.set('scale', scale);
};
function resetExperiment() {
  // Starting over: a ready-made experiment starts over as it was chosen — the steps (a fresh pot without
  // the lid, waiting for the ice to melt) changed params on the way.
  if (preset && presetGiven && presetGiven.id === preset.id) return startPreset(presetGiven, presetVals);
  if (preset) plan = [...(preset.plan ?? [])];
  planTotal = plan.length;
  prediction = null;
  presetAnswer = null;
  newSession();
  presetSetup();
}
$('#switch').onclick = () => {
  if (!params.heater) return;
  const v = params.heater.knob > 0 ? 0 : 1;
  params = { ...params, heater: { ...params.heater, knob: v } };
  lastHeater = params.heater!;
  if (stepElapsed() === 0 && !history.length) return newSession();
  sendPower(v);
};
const speedSel = $<HTMLSelectElement>('#speed');
for (const s of [1, 10, 60, 300, 600, 3600]) speedSel.append(el('option', { value: String(s), selected: s === speed }, `×${s}`));
speedSel.onchange = () => (speed = Number(speedSel.value));
$('#explain').onclick = explain;
$<HTMLInputElement>('#search').addEventListener('input', (e) => {
  query = (e.target as HTMLInputElement).value.trim().toLowerCase();
  buildShelf();
  if (shelfTab === 'experiments') buildPresets();
});

// A shadow under the experiment's bar once it sticks to the top of the screen.
{
  const head = document.querySelector<HTMLElement>('.kitchen-head');
  if (head) window.addEventListener('scroll', () => head.classList.toggle('stuck', head.getBoundingClientRect().top <= 0.5 && window.scrollY > 0), { passive: true });
}

// Footnotes on terms (катод, розчинність…): the first mention in each text block is underlined, a tap shows the definition.
installFootnotes(() => locale);
{
  const roots = ['#messages', '#offer', '#quiz', '#report', '#ref-body', '#sc-says', '#about-body', '#paper-body'];
  let queued = false;
  const run = () => {
    queued = false;
    for (const sel of roots) {
      const el = document.querySelector(sel);
      if (el) annotate(el, locale);
    }
    // On the shelf only the descriptions (not card names or family headers); in the catalogue, not the titles (they are links).
    document.querySelectorAll('#setup .item-detail, #catalog .cat-item p:not(.cat-kind)').forEach((el) => annotate(el, locale));
  };
  const schedule = () => {
    if (!queued) (queued = true), requestAnimationFrame(run);
  };
  const obs = new MutationObserver(schedule);
  for (const sel of [...roots, '#setup', '#catalog']) {
    const el = document.querySelector(sel);
    if (el) obs.observe(el, { childList: true, subtree: true, characterData: true });
  }
  schedule();
}

// ---------- the library: a page of its own (#glossary, #substances, #equipment) ----------
let libraryShown = '';
/** Shows the library page the address names (or the lab), and scrolls to the item in it: #glossary/cathode. */
function renderLibrary(toTop = true) {
  const route = libraryRoute(location.hash);
  const lib = $('#library');
  document.body.classList.toggle('in-library', !!route);
  lib.hidden = !route;
  document.title = pageTitle();
  if (!route) {
    libraryShown = '';
    return;
  }
  const key = `${route.page}|${locale}|${level}`;
  if (key !== libraryShown) {
    const query = libraryShown.startsWith(`${route.page}|`) ? (lib.querySelector<HTMLInputElement>('.lib-search')?.value ?? '') : '';
    libraryShown = key;
    lib.innerHTML = libraryHtml(route.page, { locale, level, picOf: shelfPic });
    // Terms inside the definitions are footnotes too — except the term being defined.
    lib.querySelectorAll('.lib-desc').forEach((el) => annotate(el, locale, el.closest<HTMLElement>('[data-term-id]')?.dataset['termId']));
    const search = lib.querySelector<HTMLInputElement>('.lib-search')!;
    search.value = query;
    search.oninput = () => filterLibrary(lib, search.value);
    filterLibrary(lib, query);
  }
  const item = route.item;
  const target = item ? (document.getElementById(item.startsWith('letter-') ? item : `term-${item}`) ?? document.getElementById(`item-${item}`)) : null;
  lib.querySelectorAll('.lib-flash').forEach((e) => e.classList.remove('lib-flash'));
  if (target) {
    target.scrollIntoView({ block: 'start' });
    if (!item!.startsWith('letter-')) target.classList.add('lib-flash');
  } else if (toTop) window.scrollTo(0, 0);
}
window.addEventListener('hashchange', () => renderLibrary());

buildHeader();
buildInfo();
renderLibrary();
renderAbout();
// The address names a ready-made experiment: it is chosen at once (a shared link opens on it).
if (where.route.page === 'experiment') {
  const id = where.route.id;
  queueMicrotask(() => startPreset(PRESETS.find((p) => p.id === id)!));
}
buildShelfTabs();
buildShelf();
buildExpect();
newSession();
setChart(false);
renderRecords();
buildAdd();
requestAnimationFrame(frame);
