import { createCommandRegistry, createExperimentSession, createSimulation, entityId, seconds, type ExperimentSession } from '../src/core/index.js';
import { celsius, kelvin, toCelsius } from '../src/core/units.js';
import { bodyMass, createThermalSolver, energySplit, isBurner, isHeater, isThermalBody, THERMAL_COMMANDS, THERMAL_KNOWLEDGE, type ThermalCommand } from '../src/domains/thermal/index.js';
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
  LAB_COOLER_ID,
  LAB_HEATER_ID,
  LAB_VESSEL_ID,
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
} from '../src/scenarios/index.js';
import { SUBSTANCE_CATEGORIES, SUBSTANCES, type SubstanceId, type SubstanceItem } from '../src/substances/index.js';
import { createChart } from './chart.js';
import { createKnob } from './knob.js';
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
const round = (x: number, digits = 2) => Math.round(x * 10 ** digits) / 10 ** digits;

// ---------- experiment state ----------
const DT = seconds(0.5);
const simulation = createSimulation({ solvers: [createThermalSolver()], fixedDt: DT });
const commands = createCommandRegistry<ThermalCommand>(THERMAL_COMMANDS);

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

let session: ExperimentSession<ThermalCommand>;
let initialState: ReturnType<typeof labSetup>['state'];
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

function newSession() {
  const setup = labSetup(params);
  initialState = setup.state;
  warnings = setup.warnings;
  session = createExperimentSession<ThermalCommand>({ initial: initialState, simulation, commands, sampleEvery: seconds(10) });
  running = false;
  finished = false;
  headline = null;
  checkpoint = null;
  lastSolid = null;
  acc = 0;
  points = { sample: [], vessel: [], source: [] };
  lastPointAt = -Infinity;
  record();
  $('#report').innerHTML = '';
  render();
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
const knob = createKnob(
  (v) => {
    if (!params.heater) return;
    params = { ...params, heater: { ...params.heater, knob: v } };
    lastHeater = params.heater!;
    window.clearTimeout(knobTimer);
    // Before the start the knob is part of the setup; afterwards it is an action in the log.
    if (session.state.time === 0) return newSession();
    knobTimer = window.setTimeout(() => sendPower(v), running ? 150 : 0);
    render();
  },
  (v) => (v === 0 ? t().off : formatQuantity(currentPower(v), 'W', { locale, level: 'school' })),
);

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
    const reached = session.advance(steps * DT, (s) => labGoalReached(params, s));
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
  setHeadline();
}

/** No progress for 30 simulated minutes — the outcome will not change, explain it. */
function stalled(): boolean {
  const b = sample();
  if (!b) return false;
  const now = { t: session.state.time, T: b.state.temperature, s: b.state.solidFraction ?? 0, m: bodyMass(b) };
  if (!checkpoint) {
    checkpoint = now;
    return false;
  }
  if (now.t - checkpoint.t < 1800) return false;
  const still = Math.abs(now.T - checkpoint.T) < 0.05 && Math.abs(now.s - checkpoint.s) < 0.001 && Math.abs(now.m - checkpoint.m) < 1e-5;
  checkpoint = now;
  return still;
}

function setHeadline() {
  const result = session.result(labGoalReached(params, session.state));
  const status = labStatus(params, result, simulation, warnings);
  const p = params;
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
  if (!b || session.state.time === 0) return null;
  const u = t();
  const s = b.state.solidFraction ?? 0;
  const T = formatQuantity(b.state.temperature, 'K', { locale, level: 'school' });
  const trend = lastSolid === null ? 0 : s - lastSolid;
  lastSolid = s;
  if (s > 0 && s < 1) {
    const freezing = trend > 0 || (trend === 0 && params.action === 'freeze');
    return freezing ? { text: u.phaseFreezing(T, Math.round(s * 100)), pct: s * 100 } : { text: u.phaseMelting(T, Math.round((1 - s) * 100)), pct: (1 - s) * 100 };
  }
  const boiled = b.state.boiledOff ?? 0;
  if (boiled > 0) {
    const share = boiled / b.params.mass;
    return { text: u.phaseBoiling(T, formatQuantity(boiled, 'kg', { locale, level: 'school' })), pct: share * 100 };
  }
  return null;
}

// ---------- rendering ----------
const chart = createChart();

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

  $('#setup-line').textContent = labSubject(params, locale);
  const sub = substance();
  const b = sample();
  const C = (k: number | undefined) => (k === undefined ? '—' : formatQuantity(k, 'K', { locale, level: 'school' }));
  const stateText = (() => {
    if (!b) return '—';
    const parts: string[] = [];
    const s = b.state.solidFraction ?? 0;
    parts.push(s >= 1 ? tr(sub.solidName ?? { uk: 'тверде', en: 'solid' }, locale).toLowerCase() : s > 0 ? u.solidShare(Math.round(s * 100)) : u.liquid);
    for (const e of Object.values(session.state.entities)) {
      if (isThermalBody(e) && e.id.startsWith(`${SAMPLE_ID}+`) && e.label) parts.push(u.addedState(tr(e.label, locale), Math.round((e.state.solidFraction ?? 0) * 100)));
    }
    const lost = (b.state.boiledOff ?? 0) + (b.state.evaporated ?? 0);
    if (lost > 1e-4) parts.push(u.boiledOff(formatQuantity(lost, 'kg', { locale, level: 'school' })));
    return parts.join(', ');
  })();
  $('#r-time').innerHTML = `<span>${u.time}</span><strong>${formatDuration(Math.floor(session.state.time), locale)}</strong>`;
  $('#r-water').innerHTML = `<span>${tr(sub.name, locale)}</span><strong>${C(b?.state.temperature)}</strong><small>${stateText}</small>`;
  $('#r-pot').innerHTML = `<span>${u.potTemp}</span><strong>${C(temperature(LAB_VESSEL_ID))}</strong>`;
  if (params.heater) {
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
  startBtn.textContent = running ? u.pause : u.start;
  startBtn.disabled = finished;
  $<HTMLButtonElement>('#reset').textContent = u.reset;
  $('#lbl-speed').textContent = u.speed;

  // Knob, switch or nothing (cooling has no knob: the cooler holds its setpoint).
  const h = heaterItem();
  $('#knob-wrap').hidden = !h || h.spec.control !== 'knob';
  $('#switch-wrap').hidden = !h || h.spec.control !== 'switch';
  const on = (params.heater?.knob ?? 0) > 0;
  $<HTMLButtonElement>('#switch').textContent = on ? `⏻ ${u.on}` : `⏻ ${u.off}`;
  $('#switch').classList.toggle('is-on', on);
  if (h && params.heater) {
    knob.setDisabled(finished);
    knob.value = params.heater.knob;
    knob.setLabels({ min: u.min, max: u.max, off: u.off }, h.spec.minFraction > 0 ? ['0', u.min, '', '', u.max] : ['0', '1', '2', '3', '4', '5', '6']);
    knob.element.setAttribute('aria-label', u.power);
  }

  // Messages: impossibility before the start, headline after, warnings.
  const msg: string[] = [];
  if (headline) msg.push(renderHtml(headline()));
  else {
    // A flat line on the chart is not "nothing happens": say what is going on and how far it got.
    const phase = phaseNote();
    if (phase) msg.push(`<div class="phase"><p>${phase.text}</p><div class="progress"><span style="--p:${phase.pct}%"></span></div></div>`);
    for (const w of warnings) msg.push(`<p>⚠ ${tr(w, locale)}</p>`);
    const impossible = labImpossibility(params, locale);
    if (impossible) msg.push(`<p>⚠ ${tr(impossible, locale)}</p>`);
    for (const c of labCautions(params)) msg.push(`<p>⚠ ${tr(c, locale)}</p>`);
  }
  $('#messages').innerHTML = msg.join('');

  // Energy.
  const split = energySplit(initialState, session.state);
  const E = (j: number) => formatQuantity(j, 'J', { locale, level: 'school' });
  if (split.produced > 0) {
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
  const heating = params.action === 'heat-to' || params.action === 'boil';
  const cooling = params.action === 'cool-to' || params.action === 'freeze';
  if (sub.freezing && (!heating || params.startTemp <= sub.freezing.point.value)) markers.push({ v: sub.freezing.point.value, label: `${u.meltLine} ${sub.freezing.point.value} °C` });
  if (sub.boiling && !cooling && params.action !== 'melt') markers.push({ v: sub.boiling.point.value, label: `${u.boilLine} ${sub.boiling.point.value} °C` });
  if (!sub.boiling && sub.decomposes && params.action === 'boil') markers.push({ v: sub.decomposes.value, label: `${locale === 'uk' ? 'димлення' : 'smoke'} ${sub.decomposes.value} °C` });
  if (params.target !== undefined && (params.action === 'heat-to' || params.action === 'cool-to')) markers.push({ v: params.target, label: `${u.targetLine} ${params.target} °C` });
  $('#legend').innerHTML = [['water', tr(sub.name, locale)], ['pot', u.potTemp], ...(h?.spec.method === 'contact' ? [['source', tr(h.name, locale)]] : [])]
    .map(([c, n]) => `<span class="key ${c}">${n}</span>`)
    .join('');
  chart.render(
    [
      { name: tr(sub.name, locale), className: 'water', points: points.sample },
      { name: u.potTemp, className: 'pot', points: points.vessel },
      { name: h ? tr(h.name, locale) : '', className: 'source', points: points.source },
    ],
    u.chartTime,
    markers,
  );
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
  const number = (label: string, value: number, min: number, max: number, step: number, apply: (v: number) => void) => {
    const i = el('input', { type: 'number', value: String(value), min: String(min), max: String(max), step: String(step), inputMode: 'decimal' });
    i.onchange = () => {
      const v = Number(i.value);
      if (Number.isFinite(v) && v >= min && v <= max) {
        apply(v);
        rebuild();
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
    const b = el('button', { type: 'button', className: `chip${a === params.action ? ' selected' : ''}` }, u.actions[a]);
    b.setAttribute('aria-pressed', String(a === params.action));
    b.onclick = () => setAction(a);
    actionBox.append(b);
  }
  const actionContent: HTMLElement[] = [actionBox];
  if (params.action === 'heat-to' || params.action === 'cool-to') {
    actionContent.push(number(u.target, params.target ?? (params.action === 'heat-to' ? 60 : 5), -30, 300, 1, (x) => (params = { ...params, target: x })));
  }
  if (!query) section('action', u.action, u.actions[params.action], ...actionContent);

  // 2. Substance.
  const sub = substance();
  const small = params.size < 0.1;
  section(
    'substance',
    u.substance,
    tr(sub.name, locale),
    ...groupList(
      SUBSTANCE_CATEGORIES.map((c) => ({
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
                params = { ...params, substance: x.id as SubstanceId, startTemp: defaultStart(params.action, x) };
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
  if (uses === 'heater' || uses === 'either') {
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
              rebuild();
            },
            detail: () => [
              ...describe(x),
              el('span', { className: 'muted small' }, u.model),
              chips(x.spec.ratings.map((r) => [String(r), formatQuantity(r, 'W', { locale, level: 'school' })] as const), String(params.heater?.rating), (r) => {
                params = { ...params, heater: { ...params.heater!, rating: Number(r) } };
                lastHeater = params.heater!;
                rebuild();
              }),
            ],
          });
        }),
    }));
    if (uses === 'either') groups.unshift({ label: locale === 'uk' ? 'Без нагрівача' : 'No heater', items: [roomItem(!params.heater, () => {
      const { heater: _h, ...rest } = params;
      void _h;
      params = rest;
      rebuild();
    })] });
    section('device', uses === 'either' ? u.meltWith : u.device, params.heater ? tr(HEATERS[params.heater.id].name, locale) : u.justRoom, ...groupList(groups));
  } else {
    const groups = [
      { label: locale === 'uk' ? 'Без охолоджувача' : 'No cooler', items: [roomItem(!params.cooler, () => {
        const { cooler: _c, ...rest } = params;
        void _c;
        params = rest;
        rebuild();
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
                rebuild();
              },
              detail: () => [
                ...describe(x),
                ...(x.spec.setpoint.max > x.spec.setpoint.min
                  ? [number(`${u.setpoint} (${x.spec.setpoint.min}…${x.spec.setpoint.max})`, params.cooler?.setpoint ?? x.spec.setpoint.default, x.spec.setpoint.min, x.spec.setpoint.max, 1, (sp) => {
                      params = { ...params, cooler: { ...params.cooler!, setpoint: sp } };
                      lastCooler = params.cooler!;
                    })]
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

/** Sensible starting temperature for an action: frozen below the melting point for "melt". */
function defaultStart(action: LabAction, sub: SubstanceItem): number {
  if (action === 'melt' && sub.freezing) return Math.round(sub.freezing.point.value - 10);
  return 20;
}

function setAction(a: LabAction) {
  const uses = actionUses(a);
  // Freezing and cooling take hours of model time: start faster so the result comes in a minute or two.
  speed = a === 'heat-to' || a === 'boil' ? 60 : 600;
  $<HTMLSelectElement>('#speed').value = String(speed);
  let next: LabParams = { ...params, action: a, startTemp: defaultStart(a, substance()) };
  if (a === 'heat-to') next = { ...next, target: 60 };
  else if (a === 'cool-to') next = { ...next, target: 5, startTemp: 60 };
  else {
    const { target: _t, ...rest } = next;
    void _t;
    next = rest;
  }
  if (uses === 'heater') {
    const { cooler: _c, ...rest } = next;
    void _c;
    next = { ...rest, heater: lastHeater };
  } else if (uses === 'cooler') {
    const { heater: _h, ...rest } = next;
    void _h;
    next = { ...rest, cooler: lastCooler };
  } else {
    const { cooler: _c, heater: _h, ...rest } = next;
    void _c;
    void _h;
    next = rest;
  }
  params = next;
  buildShelf();
  newSession();
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
  const result = session.result(labGoalReached(params, session.state));
  if (result.final.time === 0) return;
  running = false;
  if (!headline) setHeadline();
  const title = locale === 'uk' ? 'Що відбулося і чому' : 'What happened and why';
  const notes: Block[] = (substance().modelNotes ?? []).map((n) => ({ kind: 'note', tone: 'info', text: tr(n, locale) }));
  $('#report').innerHTML = renderHtml(
    buildReport({ title, level, locale, country: 'UA', result, simulation, domain: THERMAL_KNOWLEDGE, focusTime: result.final.time / 2, summary: [...headline!(), ...notes] }),
  );
  render();
  $('#report').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---------- wiring ----------
$('#knob-wrap').append(knob.element);
$('#chart').append(chart.element);
$('#start').onclick = () => {
  if (finished) return;
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
  if (session.state.time === 0) return newSession();
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
