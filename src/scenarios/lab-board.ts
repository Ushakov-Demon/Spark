import type { ExperimentLogEntry } from '../core/experiment.js';
import type { SystemState } from '../core/state.js';
import { tr } from '../knowledge/i18n.js';
import { ZERO_CELSIUS_IN_KELVIN } from '../core/units.js';
import { isSupply } from '../domains/electrical/entities.js';
import { bodyEnergy, bodyMass, isBurner, isHeater, isThermalBody, type ThermalBody } from '../domains/thermal/entities.js';
import { sig } from '../explain/format.js';
import type { Locale } from '../knowledge/i18n.js';
import { COMPONENTS } from '../components/index.js';
import { SUBSTANCES } from '../substances/catalog.js';
import { formatReading, weigh } from './weighing.js';
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
  const kJ = (j: number) => (Math.abs(j) >= 1e4 ? `${n(j / 1000)} ${uk ? 'кДж' : 'kJ'}` : `${n(j)} ${uk ? 'Дж' : 'J'}`);
  const out: BoardLine[] = [];
  if (!states.length) return out;
  const name = (uk ? (sub.genitive?.uk ?? sub.name.uk) : sub.name.en).toLowerCase();
  const iceName = uk ? 'льоду' : 'ice';

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
          title: dm > 0 ? (uk ? `кристалізація${over ? `: замерзло ${n(m * 1000)} г` : ''}` : `freezing${over ? `: ${n(m * 1000)} g froze` : ''}`) : uk ? `плавлення${over ? `: розтануло ${n(m * 1000)} г` : ''}` : `melting${over ? `: ${n(m * 1000)} g melted` : ''}`,
          formula: 'Q = λ·m',
          ...(over ? { numbers: `${n(lambda)} · ${n(m)} ≈ ${kJ(lambda * m)}` } : {}),
        });
      }
    } else {
      const c = ph === 'solid' ? (b.state.mixture ? COMPONENTS.water.phases.solid?.specificHeat?.value : sub.freezing?.solidSpecificHeat.value) : sub.liquid.specificHeat.value;
      // Heat flow only: a jump at the moment something was poured in (mixing) is not warming.
      let dT = 0;
      for (let j = Math.max(1, start); j < i; j++) dT += jumpless(j);
      const m = bodyMass(b);
      if (c && Math.abs(dT) >= 0.05) {
        const what = ph === 'solid' ? iceName : name;
        out.push({
          id,
          title: dT > 0 ? (uk ? `нагрівання ${what}` : `warming the ${what}`) : uk ? `охолодження ${what}` : `cooling the ${what}`,
          formula: 'Q = c·m·Δt',
          ...(over ? { numbers: `${n(c)} · ${n(m)} · ${n(Math.abs(dT), 2)} ≈ ${kJ(c * m * Math.abs(dT))}` } : {}),
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
  const pieces = Object.values(lastState.entities).filter((e): e is ThermalBody => isThermalBody(e) && e.id.startsWith(`${SAMPLE_ID}+`) && !('phase' in e.params && e.params.phase));
  let given = 0;
  let taken = 0;
  for (const piece of pieces) {
    const from = states.find((s) => s.entities[piece.id]);
    const p0 = from?.entities[piece.id];
    if (!p0 || !isThermalBody(p0)) continue;
    const dT = C(piece.state.temperature) - C(p0.state.temperature);
    const c = piece.params.specificHeat;
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
      ...(finished ? { numbers: `${n(c)} · ${n(m)} · ${n(Math.abs(dT), 3)} ≈ ${kJ(q)}` } : {}),
    });
  }
  if (finished && pieces.length && phaseOf(sampleBody) === 'liquid' && phaseOf(bodies[0]!) === 'liquid') {
    // The liquid's own share, from the start of the step to the end (no phase change in it).
    const dT = C(sampleBody.state.temperature) - C(bodies[0]!.state.temperature);
    const q = sub.liquid.specificHeat.value * bodyMass(sampleBody) * Math.abs(dT);
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

  // The latest weighing: what the scales show is the vessel plus what is in it.
  const scale = weighed[weighed.length - 1];
  if (scale) {
    const w = weigh(states[states.length - 1]!, scale);
    if (w.reading !== null && w.tare !== null) {
      const g = (kg: number) => formatReading(scale, kg, locale);
      out.push({ id: 'weigh', title: uk ? 'зважування: посуд + вміст' : 'weighing: vessel + contents', formula: 'm = m₁ + m₂', numbers: `${g(w.tare)} + ${g(w.reading - w.tare)} = ${g(w.reading)}` });
    }
  }
  return out;
}
