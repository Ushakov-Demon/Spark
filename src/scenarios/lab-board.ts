import type { ExperimentLogEntry } from '../core/experiment.js';
import type { SystemState } from '../core/state.js';
import { tr, type Locale } from '../knowledge/i18n.js';
import { experimentOf } from '../experiments/registry.js';
import { ZERO_CELSIUS_IN_KELVIN } from '../core/units.js';
import { isSupply } from '../domains/electrical/entities.js';
import { bodyEnergy, bodyMass, isBurner, isHeater, isThermalBody, type ThermalBody } from '../domains/thermal/entities.js';
import { mixtureHeatCapacity } from '../domains/thermal/mixture.js';
import { inWaterFamily } from '../domains/thermal/dissolve.js';
import { sig } from '../explain/format.js';
import { COMPONENTS, molarMass, type ComponentId } from '../components/index.js';
import { msg, t as tl } from '../knowledge/messages.js';
import { SUBSTANCES, type SubstanceId } from '../substances/catalog.js';
import { liquidHeat } from '../substances/types.js';
import { formatReading, weigh } from './weighing.js';
import { formatMeasured } from './measuring.js';
import type { MeasurementRecord } from '../core/trace.js';
import type { ScaleId } from '../equipment/scales.js';
import { SAMPLE_ID, sampleOf, type LabParams } from './thermal-lab.js';

/**
 * The blackboard over the lab table: the formulas of what is going on in the
 * current step, with this run's numbers put in. Each phase of the step —
 * warming the ice, melting it, warming the water, boiling — gets its own line,
 * in the order they happened. While a phase goes on only its formula is on the
 * board; its numbers are written when it is over. The
 * physical constants come from the substance models (sourced data).
 */
export interface BoardLine {
  /** Stable while the phase lasts (the page animates a new line once). */
  readonly id: string;
  /** What it is about: "нагрівання води". */
  readonly title: string;
  readonly formula: string;
  /** The formula with the numbers put in, and the result — written once the phase is over (the formula has done its work). */
  readonly numbers?: string;
}

type Phase = 'solid' | 'liquid' | 'mix';
const C = (k: number) => k - ZERO_CELSIUS_IN_KELVIN;
/** Ice and other frozen liquids put in (they melt into the sample); a metal block with melting data is still a block. */
const isFrozenLiquid = (e: ThermalBody) => 'phase' in e.params && !!e.params.phase && !SUBSTANCES[e.params.substance as SubstanceId]?.melt;
const iceMass = (b: ThermalBody) => (b.state.mixture ? b.state.mixture.ice : (b.state.solidFraction ?? 0) * bodyMass(b));
const phaseOf = (b: ThermalBody): Phase => {
  const m = b.state.mixture;
  const s = m ? (m.water > 0 ? m.ice / m.water : 0) : (b.state.solidFraction ?? 0);
  return s >= 1 - 1e-9 ? 'solid' : s <= 1e-9 ? 'liquid' : 'mix';
};
const boiled = (b: ThermalBody) => b.state.boiledOff ?? 0;

/** The board for a step: `states` are the step's states in time order (the recorded samples and now); `weighed` — the scales used in it, latest last. */
export function boardLines(p: LabParams, states: readonly SystemState[], locale: Locale, weighed: readonly ScaleId[] = [], finished = false, log: readonly ExperimentLogEntry<{ type: string }>[] = []): BoardLine[] {
  const sub = SUBSTANCES[p.substance];
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  // Δt to a tenth of a degree (as a thermometer reads): rounded to whole degrees the product would not match (864 · 0,1 · 30 ≠ 2 620).
  const dt = (x: number) => sig(Math.round(Math.abs(x) * 10) / 10, 6, locale);
  const kJ = (j: number) => (Math.abs(j) >= 1e4 ? `${n(j / 1000)} ${tl(locale, 'unit-sym-kJ')}` : `${n(j)} ${tl(locale, 'unit-sym-J')}`);
  const out: BoardLine[] = [];
  if (!states.length) return out;
  const name = tr(sub.genitive ?? sub.name, locale).toLowerCase();
  // The solid state: ice for water and the like; a metal or salt is a solid under its own name.
  const iceName = sub.melt ? name : tl(locale, 'lab-board-lines-ice-name');

  // Split the step into phases: runs of states where the sample is all solid, all liquid or both.
  const bodies = states.map(sampleOf);
  // A step in which liquid was poured into the sample (its mass grew) is mixing, not heat flow: left out of Δt.
  // (Evaporation only takes mass away; a block put in is a body of its own.)
  const jumpless = (j: number) => (bodyMass(bodies[j]!) > bodyMass(bodies[j - 1]!) + 1e-7 ? 0 : C(bodies[j]!.state.temperature) - C(bodies[j - 1]!.state.temperature));
  let start = 0;
  let k = 0;
  for (let i = 1; i <= bodies.length; i++) {
    const same = i < bodies.length && phaseOf(bodies[i]!) === phaseOf(bodies[start]!);
    if (same) continue;
    const a = bodies[Math.max(0, start - 1)]!; // the phase began right after the state before it
    const b = bodies[i - 1]!;
    const ph = phaseOf(bodies[start]!);
    const id = `${k++}:${ph}`;
    // The phase still going on: the formula now, the numbers when it is over.
    const over = i < bodies.length || finished;
    if (ph === 'mix') {
      const dm = iceMass(b) - iceMass(a);
      // Ice is frozen water, also when it forms in salt water.
      const lambda = b.state.mixture ? COMPONENTS.water.melting?.latentHeat?.value : sub.freezing?.latentHeat.value;
      if (lambda && Math.abs(dm) > 1e-6) {
        const m = Math.abs(dm);
        out.push({
          id,
          title: tl(locale, dm > 0 ? 'lab-board-freezing' : 'lab-board-melting', { grams: over ? n(m * 1000) : 'none', melt: sub.melt ? 'yes' : 'no' }),
          formula: 'Q = λ·m',
          ...(over ? { numbers: `${n(lambda)} · ${n(m)} ≈ ${kJ(lambda * m)}` } : {}),
        });
      }
    } else {
      // A solution warms as all its components together: its own specific heat (water and what is dissolved in it).
      const mixC = b.state.mixture && b.state.mixture.solutes.length && bodyMass(b) > 0 ? mixtureHeatCapacity(b.state.mixture) / bodyMass(b) : undefined;
      const c = ph === 'solid' ? (b.state.mixture ? COMPONENTS.water.phases.solid?.specificHeat?.value : sub.freezing?.solidSpecificHeat.value) : (mixC ?? liquidHeat(sub).value);
      // Heat flow only: a jump at the moment something was poured in (mixing) is not warming.
      let dT = 0;
      for (let j = Math.max(1, start); j < i; j++) dT += jumpless(j);
      const m = bodyMass(b);
      if (c && Math.abs(dT) >= 0.05) {
        // A solution by its own name ("розчину мідного купоросу"), not the water it was made from.
        const what = ph === 'solid' ? iceName : b.state.mixture?.solutes.length && b.label ? tl(locale, 'lab-board-lines-what', { of: b.label.uk.startsWith('Розчин ') ? b.label.uk.slice(6) : '' }) : name;
        out.push({
          id,
          title: dT > 0 ? (tl(locale, 'lab-board-lines-title', { what })) : tl(locale, 'lab-board-lines-title-2', { what }),
          formula: 'Q = c·m·Δt',
          ...(over ? { numbers: `${n(c)} · ${n(m)} · ${dt(dT)} ≈ ${kJ(c * m * Math.abs(dT))}` } : {}),
        });
      }
    }
    start = i;
  }

  // Hot water poured into cold: it mixes at once — the temperature of the mixture (same liquid: c cancels).
  // Written first: the pouring came before the heat flow that follows it.
  const mixes: BoardLine[] = [];
  log.forEach((e, i) => {
    if (!e.ok) return;
    for (const r of e.trace) {
      if (r.kind !== 'formula' || r.formula !== 'thermal.equilibrium-temperature') continue;
      const parts = r.args[0] as readonly { mass: number; temperature: number }[];
      if (parts.length !== 2) continue;
      const [a, b] = parts as [{ mass: number; temperature: number }, { mass: number; temperature: number }];
      mixes.push({
        id: `mix:${i}`,
        title: tl(locale, 'lab-board-lines-title-3'),
        formula: 'θ = (m₁t₁ + m₂t₂) / (m₁ + m₂)',
        numbers: `(${n(a.mass)}·${n(C(a.temperature))} + ${n(b.mass)}·${n(C(b.temperature))}) / (${n(a.mass)} + ${n(b.mass)}) ≈ ${n(C(r.output))} °C`,
      });
    }
  });

  out.unshift(...mixes);

  // Pieces put into the liquid (a metal block): each gives or takes Q = c·m·Δt; at the end — the heat balance.
  const lastState = states[states.length - 1]!;
  const sampleBody = sampleOf(lastState);
  const pieces = Object.values(lastState.entities).filter((e): e is ThermalBody => isThermalBody(e) && e.id.startsWith(`${SAMPLE_ID}+`) && !isFrozenLiquid(e));
  let given = 0;
  let taken = 0;
  for (const piece of pieces) {
    const from = states.find((s) => s.entities[piece.id]);
    const p0 = from?.entities[piece.id];
    if (!p0 || !isThermalBody(p0)) continue;
    const dT = C(piece.state.temperature) - C(p0.state.temperature);
    // A solid piece (a metal block) by its solid heat capacity — its params hold the melt's.
    const c = (piece.state.solidFraction ?? 0) >= 1 && piece.params.phase?.specificHeatSolid ? piece.params.phase.specificHeatSolid : piece.params.specificHeat;
    const m = bodyMass(piece);
    const name = piece.params.substance && piece.params.substance in SUBSTANCES ? tr(SUBSTANCES[piece.params.substance as keyof typeof SUBSTANCES].name, locale) : tr(piece.label ?? msg('lab-board-lines-name'), locale);
    const q = c * m * Math.abs(dT);
    if (dT < 0) given += q;
    else taken += q;
    if (Math.abs(dT) < 0.05) continue;
    out.push({
      id: `piece:${piece.id}`,
      title: `${name} — ${dT < 0 ? (tl(locale, 'lab-board-lines-title-4')) : tl(locale, 'lab-board-lines-title-5')}`,
      formula: 'Q = c·m·Δt',
      ...(finished ? { numbers: `${n(c)} · ${n(m)} · ${dt(dT)} ≈ ${kJ(q)}` } : {}),
    });
  }
  if (finished && pieces.length && phaseOf(sampleBody) === 'liquid' && phaseOf(bodies[0]!) === 'liquid') {
    // The liquid's own share, from the start of the step to the end (no phase change in it).
    const dT = C(sampleBody.state.temperature) - C(bodies[0]!.state.temperature);
    const q = liquidHeat(sub).value * bodyMass(sampleBody) * Math.abs(dT);
    if (dT < 0) given += q;
    else taken += q;
    if (given > 0 && taken > 0) {
      out.push({
        id: 'balance',
        title: tl(locale, 'lab-board-balance-lines-title'),
        formula: 'c₁m₁(t₁ − θ) = c₂m₂(θ − t₂)',
        numbers: `${kJ(given)} ≈ ${kJ(taken)}`,
      });
    }
  }

  // Boiling: the water that left as steam took L for every kilogram.
  const steam = boiled(bodies[bodies.length - 1]!) - boiled(bodies[0]!);
  const L = sub.boiling?.latentHeat.value;
  // A tenth of a gram: less is the very first bubbles, not boiling yet worth a line.
  if (L && steam >= 1e-4) {
    out.push({ id: 'boil', title: tl(locale, 'lab-board-boil-lines-title-2', { steam: finished ? tl(locale, 'lab-board-boil-lines-title', { steam: n(steam * 1000) }) : '' }), formula: 'Q = L·m', ...(finished ? { numbers: `${n(L)} · ${n(steam)} ≈ ${kJ(L * steam)}` } : {}) });
  }

  // A current through the liquid: Ohm's law and the heat it releases (Joule–Lenz).
  const sup = Object.values(states[states.length - 1]!.entities).find(isSupply);
  if (sup && sup.state.current > 0 && sup.state.resistance) {
    const I = sup.state.current;
    const R = sup.state.resistance;
    const t = sup.state.time;
    const amps = I < 0.1 ? `${n(I * 1000, 2)} ${tl(locale, 'unit-sym-mA')}` : `${n(I, 3)} ${tl(locale, 'unit-sym-A')}`;
    out.push({ id: 'ohm', title: tl(locale, 'lab-board-ohm-lines-title'), formula: 'I = U/R', ...(finished ? { numbers: `${n(I * R, 3)} ${tl(locale, 'unit-sym-V')} / ${n(R, 3)} ${tl(locale, 'unit-sym-ohm')} ≈ ${amps}` } : {}) });
    if (t > 0) out.push({ id: 'joule', title: tl(locale, 'lab-board-joule-lines-title'), formula: 'Q = I²·R·t', ...(finished ? { numbers: `${n(I, 3)}² · ${n(R, 3)} · ${n(t, 3)} ≈ ${kJ(I * I * R * t)}` } : {}) });
  }
  // The heater: how much it gave (E = P·t) and how much of it the substance got (efficiency) — at the end of the step.
  const first = states[0]!;
  const last = states[states.length - 1]!;
  const t = last.time - first.time;
  const heaters = Object.values(last.entities).filter((e) => isHeater(e) || isBurner(e));
  const E = heaters.reduce((sum, e) => {
    const e0 = first.entities[e.id];
    return e0 && (isHeater(e0) || isBurner(e0)) ? sum + (e as typeof e0).state.energyDelivered - e0.state.energyDelivered : sum;
  }, 0);
  if (finished && E > 1 && t > 0) {
    out.push({ id: 'heater', title: tl(locale, 'lab-board-heater-lines-title'), formula: 'E = P·t', numbers: `${n(E / t)} · ${n(t)} ≈ ${kJ(E)}` });
    // What the substance itself got: the change of the energy stored in the sample and what was added to it.
    const useful = Object.values(last.entities).reduce((sum, e) => {
      const e0 = first.entities[e.id];
      return isThermalBody(e) && e0 && isThermalBody(e0) && (e.id === SAMPLE_ID || e.id.startsWith(`${SAMPLE_ID}+`)) ? sum + bodyEnergy(e) - bodyEnergy(e0) : sum;
    }, 0);
    if (useful > 0) out.push({ id: 'efficiency', title: tl(locale, 'lab-board-efficiency-lines-title'), formula: 'η = Q/E', numbers: `${kJ(useful)} / ${kJ(E)} ≈ ${Math.round((useful / E) * 100)} %` });
  }

  out.push(...measuredLines(log, locale));
  out.push(...dissolvingHeatLines(log, states[states.length - 1]!, locale));

  // The latest weighing: what the scales show is the vessel plus what is in it.
  // Only while it is the latest thing done: after that the contents may have changed.
  const scale = log[log.length - 1]?.command.type === 'lab.weigh' ? weighed[weighed.length - 1] : undefined;
  if (scale) {
    const w = weigh(states[states.length - 1]!, scale);
    if (w.reading !== null && w.tare !== null) {
      const g = (kg: number) => formatReading(scale, kg, locale);
      out.push({ id: 'weigh', title: tl(locale, 'lab-board-weigh-lines-title'), formula: 'm = m₁ + m₂', numbers: `${g(w.tare)} + ${g(w.reading - w.tare)} = ${g(w.reading)}` });
      out.push(...massFractionLines(states[states.length - 1]!, scale, locale));
    }
  }
  return out;
}

/**
 * A substance poured in dissolved: the heat it took in or gave off, Q = n·ΔH (the enthalpy of solution of
 * its component, CRC), for what of it is dissolved now.
 */
function dissolvingHeatLines(log: readonly ExperimentLogEntry<{ type: string }>[], state: SystemState, locale: Locale): BoardLine[] {
  const b = sampleOf(state);
  const mix = 'mixture' in b.state ? b.state.mixture : undefined;
  if (!mix) return [];
  const out: BoardLine[] = [];
  const seen = new Set<string>();
  for (const e of log) {
    if (!e.ok || e.command.type !== 'thermal.add') continue;
    const id = SUBSTANCES[(e.command as unknown as { substance: SubstanceId }).substance]?.component as ComponentId | undefined;
    const c = id ? COMPONENTS[id] : undefined;
    const h = c?.inWater?.enthalpyOfSolution;
    const solute = mix.solutes.find((x) => x.component === id);
    if (!c || !h || !solute || seen.has(id!)) continue;
    seen.add(id!);
    const M = molarMass(c);
    const n = M ? (solute.mass - solute.crystals) / M : 0;
    if (n <= 0) continue;
    const q = n * Math.abs(h.value);
    const what = tr(c.genitive ?? c.name, locale).toLowerCase();
    const s = (x: number, d = 3) => sig(x, d, locale);
    out.push({
      id: `dissolve-heat:${id}`,
      title: tl(locale, 'lab-board-dissolving-heat-lines-title-3', { what, value: h.value > 0 ? tl(locale, 'lab-board-dissolving-heat-lines-title') : tl(locale, 'lab-board-dissolving-heat-lines-title-2') }),
      formula: 'Q = n·ΔH',
      numbers: `${s(n)} ${tl(locale, 'lab-board-dissolving-heat-lines-numbers')} · ${s(Math.abs(h.value), 4)} ${tl(locale, 'lab-board-dissolving-heat-lines-numbers-2')} ≈ ${s(q, 2)} ${tl(locale, 'unit-sym-kJ')}`,
    });
  }
  return out;
}

/**
 * A solution just weighed: the mass fraction of each dissolved substance, w = m(substance) / m(solution).
 * The solution is the water and what is dissolved in it — crystals on the bottom are not part of it.
 */
function massFractionLines(state: SystemState, scale: ScaleId, locale: Locale): BoardLine[] {
  const b = sampleOf(state);
  const mix = 'mixture' in b.state ? b.state.mixture : undefined;
  if (!mix || !mix.solutes.length) return [];
  const dissolved = mix.solutes.map((x) => ({ component: x.component, mass: x.mass - x.crystals })).filter((x) => x.mass > 1e-7);
  const solution = mix.water - mix.ice + dissolved.reduce((a, x) => a + x.mass, 0);
  const g = (kg: number) => formatReading(scale, kg, locale);
  return dissolved.map((x) => {
    const c = COMPONENTS[x.component as ComponentId];
    const what = c ? tr(c.genitive ?? c.name, locale).toLowerCase() : x.component;
    return {
      id: `fraction:${x.component}`,
      title: tl(locale, 'lab-board-mass-fraction-lines-title', { what }),
      formula: tl(locale, 'lab-board-mass-fraction-lines-formula'),
      numbers: `${g(x.mass)} / ${g(solution)} ≈ ${sig((x.mass / solution) * 100, 3, locale)} %`,
    };
  });
}

/**
 * What the instruments told, as formulas: the volume of a body from the marks (V = V₂ − V₁),
 * its mass from the scales (m = m₂ − m₁) and so its density; its weight on the dynamometer,
 * and the buoyant force two ways — from the readings (P − P′) and from Archimedes (ρ·g·V).
 */
/** Only what was measured (a lab work where heating is just the way to a temperature: no heat balance on the board). */
export function measuredLines(log: readonly ExperimentLogEntry<{ type: string }>[], locale: Locale): BoardLine[] {
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  let lastV: { v: number; div: number; at: number } | null = null;
  let lastM: { m: number; scale: string } | null = null;
  let addedSince = { v: false, m: false };
  // Salt or sugar poured in dissolves: what the scales add is a substance, not a body.
  let dissolvedAdded = false;
  let body: { m?: number; v?: number } = {};
  const airByBody = new Map<string, number>();
  const count = { volume: 0, mass: 0 };
  const sub = (k: number) => String(k).replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[Number(d)]!);
  log.forEach((e, i) => {
    if (!e.ok) return;
    const c = e.command as { type: string } & Record<string, unknown>;
    // An experiment module writes its own lines.
    const mod = experimentOf(c.type);
    if (mod) {
      if (mod.board) out.push(...mod.board(c as never, e.trace.filter((x): x is MeasurementRecord => x.kind === 'measurement' && x.value !== null), { index: i, before: log.slice(0, i), locale }));
      return;
    }
    if (c.type === 'thermal.add') {
      const sub = SUBSTANCES[c['substance'] as keyof typeof SUBSTANCES];
      if (sub?.category.startsWith('solid.') || c['frozen']) addedSince = { v: true, m: true };
      dissolvedAdded = !!sub && sub.category.startsWith('solid.') && !c['frozen'] && inWaterFamily(sub);
      return;
    }
    const r = e.trace.find((x): x is MeasurementRecord => x.kind === 'measurement');
    if (!r || r.value === null) return;
    // The bench: a spring stretched by weights, a block pulled along a board, the block's edges.
    const cm = (x: number) => formatMeasured('length', x, 0.001, locale);
    // The coil in the water on the multimeter: its resistance at this temperature, and — once warmer than at the
    // start — the temperature coefficient α = (R − R₀) / (R₀·Δt). (R₀ is its reading at 20 °C, where it starts.)
    if (c.type === 'lab.ohm') {
      const t = r.inputs?.['temperature'] ?? 20;
      const div = r.inputs?.['division'] ?? 0.01;
      const Om = (x: number) => formatMeasured('resistance', x, div, locale);
      const key = Math.round(t);
      out.push({ id: `ohm:${key}`, title: tl(locale, 'lab-board-measured-lines-title', { t: n(t, 3) }), formula: `R = ${Om(r.value)}` });
      const r0 = Math.round((r.inputs?.['r20'] ?? 0) / div) * div;
      const dt = t - 20;
      if (dt > 1 && r0 > 0) out.push({ id: `alphaT:${key}`, title: tl(locale, 'lab-board-measured-lines-title-2', { dt: n(dt, 3) }), formula: 'α = (R − R₀) / (R₀·Δt)', numbers: `(${n(r.value, 4)} − ${n(r0, 4)}) / (${n(r0, 4)} · ${n(dt, 3)}) ≈ ${n((r.value - r0) / (r0 * dt), 2)} ${'1/°C'}` });
      return;
    }
    // The cathode on the balance: before the current, then after — the copper it gained, and k = Δm / (I·t).
    if (c.type === 'lab.cathode') {
      const g = (kg: number) => formatMeasured('mass', kg, 0.00001, locale);
      const metal = r.inputs?.['metal'] ?? 0;
      if (metal <= 0) {
        out.push({ id: `cath1:${i}`, title: tl(locale, 'lab-board-measured-lines-title-3'), formula: `m₁ = ${g(r.value)}` });
        return;
      }
      // (The weighing before is the plate without what settled since — the same reading as then.)
      const div = r.inputs?.['division'] ?? 0.00001;
      const before = Math.round((r.exact - metal) / div) * div;
      const dm = r.value - before;
      const q = r.inputs?.['charge'] ?? 0;
      const t = r.inputs?.['time'] ?? 0;
      const I = t > 0 ? q / t : 0;
      out.push({ id: `cath2:${i}`, title: tl(locale, 'lab-board-measured-lines-title-4'), formula: `m₂ = ${g(r.value)}` });
      out.push({ id: `dm:${i}`, title: tl(locale, 'lab-board-measured-lines-title-5'), formula: 'Δm = m₂ − m₁', numbers: `${g(r.value)} − ${g(before)} = ${g(dm)}` });
      if (I > 0) out.push({ id: `kEq:${i}`, title: tl(locale, 'lab-board-measured-lines-title-6', { I: n(I, 2), t: n(t / 60, 3) }), formula: 'k = Δm / (I·t)', numbers: `${n(dm * 1e6, 3)} ${tl(locale, 'unit-sym-mg')} / (${n(I, 2)} ${tl(locale, 'unit-sym-A')} · ${n(t, 4)} ${tl(locale, 'unit-sym-s')}) ≈ ${n((dm * 1e6) / (I * t), 2)} ${tl(locale, 'lab-board-measured-lines-numbers')}` });
      return;
    }
    if (r.quantity === 'volume') {
      const div = r.inputs?.['division'] ?? 1e-6;
      // Written down as in a lab notebook: V₁ = 50 мл, then V₂…
      out.push({ id: `recV:${i}`, title: (addedSince.v ? tl(locale, 'lab-board-measured-lines-title-7') : tl(locale, 'lab-board-measured-lines-title-8')), formula: `V${sub(++count.volume)} = ${formatMeasured('volume', r.value, div, locale)}` });
      if (lastV && addedSince.v) {
        const dv = r.value - lastV.v;
        body = { ...body, v: dv };
        out.push({ id: `vol:${i}`, title: tl(locale, 'lab-board-measured-lines-title-9'), formula: 'V = V₂ − V₁', numbers: `${formatMeasured('volume', r.value, div, locale)} − ${formatMeasured('volume', lastV.v, div, locale)} = ${formatMeasured('volume', dv, div, locale)}` });
      }
      // Read again with nothing put in since — after melting, warming…: did the level change?
      if (lastV && !addedSince.v && e.time > lastV.at + 1e-9) {
        out.push({ id: `dV:${i}`, title: tl(locale, 'lab-board-measured-lines-title-10'), formula: `ΔV = V${sub(count.volume)} − V${sub(count.volume - 1)}`, numbers: `${formatMeasured('volume', r.value, div, locale)} − ${formatMeasured('volume', lastV.v, div, locale)} = ${formatMeasured('volume', r.value - lastV.v, div, locale)}` });
      }
      lastV = { v: r.value, div, at: e.time };
      addedSince = { ...addedSince, v: false };
    } else if (r.quantity === 'mass') {
      const scale = r.instrument;
      out.push({ id: `recM:${i}`, title: (addedSince.m ? (dissolvedAdded ? tl(locale, 'lab-board-measured-lines-title-11') : tl(locale, 'lab-board-measured-lines-title-12')) : tl(locale, 'lab-board-measured-lines-title-13')), formula: `m${sub(++count.mass)} = ${formatReading(scale as ScaleId, r.value, locale)}` });
      if (lastM && addedSince.m && lastM.scale === scale) {
        const dm = r.value - lastM.m;
        body = { ...body, m: dm };
        out.push({ id: `mass:${i}`, title: dissolvedAdded ? (tl(locale, 'lab-board-measured-lines-title-14')) : tl(locale, 'lab-board-measured-lines-title-15'), formula: 'm = m₂ − m₁', numbers: `${formatReading(scale as ScaleId, r.value, locale)} − ${formatReading(scale as ScaleId, lastM.m, locale)} = ${formatReading(scale as ScaleId, dm, locale)}` });
      }
      lastM = { m: r.value, scale };
      addedSince = { ...addedSince, m: false };
    } else if (r.quantity === 'force') {
      const key = `${String(c['substance'])}:${String(c['mass'])}`;
      const g = r.inputs?.['g'] ?? 9.80665;
      const N = (x: number) => formatMeasured('force', x, 0.01, locale);
      if (c['into'] === 'air') {
        airByBody.set(key, r.value);
        out.push({ id: `P:${i}`, title: tl(locale, 'lab-board-measured-lines-title-16'), formula: 'P = m·g', numbers: `${n(Number(c['mass']))} · ${n(g, 3)} ≈ ${N(Number(c['mass']) * g)} (${tl(locale, 'lab-board-measured-lines-numbers-2')}: ${formatMeasured('force', r.value, 0.1, locale)})` });
      } else {
        const air = airByBody.get(key);
        if ((r.inputs?.['share'] ?? 1) < 1) {
          out.push({ id: `float:${i}`, title: tl(locale, 'lab-board-measured-lines-title-17'), formula: 'F_A = P', numbers: `ρ_т < ρ_р: ${n(Number(c['mass']) / (r.inputs?.['volume'] ?? 1))} < ${n(r.inputs?.['rhoLiquid'] ?? 1000)} ${tl(locale, 'unit-sym-kg-per-m3')}` });
          return;
        }
        if (air !== undefined) out.push({ id: `FA:${i}`, title: tl(locale, 'lab-board-measured-lines-title-18'), formula: 'F_A = P − P′', numbers: `${formatMeasured('force', air, 0.1, locale)} − ${formatMeasured('force', r.value, 0.1, locale)} = ${formatMeasured('force', air - r.value, 0.1, locale)}` });
        const rho = r.inputs?.['rhoLiquid'];
        const V = r.inputs?.['volume'];
        if (rho && V) out.push({ id: `FAr:${i}`, title: tl(locale, 'lab-board-measured-lines-title-19'), formula: 'F_A = ρ·g·V', numbers: `${n(rho)} · ${n(g, 3)} · ${n(V)} ≈ ${N(rho * g * V)}` });
      }
    }
    // Both the mass and the volume of the body are known: its density.
    if (body.m !== undefined && body.v !== undefined && body.v > 0) {
      const rho = body.m / body.v;
      // A closed hollow body (a stoppered test tube with sand): its density is the mean one, not a substance's.
      const hollow = log.some((e) => e.ok && e.command.type === 'thermal.add' && (e.command as { volume?: number }).volume);
      out.push({ id: `rho:${i}`, title: hollow ? (tl(locale, 'lab-board-measured-lines-title-20')) : tl(locale, 'lab-board-measured-lines-title-21'), formula: 'ρ = m / V', numbers: `${n(body.m * 1000)} ${tl(locale, 'unit-sym-g')} / ${n(body.v * 1e6)} ${tl(locale, 'unit-sym-cm3')} ≈ ${n(rho / 1000)} ${tl(locale, 'unit-sym-g-per-cm3')} = ${n(rho)} ${tl(locale, 'unit-sym-kg-per-m3')}` });
      body = {};
    }
  });
  return out;
}
