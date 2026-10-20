import { createCommandRegistry, createExperimentSession, createSimulation, entityId, seconds, type ExperimentSession } from '../src/core/index.js';
import { celsius, kelvin, toCelsius } from '../src/core/units.js';
import { bodyMass, createThermalSolver, energySplit, isBurner, isHeater, isThermalBody, liquidConcentration, THERMAL_COMMANDS } from '../src/domains/thermal/index.js';
import {
  childrenOf,
  COOLERS,
  HEATERS,
  itemsUnder,
  powerAt,
  canHeat,
  typicalVesselMass,
  VESSELS,
  type CoolerId,
  type EquipmentItem,
  type HeaterId,
  type VesselId,
} from '../src/equipment/index.js';
import { buildReport, entityLabel, formatDuration, formatQuantity, renderHtml, sig, type Block, type ExplainContext } from '../src/explain/index.js';
import { isLocale, LOCALES, tr, type Locale, type LocalizedText } from '../src/knowledge/i18n.js';
import { LEVEL_INFO, LEVELS, textFor, type Level } from '../src/knowledge/levels.js';
import {
  actionUses,
  LAB_ACTIONS,
  OPERATIONS,
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
  SAMPLE_ID,
  type LabAction,
  type LabParams,
  type LabStatus,
  configureStep,
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
import { COMPONENTS, NACL_SOLUTE } from '../src/components/index.js';
import { cellReading, createElectricalSolver, ELECTRICAL_COMMANDS, electrolysisGases, isSupply } from '../src/domains/electrical/index.js';
import { SUPPLIES, supplyVoltage, type SupplyId } from '../src/equipment/supplies.js';
import { SUBSTANCE_CATEGORIES, SUBSTANCES, type SubstanceId, type SubstanceItem } from '../src/substances/index.js';
import { createChart } from './chart.js';
import { createKnob } from './knob.js';
import { createScene, type DeviceKind, type LiquidKind, type SceneView, type VesselShape } from './scene.js';
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
let locale: Locale = (() => {
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
const commands = createCommandRegistry<LabCommand>([...THERMAL_COMMANDS, ...ELECTRICAL_COMMANDS]);

let params: LabParams = {
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
/** Changes that would make the goal reachable (offered with buttons). */
let fixes: LabFix[] | 'computing' = [];
let warnings: readonly LocalizedText[] = [];
let running = false;
let finished = false;
let speed = 60;
let acc = 0;
let lastFrame = 0;
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

/** A new experiment: fresh setup, empty protocol. */
function newSession() {
  history = [];
  pendingAdds = [];
  points = { sample: [], vessel: [], source: [] };
  lastPointAt = -Infinity;
  beginStep(labSetup(params));
}

/** Start a step from a placed state (the vessel already stands where this step needs it). */
function beginStep(placed: { readonly state: SystemState; readonly warnings: readonly LocalizedText[] }) {
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
  fixes = labFixes(params);
  acc = 0;
  record();
  $('#report').innerHTML = '';
  render();
}

const stepElapsed = () => session.state.time - initialState.time;

/** Close the current step (if it ran at all) and put it into the protocol. */
function closeStep() {
  if (doneRecord) return void history.push({ ...doneRecord, adds: stepAdds });
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
  buildShelf();
  if (!history.length && stepElapsed() === 0 && !stepAdds.length) return newSession();
  if (stepElapsed() === 0 && !stepAdds.length) return beginStep(configureStep(initialState, params));
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
  (v) => {
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
  },
  (v) =>
    knobTurns() === 'supply'
      ? formatQuantity(supplyVoltage(SUPPLIES[params.supply!.id], v), 'V', { locale, level: 'school' })
      : v === 0
        ? t().off
        : formatQuantity(currentPower(v), 'W', { locale, level: 'school' }),
);

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

// ---------- main loop ----------
function frame(now: number) {
  const realDt = Math.min(0.1, (now - (lastFrame || now)) / 1000);
  lastFrame = now;
  if (running && !finished) {
    acc += realDt * speed;
    const steps = Math.floor(acc / DT);
    acc -= steps * DT;
    const reached = session.advance(steps * DT, (s) => labGoalReached(stepP, s));
    record();
    if (reached) stop();
    else if (stalled()) stop();
    render();
  }
  requestAnimationFrame(frame);
}

function stop() {
  running = false;
  finished = true;
  const result = session.result(labGoalReached(stepP, session.state));
  doneRecord = { params: stepP, result, status: labStatus(stepP, result, simulation, warnings) };
  // Heating that stalls: find what helps by re-running in the mind (after the headline is on screen).
  if (doneRecord.status.kind === 'stalls' && OPERATIONS[stepP.action].direction === 'heating') {
    fixes = 'computing';
    const p = stepP;
    window.setTimeout(() => {
      fixes = stallFixes(p, simulation);
      render();
    }, 30);
  } else if (doneRecord.status.kind === 'reached') fixes = [];
  setHeadline();
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
  headline = () => [
    ...labSummary(p, result, status, ctx()),
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

/** Can it be frozen within the temperatures the page offers (down to −30 °C)? Ethanol (−114 °C) cannot. */
const canFreezeHere = (s: SubstanceItem) => s.freezing !== undefined && s.freezing.point.value > -30;

/** Volume taken by everything in the vessel now, litres. */
function usedVolume(): number {
  let v = 0;
  for (const e of Object.values(session.state.entities)) {
    if (!isThermalBody(e) || !(e.id === SAMPLE_ID || e.id.startsWith(`${SAMPLE_ID}+`))) continue;
    const mix = e.state.mixture;
    if (mix) {
      // Solution + ice + salt crystals, each with its own density.
      const solution = mix.water - mix.ice + mix.salt - mix.crystals;
      v += (solution / NACL_SOLUTE.solutionDensity(liquidConcentration(mix)) + mix.ice / COMPONENTS.water.phases.solid!.density!.value + mix.crystals / COMPONENTS['sodium-chloride'].phases.solid!.density!.value) * 1000;
      continue;
    }
    const sub = 'substance' in e.params && e.params.substance ? SUBSTANCES[e.params.substance as SubstanceId] : undefined;
    const density = sub ? ((e.state.solidFraction ?? 0) >= 1 ? (sub.freezing?.solidDensity?.value ?? sub.liquid.density.value) : sub.liquid.density.value) : 1000;
    v += (bodyMass(e) / density) * 1000;
  }
  return v;
}

function buildAdd() {
  const u = t();
  const box = $<HTMLDetailsElement>('#add');
  const open = box.open;
  box.innerHTML = '';
  box.append(el('summary', {}, u.addTitle));
  const sub = SUBSTANCES[addSub];
  const sel = el('select', {});
  for (const c of SUBSTANCE_CATEGORIES) {
    const g = el('optgroup', { label: tr(c.name, locale) });
    for (const x of Object.values(SUBSTANCES).filter((y) => y.category === c.id)) g.append(el('option', { value: x.id, selected: x.id === addSub }, tr(x.name, locale)));
    sel.append(g);
  }
  sel.onchange = () => {
    addSub = sel.value as SubstanceId;
    if (!canFreezeHere(SUBSTANCES[addSub])) addFrozen = false;
    addTemp = addFrozen ? -18 : 20;
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
    const density = addFrozen ? (sub.freezing?.solidDensity?.value ?? sub.liquid.density.value) : sub.liquid.density.value;
    const free = params.size - usedVolume();
    if (((addGrams / 1000) / density) * 1000 > free + 1e-9) {
      addError = u.addDoesNotFit(free < 1 ? `${Math.round(free * 1000)} ${u.ml}` : `${sig(free, 3, locale)} ${u.liters}`);
      return buildAdd();
    }
    const entry = session.apply({ type: 'thermal.add', into: SAMPLE_ID, substance: addSub, mass: (addGrams / 1000) as never, temperature: celsius(addTemp), ...(addFrozen ? { frozen: true } : {}) });
    addError = entry.ok ? '' : tr(entry.error, locale);
    if (entry.ok) (finished ? pendingAdds : stepAdds).push({ what: sub.name, mass: addGrams / 1000 });
    headline = null;
    checkpoint = null;
    buildAdd();
    render();
  };
  box.append(
    el('div', { className: 'add-grid' },
      el('label', { className: 'mini-field' }, el('span', {}, u.substance), sel),
      state,
      el('label', { className: 'mini-field' }, el('span', {}, u.addAmount), num(addGrams, 1, 5000, 1, (v) => (addGrams = v))),
      el('label', { className: 'mini-field' }, el('span', {}, u.addTemp), num(addTemp, -30, 300, 1, (v) => (addTemp = v))),
      button,
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
    return freezing ? { text: u.phaseFreezing(T, Math.round(s * 100)), pct: s * 100 } : { text: u.phaseMelting(T, Math.round((1 - s) * 100)), pct: (1 - s) * 100 };
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
/** Bulk boiling in the last frames (boiled-off mass grew) — for the bubbles and the Professor. */
let lastBoiled = 0;
let boilingNow = false;

/** What the scene should show right now: read from the state, nothing computed here. */
function sceneView(): SceneView {
  const u = t();
  const b = sample();
  const sub = substance();
  const sup = Object.values(session.state.entities).find(isSupply);
  const heaterEntity = session.state.entities[entityId(LAB_HEATER_ID)];
  const device: DeviceKind = (params.supply
    ? SUPPLIES[params.supply.id].look
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
  const group = sub.component ? COMPONENTS[sub.component as keyof typeof COMPONENTS]?.group : 'salt';
  const liquid: LiquidKind = sub.recipe || mix ? 'salt' : group === 'water' ? 'water' : group === 'alcohol' ? 'alcohol' : group === 'acid' ? 'acid' : group === 'oil' ? 'oil' : 'other';
  const s = b?.state.solidFraction ?? 0;
  const current = sup ? { amps: sup.state.current, volts: sup.state.current > 0 ? sup.state.decomposition + sup.state.current * ((sup.state.resistance ?? 0) + sup.params.internalResistance) : sup.params.voltage, toxicGas: electrolysis?.anode.component === 'chlorine' } : undefined;
  // The Professor: what is going on, in one line.
  const st = doneRecord?.status;
  const professor: SceneView['professor'] = st
    ? st.kind === 'reached'
      ? { mood: 'happy', says: u.prof.reached }
      : st.kind === 'decomposes'
        ? { mood: 'sooty', says: u.prof.smoke }
        : { mood: 'thinking', says: u.prof.failed }
    : !running && stepElapsed() === 0
      ? labImpossibility(params)
        ? { mood: 'thinking', says: u.prof.impossible }
        : { mood: 'neutral', says: u.prof.idle }
      : current && current.amps > 0.005
        ? current.toxicGas && current.amps > 0.05
          ? { mood: 'sooty', says: u.prof.chlorine }
          : { mood: 'surprised', says: u.prof.current }
        : params.supply
          ? { mood: 'thinking', says: u.prof.noCurrent }
          : boilingNow
            ? { mood: 'surprised', says: u.prof.boiling }
            : s > 0 && s < 1
              ? OPERATIONS[params.action].direction === 'cooling'
                ? { mood: 'neutral', says: u.prof.freezing }
                : { mood: 'neutral', says: u.prof.melting }
              : OPERATIONS[params.action].direction === 'cooling'
                ? { mood: 'neutral', says: u.prof.cooling }
                : { mood: 'neutral', says: u.prof.heating };
  const evaporating = Math.max(0, (T - 45) / 60);
  return {
    device,
    on: params.supply ? (sup?.state.current ?? 0) > 0 : params.heater ? power > 0 : !!params.cooler,
    intensity: params.heater ? Math.min(1, power / maxPower) : 1,
    ...(heaterEntity && isHeater(heaterEntity) ? { deviceTemp: heaterEntity.state.temperature - 273.15 } : {}),
    vessel: (vesselItem().look ?? 'pot') as VesselShape,
    material: params.material,
    lid: params.lid,
    liquid,
    fill: Math.min(1, usedVolume() / params.size),
    temperature: T,
    solid: mix && mix.water <= 1e-9 ? 0 : s,
    crystals: mix && mix.salt > 0 ? mix.crystals / mix.salt : 0,
    boiling: boilingNow,
    steam: s >= 1 ? 0 : boilingNow ? (params.lid ? 0.5 : 1) : Math.min(0.6, evaporating) * (params.lid ? 0.3 : 1),
    ...(current ? { current } : {}),
    ...(params.cooler ? { setpoint: params.cooler.setpoint } : {}),
    running,
    decimal: locale === 'uk' ? ',' : '.',
    professor,
  };
}

function render() {
  const u = t();
  document.documentElement.lang = locale;
  document.title = u.title;
  $('#title').textContent = u.title;
  $('#subtitle').textContent = u.subtitle;
  $('#lbl-language').textContent = u.language;
  $('#lbl-level').textContent = u.level;
  $('#setup-title').textContent = u.setup;
  $('#exp-title').textContent = u.experiment;
  $('#explain').textContent = u.explain;
  $('#explain-hint').textContent = u.explainHint;
  $('#footer').textContent = u.footer;
  renderSide();

  $('#setup-line').textContent = labSubject(params, locale, session.state);
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
    if (mix && s < 1 && mix.water - mix.ice > 1e-9) parts.push(u.salinity(sig(liquidConcentration(mix) * 100, 3, locale)));
    if (mix && mix.crystals > 1e-6) parts.push(u.crystals(formatQuantity(mix.crystals, 'kg', { locale, level: 'school' })));
    for (const e of Object.values(session.state.entities)) {
      if (isThermalBody(e) && e.id.startsWith(`${SAMPLE_ID}+`) && e.label) parts.push(u.addedState(tr(e.label, locale), Math.round((e.state.solidFraction ?? 0) * 100)));
    }
    const lost = (b.state.boiledOff ?? 0) + (b.state.evaporated ?? 0);
    if (lost > 1e-4) parts.push(u.boiledOff(formatQuantity(lost, 'kg', { locale, level: 'school' })));
    // Gases of electrolysis so far (Faraday's law from the charge that passed).
    const supplyNow = Object.values(session.state.entities).find(isSupply);
    const electrolysis = cellReading(b).electrolysis;
    if (supplyNow && electrolysis && supplyNow.state.charge > 0) {
      const gases = electrolysisGases(electrolysis, supplyNow.state.charge, celsius(params.roomTemp));
      if (gases[0]!.volume > 5e-8) parts.push(u.gases(gases.map((g) => `${formatQuantity(g.volume * 1e6, 'mL', { locale, level: 'school' })} ${tr(COMPONENTS[g.component].genitive ?? COMPONENTS[g.component].name, locale).toLowerCase()}`).join(locale === 'uk' ? ' і ' : ' and ')));
    }
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
  $<HTMLButtonElement>('#reset').textContent = u.reset;
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

  renderProtocol();
  scene.render(sceneView());

  // Messages: impossibility before the start, headline after, warnings.
  const msg: string[] = [];
  const offer: string[] = [];
  const fixButtons = () =>
    Array.isArray(fixes) ? fixes.map((f, i) => `<button type="button" data-fix="${i}">${tr(f.label, locale)}</button>`).join('') : `<span class="muted small">${u.computing}</span>`;
  if (headline) {
    msg.push(renderHtml(headline()));
    // The goal was not reached: offer what would reach it — the experiment continues from where it is.
    if (fixes === 'computing' || fixes.length) offer.push(`<div class="offer"><p>${doneRecord?.status.kind === 'stalls' ? u.offerAfterStall : u.offerAfterImpossible}</p><div class="fixes">${fixButtons()}</div></div>`);
  } else {
    // A flat line on the chart is not "nothing happens": say what is going on and how far it got.
    const phase = phaseNote();
    if (phase) msg.push(`<div class="phase"><p>${phase.text}</p><div class="progress"><span style="--p:${phase.pct}%"></span></div></div>`);
    for (const w of warnings) msg.push(`<p>⚠ ${tr(w, locale)}</p>`);
    const impossible = labImpossibility(stepP);
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
  const what = (p: LabParams) =>
    `${tr(OPERATIONS[p.action].label, locale).replace('…', '')}${p.target !== undefined && OPERATIONS[p.action].target ? ` ${p.target} °C` : ''}${p.duration !== undefined && OPERATIONS[p.action].duration ? `, ${p.duration} ${locale === 'uk' ? 'хв' : 'min'}` : ''}`;
  const adds = (a: readonly Added[]) => a.map((x) => `<span class="added">${u.added(tr(x.what, locale).toLowerCase(), formatQuantity(x.mass, 'kg', { locale, level: 'school' }))}</span>`).join('');
  const outcome = (st: LabStatus, r: ExperimentResult<LabCommand>, p: LabParams) =>
    st.kind === 'reached' && OPERATIONS[p.action].duration ? `✓ ${D(st.at)}` : st.kind === 'reached' ? u.stepReached(D(st.at)) : st.kind === 'will-reach' ? u.stepStopped(D(r.final.time - r.initial.time)) : u.stepFailed;
  const rows = history.map((h) => {
    const ok = h.status.kind === 'reached' || h.status.kind === 'will-reach';
    return `<li class="${ok ? 'done' : 'failed'}"><span class="what">${what(h.params)}</span><span class="where">${place(h.params)}</span>${adds(h.adds)}<span class="outcome">${outcome(h.status, h.result, h.params)}</span></li>`;
  });
  const now = doneRecord ? outcome(doneRecord.status, doneRecord.result, doneRecord.params) : running || stepElapsed() > 0 ? u.stepRunning(formatDuration(Math.floor(stepElapsed()), locale)) : u.stepWaiting;
  rows.push(`<li class="current"><span class="what">${what(stepP)}</span><span class="where">${place(stepP)}</span>${adds(stepAdds)}<span class="outcome">${now}</span>${adds(pendingAdds)}</li>`);
  $('#protocol-title').textContent = u.protocolTitle;
  $('#protocol').innerHTML = rows.join('');
  $('#protocol-hint').textContent = finished ? u.protocolNext : u.protocolHint;
}

// ---------- shelf (left panel) ----------
const openSections = new Set<string>((store.get('open') ?? 'action,substance,vessel,device,conditions').split(','));
let query = '';

function buildShelf() {
  const u = t();
  const root = $('#setup');
  const shelf = $('#shelf');
  const scroll = shelf.scrollTop;
  root.innerHTML = '';
  $<HTMLInputElement>('#search').placeholder = locale === 'uk' ? 'Пошук: речовина, посуд, прилад…' : 'Search: substance, vessel, device…';
  const rebuild = () => {
    buildShelf();
    newSession();
  };
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
  /** One selectable card; `detail` is shown under the selected one. */
  const item = (o: { name: LocalizedText; note?: string | undefined; badge?: string; selected: boolean; problem?: string; onPick: () => void; detail?: () => HTMLElement[] }) => {
    const li = el('li');
    const b = el('button', { type: 'button', className: `item${o.selected ? ' selected' : ''}${o.problem ? ' incompatible' : ''}` });
    b.setAttribute('aria-pressed', String(o.selected));
    b.append(el('span', { className: 'item-name' }, tr(o.name, locale), ...(o.badge ? [el('span', { className: 'badge' }, o.badge)] : [])));
    if (o.problem || o.note) b.append(el('span', { className: 'item-note' }, o.problem ? `⚠ ${o.problem}` : o.note!));
    if (o.problem) b.title = o.problem;
    b.onclick = o.onPick;
    li.append(b);
    if (o.selected && o.detail) li.append(el('div', { className: 'item-detail' }, ...o.detail()));
    return li;
  };
  const describe = (i: { description: Parameters<typeof textFor>[0]; safety?: Parameters<typeof textFor>[0]; modelNotes?: readonly LocalizedText[] }): HTMLElement[] => [
    el('p', {}, tr(textFor(i.description, level), locale)),
    ...(i.safety ? [el('p', { className: 'safety' }, `⚠ ${u.safety}: ${tr(textFor(i.safety, level), locale)}`)] : []),
    ...(i.modelNotes ?? []).map((n) => el('p', { className: 'muted small' }, `ℹ ${tr(n, locale)}`)),
  ];
  const groupList = (groups: readonly { label: string; items: (HTMLElement | null)[] }[]) => {
    const out: HTMLElement[] = [];
    for (const g of groups) {
      const items = g.items.filter((x): x is HTMLElement => x !== null);
      if (!items.length) continue;
      out.push(el('div', { className: 'group-label' }, g.label), el('ul', { className: 'items' }, ...items));
    }
    return out;
  };
  const volume = (l: number) => (l < 1 ? `${Math.round(l * 1000)} ${u.ml}` : `${num(l)} ${u.liters}`);
  const num = (x: number) => sig(x, 4, locale);
  const hasEstimate = (vals: readonly ({ verification: string } | undefined)[]) => vals.some((v) => v?.verification === 'estimate');

  // 1. What we do.
  const actionBox = el('div', { className: 'actions' });
  for (const a of LAB_ACTIONS) {
    const b = el('button', { type: 'button', className: `chip${a === params.action ? ' selected' : ''}` }, tr(OPERATIONS[a].label, locale));
    b.setAttribute('aria-pressed', String(a === params.action));
    b.onclick = () => setAction(a);
    actionBox.append(b);
  }
  const actionContent: HTMLElement[] = [actionBox];
  const op = OPERATIONS[params.action];
  if (op.target) {
    actionContent.push(number(u.target, params.target ?? op.target.default, op.target.min, op.target.max, 1, (x) => (params = { ...params, target: x }), stepChanged));
  }
  if (op.duration) {
    actionContent.push(number(u.duration, params.duration ?? op.duration.default, op.duration.min, op.duration.max, 1, (x) => (params = { ...params, duration: x }), stepChanged));
  }
  if (!query) section('action', u.action, tr(op.label, locale), ...actionContent);

  // 2. Substance.
  const sub = substance();
  const small = params.size < 0.1;
  section(
    'substance',
    u.substance,
    tr(sub.name, locale),
    ...groupList(
      SUBSTANCE_CATEGORIES.filter((c) => c.id.startsWith('liquid.')).map((c) => ({
        label: tr(c.name, locale),
        items: Object.values(SUBSTANCES)
          .filter((x) => x.category === c.id && matches(x.name))
          .map((x) =>
            item({
              name: x.name,
              note: [x.freezing ? `${u.meltLine} ${num(x.freezing.point.value)} °C` : null, x.boiling ? `${u.boilLine} ${num(x.boiling.point.value)} °C` : null].filter(Boolean).join(' · ') || undefined,
              ...(hasEstimate([x.liquid.specificHeat, x.freezing?.point, x.boiling?.point]) ? { badge: u.estimateBadge } : {}),
              selected: x.id === params.substance,
              onPick: () => {
                params = { ...params, substance: x.id as SubstanceId, startTemp: OPERATIONS[params.action].startTemp(x) };
                rebuild();
              },
              detail: () => [
                ...describe(x),
                number(`${u.amount} (≤ ${volume(params.size)})`, params.liters, small ? 0.001 : 0.01, params.size, small ? 0.001 : 0.01, (v) => (params = { ...params, liters: v })),
                number(u.startTemp, params.startTemp, -30, 300, 1, (v) => (params = { ...params, startTemp: v })),
              ],
            }),
          ),
      })),
    ),
  );

  // 3. Vessel.
  const v = vesselItem();
  section(
    'vessel',
    u.vessel,
    `${tr(v.name, locale)}, ${volume(params.size)}`,
    ...groupList(
      childrenOf('vessel').map((c) => ({
        label: tr(c.name, locale),
        items: itemsUnder(c.id)
          .filter((x): x is typeof v => x.kind === 'vessel' && matches(x.name))
          .map((x) =>
            item({
              name: x.name,
              note: `${x.spec.materials.map((m) => u.materials[m] ?? m).join(', ')} · ${volume(x.spec.sizes[0]!)}–${volume(x.spec.sizes.at(-1)!)}`,
              selected: x.id === params.vessel,
              onPick: () => {
                const size = x.spec.defaultSize;
                params = { ...params, vessel: x.id as VesselId, size, material: x.spec.defaultMaterial, lid: false, liters: round(size * 0.7, size < 0.1 ? 3 : 2) };
                delete (params as { vesselMass?: number }).vesselMass;
                rebuild();
              },
              detail: () => {
                const out: HTMLElement[] = [...describe(x), el('span', { className: 'muted small' }, u.size)];
                out.push(
                  chips(x.spec.sizes.map((z) => [String(z), volume(z)] as const), String(params.size), (z) => {
                    const size = Number(z);
                    params = { ...params, size, liters: params.liters <= size ? params.liters : round(size * 0.7, size < 0.1 ? 3 : 2) };
                    delete (params as { vesselMass?: number }).vesselMass;
                    rebuild();
                  }),
                );
                if (x.spec.materials.length > 1) {
                  out.push(
                    el('span', { className: 'muted small' }, u.material),
                    chips(x.spec.materials.map((m) => [m, u.materials[m] ?? m] as const), params.material, (m) => {
                      params = { ...params, material: m };
                      rebuild();
                    }),
                  );
                }
                out.push(number(u.vesselMass, params.vesselMass ?? typicalVesselMass(x, params.size), 0.01, 20, 0.01, (m) => (params = { ...params, vesselMass: m })));
                if (x.spec.lid === 'optional') {
                  const lid = el('input', { type: 'checkbox', checked: params.lid });
                  lid.onchange = () => {
                    params = { ...params, lid: lid.checked };
                    rebuild();
                  };
                  out.push(el('label', { className: 'check' }, lid, el('span', {}, u.lid)));
                }
                return out;
              },
            }),
          ),
      })),
    ),
  );

  // 4. Heater or cooler, depending on the action.
  const uses = actionUses(params.action);
  const roomItem = (selected: boolean, onPick: () => void) =>
    !matches({ uk: UI.uk.justRoom, en: UI.en.justRoom }) ? null : item({ name: { uk: UI.uk.justRoom, en: UI.en.justRoom }, note: `${params.roomTemp} °C`, selected, onPick });
  if (uses === 'supply') {
    const groups = childrenOf('device.power').map((c) => ({
      label: tr(c.name, locale),
      items: Object.values(SUPPLIES)
        .filter((x) => x.category === c.id && matches(x.name))
        .map((x) =>
          item({
            name: x.name,
            note: `${x.spec.voltage.min === x.spec.voltage.max ? `${x.spec.voltage.max} ${u.volts}` : `${x.spec.voltage.min}–${x.spec.voltage.max} ${u.volts}`} · ≤ ${sig(x.spec.currentLimit.value, 3, locale)} ${u.amps}`,
            ...([x.spec.currentLimit, x.spec.internalResistance].some((d) => d?.verification === 'estimate') ? { badge: u.estimateBadge } : {}),
            selected: x.id === params.supply?.id,
            onPick: () => {
              params = { ...params, supply: { id: x.id as SupplyId, knob: lastSupply.knob } };
              lastSupply = params.supply!;
              stepChanged();
            },
            detail: () => describe(x),
          }),
        ),
    }));
    section('device', u.supplyWhat, params.supply ? tr(SUPPLIES[params.supply.id].name, locale) : '—', ...groupList(groups));
  } else if (uses === 'heater' || uses === 'either') {
    const groups: { label: string; items: (HTMLElement | null)[] }[] = childrenOf('device.heater').map((c) => ({
      label: tr(c.name, locale),
      items: itemsUnder(c.id)
        .filter((x): x is NonNullable<ReturnType<typeof heaterItem>> => x.kind === 'heater' && matches(x.name))
        .map((x) => {
          const compat = canHeat(x, v, params.material, params.size);
          return item({
            name: x.name,
            note: x.spec.ratings.map((r) => formatQuantity(r, 'W', { locale, level: 'school' })).join(' / '),
            ...(x.spec.ratingData.verification === 'estimate' ? { badge: u.estimateBadge } : {}),
            ...(compat.ok ? {} : { problem: tr(compat.reason, locale) }),
            selected: x.id === params.heater?.id,
            onPick: () => {
              params = { ...params, heater: { id: x.id as HeaterId, rating: x.spec.defaultRating, knob: x.spec.control === 'switch' ? 0 : lastHeater.knob || 0.7 } };
              lastHeater = params.heater!;
              stepChanged();
            },
            detail: () => [
              ...describe(x),
              el('span', { className: 'muted small' }, u.model),
              chips(x.spec.ratings.map((r) => [String(r), formatQuantity(r, 'W', { locale, level: 'school' })] as const), String(params.heater?.rating), (r) => {
                params = { ...params, heater: { ...params.heater!, rating: Number(r) } };
                lastHeater = params.heater!;
                stepChanged();
              }),
            ],
          });
        }),
    }));
    if (uses === 'either') groups.unshift({ label: locale === 'uk' ? 'Без нагрівача' : 'No heater', items: [roomItem(!params.heater, () => {
      const { heater: _h, ...rest } = params;
      void _h;
      params = rest;
      stepChanged();
    })] });
    section('device', uses === 'either' ? u.meltWith : u.device, params.heater ? tr(HEATERS[params.heater.id].name, locale) : u.justRoom, ...groupList(groups));
  } else {
    const groups = [
      { label: locale === 'uk' ? 'Без охолоджувача' : 'No cooler', items: [roomItem(!params.cooler, () => {
        const { cooler: _c, ...rest } = params;
        void _c;
        params = rest;
        stepChanged();
      })] },
      ...childrenOf('device.cooler').map((c) => ({
        label: tr(c.name, locale),
        items: itemsUnder(c.id)
          .filter((x): x is (typeof COOLERS)[CoolerId] => x.kind === 'cooler' && matches(x.name))
          .map((x) =>
            item({
              name: x.name,
              note: x.spec.setpoint.max > x.spec.setpoint.min ? `${x.spec.setpoint.min}…${x.spec.setpoint.max} °C` : `${x.spec.setpoint.default} °C`,
              selected: x.id === params.cooler?.id,
              onPick: () => {
                params = { ...params, cooler: { id: x.id as CoolerId, setpoint: x.spec.setpoint.default } };
                lastCooler = params.cooler!;
                stepChanged();
              },
              detail: () => [
                ...describe(x),
                ...(x.spec.setpoint.max > x.spec.setpoint.min
                  ? [number(`${u.setpoint} (${x.spec.setpoint.min}…${x.spec.setpoint.max})`, params.cooler?.setpoint ?? x.spec.setpoint.default, x.spec.setpoint.min, x.spec.setpoint.max, 1, (sp) => {
                      params = { ...params, cooler: { ...params.cooler!, setpoint: sp } };
                      lastCooler = params.cooler!;
                    }, stepChanged)]
                  : []),
              ],
            }),
          ),
      })),
    ];
    section('device', u.coolWhere, params.cooler ? tr(COOLERS[params.cooler.id].name, locale) : u.justRoom, ...groupList(groups));
  }

  // 5. Conditions.
  if (!query) section('conditions', locale === 'uk' ? 'Умови' : 'Conditions', `${params.roomTemp} °C`, number(u.room, params.roomTemp, -20, 45, 1, (x) => (params = { ...params, roomTemp: x })));

  shelf.scrollTop = scroll;
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
  params = next;
  stepChanged();
}

function buildHeader() {
  const lang = $<HTMLSelectElement>('#language');
  lang.innerHTML = '';
  const names: Record<Locale, string> = { uk: 'Українська', en: 'English' };
  for (const l of LOCALES) lang.append(el('option', { value: l, selected: l === locale }, names[l]));
  lang.onchange = () => {
    locale = lang.value as Locale;
    store.set('locale', locale);
    buildHeader();
    buildShelf();
    buildExpect();
    buildAdd();
    render();
    if ($('#report').innerHTML) explain();
  };
  const lv = $<HTMLSelectElement>('#level');
  lv.innerHTML = '';
  for (const l of LEVELS) lv.append(el('option', { value: l, selected: l === level, title: tr(LEVEL_INFO[l].audience, locale) }, tr(LEVEL_INFO[l].name, locale)));
  lv.onchange = () => {
    level = lv.value as Level;
    store.set('level', level);
    buildShelf();
    if ($('#report').innerHTML) explain();
  };
}

function explain() {
  const result = doneRecord?.result ?? session.result(labGoalReached(stepP, session.state));
  if (result.final.time === result.initial.time) return;
  running = false;
  if (!headline) setHeadline();
  const title = locale === 'uk' ? 'Що відбулося і чому' : 'What happened and why';
  const notes: Block[] = (substance().modelNotes ?? []).map((n) => ({ kind: 'note', tone: 'info', text: tr(n, locale) }));
  $('#report').innerHTML = renderHtml(
    buildReport({ title, level, locale, country: 'UA', result, simulation, domain: LAB_KNOWLEDGE, focusTime: (result.initial.time + result.final.time) / 2, summary: [...headline!(), ...notes] }),
  );
  render();
  $('#report').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** Apply an offered change: the vessel moves on with its contents and the experiment goes on at once. */
function applyFix(f: LabFix) {
  params = f.params;
  if (params.heater) lastHeater = params.heater;
  if (params.cooler) lastCooler = params.cooler;
  if (params.supply) lastSupply = params.supply;
  stepChanged();
  running = true;
  lastFrame = 0;
  render();
}

// ---------- side panel: fold / unfold ----------
function renderSide() {
  const folded = store.get('side') === 'folded';
  $('.main').classList.toggle('side-folded', folded);
  const b = $<HTMLButtonElement>('#side-toggle');
  b.textContent = folded ? t().sideUnfold : t().sideFold;
  b.setAttribute('aria-expanded', String(!folded));
}
$('#side-toggle').onclick = () => {
  store.set('side', store.get('side') === 'folded' ? 'open' : 'folded');
  renderSide();
};

// ---------- wiring ----------
$('#offer').addEventListener('click', (e) => {
  const target = (e.target as HTMLElement).closest<HTMLElement>('[data-fix], [data-stop]');
  if (!target) return;
  if (target.dataset['stop']) return stop();
  const f = Array.isArray(fixes) ? fixes[Number(target.dataset['fix'])] : undefined;
  if (f) applyFix(f);
});
$('#knob-wrap').append(knob.element);
$('#chart').append(chart.element);
$('#scene').append(scene.element);
$('#start').onclick = () => {
  // A finished step: the next one continues with the same contents (the user may have changed nothing).
  if (finished) {
    closeStep();
    beginStep(configureStep(session.state, params));
    running = true;
    lastFrame = 0;
    return render();
  }
  running = !running;
  lastFrame = 0;
  render();
};
$('#reset').onclick = () => newSession();
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
});

buildHeader();
buildShelf();
buildExpect();
newSession();
buildAdd();
requestAnimationFrame(frame);
