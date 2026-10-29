import type { ExperimentLogEntry } from '../core/experiment.js';
import type { SystemState } from '../core/state.js';
import { tr } from '../knowledge/i18n.js';
import { liftPhaseText, type LiftPhase } from './lift-bench.js';
import { bounceBallName, type BounceBall } from './bounce-bench.js';
import { BEAUFORT, beaufortOf, WIND_TRACK } from './wind-bench.js';
import { STROBE_INTERVAL, STROBE_SCALE } from './strobe-bench.js';
import { SNAIL_TIME, snailSurfaceName, type SnailSurface } from './snail-bench.js';
import { TOUCH_CASES, touchSeen, type TouchCase } from './touch-bench.js';
import { G } from '../domains/mechanics/constants.js';
import { ZERO_CELSIUS_IN_KELVIN } from '../core/units.js';
import { isSupply } from '../domains/electrical/entities.js';
import { bodyEnergy, bodyMass, isBurner, isHeater, isThermalBody, type ThermalBody } from '../domains/thermal/entities.js';
import { mixtureHeatCapacity } from '../domains/thermal/mixture.js';
import { inWaterFamily } from '../domains/thermal/dissolve.js';
import { sig } from '../explain/format.js';
import type { Locale } from '../knowledge/i18n.js';
import { COMPONENTS, molarMass, type ComponentId } from '../components/index.js';
import { SUBSTANCES, type SubstanceId } from '../substances/catalog.js';
import { liquidHeat } from '../substances/types.js';
import { formatReading, weigh } from './weighing.js';
import { formatMeasured } from './measuring.js';
import { balanceWeights, weightsText } from './bench.js';
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
  const uk = locale === 'uk';
  const sub = SUBSTANCES[p.substance];
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  // Δt to a tenth of a degree (as a thermometer reads): rounded to whole degrees the product would not match (864 · 0,1 · 30 ≠ 2 620).
  const dt = (x: number) => sig(Math.round(Math.abs(x) * 10) / 10, 6, locale);
  const kJ = (j: number) => (Math.abs(j) >= 1e4 ? `${n(j / 1000)} ${uk ? 'кДж' : 'kJ'}` : `${n(j)} ${uk ? 'Дж' : 'J'}`);
  const out: BoardLine[] = [];
  if (!states.length) return out;
  const name = (uk ? (sub.genitive?.uk ?? sub.name.uk) : sub.name.en).toLowerCase();
  // The solid state: ice for water and the like; a metal or salt is a solid under its own name.
  const iceName = sub.melt ? name : uk ? 'льоду' : 'ice';

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
          title: dm > 0 ? (uk ? `кристалізація${over ? `: ${sub.melt ? 'затверділо' : 'замерзло'} ${n(m * 1000)} г` : ''}` : `freezing${over ? `: ${n(m * 1000)} g froze` : ''}`) : uk ? `плавлення${over ? `: ${sub.melt ? 'розплавилося' : 'розтануло'} ${n(m * 1000)} г` : ''}` : `melting${over ? `: ${n(m * 1000)} g melted` : ''}`,
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
        const what = ph === 'solid' ? iceName : b.state.mixture?.solutes.length && b.label ? `${uk ? 'розчину' : 'the solution'}${b.label.uk.startsWith('Розчин ') ? (uk ? b.label.uk.slice(6) : '') : ''}` : name;
        out.push({
          id,
          title: dT > 0 ? (uk ? `нагрівання ${what}` : `warming the ${what}`) : uk ? `охолодження ${what}` : `cooling the ${what}`,
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
        title: uk ? 'змішування: температура суміші' : 'mixing: the temperature of the mixture',
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
    const name = piece.params.substance && piece.params.substance in SUBSTANCES ? tr(SUBSTANCES[piece.params.substance as keyof typeof SUBSTANCES].name, locale) : tr(piece.label ?? { uk: 'тіло', en: 'body' }, locale);
    const q = c * m * Math.abs(dT);
    if (dT < 0) given += q;
    else taken += q;
    if (Math.abs(dT) < 0.05) continue;
    out.push({
      id: `piece:${piece.id}`,
      title: `${name} — ${dT < 0 ? (uk ? 'охолодження' : 'cooling') : uk ? 'нагрівання' : 'warming'}`,
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
        title: uk ? 'тепловий баланс: скільки віддали — стільки й отримали (різниця — посуд і повітря)' : 'heat balance: what was given was taken (the rest went into the vessel and the air)',
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
    out.push({ id: 'boil', title: uk ? `кипіння${finished ? `: википіло ${n(steam * 1000)} г` : ''}` : `boiling${finished ? `: ${n(steam * 1000)} g boiled off` : ''}`, formula: 'Q = L·m', ...(finished ? { numbers: `${n(L)} · ${n(steam)} ≈ ${kJ(L * steam)}` } : {}) });
  }

  // A current through the liquid: Ohm's law and the heat it releases (Joule–Lenz).
  const sup = Object.values(states[states.length - 1]!.entities).find(isSupply);
  if (sup && sup.state.current > 0 && sup.state.resistance) {
    const I = sup.state.current;
    const R = sup.state.resistance;
    const t = sup.state.time;
    const amps = I < 0.1 ? `${n(I * 1000, 2)} ${uk ? 'мА' : 'mA'}` : `${n(I, 3)} ${uk ? 'А' : 'A'}`;
    out.push({ id: 'ohm', title: uk ? 'струм у рідині' : 'current in the liquid', formula: 'I = U/R', ...(finished ? { numbers: `${n(I * R, 3)} ${uk ? 'В' : 'V'} / ${n(R, 3)} ${uk ? 'Ом' : 'Ω'} ≈ ${amps}` } : {}) });
    if (t > 0) out.push({ id: 'joule', title: uk ? 'теплота від струму' : 'heat from the current', formula: 'Q = I²·R·t', ...(finished ? { numbers: `${n(I, 3)}² · ${n(R, 3)} · ${n(t, 3)} ≈ ${kJ(I * I * R * t)}` } : {}) });
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
    out.push({ id: 'heater', title: uk ? 'нагрівач віддав' : 'the heater gave', formula: 'E = P·t', numbers: `${n(E / t)} · ${n(t)} ≈ ${kJ(E)}` });
    // What the substance itself got: the change of the energy stored in the sample and what was added to it.
    const useful = Object.values(last.entities).reduce((sum, e) => {
      const e0 = first.entities[e.id];
      return isThermalBody(e) && e0 && isThermalBody(e0) && (e.id === SAMPLE_ID || e.id.startsWith(`${SAMPLE_ID}+`)) ? sum + bodyEnergy(e) - bodyEnergy(e0) : sum;
    }, 0);
    if (useful > 0) out.push({ id: 'efficiency', title: uk ? 'ККД: скільки дісталося речовині' : 'efficiency: what the substance got', formula: 'η = Q/E', numbers: `${kJ(useful)} / ${kJ(E)} ≈ ${Math.round((useful / E) * 100)} %` });
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
      out.push({ id: 'weigh', title: uk ? 'зважування: посуд + вміст' : 'weighing: vessel + contents', formula: 'm = m₁ + m₂', numbers: `${g(w.tare)} + ${g(w.reading - w.tare)} = ${g(w.reading)}` });
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
  const uk = locale === 'uk';
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
    const what = (uk ? (c.genitive?.uk ?? c.name.uk) : c.name.en).toLowerCase();
    const s = (x: number, d = 3) => sig(x, d, locale);
    out.push({
      id: `dissolve-heat:${id}`,
      title: uk ? `розчинення ${what}: теплоту ${h.value > 0 ? 'поглинуто' : 'виділено'}` : `dissolving ${what}: heat ${h.value > 0 ? 'taken in' : 'given off'}`,
      formula: 'Q = n·ΔH',
      numbers: `${s(n)} ${uk ? 'моль' : 'mol'} · ${s(Math.abs(h.value), 4)} ${uk ? 'кДж/моль' : 'kJ/mol'} ≈ ${s(q, 2)} ${uk ? 'кДж' : 'kJ'}`,
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
  const uk = locale === 'uk';
  const dissolved = mix.solutes.map((x) => ({ component: x.component, mass: x.mass - x.crystals })).filter((x) => x.mass > 1e-7);
  const solution = mix.water - mix.ice + dissolved.reduce((a, x) => a + x.mass, 0);
  const g = (kg: number) => formatReading(scale, kg, locale);
  return dissolved.map((x) => {
    const c = COMPONENTS[x.component as ComponentId];
    const what = c ? (uk ? (c.genitive?.uk ?? c.name.uk) : c.name.en).toLowerCase() : x.component;
    return {
      id: `fraction:${x.component}`,
      title: uk ? `масова частка ${what} в розчині` : `the mass fraction of ${what} in the solution`,
      formula: uk ? 'w = m(речовини) / m(розчину)' : 'w = m(substance) / m(solution)',
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
  const uk = locale === 'uk';
  const n = (x: number, d = 3) => sig(x, d, locale).replace('-', '−');
  const out: BoardLine[] = [];
  let lastV: { v: number; div: number; at: number } | null = null;
  let lastM: { m: number; scale: string } | null = null;
  let addedSince = { v: false, m: false };
  // Salt or sugar poured in dissolves: what the scales add is a substance, not a body.
  let dissolvedAdded = false;
  let body: { m?: number; v?: number } = {};
  const airByBody = new Map<string, number>();
  let springL0: number | null = null;
  // A liquid weighed on the balance (empty vessel, then with the liquid) and its volume read by the marks: its density.
  let emptyVessel: number | null = null;
  let liquidMass: number | null = null;
  let liquidVolume: number | null = null;
  let liquidDone = false;
  const liquidDensityLine = (i: number) => {
    if (liquidDone || liquidMass === null || liquidVolume === null || !(liquidVolume > 0)) return;
    liquidDone = true;
    out.push({ id: `rhoL:${i}`, title: uk ? 'густина рідини' : 'the density of the liquid', formula: 'ρ = m / V', numbers: `${n(liquidMass * 1000)} ${uk ? 'г' : 'g'} / ${n(liquidVolume * 1e6)} ${uk ? 'см³' : 'cm³'} ≈ ${n(liquidMass / liquidVolume / 1000)} ${uk ? 'г/см³' : 'g/cm³'} = ${n(liquidMass / liquidVolume)} ${uk ? 'кг/м³' : 'kg/m³'}` });
  };
  const edges: (number | undefined)[] = [];
  const count = { volume: 0, mass: 0 };
  let tapePath: number | null = null;
  let pressAreas: number | null = null;
  let atmScale: number | null = null;
  let vesselArea: number | null = null;
  const pair: Partial<Record<'r1' | 'r2' | 'both', { I: number; U: number }>> = {};
  const sub = (k: number) => String(k).replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[Number(d)]!);
  log.forEach((e, i) => {
    if (!e.ok) return;
    const c = e.command as { type: string } & Record<string, unknown>;
    if (c.type === 'thermal.add') {
      const sub = SUBSTANCES[c['substance'] as keyof typeof SUBSTANCES];
      if (sub?.category.startsWith('solid.') || c['frozen']) addedSince = { v: true, m: true };
      dissolvedAdded = !!sub && sub.category.startsWith('solid.') && !c['frozen'] && inWaterFamily(sub);
      return;
    }
    // Two resistors: what the instruments show at each place; once all three are read, the sum that holds.
    if (c.type === 'lab.pair') {
      const recs = e.trace.filter((x): x is MeasurementRecord => x.kind === 'measurement');
      const I = recs.find((x) => x.quantity === 'current')?.value;
      const U = recs.find((x) => x.quantity === 'voltage')?.value;
      if (I == null || U == null) return;
      const at = String(c['at']) as 'r1' | 'r2' | 'both';
      const series = c['connection'] === 'series';
      pair[at] = { I, U };
      const A = (x: number) => formatMeasured('current', x, 0.01, locale);
      const V = (x: number) => formatMeasured('voltage', x, 0.1, locale);
      const sub = at === 'r1' ? '₁' : at === 'r2' ? '₂' : '';
      const place = at === 'both' ? (series ? (uk ? 'на обох резисторах разом' : 'across both resistors') : uk ? 'до розгалуження' : 'before the fork') : uk ? `резистор ${at === 'r1' ? 1 : 2}` : `resistor ${at === 'r1' ? 1 : 2}`;
      out.push({ id: `pair:${i}`, title: uk ? `покази: ${place}` : `the readings: ${place}`, formula: series ? `I = ${A(I)}, U${sub} = ${V(U)}` : `I${sub} = ${A(I)}, U = ${V(U)}` });
      const { r1, r2, both } = pair;
      if (r1 && r2 && both) {
        out.push(series
          ? { id: `sum:${i}`, title: uk ? 'сума напруг на резисторах — і загальна напруга' : 'the voltages across the resistors added — and the total', formula: 'U = U₁ + U₂', numbers: `${V(r1.U)} + ${V(r2.U)} = ${V(r1.U + r2.U)} (${uk ? 'виміряно' : 'measured'} ${V(both.U)})` }
          : { id: `sum:${i}`, title: uk ? 'сума струмів у гілках — і загальний струм' : 'the branch currents added — and the total', formula: 'I = I₁ + I₂', numbers: `${A(r1.I)} + ${A(r2.I)} = ${A(r1.I + r2.I)} (${uk ? 'виміряно' : 'measured'} ${A(both.I)})` });
      }
      return;
    }
    // The circuit: the ammeter and the voltmeter read together — the resistance R = U / I.
    if (c.type === 'lab.circuit') {
      const recs = e.trace.filter((x): x is MeasurementRecord => x.kind === 'measurement');
      const I = recs.find((x) => x.quantity === 'current');
      const U = recs.find((x) => x.quantity === 'voltage');
      if (!I || !U || I.value === null || U.value === null || I.value <= 0) return;
      const A = (x: number) => formatMeasured('current', x, 0.01, locale);
      const V = (x: number) => formatMeasured('voltage', x, 0.1, locale);
      out.push({ id: `IU:${i}`, title: uk ? `покази приладів (джерело ${n(Number(c['source']), 2)} В)` : `the instruments (source ${n(Number(c['source']), 2)} V)`, formula: `I = ${A(I.value)}, U = ${V(U.value)}` });
      if (c['power']) out.push({ id: `P:${i}`, title: uk ? 'потужність споживача' : 'the power of the consumer', formula: 'P = U · I', numbers: `${V(U.value)} · ${A(I.value)} ≈ ${n(U.value * I.value, 2)} ${uk ? 'Вт' : 'W'}` });
      else out.push({ id: `R:${i}`, title: uk ? 'опір провідника' : 'the resistance of the conductor', formula: 'R = U / I', numbers: `${V(U.value)} / ${A(I.value)} ≈ ${n(U.value / I.value, 2)} ${uk ? 'Ом' : 'Ω'}` });
      return;
    }
    const r = e.trace.find((x): x is MeasurementRecord => x.kind === 'measurement');
    if (!r || r.value === null) return;
    // The bench: a spring stretched by weights, a block pulled along a board, the block's edges.
    const cm = (x: number) => formatMeasured('length', x, 0.001, locale);
    const F2 = (x: number) => formatMeasured('force', x, 0.01, locale);
    if (c.type === 'lab.stretch') {
      const w = Number(c['weights']);
      if (w === 0) {
        springL0 = r.value;
        out.push({ id: `l0:${i}`, title: uk ? 'довжина пружини без вантажу' : 'the spring with no load', formula: `l₀ = ${cm(r.value)}` });
        return;
      }
      if (springL0 === null) return;
      const x = r.value - springL0;
      const F = r.inputs?.['F'] ?? 0;
      out.push({ id: `hooke:${i}`, title: uk ? `${w} × 100 г: сила пружності дорівнює вазі тягарців` : `${w} × 100 g: the elastic force equals the weights’ weight`, formula: 'k = F / x', numbers: `${F2(F)} / ${n(x)} ${uk ? 'м' : 'm'} ≈ ${n(F / x)} ${uk ? 'Н/м' : 'N/m'} (x = ${cm(r.value)} − ${cm(springL0)})` });
      return;
    }
    if (c.type === 'lab.pull') {
      const N = r.inputs?.['N'] ?? 0;
      out.push({ id: `mu:${i}`, title: uk ? `тертя ковзання: брусок ${Number(c['weights']) === 0 ? 'без тягарців' : `і ${Number(c['weights'])} × 100 г`}` : `sliding friction: the block ${Number(c['weights']) === 0 ? 'alone' : `and ${Number(c['weights'])} × 100 g`}`, formula: 'μ = F / N', numbers: `${formatMeasured('force', r.value, 0.1, locale)} / ${F2(N)} ≈ ${n(r.value / N, 2)}` });
      return;
    }
    if (c.type === 'lab.balance') {
      const what = String(c['what']);
      const label = (c['label'] as { uk: string; en: string } | undefined)?.[uk ? 'uk' : 'en'] ?? (what === 'vessel-empty' ? (uk ? 'порожня посудина' : 'the empty vessel') : what === 'vessel' ? (uk ? 'посудина з рідиною' : 'the vessel with the liquid') : uk ? 'тіло' : 'the body');
      const g = (kg: number) => formatMeasured('mass', kg, 0.00001, locale);
      const set = balanceWeights(r.value) ?? [];
      out.push({ id: `bal:${i}`, title: uk ? `важільні терези: ${label.toLowerCase()}` : `lever balance: ${label.toLowerCase()}`, formula: `m = ${g(r.value)}`, numbers: weightsText(set, uk) });
      if (what === 'vessel-empty') emptyVessel = r.value;
      if (what === 'vessel' && emptyVessel !== null) {
        liquidMass = r.value - emptyVessel;
        out.push({ id: `liq:${i}`, title: uk ? 'маса рідини — різниця двох зважувань' : 'the mass of the liquid — the difference of two weighings', formula: 'm = m₂ − m₁', numbers: `${g(r.value)} − ${g(emptyVessel)} = ${g(liquidMass)}` });
      }
      liquidDensityLine(i);
      return;
    }
    // The inclined plane: the useful work (lifting by h), the work done (pulling along l), the efficiency.
    if (c.type === 'lab.slope') {
      const h = r.inputs?.['h'] ?? 0;
      const l = r.inputs?.['l'] ?? 1;
      // The weight as the dynamometer showed it in the air (the last weighing), else the model's.
      const P = [...airByBody.values()].filter((x): x is number => x !== null).pop() ?? r.inputs?.['P'] ?? 0;
      const N1 = (x: number) => formatMeasured('force', x, 0.1, locale);
      const J = uk ? 'Дж' : 'J';
      const Au = P * h;
      const At = r.value * l;
      out.push({ id: `Au:${i}`, title: uk ? `корисна робота — підняти брусок на h = ${cm(h)}` : `the useful work — lifting the block by h = ${cm(h)}`, formula: 'A_к = P·h', numbers: `${N1(P)} · ${n(h)} ${uk ? 'м' : 'm'} ≈ ${n(Au, 3)} ${J}` });
      out.push({ id: `At:${i}`, title: uk ? `повна робота — тягти вздовж дошки l = ${cm(l)}` : `the work done — pulling along the board l = ${cm(l)}`, formula: 'A_п = F·l', numbers: `${N1(r.value)} · ${n(l)} ${uk ? 'м' : 'm'} ≈ ${n(At, 3)} ${J}` });
      out.push({ id: `eta:${i}`, title: uk ? `ККД похилої площини (h = ${cm(h)})` : `the efficiency of the slope (h = ${cm(h)})`, formula: 'η = A_к / A_п', numbers: `${n(Au, 3)} ${J} / ${n(At, 3)} ${J} ≈ ${n((Au / At) * 100, 2)} %` });
      return;
    }
    // The lever: the moments on both sides — equal when it balances.
    if (c.type === 'lab.lever') {
      const F1 = r.inputs?.['F1'] ?? 0;
      const l1 = r.inputs?.['l1'] ?? 0;
      const l2 = r.inputs?.['l2'] ?? 0;
      const dyn = r.instrument === 'dynamometer';
      const F2s = dyn ? formatMeasured('force', r.value, 0.1, locale) : F2(r.value);
      const Nm = uk ? 'Н·м' : 'N·m';
      out.push({ id: `M1:${i}`, title: uk ? `момент сили ліворуч (${F2(F1)} на ${cm(l1)})` : `the moment on the left (${F2(F1)} at ${cm(l1)})`, formula: 'M₁ = F₁·l₁', numbers: `${F2(F1)} · ${n(l1)} ${uk ? 'м' : 'm'} ≈ ${n(F1 * l1, 3)} ${Nm}` });
      out.push({ id: `M2:${i}`, title: dyn ? (uk ? `момент сили праворуч (динамометр на ${cm(l2)})` : `the moment on the right (the dynamometer at ${cm(l2)})`) : uk ? `момент сили праворуч (${F2s} на ${cm(l2)})` : `the moment on the right (${F2s} at ${cm(l2)})`, formula: 'M₂ = F₂·l₂', numbers: `${F2s} · ${n(l2)} ${uk ? 'м' : 'm'} ≈ ${n(r.value * l2, 3)} ${Nm}` });
      return;
    }
    // Weight in a lift: the phase, which way the lift accelerates, and what the dynamometer shows.
    if (c.type === 'lab.lift') {
      const a = r.inputs?.['a'] ?? 0;
      const phase = String(c['phase']);
      const title = tr(liftPhaseText(phase as LiftPhase).plan, locale);
      const acc = phase === 'fall' ? (uk ? 'вільне падіння' : 'free fall') : a === 0 ? (uk ? 'без прискорення' : 'no acceleration') : `a = ${n(Math.abs(a), 2)} ${uk ? 'м/с²' : 'm/s²'} ${a > 0 ? '↑' : '↓'}`;
      out.push({ id: `lf:${i}`, title: `${title} (${acc})`, formula: `P = ${formatMeasured('force', r.value, 0.1, locale)}` });
      return;
    }
    // Carts: the paths in 0.5 s and their ratio — the masses' (hidden till the answer); a cart's weight.
    if (c.type === 'lab.carts') {
      const recs = e.trace.filter((x): x is MeasurementRecord => x.kind === 'measurement' && x.value !== null);
      if (c['mode'] === 'weigh') {
        out.push({ id: `cw:${i}`, title: uk ? `візок ${c['cart']} на динамометрі` : `cart ${c['cart']} on the dynamometer`, formula: `P = ${formatMeasured('force', recs[0]?.value ?? 0, 0.1, locale)}` });
        return;
      }
      const [a, b] = recs.map((x) => x.value!);
      const w = Number(c['weights']);
      const cm = (x: number) => `${n(x * 100, 3)} ${uk ? 'см' : 'cm'}`;
      out.push({ id: `cl:${i}`, title: uk ? `${w === 0 ? 'однакові візки' : `візок 2 + ${w} × 100 г`}: за 0,5 с` : `${w === 0 ? 'alike carts' : `cart 2 + ${w} × 100 g`}: in 0.5 s`, formula: `l₁ = ${cm(a ?? 0)}, l₂ = ${cm(b ?? 0)}` });
      out.push({ id: `cr:${i}`, title: uk ? 'у скільки разів повільніший — у стільки разів важчий' : 'as many times slower — so many times heavier', formula: 'm₂ / m₁ = v₁ / v₂ = l₁ / l₂', numbers: `${cm(a ?? 0)} / ${cm(b ?? 0)} ≈ ${n((a ?? 0) / (b ?? 1), 2)}` });
      return;
    }
    // Contact and non-contact forces: what was seen, and whether the force acted without touching (no numbers).
    if (c.type === 'lab.touch') {
      const k = String(c['case']) as TouchCase;
      const acts = r.inputs?.['acts'] === 1;
      out.push({ id: `tc:${i}`, title: tr(touchSeen(k), locale), formula: `${tr(TOUCH_CASES[k].force, locale)}: ${acts ? (uk ? 'діє без дотику' : 'acts without touching') : uk ? 'без дотику не діє' : 'does not act without touching'}` });
      return;
    }
    // Inertia: how fast the card went and how soon it left the coin; how far the coin moved.
    if (c.type === 'lab.coin') {
      const v = r.inputs?.['speed'] ?? 0;
      const slipped = r.inputs?.['slipped'] === 1;
      const inGlass = r.inputs?.['inGlass'] === 1;
      const res = inGlass ? (uk ? 'у склянці' : 'in the glass') : slipped ? (uk ? 'повз склянку' : 'missed the glass') : uk ? 'поїхала з карткою' : 'went with the card';
      out.push({ id: `cn:${i}`, title: uk ? `картка ${n(v, 2)} м/с: монета зсунулася на ${Math.round(r.value * 1000)} мм — ${res}` : `the card at ${n(v, 2)} m/s: the coin moved ${Math.round(r.value * 1000)} mm — ${res}`, formula: 't = l / v', numbers: `${n(slipped ? 0.075 : 0.15, 2)} ${uk ? 'м' : 'm'} / ${n(v, 2)} ${uk ? 'м/с' : 'm/s'} ≈ ${n(r.inputs?.['time'] ?? 0, 2)} ${uk ? 'с' : 's'}` });
      return;
    }
    // A snail: the surface, the distance in 30 s and the speed.
    if (c.type === 'lab.snail') {
      const t = r.inputs?.['time'] ?? SNAIL_TIME;
      out.push({ id: `sn:${i}`, title: tr(snailSurfaceName(String(c['surface']) as SnailSurface), locale), formula: 'v = l / t', numbers: `${Math.round(r.value * 1000)} ${uk ? 'мм' : 'mm'} / ${t} ${uk ? 'с' : 's'} ≈ ${n((r.value * 1000) / t, 2)} ${uk ? 'мм/с' : 'mm/s'}` });
      return;
    }
    // A stroboscopic photo: the gaps measured on it, five times that in life; the speeds (hidden till the answer).
    if (c.type === 'lab.strobe') {
      const g = e.trace.filter((x): x is MeasurementRecord => x.kind === 'measurement' && x.value !== null).map((x) => x.value!);
      const table = c['photo'] === 'table';
      const cm = (x: number) => `${n(x * STROBE_SCALE * 100, 2)} ${uk ? 'см' : 'cm'}`;
      const where = table ? (uk ? 'на столі' : 'on the table') : uk ? 'на жолобі' : 'in the groove';
      out.push({ id: `sg:${i}`, title: `${where}: ${g.map((x) => Math.round(x * 1000)).join(', ')} ${uk ? 'мм на фото' : 'mm on the photo'}`, formula: `l = ${STROBE_SCALE} · l_${uk ? 'фото' : 'photo'}`, numbers: g.map(cm).join(', ') });
      out.push({ id: `sv:${i}`, title: uk ? 'за 0,25 с між спалахами' : 'in 0.25 s between the flashes', formula: 'v = l / t', numbers: g.map((x) => `${n((x * STROBE_SCALE) / STROBE_INTERVAL, 2)}`).join(', ') + (uk ? ' м/с' : ' m/s') });
      return;
    }
    // The wind's speed: the day's signs, v = l / t, and the Beaufort force the speed falls in.
    if (c.type === 'lab.wind') {
      const day = Number(c['day']) as 1 | 2 | 3;
      const l = r.inputs?.['track'] ?? WIND_TRACK;
      const v = l / r.value;
      const f = beaufortOf(v);
      const name = BEAUFORT[f as 1 | 2 | 3]?.name;
      out.push({ id: `wd:${i}`, title: tr(BEAUFORT[day].signs, locale), formula: 'v = l / t', numbers: `${n(l, 2)} ${uk ? 'м' : 'm'} / ${formatMeasured('time', r.value, 0.01, locale)} ≈ ${n(v, 2)} ${uk ? 'м/с' : 'm/s'}${name ? (uk ? ` — ${f} ${f === 1 ? 'бал' : 'бали'}, ${name.uk}` : ` — force ${f}, ${name.en}`) : ''}` });
      return;
    }
    // A windlass: what was counted or measured; how it follows from the circumference (hidden till the answer).
    if (c.type === 'lab.winch') {
      const d = r.inputs?.['diameter'] ?? 0;
      const amount = Number(c['amount']);
      const what = c['spool'] === 'pencil' ? (uk ? 'олівець, d = 8 мм' : 'pencil, d = 8 mm') : uk ? 'котушка, d = 2 см' : 'reel, d = 2 cm';
      const cm = (x: number) => `${n(x * 100, 3)} ${uk ? 'см' : 'cm'}`;
      if (c['mode'] === 'lower') {
        out.push({ id: `wm:${i}`, title: uk ? `${what}: вантаж униз на ${cm(amount)}` : `${what}: the load down ${cm(amount)}`, formula: `n = ${formatMeasured('turns', r.value, 0.25, locale)}` });
        out.push({ id: `wc:${i}`, title: uk ? 'за оберт — довжина кола' : 'a turn — the circumference', formula: 'n = l / (π·d)', numbers: `${cm(amount)} / (3,14 · ${cm(d)}) ≈ ${n(amount / (Math.PI * d), 3)}`.replace('3,14', uk ? '3,14' : '3.14') });
      } else {
        out.push({ id: `wm:${i}`, title: uk ? `${what}: ${amount} обертів ручки` : `${what}: ${amount} turns of the handle`, formula: `h = ${cm(r.value)}` });
        out.push({ id: `wc:${i}`, title: uk ? 'за оберт — довжина кола' : 'a turn — the circumference', formula: 'l = π·d·n', numbers: `3,14 · ${cm(d)} · ${amount} ≈ ${cm(Math.PI * d * amount)}`.replace('3,14', uk ? '3,14' : '3.14') });
      }
      return;
    }
    // The relativity of motion: the time, the bottle's shift, the bubble's speed relative to the bottle and to the table.
    if (c.type === 'lab.carry') {
      const recs = e.trace.filter((x): x is MeasurementRecord => x.kind === 'measurement' && x.value !== null);
      const of = (w: number) => recs.find((x) => x.inputs?.['which'] === w)?.value ?? 0;
      const t = of(0);
      const u = Number(c['speed']);
      const cm = (x: number) => `${n(x * 100, 3)} ${uk ? 'см' : 'cm'}`;
      const T = formatMeasured('time', t, 0.01, locale);
      const v = (l: number) => `${n((l / t) * 100, 2)} ${uk ? 'см/с' : 'cm/s'}`;
      const how = u === 0 ? (uk ? 'пляшка стоїть' : 'the bottle stands') : uk ? `u = ${n(u * 100, 2)} см/с, зсув ${cm(of(1))}` : `u = ${n(u * 100, 2)} cm/s, moved ${cm(of(1))}`;
      out.push({ id: `cb:${i}`, title: uk ? `${how}: відносно пляшки` : `${how}: relative to the bottle`, formula: 'v = l / t', numbers: `${cm(0.09)} / ${T} ≈ ${v(0.09)}` });
      out.push({ id: `ct:${i}`, title: uk ? 'відносно стола' : 'relative to the table', formula: 'v = s / t', numbers: `${cm(of(2))} / ${T} ≈ ${v(of(2))}` });
      return;
    }
    // A ball's bounce: how high it rose after this impact and the energy it has there, Eп = m·g·h.
    if (c.type === 'lab.bounce') {
      const m = r.inputs?.['mass'] ?? 0;
      const k = Number(c['bounce']);
      const what = tr(bounceBallName(String(c['ball']) as BounceBall), locale);
      const h = `${Math.round(r.value * 100)} ${uk ? 'см' : 'cm'}`;
      const title = uk ? `${k}-й відскок: h = ${h}` : `bounce ${k}: h = ${h}`;
      // (Its energy before the drop: the first bounce of each ball.)
      if (k === 1) out.push({ id: `b0:${i}`, title: uk ? `${what} нагорі: h₀ = 1 м` : `${what} at the top: h₀ = 1 m`, formula: 'Eп = m·g·h', numbers: `${n(m, 2)} ${uk ? 'кг' : 'kg'} · ${n(G, 2)} ${uk ? 'Н/кг' : 'N/kg'} · 1 ${uk ? 'м' : 'm'} ≈ ${n(m * G * 1000, 2)} ${uk ? 'мДж' : 'mJ'}` });
      out.push({ id: `bn:${i}`, title, formula: 'Eп = m·g·h', numbers: `${n(m, 2)} ${uk ? 'кг' : 'kg'} · ${n(G, 2)} ${uk ? 'Н/кг' : 'N/kg'} · ${n(r.value, 2)} ${uk ? 'м' : 'm'} ≈ ${n(m * G * r.value * 1000, 2)} ${uk ? 'мДж' : 'mJ'}` });
      return;
    }
    // The method of rows: the row's length and the size of one, d = L/N.
    if (c.type === 'lab.rows') {
      const N = Number(c['count']);
      const body = String(c['body']);
      const L = `${Math.round(r.value * 1000)} ${uk ? 'мм' : 'mm'}`;
      const what = { pea: uk ? 'горошин' : 'peas', millet: uk ? 'зерняток пшона' : 'millet grains', thread: uk ? 'витків нитки' : 'turns of thread' }[body] ?? '';
      if (N === 1) {
        out.push({ id: `r1:${i}`, title: uk ? 'одна горошина: лінійкою до поділки' : 'one pea: by the ruler to a division', formula: `d = ${L} ± 0,5 ${uk ? 'мм' : 'mm'}`.replace('0,5', uk ? '0,5' : '0.5') });
        return;
      }
      out.push({ id: `rw:${i}`, title: uk ? `${N} ${what}: ${body === 'thread' ? 'ширина намотки' : 'довжина ряду'} ${L}` : `${N} ${what}: ${body === 'thread' ? 'the winding’s width' : 'the row’s length'} ${L}`, formula: 'd = L / N', numbers: `${L} / ${N} ≈ ${(r.value / N * 1000).toFixed(2).replace('.', uk ? ',' : '.')} ${uk ? 'мм' : 'mm'}` });
      return;
    }
    // Adding forces: what the dynamometers show, and their resultant (hidden till the answer).
    if (c.type === 'lab.forces') {
      const recs = e.trace.filter((x): x is MeasurementRecord => x.kind === 'measurement' && x.quantity === 'force' && x.value !== null);
      const F = (x: MeasurementRecord | undefined) => formatMeasured('force', x?.value ?? 0, 0.1, locale);
      const [a, b] = recs;
      if (!a) return;
      if (c['hold'] === 'one') {
        out.push({ id: `fw:${i}`, title: uk ? 'вантаж на одному динамометрі' : 'the load on one dynamometer', formula: `F = ${F(a)}` });
        return;
      }
      if (!b) return;
      if (c['hold'] === 'two') {
        const at = Math.round(Number(c['at']) * 100);
        out.push({ id: `ft:${i}`, title: uk ? `два динамометри, тягарці на ${at} см` : `two dynamometers, the weights at ${at} cm`, formula: `F₁ = ${F(a)}; F₂ = ${F(b)}` });
        out.push({ id: `rs:${i}`, title: uk ? 'рівнодійна: обидві сили вгору' : 'the resultant: both forces up', formula: 'R = F₁ + F₂', numbers: `${F(a)} + ${F(b)} = ${formatMeasured('force', a.value! + b.value!, 0.1, locale)}` });
        return;
      }
      out.push({ id: `fd:${i}`, title: uk ? 'один тягне вгору, другий униз' : 'one pulls up, the other down', formula: `F₁ = ${F(a)} ↑; F₂ = ${F(b)} ↓` });
      out.push({ id: `rs:${i}`, title: uk ? 'рівнодійна: сили протилежні' : 'the resultant: opposite forces', formula: 'R = F₁ − F₂', numbers: `${F(a)} − ${F(b)} = ${formatMeasured('force', a.value! - b.value!, 0.1, locale)}` });
      return;
    }
    // A body in a liquid: its times at the marks, and its speed v = l/t (hidden till the answer).
    if (c.type === 'lab.sink') {
      const laps = e.trace.filter((x): x is MeasurementRecord => x.kind === 'measurement' && x.quantity === 'time' && x.value !== null);
      const last = laps[laps.length - 1];
      if (!last) return;
      const bubble = c['body'] === 'bubble';
      const d = Number(c['diameter']) * 1000;
      const liquid = { 'washing-up': uk ? 'у рідині для посуду' : 'in washing-up liquid', glycerol: uk ? 'у гліцерині' : 'in glycerol', 'sunflower-oil': uk ? 'в олії' : 'in oil', water: uk ? 'у воді' : 'in water' }[String(c['liquid'])] ?? '';
      const what = bubble ? (uk ? `бульбашка ≈ ${n(d, 2)} мм` : `a ≈ ${n(d, 2)} mm bubble`) : uk ? `кулька ${liquid}` : `the ball ${liquid}`;
      const cmT = (m: number) => `${Math.round(m * 100)} ${uk ? 'см' : 'cm'}`;
      out.push({ id: `st:${i}`, title: uk ? `${what}: час на позначках` : `${what}: the times at the marks`, formula: laps.map((x) => `${cmT(x.inputs?.['mark'] ?? 0)} — ${formatMeasured('time', x.value, 0.01, locale)}`).join('; ') });
      const s = last.inputs?.['mark'] ?? 0;
      const v = s / last.value!;
      out.push({ id: `${bubble ? 'bv' : 'kv'}:${i}`, title: uk ? `${what}: швидкість` : `${what}: the speed`, formula: 'v = l / t', numbers: `${n(s * 100)} ${uk ? 'см' : 'cm'} / ${formatMeasured('time', last.value, 0.01, locale)} ≈ ${v < 0.1 ? `${n(v * 100, 2)} ${uk ? 'см/с' : 'cm/s'}` : `${n(v, 2)} ${uk ? 'м/с' : 'm/s'}`}` });
      return;
    }
    // Induction: the milliammeter's swing and the EMF it gives, ε = I·R.
    if (c.type === 'lab.induct') {
      const R = r.inputs?.['resistance'] ?? 0;
      const move = String(c['move']);
      const fast = Number(c['time']) <= 0.5;
      const pace = fast ? (uk ? 'швидко' : 'fast') : uk ? 'повільно' : 'slowly';
      const what = move === 'still' ? (uk ? 'магніт нерухомо' : 'the magnet still') : move === 'out' ? (uk ? `витягли ${pace}` : `pulled out ${pace}`) : move === 'coil' ? (uk ? `котушку на магніт ${pace}` : `the coil onto the magnet ${pace}`) : uk ? `${c['pole'] === 'S' ? 'південним' : 'північним'} у котушку ${pace}` : `${c['pole'] === 'S' ? 'south' : 'north'} pole in ${pace}`;
      const mA = `${r.value > 0 ? '+' : ''}${n(r.value * 1000, 2)} ${uk ? 'мА' : 'mA'}`;
      if (move === 'still' || r.value === 0) out.push({ id: `iI:${i}`, title: what, formula: `I = ${mA}` });
      else out.push({ id: `iE:${i}`, title: what, formula: `I = ${mA}, ε = I·R`, numbers: `${n(Math.abs(r.value), 3)} ${uk ? 'А' : 'A'} · ${n(R, 2)} ${uk ? 'Ом' : 'Ω'} ≈ ${n(Math.abs(r.value) * R, 2)} ${uk ? 'В' : 'V'}` });
      return;
    }
    // The electromagnet: the compass's turn and the field it gives, B = B_Earth·tg θ.
    if (c.type === 'lab.magnet') {
      const m = e.trace.find((x): x is MeasurementRecord => x.kind === 'measurement' && x.quantity === 'angle');
      if (!m || m.value === null) return;
      const I = Number(c['current']);
      const earth = m.inputs?.['earth'] ?? 19.4e-6;
      const what = I === 0 ? (uk ? 'без струму' : 'no current') : `${n(I, 2)} ${uk ? 'А' : 'A'}${c['reversed'] ? (uk ? ', струм в інший бік' : ', reversed') : ''}${c['core'] ? '' : uk ? ', без цвяха' : ', no nail'}`;
      if (I === 0) {
        const where = c['place'] ? ` (${String(c['place'])}${c['example'] ? (uk ? ', для прикладу' : ', for example') : ''})` : '';
        out.push({ id: 'm0', title: uk ? `компас ${what}` : `the compass, ${what}`, formula: `θ = ${m.value}°` });
        out.push({ id: 'mE', title: uk ? `поле Землі${where}` : `the Earth’s field${where}`, formula: `B_З ≈ ${n(earth * 1e6)} ${uk ? 'мкТл' : 'µT'}` });
        return;
      }
      const key = `${I}${c['reversed'] ? 'r' : ''}${c['core'] ? '' : 'n'}`;
      out.push({ id: `mB:${key}`, title: uk ? `поле електромагніта: ${what}` : `the electromagnet’s field: ${what}`, formula: `θ = ${n(m.value)}°, B = B_З·tg θ`, numbers: `${n(earth * 1e6)} ${uk ? 'мкТл' : 'µT'} · tg ${n(m.value)}° ≈ ${n(earth * Math.tan((m.value * Math.PI) / 180) * 1e6, 2)} ${uk ? 'мкТл' : 'µT'}` });
      return;
    }
    // Pascal's device: the bottom's area; for each vessel the water's weight and the force on the bottom.
    if (c.type === 'lab.vessel') {
      const recs = e.trace.filter((x): x is MeasurementRecord => x.kind === 'measurement');
      if (c['step'] === 'bottom') {
        vesselArea = Math.PI * (r.value / 2) ** 2;
        out.push({ id: 'vS', title: uk ? 'площа дна' : 'the bottom’s area', formula: 'S = π·d² / 4', numbers: `${n(Math.PI)} · (${n(r.value * 100)} ${uk ? 'см' : 'cm'})² / 4 ≈ ${n(vesselArea * 1e4)} ${uk ? 'см²' : 'cm²'}` });
        return;
      }
      const V = recs.find((x) => x.quantity === 'volume');
      const M = recs.find((x) => x.quantity === 'length');
      if (!V || !M || V.value === null || M.value === null) return;
      const rho = M.inputs?.['rho'] ?? 1000;
      const g = M.inputs?.['g'] ?? 9.81;
      const shape = String(c['shape']);
      const what = { straight: uk ? 'пряма посудина' : 'the straight vessel', wide: uk ? 'посудина, що розширюється' : 'the widening vessel', narrow: uk ? 'посудина, що звужується' : 'the narrowing vessel' }[shape] ?? shape;
      out.push({ id: `vP:${shape}`, title: uk ? `${what}: вага води` : `${what}: the water’s weight`, formula: 'P = ρ·g·V', numbers: `${n(rho, 4)} · ${n(g)} · ${n(V.value * 1e6)}·10⁻⁶ ≈ ${n(rho * g * V.value, 2)} ${uk ? 'Н' : 'N'}` });
      if (vesselArea) out.push({ id: `vF:${shape}`, title: uk ? `${what}: сила тиску на дно` : `${what}: the force on the bottom`, formula: 'F = ρ·g·Δh·S', numbers: `${n(rho, 4)} · ${n(g)} · ${n(M.value, 3)} · ${n(vesselArea * 1e4)}·10⁻⁴ ≈ ${n(rho * g * M.value * vesselArea, 2)} ${uk ? 'Н' : 'N'}` });
      return;
    }
    // The syringe: the plunger's area from its scale, the barometer, and the pressure each pull gives.
    if (c.type === 'lab.atm') {
      if (c['step'] === 'scale') {
        atmScale = r.value;
        out.push({ id: 'atS', title: uk ? 'площа поршня зі шкали (1 мл)' : 'the plunger’s area from the scale (1 mL)', formula: 'S = V / l', numbers: `1 ${uk ? 'мл' : 'mL'} / ${n(r.value * 100)} ${uk ? 'см' : 'cm'} ≈ ${n(1 / (r.value * 100), 3)} ${uk ? 'см²' : 'cm²'}` });
        return;
      }
      if (c['step'] === 'barometer') {
        out.push({ id: 'atB', title: uk ? 'барометр' : 'the barometer', formula: `p₀ = ${formatMeasured('pressure', r.value, 100, locale)} = ${n(r.value, 4)} ${uk ? 'Па' : 'Pa'}` });
        return;
      }
      if (c['step'] === 'open') {
        out.push({ id: 'atO', title: uk ? 'носик відкритий' : 'the nozzle open', formula: `F = ${formatMeasured('force', r.value, 0.1, locale)}` });
        return;
      }
      if (atmScale) {
        const v = Number(c['pulled']);
        out.push({ id: `pa:${v}`, title: uk ? `носик закритий, поршень до ${n(v)} мл` : `the nozzle shut, the plunger to ${n(v)} mL`, formula: 'p = F·l / V', numbers: `${n(r.value, 2)} ${uk ? 'Н' : 'N'} · ${n(atmScale, 3)} ${uk ? 'м' : 'm'} / 10⁻⁶ ${uk ? 'м³' : 'm³'} ≈ ${n((r.value * atmScale) / 1e-6, 3)} ${uk ? 'Па' : 'Pa'}` });
      }
      return;
    }
    // The hydraulic machine: the pistons' areas, the force each load needed, the gain; the travel.
    if (c.type === 'lab.press') {
      const recs = e.trace.filter((x): x is MeasurementRecord => x.kind === 'measurement');
      const cmT = (m: number) => `${n(m * 100)} ${uk ? 'см' : 'cm'}`;
      const N1 = (x: number) => formatMeasured('force', x, 0.1, locale);
      if (c['step'] === 'diameters') {
        const d1 = recs.find((x) => x.inputs?.['which'] === 1)?.value ?? 0;
        const d2 = recs.find((x) => x.inputs?.['which'] === 2)?.value ?? 0;
        pressAreas = d1 > 0 ? (d2 / d1) ** 2 : null;
        out.push({ id: 'pd', title: uk ? 'діаметри поршнів' : 'the pistons’ diameters', formula: `d₁ = ${cmT(d1)}, d₂ = ${cmT(d2)}` });
        if (pressAreas) out.push({ id: 'pS', title: uk ? 'у скільки разів більша площа широкого' : 'how many times larger the wide one’s area', formula: 'S₂ / S₁ = (d₂ / d₁)²', numbers: `(${n(d2 * 100)} / ${n(d1 * 100)})² ≈ ${n(pressAreas, 2)}` });
        return;
      }
      if (c['step'] === 'lift') {
        const F2 = r.inputs?.['load'] ?? 0;
        out.push({ id: `pF:${c['weights']}`, title: uk ? `${c['weights']} ${Number(c['weights']) === 1 ? 'тягарець' : Number(c['weights']) < 5 ? 'тягарці' : 'тягарців'} на широкому поршні` : `${c['weights']} weights on the wide piston`, formula: `F₂ = ${N1(F2)}, F₁ = ${N1(r.value)}` });
        if (r.value > 0) out.push({ id: `gain:${c['weights']}`, title: uk ? 'виграш у силі' : 'the gain in force', formula: 'F₂ / F₁', numbers: `${n(F2, 2)} / ${n(r.value, 2)} ≈ ${n(F2 / r.value, 2)}` });
        return;
      }
      out.push({ id: 'pl', title: uk ? 'вузький поршень на 6 см униз — широкий угору на' : 'the narrow piston 6 cm down — the wide one up by', formula: `l₂ = ${cmT(r.value)}` });
      return;
    }
    // The U-tube: water alone — its levels alike; with oil — both columns above the boundary, and the oil's density.
    if (c.type === 'lab.utube') {
      const ml = Number(c['poured']);
      const recs = e.trace.filter((x): x is MeasurementRecord => x.kind === 'measurement');
      const cmT = (m: number) => `${n(m * 100)} ${uk ? 'см' : 'cm'}`;
      if (ml === 0) {
        out.push({ id: 'u0', title: uk ? 'сама вода: різниця рівнів у колінах' : 'water alone: the levels’ difference', formula: `Δh = ${cmT(r.value)}` });
        return;
      }
      const hO = recs.find((x) => x.inputs?.['which'] === 1)?.value ?? 0;
      const hW = recs.find((x) => x.inputs?.['which'] === 0)?.value ?? 0;
      const rhoW = r.inputs?.['rhoWater'] ?? 997;
      out.push({ id: `uh:${ml}`, title: uk ? `олії ${ml} мл: висоти над межею` : `${ml} mL of oil: the heights above the boundary`, formula: `h_${uk ? 'олії' : 'oil'} = ${cmT(hO)}, h_${uk ? 'води' : 'water'} = ${cmT(hW)}` });
      if (hO > 0) out.push({ id: `rhoU:${ml}`, title: uk ? `густина олії (${ml} мл)` : `the oil’s density (${ml} mL)`, formula: uk ? 'ρ_олії = ρ_води·h_води / h_олії' : 'ρ_oil = ρ_water·h_water / h_oil', numbers: `${n(rhoW, 4)} · ${n(hW * 100)} / ${n(hO * 100)} ≈ ${n((rhoW * hW) / hO, 3)} ${uk ? 'кг/м³' : 'kg/m³'}` });
      return;
    }
    // The pressure at a depth: the manometer's Δh gives p = ρ_water·g·Δh, and over the depth — the liquid's density.
    if (c.type === 'lab.depth') {
      const h = Number(c['depth']);
      const side = !!c['sideways'];
      const rhoM = r.inputs?.['rhoManometer'] ?? 1000;
      const g = r.inputs?.['g'] ?? 9.81;
      const p = rhoM * g * r.value;
      const cmT = (m: number) => `${n(m * 100)} ${uk ? 'см' : 'cm'}`;
      const where = side ? (uk ? `, плівкою вбік` : ', film sideways') : '';
      out.push({ id: `dp:${side ? 's' : ''}${Math.round(h * 1000)}`, title: uk ? `тиск на глибині ${cmT(h)}${where}` : `the pressure at ${cmT(h)}${where}`, formula: 'p = ρ_води·g·Δh', numbers: `${n(rhoM, 4)} · ${n(g)} · ${n(r.value, 3)} ≈ ${n(p, 3)} ${uk ? 'Па' : 'Pa'}` });
      if (!side) out.push({ id: `rhoD:${Math.round(h * 1000)}`, title: uk ? `густина рідини (з глибини ${cmT(h)})` : `the liquid’s density (from ${cmT(h)})`, formula: 'ρ = p / (g·h)', numbers: `${n(p, 3)} / (${n(g)} · ${n(h)}) ≈ ${n(p / (g * h), 3)} ${uk ? 'кг/м³' : 'kg/m³'}` });
      return;
    }
    // The black box: the current at this voltage, one way or turned round, and the circuit's resistance R = U / I.
    if (c.type === 'lab.box') {
      const U = Number(c['source']);
      const back = !!c['reversed'];
      const div = r.inputs?.['division'] ?? 0.0001;
      const mA = `${n(r.value * 1000, 3)} ${uk ? 'мА' : 'mA'}`;
      const way = back ? (uk ? ', скринька перевернута' : ', the box turned round') : '';
      out.push({ id: `box:${back ? 'b' : 'a'}${U}`, title: uk ? `струм за ${n(U)} В${way}` : `the current at ${n(U)} V${way}`, formula: `I = ${mA}` });
      if (r.value >= div) out.push({ id: `boxR:${back ? 'b' : 'a'}${U}`, title: uk ? `опір кола${way}` : `the circuit’s resistance${way}`, formula: 'R = U / I', numbers: `${n(U)} ${uk ? 'В' : 'V'} / ${n(r.value * 1000, 3)} ${uk ? 'мА' : 'mA'} ≈ ${n(U / r.value, 2)} ${uk ? 'Ом' : 'Ω'}` });
      else out.push({ id: `boxR:${back ? 'b' : 'a'}${U}`, title: uk ? `опір кола${way}` : `the circuit’s resistance${way}`, formula: uk ? 'I ≈ 0 → R дуже великий' : 'I ≈ 0 → R very large' });
      return;
    }
    // The coil in the water on the multimeter: its resistance at this temperature, and — once warmer than at the
    // start — the temperature coefficient α = (R − R₀) / (R₀·Δt). (R₀ is its reading at 20 °C, where it starts.)
    if (c.type === 'lab.ohm') {
      const t = r.inputs?.['temperature'] ?? 20;
      const div = r.inputs?.['division'] ?? 0.01;
      const Om = (x: number) => formatMeasured('resistance', x, div, locale);
      const key = Math.round(t);
      out.push({ id: `ohm:${key}`, title: uk ? `опір котушки за ${n(t, 3)} °C` : `the coil’s resistance at ${n(t, 3)} °C`, formula: `R = ${Om(r.value)}` });
      const r0 = Math.round((r.inputs?.['r20'] ?? 0) / div) * div;
      const dt = t - 20;
      if (dt > 1 && r0 > 0) out.push({ id: `alphaT:${key}`, title: uk ? `температурний коефіцієнт опору (нагріли на ${n(dt, 3)} °C)` : `the temperature coefficient (warmed by ${n(dt, 3)} °C)`, formula: 'α = (R − R₀) / (R₀·Δt)', numbers: `(${n(r.value, 4)} − ${n(r0, 4)}) / (${n(r0, 4)} · ${n(dt, 3)}) ≈ ${n((r.value - r0) / (r0 * dt), 2)} ${uk ? '1/°C' : '1/°C'}` });
      return;
    }
    // The cathode on the balance: before the current, then after — the copper it gained, and k = Δm / (I·t).
    if (c.type === 'lab.cathode') {
      const g = (kg: number) => formatMeasured('mass', kg, 0.00001, locale);
      const metal = r.inputs?.['metal'] ?? 0;
      if (metal <= 0) {
        out.push({ id: `cath1:${i}`, title: uk ? 'маса катода до досліду' : 'the cathode before', formula: `m₁ = ${g(r.value)}` });
        return;
      }
      // (The weighing before is the plate without what settled since — the same reading as then.)
      const div = r.inputs?.['division'] ?? 0.00001;
      const before = Math.round((r.exact - metal) / div) * div;
      const dm = r.value - before;
      const q = r.inputs?.['charge'] ?? 0;
      const t = r.inputs?.['time'] ?? 0;
      const I = t > 0 ? q / t : 0;
      out.push({ id: `cath2:${i}`, title: uk ? 'маса катода після досліду' : 'the cathode after', formula: `m₂ = ${g(r.value)}` });
      out.push({ id: `dm:${i}`, title: uk ? 'маса міді, що осіла на катоді' : 'the copper settled on the cathode', formula: 'Δm = m₂ − m₁', numbers: `${g(r.value)} − ${g(before)} = ${g(dm)}` });
      if (I > 0) out.push({ id: `kEq:${i}`, title: uk ? `електрохімічний еквівалент (I ≈ ${n(I, 2)} А, t = ${n(t / 60, 3)} хв)` : `the electrochemical equivalent (I ≈ ${n(I, 2)} A, t = ${n(t / 60, 3)} min)`, formula: 'k = Δm / (I·t)', numbers: `${n(dm * 1e6, 3)} ${uk ? 'мг' : 'mg'} / (${n(I, 2)} ${uk ? 'А' : 'A'} · ${n(t, 4)} ${uk ? 'с' : 's'}) ≈ ${n((dm * 1e6) / (I * t), 2)} ${uk ? 'мг/Кл' : 'mg/C'}` });
      return;
    }
    // The motion bench: a path by the tape, times by the stopwatch — speeds and periods.
    const sec = (x: number) => formatMeasured('time', x, 0.01, locale);
    if (c.type === 'lab.tape') {
      tapePath = r.value;
      out.push({ id: `tape:${i}`, title: c['what'] === 'path' ? (uk ? 'шлях кульки — від позначки до циліндра' : 'the ball’s path — from the mark to the cylinder') : uk ? 'довжина маятника' : 'the length of the pendulum', formula: `l = ${cm(r.value)}` });
      return;
    }
    if (c.type === 'lab.roll') {
      const path = Number(c['path']);
      // Half the path: half of what the tape measured.
      const l = tapePath === null ? path : path < tapePath - 1e-9 ? tapePath / 2 : tapePath;
      const half = tapePath !== null && path < tapePath - 1e-9;
      out.push({ id: `roll:${i}`, title: half ? (uk ? 'середня швидкість на першій половині шляху' : 'the average speed on the first half of the path') : uk ? 'середня швидкість кульки на всьому шляху' : 'the ball’s average speed on the whole path', formula: 'v = l / t', numbers: `${n(l)} ${uk ? 'м' : 'm'} / ${sec(r.value)} ≈ ${n(l / r.value, 2)} ${uk ? 'м/с' : 'm/s'}` });
      return;
    }
    if (c.type === 'lab.whirl') {
      const N = Number(c['turns']);
      const T = r.value / N;
      const R = r.inputs?.['radius'] ?? 0.15;
      out.push({ id: `T:${i}`, title: uk ? `період обертання (нитка ${cm(Number(c['thread']))})` : `the period of turning (thread ${cm(Number(c['thread']))})`, formula: 'T = t / N', numbers: `${sec(r.value)} / ${N} ≈ ${sec(T)}` });
      out.push({ id: `n:${i}`, title: uk ? 'обертова частота' : 'the frequency', formula: 'n = N / t', numbers: `${N} / ${sec(r.value)} ≈ ${n(N / r.value, 2)} ${uk ? 'об/с' : 'rev/s'}` });
      out.push({ id: `vc:${i}`, title: uk ? 'швидкість тіла на колі' : 'the body’s speed on the circle', formula: 'v = 2πR / T', numbers: `2π · ${n(R)} ${uk ? 'м' : 'm'} / ${sec(T)} ≈ ${n((2 * Math.PI * R) / T, 2)} ${uk ? 'м/с' : 'm/s'}` });
      return;
    }
    if (c.type === 'lab.swing') {
      const N = Number(c['count']);
      out.push({ id: `Tp:${i}`, title: uk ? `період: ${cm(Number(c['length']))}, відхилення ${cm(Number(c['amplitude']))}, кулька ${Math.round(Number(c['mass']) * 1000)} г` : `the period: ${cm(Number(c['length']))}, ${cm(Number(c['amplitude']))} aside, a ${Math.round(Number(c['mass']) * 1000)} g ball`, formula: 'T = t / N', numbers: `${sec(r.value)} / ${N} ≈ ${sec(r.value / N)}` });
      return;
    }
    if (c.type === 'lab.edge') {
      edges[Number(c['edge'])] = r.value;
      out.push({ id: `edge:${i}`, title: uk ? ['довжина бруска', 'ширина бруска', 'висота бруска'][Number(c['edge'])]! : ['the block’s length', 'its width', 'its height'][Number(c['edge'])]!, formula: `${['a', 'b', 'c'][Number(c['edge'])]} = ${cm(r.value)}` });
      const P = [...airByBody.values()].pop();
      const [a, b, h] = edges;
      if (a !== undefined && b !== undefined && h !== undefined && P !== undefined && P !== null) {
        const faces: [string, number][] = [[uk ? 'найбільша грань' : 'the largest face', a * b], [uk ? 'бічна грань' : 'the side face', a * h], [uk ? 'найменша грань' : 'the smallest face', b * h]];
        for (const [name, S] of faces) out.push({ id: `pressure:${i}:${name}`, title: uk ? `тиск бруска: ${name}` : `the block’s pressure: ${name}`, formula: 'p = P / S', numbers: `${formatMeasured('force', P, 0.1, locale)} / ${n(S * 1e4)} ${uk ? 'см²' : 'cm²'} ≈ ${n(P / S)} ${uk ? 'Па' : 'Pa'}` });
      }
      return;
    }
    if (r.quantity === 'volume' && liquidVolume === null && emptyVessel !== null) {
      liquidVolume = r.value;
      // (The reading's own line follows below; the density is written once the mass is known too.)
    }
    if (r.quantity === 'volume') {
      const div = r.inputs?.['division'] ?? 1e-6;
      // Written down as in a lab notebook: V₁ = 50 мл, then V₂…
      out.push({ id: `recV:${i}`, title: uk ? (addedSince.v ? 'рівень після того, як опустили тіло' : 'рівень рідини за поділками') : addedSince.v ? 'the level after the body went in' : 'the level by the marks', formula: `V${sub(++count.volume)} = ${formatMeasured('volume', r.value, div, locale)}` });
      if (lastV && addedSince.v) {
        const dv = r.value - lastV.v;
        body = { ...body, v: dv };
        out.push({ id: `vol:${i}`, title: uk ? 'на скільки піднялася рідина — об’єм витісненої води' : 'how far the liquid rose — the volume of water pushed aside', formula: 'V = V₂ − V₁', numbers: `${formatMeasured('volume', r.value, div, locale)} − ${formatMeasured('volume', lastV.v, div, locale)} = ${formatMeasured('volume', dv, div, locale)}` });
      }
      // Read again with nothing put in since — after melting, warming…: did the level change?
      if (lastV && !addedSince.v && e.time > lastV.at + 1e-9) {
        out.push({ id: `dV:${i}`, title: uk ? 'як змінився рівень' : 'how the level changed', formula: `ΔV = V${sub(count.volume)} − V${sub(count.volume - 1)}`, numbers: `${formatMeasured('volume', r.value, div, locale)} − ${formatMeasured('volume', lastV.v, div, locale)} = ${formatMeasured('volume', r.value - lastV.v, div, locale)}` });
      }
      lastV = { v: r.value, div, at: e.time };
      addedSince = { ...addedSince, v: false };
    } else if (r.quantity === 'mass') {
      const scale = r.instrument;
      out.push({ id: `recM:${i}`, title: uk ? (addedSince.m ? (dissolvedAdded ? 'покази терезів разом із доданою речовиною' : 'покази терезів разом із тілом') : 'покази терезів') : addedSince.m ? (dissolvedAdded ? 'the scales with the substance added' : 'the scales with the body') : 'the scales', formula: `m${sub(++count.mass)} = ${formatReading(scale as ScaleId, r.value, locale)}` });
      if (lastM && addedSince.m && lastM.scale === scale) {
        const dm = r.value - lastM.m;
        body = { ...body, m: dm };
        out.push({ id: `mass:${i}`, title: dissolvedAdded ? (uk ? 'маса доданої речовини — на скільки збільшилися покази терезів' : 'the mass of the substance added — how much the reading grew') : uk ? 'маса тіла — на скільки збільшилися покази терезів' : 'the mass of the body — how much the reading grew', formula: 'm = m₂ − m₁', numbers: `${formatReading(scale as ScaleId, r.value, locale)} − ${formatReading(scale as ScaleId, lastM.m, locale)} = ${formatReading(scale as ScaleId, dm, locale)}` });
      }
      lastM = { m: r.value, scale };
      addedSince = { ...addedSince, m: false };
    } else if (r.quantity === 'force') {
      const key = `${String(c['substance'])}:${String(c['mass'])}`;
      const g = r.inputs?.['g'] ?? 9.80665;
      const N = (x: number) => formatMeasured('force', x, 0.01, locale);
      if (c['into'] === 'air') {
        airByBody.set(key, r.value);
        out.push({ id: `P:${i}`, title: uk ? 'вага тіла у повітрі' : 'the weight of the body in the air', formula: 'P = m·g', numbers: `${n(Number(c['mass']))} · ${n(g, 3)} ≈ ${N(Number(c['mass']) * g)} (${uk ? 'динамометр' : 'dynamometer'}: ${formatMeasured('force', r.value, 0.1, locale)})` });
      } else {
        const air = airByBody.get(key);
        if ((r.inputs?.['share'] ?? 1) < 1) {
          out.push({ id: `float:${i}`, title: uk ? 'тіло плаває: архімедова сила зрівнялася з вагою' : 'the body floats: the buoyant force equals its weight', formula: 'F_A = P', numbers: `ρ_т < ρ_р: ${n(Number(c['mass']) / (r.inputs?.['volume'] ?? 1))} < ${n(r.inputs?.['rhoLiquid'] ?? 1000)} ${uk ? 'кг/м³' : 'kg/m³'}` });
          return;
        }
        if (air !== undefined) out.push({ id: `FA:${i}`, title: uk ? 'архімедова сила — за показами динамометра' : 'the buoyant force — from the dynamometer', formula: 'F_A = P − P′', numbers: `${formatMeasured('force', air, 0.1, locale)} − ${formatMeasured('force', r.value, 0.1, locale)} = ${formatMeasured('force', air - r.value, 0.1, locale)}` });
        const rho = r.inputs?.['rhoLiquid'];
        const V = r.inputs?.['volume'];
        if (rho && V) out.push({ id: `FAr:${i}`, title: uk ? 'архімедова сила — за законом Архімеда' : 'the buoyant force — by Archimedes', formula: 'F_A = ρ·g·V', numbers: `${n(rho)} · ${n(g, 3)} · ${n(V)} ≈ ${N(rho * g * V)}` });
      }
    }
    // Both the mass and the volume of the body are known: its density.
    if (body.m !== undefined && body.v !== undefined && body.v > 0) {
      const rho = body.m / body.v;
      // A closed hollow body (a stoppered test tube with sand): its density is the mean one, not a substance's.
      const hollow = log.some((e) => e.ok && e.command.type === 'thermal.add' && (e.command as { volume?: number }).volume);
      out.push({ id: `rho:${i}`, title: hollow ? (uk ? 'середня густина тіла' : 'the mean density of the body') : uk ? 'густина речовини тіла' : 'the density of the body', formula: 'ρ = m / V', numbers: `${n(body.m * 1000)} ${uk ? 'г' : 'g'} / ${n(body.v * 1e6)} ${uk ? 'см³' : 'cm³'} ≈ ${n(rho / 1000)} ${uk ? 'г/см³' : 'g/cm³'} = ${n(rho)} ${uk ? 'кг/м³' : 'kg/m³'}` });
      body = {};
    }
    liquidDensityLine(i);
  });
  return out;
}
