import { createCommandRegistry, createExperimentSession, createSimulation, entityId, seconds, type ExperimentSession } from '../src/core/index.js';
import { celsius, toCelsius, kelvin } from '../src/core/units.js';
import {
  createThermalSolver,
  deviceWorksWith,
  energySplit,
  HEATING_DEVICES,
  isBurner,
  isHeater,
  isThermalBody,
  MATERIALS,
  powerAt,
  THERMAL_COMMANDS,
  THERMAL_KNOWLEDGE,
  type DeviceId,
  type ThermalCommand,
} from '../src/domains/thermal/index.js';
import { buildReport, entityLabel, formatQuantity, renderHtml, type ExplainContext } from '../src/explain/index.js';
import { isLocale, LOCALES, tr, type Locale } from '../src/knowledge/i18n.js';
import { LEVEL_INFO, LEVELS, type Level } from '../src/knowledge/levels.js';
import { heatingLab, SOURCE_ID, type HeatingParams, type PotMetal } from '../src/scenarios/index.js';
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

let params: HeatingParams = { device: 'electric-hotplate', rating: 2000, knob: 0.7, liters: 2, startTemp: 20, roomTemp: 20, potMaterial: 'steel', potMass: 1 };
let session: ExperimentSession<ThermalCommand>;
let initialState: ReturnType<typeof heatingLab>;
let running = false;
let finished: 'boiled' | null = null;
let speed = 60;
let acc = 0;
let lastFrame = 0;
let points: { water: { t: number; v: number }[]; pot: { t: number; v: number }[]; source: { t: number; v: number }[] } = { water: [], pot: [], source: [] };
let lastPointAt = -Infinity;
let stallSince: { t: number; temp: number } | null = null;
let neverBoils = false;

const device = () => HEATING_DEVICES[params.device];
const compatible = () => deviceWorksWith(device(), params.potMaterial);
const currentPower = (knob: number) => (compatible() ? powerAt(device(), params.rating, knob) : 0);
const ctx = (): ExplainContext => ({ level, locale });
const t = () => UI[locale];

function temperature(id: string): number | undefined {
  const e = session.state.entities[entityId(id)];
  return e && (isThermalBody(e) || isHeater(e)) ? e.state.temperature : undefined;
}

function newSession() {
  initialState = heatingLab(params);
  session = createExperimentSession<ThermalCommand>({ initial: initialState, simulation, commands, sampleEvery: seconds(10) });
  running = false;
  finished = null;
  neverBoils = false;
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
  const w = temperature('water');
  const p = temperature('pot');
  const s = temperature(SOURCE_ID);
  if (w !== undefined) points.water.push({ t: m, v: toCelsius(kelvin(w)) });
  if (p !== undefined) points.pot.push({ t: m, v: toCelsius(kelvin(p)) });
  if (s !== undefined && device().kind !== 'immersion') points.source.push({ t: m, v: toCelsius(kelvin(s)) });
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

function sendPower(v: number) {
  const power = currentPower(v);
  session.apply({ type: 'thermal.heater.set', entity: SOURCE_ID, on: power > 0, power: power as never });
  neverBoils = false;
  stallSince = null;
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
      const w = s.entities[entityId('water')];
      return !!w && isThermalBody(w) && w.state.temperature >= BOIL;
    });
    record();
    if (boiled) {
      finished = 'boiled';
      running = false;
    } else detectStall();
    render();
  }
  requestAnimationFrame(frame);
}

/** Warn when the water stopped warming well below boiling for a long (simulated) time. */
function detectStall() {
  const w = temperature('water');
  if (w === undefined) return;
  const time = session.state.time;
  if (!stallSince || w - stallSince.temp > 0.5) stallSince = { t: time, temp: w };
  else if (time - stallSince.t > 1800 && currentPower(params.knob) > 0) neverBoils = true;
}

// ---------- rendering ----------
/** 635 s → "10 хв 35 с" / "10 min 35 s" (compact, for the live readout). */
function clock(s: number): string {
  const total = Math.floor(s);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  const [H, M, S] = locale === 'uk' ? ['год', 'хв', 'с'] : ['h', 'min', 's'];
  return h ? `${h} ${H} ${m} ${M}` : m ? `${m} ${M} ${sec} ${S}` : `${sec} ${S}`;
}
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

  const w = temperature('water');
  const p = temperature('pot');
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
  $('#knob-wrap').hidden = d.control !== 'knob';
  $('#switch-wrap').hidden = d.control !== 'switch';
  $<HTMLButtonElement>('#switch').textContent = params.knob > 0 ? `⏻ ${u.on}` : `⏻ ${u.off}`;
  $('#switch').classList.toggle('is-on', params.knob > 0);
  knob.setDisabled(finished !== null);
  knob.value = params.knob;
  const ticks = d.minFraction > 0 ? ['0', u.min, '', '', u.max] : ['0', '1', '2', '3', '4', '5', '6'];
  knob.setLabels({ min: u.min, max: u.max, off: u.off }, ticks);
  knob.element.setAttribute('aria-label', u.power);

  // Messages.
  const msg: string[] = [];
  if (!compatible()) {
    msg.push(
      locale === 'uk'
        ? `⚠ Індукційна плита не гріє каструлю з матеріалу «${u.materials[params.potMaterial]}»: потрібен магнітний метал (чавун, магнітна сталь). Плита просто не «бачить» посуд.`
        : `⚠ An induction hob does not heat a ${u.materials[params.potMaterial]} pot: it needs a magnetic metal (cast iron, magnetic steel). The hob simply does not «see» the pot.`,
    );
  }
  if (finished === 'boiled') msg.push(`✅ ${u.boiled(formatQuantity(session.state.time, 's', { locale, level: 'school' }))} ${u.boilNote}`);
  else if (neverBoils) msg.push(`⚠ ${u.neverBoils}`);
  $('#messages').innerHTML = msg.map((m) => `<p>${m}</p>`).join('');

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
    ...(d.kind === 'immersion' || d.kind === 'flame' || d.kind === 'induction' ? [] : [['source', tr(d.name, locale)]]),
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

  const deviceSel = el('select', { id: 'f-device' });
  for (const d of Object.values(HEATING_DEVICES)) deviceSel.append(el('option', { value: d.id, selected: d.id === params.device }, tr(d.name, locale)));
  deviceSel.onchange = () => {
    const d = HEATING_DEVICES[deviceSel.value as DeviceId];
    params = { ...params, device: d.id, rating: d.defaultRating, knob: d.control === 'switch' ? 0 : params.knob };
    buildSetupForm();
    newSession();
  };

  const d = device();
  const ratingSel = el('select', { id: 'f-rating' });
  for (const r of d.ratings) ratingSel.append(el('option', { value: String(r), selected: r === params.rating }, formatQuantity(r, 'W', { locale, level: 'school' })));
  ratingSel.onchange = () => {
    params = { ...params, rating: Number(ratingSel.value) };
    newSession();
  };
  const estimate = d.ratingData.verification === 'estimate' ? el('span', { className: 'badge', title: d.ratingData.note ?? '' }, u.estimateBadge) : '';

  const potSel = el('select', { id: 'f-pot' });
  for (const m of ['steel', 'iron', 'aluminium'] as PotMetal[]) potSel.append(el('option', { value: m, selected: m === params.potMaterial }, u.materials[m] ?? tr(MATERIALS[m].name, locale)));
  potSel.onchange = () => {
    params = { ...params, potMaterial: potSel.value as PotMetal };
    newSession();
  };

  const number = (id: string, value: number, min: number, max: number, step: number, apply: (v: number) => void) => {
    const i = el('input', { id, type: 'number', value: String(value), min: String(min), max: String(max), step: String(step), inputMode: 'decimal' });
    i.onchange = () => {
      const v = Number(i.value);
      if (Number.isFinite(v) && v >= min && v <= max) {
        apply(v);
        newSession();
      } else i.value = String(value);
    };
    return i;
  };

  form.append(
    field(u.device, deviceSel),
    field(u.model, el('span', { className: 'inline' }, ratingSel, estimate)),
    field(u.pot, potSel),
    field(u.potMass, number('f-pot-mass', params.potMass, 0.1, 10, 0.1, (v) => (params = { ...params, potMass: v }))),
    field(u.water, number('f-liters', params.liters, 0.1, 50, 0.1, (v) => (params = { ...params, liters: v }))),
    field(u.startTemp, number('f-start', params.startTemp, 0, 99, 1, (v) => (params = { ...params, startTemp: v }))),
    field(u.room, number('f-room', params.roomTemp, -20, 45, 1, (v) => (params = { ...params, roomTemp: v }))),
  );
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
    if ($('#report').innerHTML) explain();
  };
}

function explain() {
  const result = session.result(finished === 'boiled');
  if (result.final.time === 0) return;
  const title = locale === 'uk' ? 'Що відбулося і чому' : 'What happened and why';
  $('#report').innerHTML = renderHtml(
    buildReport({ title, level, locale, country: 'UA', result, simulation, domain: THERMAL_KNOWLEDGE, focusTime: result.final.time / 2 }),
  );
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
