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
import { buildReport, entityLabel, formatDuration, formatQuantity, renderHtml, type Block, type ExplainContext } from '../src/explain/index.js';
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
  headline = () => labSummary(p, result, status, ctx());
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

  const sub = substance();
  const b = sample();
  const C = (k: number | undefined) => (k === undefined ? '—' : formatQuantity(k, 'K', { locale, level: 'school' }));
  const stateText = (() => {
    if (!b) return '—';
    const parts: string[] = [];
    const s = b.state.solidFraction ?? 0;
    parts.push(s >= 1 ? tr(sub.solidName ?? { uk: 'тверде', en: 'solid' }, locale).toLowerCase() : s > 0 ? u.solidShare(Math.round(s * 100)) : u.liquid);
    if ((b.state.boiledOff ?? 0) > 0) parts.push(u.boiledOff(formatQuantity(b.state.boiledOff!, 'kg', { locale, level: 'school' })));
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
        const what = s.role === 'room' ? u.shareRoom : s.role === 'source' ? u.shareSource(label(s.entity)) : u.shareBody(label(s.entity));
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

// ---------- setup form ----------
function buildSetupForm() {
  const u = t();
  const form = $('#setup');
  form.innerHTML = '';
  const field = (label: string, input: HTMLElement) => el('label', { className: 'field' }, el('span', {}, label), input);
  const rebuild = () => {
    buildSetupForm();
    newSession();
  };
  const select = (id: string, options: readonly (readonly [string, string])[], selected: string, onChange: (v: string) => void, groups?: readonly { label: string; options: readonly (readonly [string, string])[] }[]) => {
    const sel = el('select', { id });
    if (groups) {
      for (const g of groups) {
        if (!g.options.length) continue;
        const og = el('optgroup', { label: g.label });
        for (const [value, label] of g.options) og.append(el('option', { value, selected: value === selected }, label));
        sel.append(og);
      }
    }
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
  const byCategory = (root: string) =>
    childrenOf(root).map((c) => ({ label: tr(c.name, locale), options: itemsUnder(c.id).map((i) => [i.id, tr(i.name, locale)] as const) }));
  const volume = (l: number) => (l < 1 ? `${Math.round(l * 1000)} ${u.ml}` : `${l} ${u.liters}`);
  const sub = substance();
  const v = vesselItem();

  // 1. What we do.
  const actionSel = select('f-action', LAB_ACTIONS.map((a) => [a, u.actions[a]] as const), params.action, (a) => setAction(a as LabAction));
  form.append(field(u.action, actionSel));
  if (params.action === 'heat-to' || params.action === 'cool-to') {
    form.append(field(u.target, number('f-target', params.target ?? (params.action === 'heat-to' ? 60 : 5), -30, 300, 1, (x) => (params = { ...params, target: x }))));
  }

  // 2. Substance.
  const subSel = select('f-substance', [], params.substance, (id) => {
    params = { ...params, substance: id as SubstanceId, startTemp: defaultStart(params.action, SUBSTANCES[id as SubstanceId]) };
    rebuild();
  }, SUBSTANCE_CATEGORIES.map((c) => ({ label: tr(c.name, locale), options: Object.values(SUBSTANCES).filter((s) => s.category === c.id).map((s) => [s.id, tr(s.name, locale)] as const) })));
  form.append(field(u.substance, subSel));
  const small = params.size < 0.1;
  form.append(
    field(`${u.amount} (≤ ${volume(params.size)})`, number('f-liters', params.liters, small ? 0.001 : 0.01, params.size, small ? 0.001 : 0.01, (x) => (params = { ...params, liters: x }))),
    field(u.startTemp, number('f-start', params.startTemp, -30, 300, 1, (x) => (params = { ...params, startTemp: x }))),
  );

  // 3. Vessel.
  form.append(
    field(
      u.vessel,
      select('f-vessel', [], params.vessel, (id) => {
        const next = VESSELS[id as VesselId];
        const size = next.spec.defaultSize;
        params = { ...params, vessel: next.id as VesselId, size, material: next.spec.defaultMaterial, lid: false, liters: round(size * 0.7, size < 0.1 ? 3 : 2) };
        delete (params as { vesselMass?: number }).vesselMass;
        rebuild();
      }, byCategory('vessel')),
    ),
    field(u.size, select('f-size', v.spec.sizes.map((x) => [String(x), volume(x)] as const), String(params.size), (x) => {
      const size = Number(x);
      params = { ...params, size, liters: params.liters <= size ? params.liters : round(size * 0.7, size < 0.1 ? 3 : 2) };
      delete (params as { vesselMass?: number }).vesselMass;
      rebuild();
    })),
  );
  if (v.spec.materials.length > 1) {
    form.append(field(u.material, select('f-pot', v.spec.materials.map((m) => [m, u.materials[m] ?? m] as const), params.material, (m) => {
      params = { ...params, material: m };
      rebuild();
    })));
  }
  form.append(field(u.vesselMass, number('f-pot-mass', params.vesselMass ?? typicalVesselMass(v, params.size), 0.01, 20, 0.01, (x) => (params = { ...params, vesselMass: x }))));
  if (v.spec.lid === 'optional') {
    const lid = el('input', { id: 'f-lid', type: 'checkbox', checked: params.lid });
    lid.onchange = () => {
      params = { ...params, lid: lid.checked };
      rebuild();
    };
    form.append(el('label', { className: 'check' }, lid, el('span', {}, u.lid)));
  }

  // 4. Heater or cooler, depending on the action.
  const uses = actionUses(params.action);
  const NONE = 'none';
  if (uses === 'heater' || uses === 'either') {
    const heaterGroups = byCategory('device.heater');
    const sel = select('f-device', uses === 'either' ? [[NONE, u.justRoom]] : [], params.heater?.id ?? NONE, (id) => {
      if (id === NONE) {
        const { heater: _h, ...rest } = params;
        void _h;
        params = rest;
      } else {
        const hi = HEATERS[id as HeaterId];
        params = { ...params, heater: { id: hi.id as HeaterId, rating: hi.spec.defaultRating, knob: hi.spec.control === 'switch' ? 0 : lastHeater.knob || 0.7 } };
        lastHeater = params.heater!;
      }
      rebuild();
    }, heaterGroups);
    form.append(field(uses === 'either' ? u.meltWith : u.device, sel));
    const h = heaterItem();
    if (h && params.heater) {
      const est = h.spec.ratingData.verification === 'estimate' ? el('span', { className: 'badge', title: h.spec.ratingData.note ?? '' }, u.estimateBadge) : '';
      form.append(field(u.model, el('span', { className: 'inline' }, select('f-rating', h.spec.ratings.map((r) => [String(r), formatQuantity(r, 'W', { locale, level: 'school' })] as const), String(params.heater.rating), (r) => {
        params = { ...params, heater: { ...params.heater!, rating: Number(r) } };
        lastHeater = params.heater!;
        rebuild();
      }), est)));
    }
  } else {
    const sel = select('f-cooler', [[NONE, u.justRoom]], params.cooler?.id ?? NONE, (id) => {
      if (id === NONE) {
        const { cooler: _c, ...rest } = params;
        void _c;
        params = rest;
      } else {
        const c = COOLERS[id as CoolerId];
        params = { ...params, cooler: { id: c.id as CoolerId, setpoint: c.spec.setpoint.default } };
        lastCooler = params.cooler!;
      }
      rebuild();
    }, byCategory('device.cooler'));
    form.append(field(u.coolWhere, sel));
    if (params.cooler) {
      const sp = COOLERS[params.cooler.id].spec.setpoint;
      if (sp.max > sp.min) {
        form.append(field(`${u.setpoint} (${sp.min}…${sp.max})`, number('f-setpoint', params.cooler.setpoint, sp.min, sp.max, 1, (x) => {
          params = { ...params, cooler: { ...params.cooler!, setpoint: x } };
          lastCooler = params.cooler!;
        })));
      }
    }
  }
  form.append(field(u.room, number('f-room', params.roomTemp, -20, 45, 1, (x) => (params = { ...params, roomTemp: x }))));

  // 5. "What it is".
  const items: (EquipmentItem | SubstanceItem)[] = [sub, v];
  if (params.heater) items.push(HEATERS[params.heater.id]);
  if (params.cooler) items.push(COOLERS[params.cooler.id]);
  form.append(about(items));
}

/** Sensible starting temperature for an action: frozen below the melting point for "melt". */
function defaultStart(action: LabAction, sub: SubstanceItem): number {
  if (action === 'melt' && sub.freezing) return Math.round(sub.freezing.point.value - 10);
  return 20;
}

function setAction(a: LabAction) {
  const uses = actionUses(a);
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
  buildSetupForm();
  newSession();
}

function about(items: readonly (EquipmentItem | SubstanceItem)[]): HTMLElement {
  const u = t();
  const box = el('details', { className: 'about', open: true }, el('summary', {}, u.about));
  for (const i of items) {
    box.append(el('h4', {}, tr(i.name, locale)), el('p', {}, tr(textFor(i.description, level), locale)));
    if (i.safety) box.append(el('p', { className: 'safety' }, `⚠ ${u.safety}: ${tr(textFor(i.safety, level), locale)}`));
    if ('modelNotes' in i && i.modelNotes) for (const n of i.modelNotes) box.append(el('p', { className: 'muted small' }, `ℹ ${tr(n, locale)}`));
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

buildHeader();
buildSetupForm();
newSession();
requestAnimationFrame(frame);
