import { createCommandRegistry, createExperimentSession, createSimulation, entityId, seconds, type ExperimentSession } from '../src/core/index.js';
import { celsius, toCelsius, kelvin } from '../src/core/units.js';
import { createThermalSolver, energySplit, isBurner, isHeater, isThermalBody, THERMAL_COMMANDS, THERMAL_KNOWLEDGE, type ThermalCommand } from '../src/domains/thermal/index.js';
import {
  canHeat,
  childrenOf,
  HEATERS,
  itemsUnder,
  powerAt,
  typicalVesselMass,
  VESSELS,
  type EquipmentItem,
  type HeaterId,
  type VesselId,
} from '../src/equipment/index.js';
import { buildReport, entityLabel, formatDuration, formatQuantity, renderHtml, type Block, type ExplainContext } from '../src/explain/index.js';
import { isLocale, LOCALES, tr, type Locale } from '../src/knowledge/i18n.js';
import { LEVEL_INFO, LEVELS, textFor, type Level } from '../src/knowledge/levels.js';
import { heatingSetup, heatingStatus, heatingSummary, SOURCE_ID, VESSEL_ID, WATER_ID, type HeatingParams } from '../src/scenarios/index.js';
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

const browserLocale = (): Locale => (navigator.language.toLowerCase().startsWith('uk') ? 'uk' : navigator.language.toLowerCase().startsWith('en') ? 'en' : 'uk');
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

// ---------- experiment state ----------
const DT = seconds(0.5);
const simulation = createSimulation({ solvers: [createThermalSolver()], fixedDt: DT });
const commands = createCommandRegistry<ThermalCommand>(THERMAL_COMMANDS);
const BOIL = celsius(100);

let params: HeatingParams = { heater: 'electric-hotplate', rating: 2000, knob: 0.7, vessel: 'pot', size: 3, material: 'steel', lid: false, liters: 2, startTemp: 20, roomTemp: 20 };
let warnings: readonly { uk: string; en: string }[] = [];
let session: ExperimentSession<ThermalCommand>;
let initialState: ReturnType<typeof heatingSetup>['state'];
let running = false;
let finished: 'boiled' | null = null;
let speed = 60;
let acc = 0;
let lastFrame = 0;
let points: { water: { t: number; v: number }[]; pot: { t: number; v: number }[]; source: { t: number; v: number }[] } = { water: [], pot: [], source: [] };
let lastPointAt = -Infinity;
let stallSince: { t: number; temp: number } | null = null;
let neverBoils = false;
/** Headline of the finished (or stalled) experiment; computed once, re-rendered on language change. */
let headline: (() => Block[]) | null = null;

const device = () => HEATERS[params.heater];
const vesselItem = () => VESSELS[params.vessel];
const compatible = () => canHeat(device(), vesselItem(), params.material).ok;
const currentPower = (knob: number) => (compatible() ? powerAt(device(), params.rating, knob) : 0);
const ctx = (): ExplainContext => ({ level, locale });
const t = () => UI[locale];

function temperature(id: string): number | undefined {
  const e = session.state.entities[entityId(id)];
  return e && (isThermalBody(e) || isHeater(e)) ? e.state.temperature : undefined;
}

function newSession() {
  const setup = heatingSetup(params);
  initialState = setup.state;
  warnings = setup.warnings;
  session = createExperimentSession<ThermalCommand>({ initial: initialState, simulation, commands, sampleEvery: seconds(10) });
  running = false;
  finished = null;
  neverBoils = false;
  headline = null;
  stallSince = null;
  acc = 0;
  points = { water: [], pot: [], source: [] };
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
  const w = temperature(WATER_ID);
  const p = temperature(VESSEL_ID);
  const s = temperature(SOURCE_ID);
  if (w !== undefined) points.water.push({ t: m, v: toCelsius(kelvin(w)) });
  if (p !== undefined) points.pot.push({ t: m, v: toCelsius(kelvin(p)) });
  if (s !== undefined && device().spec.method === 'contact') points.source.push({ t: m, v: toCelsius(kelvin(s)) });
}

// ---------- knob / switch ----------
let knobTimer: number | undefined;
const knob = createKnob(
  (v) => {
    params = { ...params, knob: v };
    window.clearTimeout(knobTimer);
    // Before the start the knob is part of the setup; afterwards it is an action in the log.
    if (session.state.time === 0) return newSession();
    // Coalesce rapid turns into one command, like a real hand settling on a position.
    knobTimer = window.setTimeout(() => sendPower(v), running ? 150 : 0);
    render();
  },
  (v) => describePower(v),
);

function describePower(v: number): string {
  if (v === 0) return t().off;
  const w = currentPower(v);
  return formatQuantity(w, 'W', { locale, level: 'school' });
}

/** Freeze the experiment outcome now; the text itself follows the current language. */
function setHeadline() {
  const result = session.result(finished === 'boiled');
  const status = heatingStatus(result, simulation, warnings);
  const p = params;
  headline = () => heatingSummary(p, result, status, ctx());
}

function sendPower(v: number) {
  const power = currentPower(v);
  session.apply({ type: 'thermal.heater.set', entity: SOURCE_ID, on: power > 0, power: power as never });
  neverBoils = false;
  headline = null;
  stallSince = null;
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
    const boiled = session.advance(steps * DT, (s) => {
      const w = s.entities[entityId(WATER_ID)];
      return !!w && isThermalBody(w) && w.state.temperature >= BOIL;
    });
    record();
    if (boiled) {
      finished = 'boiled';
      running = false;
      setHeadline();
    } else {
      detectStall();
      if (neverBoils && !headline) {
        running = false;
        setHeadline();
      }
    }
    render();
  }
  requestAnimationFrame(frame);
}

/** Warn when the water stopped warming well below boiling for a long (simulated) time. */
function detectStall() {
  const w = temperature(WATER_ID);
  if (w === undefined) return;
  const time = session.state.time;
  if (!stallSince || w - stallSince.temp > 0.5) stallSince = { t: time, temp: w };
  else if (time - stallSince.t > 1800 && currentPower(params.knob) > 0) neverBoils = true;
}

// ---------- rendering ----------
const clock = (s: number): string => formatDuration(Math.floor(s), locale);

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

  const w = temperature(WATER_ID);
  const p = temperature(VESSEL_ID);
  const C = (k: number | undefined) => (k === undefined ? '—' : formatQuantity(k, 'K', { locale, level: 'school' }));
  $('#r-time').innerHTML = `<span>${u.time}</span><strong>${clock(session.state.time)}</strong>`;
  $('#r-water').innerHTML = `<span>${u.waterTemp}</span><strong>${C(w)}</strong>`;
  $('#r-pot').innerHTML = `<span>${u.potTemp}</span><strong>${C(p)}</strong>`;
  const src = session.state.entities[entityId(SOURCE_ID)];
  const pw = src && (isHeater(src) || isBurner(src)) && src.params.on ? src.params.power : 0;
  $('#r-power').innerHTML = `<span>${u.power}</span><strong>${pw > 0 ? formatQuantity(pw, 'W', { locale, level: 'school' }) : u.off}</strong>`;

  const startBtn = $<HTMLButtonElement>('#start');
  startBtn.textContent = running ? u.pause : u.start;
  startBtn.disabled = finished !== null;
  $<HTMLButtonElement>('#reset').textContent = u.reset;
  $('#lbl-speed').textContent = u.speed;

  // Changing the setup always starts a new experiment (see buildSetupForm); the knob is live during a run.

  // Knob or switch.
  const d = device();
  $('#knob-wrap').hidden = d.spec.control !== 'knob';
  $('#switch-wrap').hidden = d.spec.control !== 'switch';
  $<HTMLButtonElement>('#switch').textContent = params.knob > 0 ? `⏻ ${u.on}` : `⏻ ${u.off}`;
  $('#switch').classList.toggle('is-on', params.knob > 0);
  knob.setDisabled(finished !== null);
  knob.value = params.knob;
  const ticks = d.spec.minFraction > 0 ? ['0', u.min, '', '', u.max] : ['0', '1', '2', '3', '4', '5', '6'];
  knob.setLabels({ min: u.min, max: u.max, off: u.off }, ticks);
  knob.element.setAttribute('aria-label', u.power);

  // Messages.
  const msg: string[] = headline ? [] : warnings.map((w) => `<p>⚠ ${tr(w, locale)}</p>`);
  if (headline) msg.push(renderHtml(headline()));
  if (finished === 'boiled') msg.push(`<p class="muted small">${u.boilNote}</p>`);
  $('#messages').innerHTML = msg.join('');

  // Energy split.
  const split = energySplit(initialState, session.state);
  const E = (j: number) => formatQuantity(j, 'J', { locale, level: 'school' });
  if (split.produced > 0) {
    const label = (id: string) => entityLabel(session.state, id, locale);
    const rows = split.shares
      .filter((s) => Math.abs(s.energy) > 1)
      .map((s) => {
        const pct = (100 * s.energy) / split.produced;
        const what = s.role === 'room' ? u.shareRoom : s.role === 'source' ? u.shareSource(label(s.entity)) : u.shareBody(label(s.entity));
        return `<li><span class="bar" style="--w:${Math.max(0, pct).toFixed(1)}%"></span><b>${pct.toFixed(0)} %</b> ${what} <small>(${E(s.energy)})</small></li>`;
      });
    $('#energy').innerHTML = `<h3>${u.energyTitle}</h3><p>${u.produced(E(split.produced))}</p><ul class="shares">${rows.join('')}</ul>`;
  } else $('#energy').innerHTML = '';

  $('#legend').innerHTML = [
    ['water', u.waterTemp],
    ['pot', u.potTemp],
    ...(d.spec.method === 'contact' ? [['source', tr(d.name, locale)]] : []),
  ]
    .map(([c, n]) => `<span class="key ${c}">${n}</span>`)
    .join('');
  chart.render(
    [
      { name: u.waterTemp, className: 'water', points: points.water },
      { name: u.potTemp, className: 'pot', points: points.pot },
      { name: tr(d.name, locale), className: 'source', points: points.source },
    ],
    u.chartTime,
    { v: 100, label: '100 °C' },
  );
}

function buildSetupForm() {
  const u = t();
  const form = $('#setup');
  form.innerHTML = '';
  const field = (label: string, input: HTMLElement) => el('label', { className: 'field' }, el('span', {}, label), input);

  /** <select> grouped by the sub-categories of `root` (household / laboratory). */
  const grouped = (id: string, root: string, selected: string, onChange: (v: string) => void) => {
    const sel = el('select', { id });
    for (const cat of childrenOf(root)) {
      const items = itemsUnder(cat.id);
      if (!items.length) continue;
      const group = el('optgroup', { label: tr(cat.name, locale) });
      for (const i of items) group.append(el('option', { value: i.id, selected: i.id === selected }, tr(i.name, locale)));
      sel.append(group);
    }
    sel.onchange = () => onChange(sel.value);
    return sel;
  };
  const select = (id: string, options: readonly (readonly [string, string])[], selected: string, onChange: (v: string) => void) => {
    const sel = el('select', { id });
    for (const [value, label] of options) sel.append(el('option', { value, selected: value === selected }, label));
    sel.onchange = () => onChange(sel.value);
    return sel;
  };
  const number = (id: string, value: number, min: number, max: number, step: number, apply: (v: number) => void) => {
    const i = el('input', { id, type: 'number', value: String(value), min: String(min), max: String(max), step: String(step), inputMode: 'decimal' });
    i.onchange = () => {
      const v = Number(i.value);
      if (Number.isFinite(v) && v >= min && v <= max) {
        apply(v);
        rebuild();
      } else i.value = String(value);
    };
    return i;
  };
  const rebuild = () => {
    buildSetupForm();
    newSession();
  };
  const volume = (l: number) => (l < 1 ? `${Math.round(l * 1000)} ${u.ml}` : `${l} ${u.liters}`);

  const h = device();
  const v = vesselItem();
  const heaterSel = grouped('f-device', 'device.heater', params.heater, (id) => {
    const next = HEATERS[id as HeaterId];
    params = { ...params, heater: next.id as HeaterId, rating: next.spec.defaultRating, knob: next.spec.control === 'switch' ? 0 : params.knob || 0.7 };
    rebuild();
  });
  const ratingSel = select('f-rating', h.spec.ratings.map((r) => [String(r), formatQuantity(r, 'W', { locale, level: 'school' })] as const), String(params.rating), (r) => {
    params = { ...params, rating: Number(r) };
    rebuild();
  });
  const estimate = h.spec.ratingData.verification === 'estimate' ? el('span', { className: 'badge', title: h.spec.ratingData.note ?? '' }, u.estimateBadge) : '';

  const vesselSel = grouped('f-vessel', 'vessel', params.vessel, (id) => {
    const next = VESSELS[id as VesselId];
    const size = next.spec.defaultSize;
    params = { ...params, vessel: next.id as VesselId, size, material: next.spec.defaultMaterial, lid: false, liters: round(size * 0.7, size < 0.1 ? 3 : 2) };
    delete (params as { vesselMass?: number }).vesselMass;
    rebuild();
  });
  const sizeSel = select('f-size', v.spec.sizes.map((x) => [String(x), volume(x)] as const), String(params.size), (x) => {
    const size = Number(x);
    params = { ...params, size, liters: params.liters <= size ? params.liters : round(size * 0.7, size < 0.1 ? 3 : 2) };
    delete (params as { vesselMass?: number }).vesselMass;
    rebuild();
  });
  const materialSel = select('f-pot', v.spec.materials.map((m) => [m, u.materials[m] ?? m] as const), params.material, (m) => {
    params = { ...params, material: m };
    rebuild();
  });
  const mass = params.vesselMass ?? typicalVesselMass(v, params.size);
  const lid = el('input', { id: 'f-lid', type: 'checkbox', checked: params.lid });
  lid.onchange = () => {
    params = { ...params, lid: lid.checked };
    rebuild();
  };

  form.append(
    field(u.device, heaterSel),
    field(u.model, el('span', { className: 'inline' }, ratingSel, estimate)),
    field(u.vessel, vesselSel),
    field(u.size, sizeSel),
  );
  if (v.spec.materials.length > 1) form.append(field(u.material, materialSel));
  form.append(field(u.vesselMass, number('f-pot-mass', mass, 0.01, 20, 0.01, (x) => (params = { ...params, vesselMass: x }))));
  if (v.spec.lid === 'optional') form.append(el('label', { className: 'check' }, lid, el('span', {}, u.lid)));
  form.append(
    field(`${u.water} (≤ ${volume(params.size)})`, number('f-liters', params.liters, params.size < 0.1 ? 0.001 : 0.01, params.size, params.size < 0.1 ? 0.001 : 0.01, (x) => (params = { ...params, liters: x }))),
    field(u.startTemp, number('f-start', params.startTemp, 0, 99, 1, (x) => (params = { ...params, startTemp: x }))),
    field(u.room, number('f-room', params.roomTemp, -20, 45, 1, (x) => (params = { ...params, roomTemp: x }))),
  );
  form.append(about([h, v]));
}

const round = (x: number, digits = 2) => Math.round(x * 10 ** digits) / 10 ** digits;

/** "What it is" cards for the chosen equipment, at the chosen level. */
function about(items: readonly EquipmentItem[]): HTMLElement {
  const u = t();
  const box = el('details', { className: 'about', open: true }, el('summary', {}, u.about));
  for (const i of items) {
    box.append(el('h4', {}, tr(i.name, locale)), el('p', {}, tr(textFor(i.description, level), locale)));
    if (i.safety) box.append(el('p', { className: 'safety' }, `⚠ ${u.safety}: ${tr(textFor(i.safety, level), locale)}`));
  }
  return box;
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
    buildSetupForm();
    render();
    if ($('#report').innerHTML) explain();
  };
  const lv = $<HTMLSelectElement>('#level');
  lv.innerHTML = '';
  for (const l of LEVELS) lv.append(el('option', { value: l, selected: l === level, title: tr(LEVEL_INFO[l].audience, locale) }, tr(LEVEL_INFO[l].name, locale)));
  lv.onchange = () => {
    level = lv.value as Level;
    store.set('level', level);
    buildSetupForm();
    if ($('#report').innerHTML) explain();
  };
}

function explain() {
  const result = session.result(finished === 'boiled');
  if (result.final.time === 0) return;
  running = false;
  if (!headline) setHeadline();
  const title = locale === 'uk' ? 'Що відбулося і чому' : 'What happened and why';
  $('#report').innerHTML = renderHtml(
    buildReport({ title, level, locale, country: 'UA', result, simulation, domain: THERMAL_KNOWLEDGE, focusTime: result.final.time / 2, summary: headline!() }),
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
  const v = params.knob > 0 ? 0 : 1;
  params = { ...params, knob: v };
  if (session.state.time === 0) return newSession();
  sendPower(v);
  render();
};
const speedSel = $<HTMLSelectElement>('#speed');
for (const s of [1, 10, 60, 300, 600]) speedSel.append(el('option', { value: String(s), selected: s === speed }, `×${s}`));
speedSel.onchange = () => (speed = Number(speedSel.value));
$('#explain').onclick = explain;

buildHeader();
buildSetupForm();
newSession();
requestAnimationFrame(frame);
