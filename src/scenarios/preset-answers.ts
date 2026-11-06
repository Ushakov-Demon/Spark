import type { MeasurementRecord } from '../core/trace.js';
import { COMPONENTS, molarMass as molarMassOf, NACL_SOLUTE } from '../components/index.js';
import type { Command } from '../core/commands.js';
import type { ExperimentResult } from '../core/experiment.js';
import type { Simulation } from '../core/simulation.js';
import type { SystemState } from '../core/state.js';
import { ZERO_CELSIUS_IN_KELVIN } from '../core/units.js';
import { isSupply } from '../domains/electrical/entities.js';
import { FARADAY, GAS_CONSTANT } from '../domains/electrical/gases.js';
import { formatDuration, formatQuantity, sig } from '../explain/format.js';
import { tr, type Locale, type LocalizedText } from '../knowledge/i18n.js';
import { localized, msg, t as tl } from '../knowledge/messages.js';
import { paperTime, timeToGoal } from './lab-debrief.js';
import { LAB_VESSEL_ID, sampleOf, type LabParams, type LabStatus } from './thermal-lab.js';
import { formatReading, weigh } from './weighing.js';
import { SUBSTANCES } from '../substances/catalog.js';
import { formatMeasured } from './measuring.js';
import { onExperiment } from '../experiments/registry.js';
import { createCommandRegistry } from '../core/commands.js';
import { createExperimentSession } from '../core/experiment.js';
import { kilograms, seconds } from '../core/units.js';
import { bodyEnergy, isThermalBody } from '../domains/thermal/entities.js';
import { solubilityAt } from '../domains/thermal/mixture.js';
import { LAB_COMMANDS, type LabCommand } from './lab-knowledge.js';
import { labGoalReached, labSetup } from './thermal-lab.js';
import { stepLine, STEPS_END, WATER } from './preset-kit.js';

/**
 * Answers to the questions the ready-made experiments ask — built from what
 * really happened in this run (times, temperatures, how much froze, currents,
 * gases), comparing with a second run "in the mind" where the question is a
 * comparison. Physics facts used in the texts come from the component models.
 */
export interface PresetRun {
  /** Operation steps in order (additions are part of the state between them). */
  readonly steps: readonly { readonly params: LabParams; readonly result: ExperimentResult<Command>; readonly status: LabStatus }[];
  readonly simulation: Simulation;
  /** Everything measured during the experiment, in order (scales, marks, dynamometer). */
  readonly readings?: readonly { readonly command: { readonly type: string } & Record<string, unknown>; readonly record: MeasurementRecord }[];
}
/** Half a division of the 1 mL cylinder, m³: how far off the volume it gives may be. */
const CYLINDER_HALF_DIVISION = 0.5e-6;

export interface PresetAnswer {
  /** The Professor's short line. */
  readonly say: LocalizedText;
  /** The answer itself, a few sentences. */
  readonly text: LocalizedText;
  /** Which of the preset's choices this run proved right (absent — the run cannot tell). */
  readonly correct?: string;
  /** Other choices the run cannot tell from `correct`: picking one is right too. */
  readonly alsoCorrect?: readonly string[];
  /** Why it comes out so: the reasoning behind the result, at a pupil's level (not only the formula). */
  readonly why?: LocalizedText;
}

type Step = PresetRun['steps'][number];
const both = (f: (l: Locale) => string): LocalizedText => localized((l: Locale) => f(l));
const C = (k: number, l: Locale) => `${sig(k - ZERO_CELSIUS_IN_KELVIN, 3, l).replace('-', '−')} °C`;
const D = (s: number, l: Locale) => formatDuration(s, l);
/** Current in readable units: 27 мкА, 35 мА, 1,67 А. */
const A = (amps: number, l: Locale) =>
  amps < 1e-3 ? `${sig(amps * 1e6, 2, l)} ${tl(l, 'unit-sym-uA')}` : amps < 0.1 ? `${sig(amps * 1e3, 2, l)} ${tl(l, 'unit-sym-mA')}` : formatQuantity(amps, 'A', { locale: l, level: 'school' });
const Q = (v: number, unit: string, l: Locale) => formatQuantity(v, unit, { locale: l, level: 'school' });
const reachedAt = (s: Step) => (s.status.kind === 'reached' || s.status.kind === 'decomposes' ? s.status.at : s.result.final.time - s.result.initial.time);
const temp = (st: SystemState) => sampleOf(st).state.temperature;
const bodyMassOf = (st: SystemState) => { const b = sampleOf(st); return 'mixture' in b.state && b.state.mixture ? b.state.mixture.water + b.state.mixture.salt : b.params.mass; };
const K0 = ZERO_CELSIUS_IN_KELVIN;
const soluteMolarMass = (id: string) => molarMassOf(COMPONENTS[id as keyof typeof COMPONENTS]) ?? 1;
const LF_KJ = COMPONENTS.water.melting!.latentHeat!.value / 1000;
const CW = COMPONENTS.water.phases.liquid!.specificHeat!.value;

/** Seconds (from the step start) when ice first appeared, and the temperature then. */
function firstIce(s: Step): { at: number; T: number } | undefined {
  const x = s.result.samples.find((st) => (sampleOf(st).state.solidFraction ?? 0) > 0);
  return x ? { at: x.time - s.result.initial.time, T: temp(x) } : undefined;
}
/** How long the solid fraction was between 0 and 1 (a melting or freezing plateau), s. */
function plateau(s: Step): number {
  const samples = s.result.samples;
  let t = 0;
  for (let i = 1; i < samples.length; i++) {
    const f = sampleOf(samples[i]!).state.solidFraction ?? 0;
    if (f > 0 && f < 1) t += samples[i]!.time - samples[i - 1]!.time;
  }
  return t;
}
/** Mean current over a step, A, and the charge it carried, C. */
function current(s: Step): { amps: number; charge: number; time: number } {
  const a = Object.values(s.result.initial.entities).find(isSupply);
  const b = Object.values(s.result.final.entities).find(isSupply);
  if (!a || !b) return { amps: 0, charge: 0, time: 0 };
  const charge = b.state.charge - a.state.charge;
  const time = s.result.final.time - s.result.initial.time;
  return { amps: time > 0 ? charge / time : 0, charge, time };
}
const ratio = (a: number, b: number, l: Locale) => sig(a / Math.max(b, 1e-12), 2, l);

/** The temperature right after something was poured in: what the heat balance gives (from the log), or the step's start. */
function mixedAt(s: Step): number {
  for (const e of s.result.log) if (e.ok) for (const r of e.trace) if (r.kind === 'formula' && r.formula === 'thermal.equilibrium-temperature') return r.output;
  return temp(s.result.initial);
}
/** The block put into the liquid in this step: substance, mass and the temperature it went in at. */
/** Heat the calorimeter (the vessel and its lid) gave off during the step, J (negative — it took heat). */
function cupHeatGiven(s: Step): number {
  const e = (st: SystemState) => Object.values(st.entities).filter((x) => isThermalBody(x) && (x.id === LAB_VESSEL_ID || x.id === `${LAB_VESSEL_ID}.lid`)).reduce((a, x) => a + bodyEnergy(x as never), 0);
  return e(s.result.initial) - e(s.result.final);
}
function blockOf(s: Step): { substance: string; mass: number; temperature: number } | undefined {
  const last = Object.values(s.result.final.entities).find((e) => isThermalBody(e) && e.id.startsWith('sample+'));
  if (!last || !isThermalBody(last) || !last.params.substance) return undefined;
  const first = [s.result.initial, ...s.result.samples].map((x) => x.entities[last.id]).find((e) => e && isThermalBody(e));
  return first && isThermalBody(first) ? { substance: last.params.substance, mass: last.params.mass, temperature: first.state.temperature } : undefined;
}
/** The same setup "in the mind" with another block: the common temperature it would come to, K. */
function settleWith(p: LabParams, block: { substance: string; mass: number; temperature: number }, simulation: Simulation): number {
  const s = createExperimentSession<LabCommand>({ initial: labSetup(p).state, simulation, commands: createCommandRegistry<LabCommand>(LAB_COMMANDS as never), sampleEvery: seconds(60) });
  s.apply({ type: 'thermal.add', into: 'sample', substance: block.substance, mass: kilograms(block.mass), temperature: block.temperature as never });
  s.advance(3600, (x) => labGoalReached(p, x));
  return temp(s.state);
}

type Reading = NonNullable<PresetRun['readings']>[number];
const of = (run: PresetRun, q: MeasurementRecord['quantity']): Reading[] => (run.readings ?? []).filter((r) => r.record.quantity === q && r.record.value !== null);
const mL = (m3: number, l: Locale) => `${sig(m3 * 1e6, 3, l)} ${tl(l, 'unit-sym-mL')}`;
const g = (kg: number, l: Locale) => `${sig(kg * 1000, 4, l)} ${tl(l, 'unit-sym-g')}`;
/** A force as the dynamometer shows it: to its 0.1 N division. */
const N = (n: number, l: Locale) => formatMeasured('force', n, 0.1, l);
const ICE = COMPONENTS.water.phases.solid!.density!.value;
/** Densities of the metals a guess can be about, kg/m³ (from the component models). */
const METALS = { aluminium: COMPONENTS.aluminium, iron: COMPONENTS.iron, copper: COMPONENTS.copper, brass: COMPONENTS.brass } as const;

const LOCAL_ANSWERS: Readonly<Record<string, (run: PresetRun) => PresetAnswer>> = {
  'ice-level': (run) => {
    // V₁ — water alone, V₂ — with the cube floating, V₃ — when it has melted.
    const v = of(run, 'volume').map((x) => x.record);
    const [w, a, b] = v.length >= 3 ? [v[0], v[1], v[v.length - 1]] : [undefined, v[0], v[v.length - 1]];
    const div = a?.inputs?.['division'] ?? 1e-6;
    const d = a && b ? b.value! - a.value! : 0;
    const under = Math.round((ICE / WATER) * 100);
    // What the cube pushed aside (by the marks), the mass of that water — the ice's own — and the room the ice takes.
    const shown = w && a ? a.value! - w.value! : 0;
    const iceMass = shown * WATER;
    const iceVolume = iceMass / ICE;
    // As exact as the marks it comes from (a cylinder read to its division): «≈ 10 г», not «9,97 г».
    const gr = (kg: number, l: Locale) => `≈ ${sig(kg * 1000, 2, l)} ${tl(l, 'unit-sym-g')}`;
    return {
      why: msg('answer-ice-level-why'),
      say: msg('answer-ice-level-say'),
      text: both((l) =>
        tl(l, 'answer-ice-level-text-6', { value: a ? mL(a.value!, l) : '—', value2: b ? mL(b.value!, l) : '—', value3: w ? tl(l, 'answer-ice-level-text', { value: mL(w.value!, l) }) : '', shown: shown
                ? tl(l, 'answer-ice-level-text-2', { shown: mL(shown, l), iceMass: gr(iceMass, l), iceVolume: mL(iceVolume, l), under: String(under) })
                : tl(l, 'answer-ice-level-text-3', { under: String(under) }), iceMass: shown ? tl(l, 'answer-ice-level-text-4', { iceMass: gr(iceMass, l), shown: mL(shown, l) }) : tl(l, 'answer-ice-level-text-5') }),
      ),
      ...(a && b ? { correct: d > div / 2 ? 'up' : d < -div / 2 ? 'down' : 'same' } : {}),
    };
  },

  'resistance-temperature': (run) => {
    const rows = (run.readings ?? []).filter((x) => x.command.type === 'lab.ohm' && x.record.value !== null).map((x) => ({ R: x.record.value!, t: x.record.inputs?.['temperature'] ?? 20, div: x.record.inputs?.['division'] ?? 0.01 }));
    const first = rows[0];
    const last = rows[rows.length - 1];
    const ok = !!first && !!last && last !== first && last.t > first.t + 1;
    // α from the first and the last reading: by what share the resistance grew per degree.
    const alpha = ok ? (last!.R - first!.R) / (first!.R * (last!.t - first!.t)) : 0;
    const table = COMPONENTS.copper.electrical?.temperatureCoefficient?.value ?? 0.00393;
    const grew = ok && last!.R - first!.R > 2 * first!.div;
    const fell = ok && first!.R - last!.R > 2 * first!.div;
    const Om = (x: number, l: Locale) => formatMeasured('resistance', x, first?.div ?? 0.01, l);
    const deg = (x: number, l: Locale) => `${sig(x, 3, l)} °C`;
    const a = (x: number, l: Locale) => sig(x, 2, l);
    return {
      ...(ok ? { correct: grew ? 'grows' : fell ? 'falls' : 'same' } : {}),
      why: msg('answer-resistance-temperature-why'),
      say: both((l) => tl(l, 'answer-resistance-temperature-say', { t: deg(ok ? last!.t - first!.t : 0, l), alpha: a(alpha, l) })),
      text: both((l) => {
        const list = rows.map((x) => `${deg(x.t, l)}: R = ${Om(x.R, l)}`).map(stepLine).join(';') + STEPS_END;
        return tl(l, 'answer-resistance-temperature-text', { list, R: Om(last?.R ?? 0, l), R2: Om(first?.R ?? 0, l), t: deg(ok ? last!.t - first!.t : 0, l), alpha: a(alpha, l), table: a(table, l), alpha2: sig(alpha * 100, 2, l) });
      }),
    };
  },
  'electrochemical-equivalent': (run) => {
    const c = (run.readings ?? []).filter((x) => x.command.type === 'lab.cathode' && x.record.value !== null).map((x) => x.record);
    const [before, after] = [c[0], c[c.length - 1]];
    const ok = !!before && !!after && after !== before;
    const dm = ok ? after!.value! - before!.value! : 0;
    const q = after?.inputs?.['charge'] ?? 0;
    const t = after?.inputs?.['time'] ?? 0;
    const k = q > 0 ? dm / q : 0;
    // The table's: one copper atom per two electrons, k = M / (z·F).
    const table = (molarMassOf(COMPONENTS.copper) ?? 0.06355) / (2 * FARADAY);
    const mgC = (x: number, l: Locale) => `${sig(x * 1e6, 3, l)} ${tl(l, 'answer-electrochemical-equivalent-mg-c')}`;
    const g = (x: number, l: Locale) => formatMeasured('mass', x, 0.00001, l);
    return {
      ...(ok && q > 0 ? { correct: Math.abs(k - table) / table < 0.05 ? 'table' : k > table ? 'more' : 'less' } : {}),
      why: msg('answer-electrochemical-equivalent-why'),
      say: both((l) => tl(l, 'answer-electrochemical-equivalent-say', { k: mgC(k, l) })),
      text: both((l) =>
        tl(l, 'answer-electrochemical-equivalent-text', { before: ok ? g(before!.value!, l) : '—', after: ok ? g(after!.value!, l) : '—', dm: g(dm, l), q: sig(t > 0 ? q / t : 0, 2, l), t: D(t, l), q2: sig(q, 3, l), k: mgC(k, l), table: mgC(table, l) }),
      ),
    };
  },
  'floating-conditions': (run) => {
    // Three runs: m₁ (cylinder with water), the tube in, m₂ — so its mass; its volume from the level in run 1 (it lay on the bottom, all under water).
    const m = of(run, 'mass').map((x) => x.record.value ?? 0);
    const v = of(run, 'volume').map((x) => x.record);
    const masses = [0, 1, 2].map((k) => (m[2 * k + 1] ?? 0) - (m[2 * k] ?? 0));
    const div = v[1]?.inputs?.['division'] ?? 1e-6;
    const vol = v.length >= 2 ? v[1]!.value! - v[0]!.value! : 0;
    const rho = masses.map((x) => (vol > 0 ? x / vol : 0));
    // Within what the cylinder tells (half a division of its volume) — the density of water; above it, it sinks; below, it comes up.
    const err = WATER * (div / 2 / Math.max(vol, div));
    const kind = (r: number) => (r > WATER + err ? 'sinks' : r < WATER - err ? 'up' : 'inside');
    const kinds = rho.map(kind);
    const fits = kinds[0] === 'sinks' && kinds[1] === 'inside' && kinds[2] === 'up';
    const gcm = (r: number, l: Locale) => `${sig(r / 1000, 3, l)} ${tl(l, 'unit-sym-g-per-cm3')}`;
    const word = { sinks: msg('answer-word-sinks'), inside: msg('answer-word-inside'), up: msg('answer-word-up') } as const;
    const cmp = { sinks: '>', inside: '≈', up: '<' } as const;
    return {
      why: msg('answer-floating-conditions-why'),
      say: msg('answer-floating-conditions-say'),
      text: both((l) => {
        const runs = [0, 1, 2].map((k) => `${tl(l, 'answer-text-runs', { k: String(k + 1), masses: g(masses[k]!, l), rho: gcm(rho[k]!, l), cmp: cmp[kinds[k]!], word: word[kinds[k]!][l] })}`).map(stepLine).join(';') + STEPS_END;
        return tl(l, 'answer-floating-conditions-text', { vol: mL(vol, l), runs });
      }),
      ...(m.length >= 6 && vol > 0 ? { correct: fits ? 'density' : kinds[0] === 'sinks' ? 'mass' : 'volume' } : {}),
    };
  },
  'mystery-metal': (run) => {
    const m = of(run, 'mass');
    const v = of(run, 'volume');
    const dm = m.length >= 2 ? m[m.length - 1]!.record.value! - m[0]!.record.value! : 0;
    const dv = v.length >= 2 ? v[v.length - 1]!.record.value! - v[0]!.record.value! : 0;
    const rho = dv > 0 ? dm / dv : 0;
    // The nearest density among the solids on the shelf — what a look into the table gives.
    const solids = Object.values(SUBSTANCES).filter((x) => x.category === 'solid.metal' || x.category === 'solid.material');
    const nearest = solids.reduce((best, x) => (Math.abs(x.liquid.density.value - rho) < Math.abs(best.liquid.density.value - rho) ? x : best), solids[0]!);
    const real = Object.values(run.steps[run.steps.length - 1]!.result.final.entities).find((e) => isThermalBody(e) && e.id.startsWith('sample+'));
    const realId = real && isThermalBody(real) ? String(real.params.substance) : '';
    // Half a division of the cylinder on the volume: what lies within it cannot be told apart from what was measured.
    const within = dv > 0 ? solids.filter((x) => Math.abs(x.liquid.density.value - rho) <= (rho * CYLINDER_HALF_DIVISION) / dv).map((x) => x.id as string) : [];
    const guess = within.includes(realId) ? realId : nearest.id;
    const twins = within.filter((id) => id !== guess);
    const sub = (id: string) => (id in SUBSTANCES ? SUBSTANCES[id as keyof typeof SUBSTANCES] : undefined);
    const name = (id: string, l: Locale) => sub(id)?.name[l] ?? id;
    const rhoOf = (id: string) => sub(id)?.liquid.density.value ?? 0;
    return {
      why: both((l) => tl(l, 'answer-mystery-metal-why', { of: tr(sub(realId)?.genitive ?? sub(realId)?.name ?? nearest.name, l).toLowerCase(), rho: sig(rhoOf(realId) / 1000, 2, l) })),
      say: both((l) => tl(l, 'answer-mystery-metal-say', { realId: name(realId, l).toLowerCase() })),
      text: both((l) => {
        const main = tl(l, 'answer-mystery-metal-text', { dm: g(dm, l), dv: mL(dv, l), dv2: sig(dv * 1e6, 3, l), rho: sig(rho / 1000, 3, l), rho2: sig(rho, 3, l), guess: name(guess, l).toLowerCase(), guess2: sig(rhoOf(guess), 4, l), realId: name(realId, l).toLowerCase() });
        return twins.length ? `${main} ${tl(l, 'answer-mystery-metal-twin', { twin: name(twins[0]!, l).toLowerCase(), rho: sig(rhoOf(twins[0]!), 4, l) })}` : main;
      }),
      ...(dv > 0 && dm > 0 ? { correct: guess, ...(twins.length ? { alsoCorrect: twins } : {}) } : {}),
    };
  },
  supersaturated: ({ steps }) => {
    const acetate = (st: SystemState) => {
      const m = sampleOf(st).state.mixture;
      return { water: m?.water ?? 0, ...(m?.solutes.find((x) => x.component === 'sodium-acetate') ?? { mass: 0, crystals: 0 }) };
    };
    const temps = (st: (typeof steps)[number]) => [st.result.initial, ...st.result.samples, st.result.final].map((x) => sampleOf(x).state.temperature);
    const s = (t: number) => solubilityAt('sodium-acetate', t);
    // The step that cooled it (the one before the seed), and the one after the seed (the last).
    const cool = steps.length >= 2 ? steps[steps.length - 2] : undefined;
    const seeded = steps[steps.length - 1]!;
    const cooled = cool ? acetate(cool.result.final) : undefined;
    const tCool = cool ? sampleOf(cool.result.final).state.temperature : K0 + 22;
    const satCool = cooled ? (s(tCool - K0) / 100) * cooled.water : 0;
    const peak = Math.max(...temps(seeded));
    const after = acetate(seeded.result.final);
    const crystalsAtPeak = (() => {
      const states = [seeded.result.initial, ...seeded.result.samples, seeded.result.final];
      const hot = states.reduce((a, x) => (sampleOf(x).state.temperature > sampleOf(a).state.temperature ? x : a), states[0]!);
      return acetate(hot).crystals;
    })();
    const correct = !cooled ? undefined : cooled.crystals > 1e-5 ? 'on-cooling' : after.crystals <= 1e-5 ? 'nothing' : peak > tCool + 1 ? 'warm' : 'cold';
    return {
      ...(correct ? { correct } : {}),
      why: msg('answer-supersaturated-why'),
      say: both((l) => tl(l, 'answer-supersaturated-say', { peak: C(peak, l) })),
      text: both((l) =>
        tl(l, 'answer-supersaturated-text', { tCool: C(tCool, l), satCool: sig(satCool * 1000, 2, l), mass: sig((cooled?.mass ?? 0) / Math.max(satCool, 1e-9), 2, l), crystalsAtPeak: sig(crystalsAtPeak * 1000, 2, l), peak: C(peak, l) }),
      ),
    };
  },
  'heat-of-solution': ({ steps }) => {
    // Each beaker: what dissolved in it and how far its temperature went from where it started (the coldest or hottest moment).
    const beakers = steps.flatMap((st) => {
      const states = [st.result.initial, ...st.result.samples, st.result.final];
      const mix = sampleOf(st.result.final).state.mixture;
      const solute = mix?.solutes[0];
      if (!solute) return [];
      const ts = states.map((x) => sampleOf(x).state.temperature);
      const start = K0 + st.params.startTemp;
      const extreme = ts.reduce((a, t) => (Math.abs(t - start) > Math.abs(a - start) ? t : a), start);
      return [{ component: solute.component, mass: solute.mass, start, extreme, end: ts[ts.length - 1]! }];
    });
    const sign = (b: { start: number; extreme: number } | undefined) => (!b ? 0 : b.extreme < b.start - 0.5 ? -1 : b.extreme > b.start + 0.5 ? 1 : 0);
    const [a, b] = [beakers[0], beakers[1]];
    const correct = sign(a) < 0 && sign(b) < 0 ? 'both-cold' : sign(a) < 0 && sign(b) > 0 ? 'cold-hot' : sign(a) > 0 && sign(b) > 0 ? 'both-hot' : 'same';
    const name = (id: string, l: Locale) => (COMPONENTS[id as keyof typeof COMPONENTS]?.genitive?.[l] ?? id);
    const hs = (id: string) => COMPONENTS[id as keyof typeof COMPONENTS]?.inWater?.enthalpyOfSolution?.value ?? 0;
    const line = (x: (typeof beakers)[number], l: Locale) => {
      const moles = x.mass / soluteMolarMass(x.component);
      const q = Math.abs(moles * hs(x.component));
      const dt = x.extreme - x.start;
      return tl(l, 'answer-heat-of-solution-line-5', { mass: sig(x.mass * 1000, 2, l), component: name(x.component, l), moles: sig(moles, 2, l), q: sig(q, 2, l), value: hs(x.component) > 0 ? '+' : '−', component2: sig(Math.abs(hs(x.component)), 4, l), start: C(x.start, l), extreme: C(x.extreme, l), value2: hs(x.component) > 0 ? tl(l, 'answer-heat-of-solution-line') : tl(l, 'answer-heat-of-solution-line-2'), value3: dt < 0 ? tl(l, 'answer-heat-of-solution-line-3') : tl(l, 'answer-heat-of-solution-line-4') });
    };
    return {
      ...(a && b ? { correct } : {}),
      why: msg('answer-heat-of-solution-why'),
      say: msg('answer-heat-of-solution-say'),
      text: both((l) =>
        tl(l, 'answer-heat-of-solution-text', { value: beakers.map((x) => line(x, l)).join(' ') }),
      ),
    };
  },
  'grow-crystals': ({ steps }) => {
    const g3 = (kg: number, l: Locale) => `${sig(kg * 1000, 3, l)} ${tl(l, 'unit-sym-g')}`;
    const first = steps[0]!;
    // How hot it was heated (the first step's target).
    const hotT = first.params.target ?? 60;
    const last = steps[steps.length - 1]!;
    const cuso4 = (st: SystemState) => {
      const b = sampleOf(st);
      const mix = 'mixture' in b.state ? b.state.mixture : undefined;
      return { water: mix ? mix.water : 0, ...(mix?.solutes.find((x) => x.component === 'copper-sulfate') ?? { mass: 0, crystals: 0 }) };
    };
    const s = (t: number) => solubilityAt('copper-sulfate', t);
    // The copper sulfate is poured in within the first step; before heating, at the start temperature, the
    // water holds what the solubility allows and the rest lies on the bottom.
    const water0 = first.params.liters / 1000 * SUBSTANCES[first.params.substance].liquid.density.value;
    const total = cuso4(last.result.final).mass;
    const start = { water: water0, crystals: Math.max(0, total - (s(first.params.startTemp) / 100) * water0) };
    const hot = cuso4(first.result.final);
    const cold = cuso4(last.result.final);
    // Where the solution became saturated on the way down: crystals start to grow there.
    const t0 = [...Array(81).keys()].map((i) => 80 - i).find((t) => (s(t) / 100) * cold.water < cold.mass) ?? 20;
    const lost = start.water - cold.water;
    const correct = cold.crystals < 1e-4 ? 'none' : cold.crystals > cold.mass - 1e-4 ? 'all' : 'part';
    return {
      correct,
      why: msg('answer-grow-crystals-why'),
      say: both((l) => tl(l, 'answer-grow-crystals-say', { crystals: sig(cold.crystals * 1000, 3, l) })),
      text: both((l) =>
        tl(l, 'answer-grow-crystals-text-4', { value: sig(s(20), 3, l), crystals: g3(start.crystals, l), hotT: sig(hotT, 3, l), hotT2: sig(s(hotT), 3, l), t0: sig(t0, 2, l), mass: g3(cold.mass - cold.crystals, l), crystals2: g3(cold.crystals, l), value2: hot.crystals < 1e-4 ? tl(l, 'answer-grow-crystals-text') : tl(l, 'answer-grow-crystals-text-2', { crystals: g3(hot.crystals, l) }), lost: lost > 5e-4 ? tl(l, 'answer-grow-crystals-text-3', { lost: sig(lost * 1000, 2, l) }) : '' }),
      ),
    };
  },
  'mass-fraction': (run) => {
    const m = of(run, 'mass');
    const salt = m.length >= 2 ? m[m.length - 1]!.record.value! - m[0]!.record.value! : 0;
    // The water poured in; of the salt, as much as 20 °C water dissolves (all of it here: 5 g against ≈ 16 g).
    const p = run.steps[0]!.params;
    const water = (p.liters / 1000) * SUBSTANCES[p.substance].liquid.density.value;
    const dissolved = Math.min(salt, (solubilityAt('sodium-chloride', p.startTemp) / 100) * water);
    const w = water + dissolved > 0 ? (dissolved / (water + dissolved)) * 100 : 0;
    const options = [5, 10, 100 / 9, 50];
    const nearest = options.reduce((best, x) => (Math.abs(x - w) < Math.abs(best - w) ? x : best), options[0]!);
    const pct = (x: number, l: Locale) => `${sig(x, 3, l)} %`;
    return {
      why: msg('answer-mass-fraction-why'),
      say: both((l) => tl(l, 'answer-mass-fraction-say', { w: pct(w, l) })),
      text: both((l) =>
        tl(l, 'answer-mass-fraction-text', { salt: g(salt, l), water: g(water, l), dissolved: g(dissolved, l), water2: g(water + dissolved, l), w: pct(w, l), dissolved2: pct((dissolved / water) * 100, l) }),
      ),
      ...(salt > 0 && dissolved > 0 ? { correct: nearest === 100 / 9 ? '11' : String(nearest) } : {}),
    };
  },
  'archimedes-salt': (run) => {
    const f = of(run, 'force');
    const air = f.find((r) => r.command['into'] === 'air')?.record;
    const inLiquid = f.filter((r) => r.command['into'] === 'liquid').map((r) => r.record);
    const [fresh, salty] = [inLiquid[0], inLiquid[inLiquid.length - 1]];
    const F1 = air && fresh ? air.value! - fresh.value! : 0;
    const F2 = air && salty ? air.value! - salty.value! : 0;
    const rho2 = salty?.inputs?.['rhoLiquid'] ?? WATER;
    return {
      why: msg('answer-archimedes-salt-why'),
      say: msg('answer-archimedes-salt-say'),
      text: both((l) =>
        tl(l, 'answer-archimedes-salt-text', { value: air ? N(air.value!, l) : '—', value2: fresh ? N(fresh.value!, l) : '—', F1: N(F1, l), rho2: sig(rho2, 4, l), WATER: sig(WATER, 3, l), value3: salty ? N(salty.value!, l) : '—', F2: N(F2, l) }),
      ),
      ...(air && fresh && salty ? { correct: F2 > F1 + 0.05 ? 'salt' : F1 > F2 + 0.05 ? 'fresh' : 'same' } : {}),
    };
  },
  'mix-hot-cold': ({ steps }) => {
    const s = steps[0]!;
    const ideal = mixedAt(s);
    const real = temp(s.result.final);
    const t = reachedAt(s);
    return {
      why: msg('answer-mix-hot-cold-why'),
      say: both((l) => tl(l, 'answer-mix-hot-cold-say', { real: C(real, l) })),
      text: both((l) =>
        tl(l, 'answer-mix-hot-cold-text', { ideal: C(ideal, l), t: D(t, l), real: C(real, l) }),
      ),
      correct: real < ideal - 0.5 ? 'less' : real > ideal + 0.5 ? 'more' : 'fifty',
    };
  },
  'hydrostatic-weighing': (run) => {
    const f = of(run, 'force');
    const air = f.find((r) => r.command['into'] === 'air')?.record;
    const wet = [...f].reverse().find((r) => r.command['into'] === 'liquid')?.record;
    const P = air?.value ?? 0;
    const P2 = wet?.value ?? 0;
    const Fa = P - P2;
    const rhoL = wet?.inputs?.['rhoLiquid'] ?? WATER;
    const gg = air?.inputs?.['g'] ?? 9.81;
    const rho = Fa > 0 ? (P / Fa) * rhoL : 0;
    const solids = Object.values(SUBSTANCES).filter((x) => x.category === 'solid.metal' || x.category === 'solid.material');
    const nearest = solids.reduce((best, x) => (Math.abs(x.liquid.density.value - rho) < Math.abs(best.liquid.density.value - rho) ? x : best), solids[0]!);
    const name = (l: Locale) => nearest.name[l].toLowerCase();
    const err = Fa > 0 ? (0.05 / Fa + 0.05 / P) * 100 : 0;
    return {
      ...(Fa > 0 ? { correct: nearest.id } : {}),
      why: msg('answer-hydrostatic-weighing-why'),
      say: both((l) => tl(l, 'answer-hydrostatic-weighing-say', { l: name(l) })),
      text: both((l) =>
        tl(l, 'answer-hydrostatic-weighing-text', { P: N(P, l), P2: N(P2, l), Fa: N(Fa, l), Fa2: sig((Fa / (rhoL * gg)) * 1e6, 3, l), P3: sig((P / gg) * 1000, 3, l), rho: sig(rho, 3, l), l: name(l), density: sig(nearest.liquid.density.value, 4, l), err: sig(err, 2, l) }),
      ),
    };
  },
  'ice-latent-heat': ({ steps }) => {
    // The last step: the ice in the water of a calorimeter that has warmed up with it.
    const s = steps[steps.length - 1]!;
    const ice = blockOf(s);
    const mw = (s.params.liters / 1000) * WATER;
    const t1 = temp(s.result.initial) - K0;
    const th = temp(s.result.final) - K0;
    const mi = ice?.mass ?? 0.02;
    const ti = ice ? ice.temperature - K0 : -1;
    const ci = COMPONENTS.water.phases.solid!.specificHeat!.value;
    const cup = cupHeatGiven(s);
    const warmIce = ci * mi * (0 - ti) + CW * mi * th;
    const naive = (CW * mw * (t1 - th) - warmIce) / mi;
    const full = (CW * mw * (t1 - th) + cup - warmIce) / mi;
    const table = LF_KJ * 1000;
    const correct = Math.abs(naive - table) / table < 0.05 ? 'table' : naive < table ? 'less' : 'more';
    const kJ = (j: number, l: Locale) => `${sig(j / 1000, 3, l)} ${tl(l, 'unit-sym-kJ-per-kg')}`;
    return {
      correct,
      why: msg('answer-ice-latent-heat-why'),
      say: both((l) => (`λ ≈ ${kJ(naive, l)}!`)),
      text: both((l) =>
        tl(l, 'answer-ice-latent-heat-text-4', { t1: sig(t1, 3, l), th: sig(th, 3, l), CW: sig((CW * mw * (t1 - th)) / 1000, 3, l), warmIce: sig(warmIce / 1000, 2, l), naive: kJ(naive, l), table: kJ(table, l), cup: sig(cup / 1000, 2, l), full: kJ(full, l), value: correct === 'table' ? tl(l, 'answer-ice-latent-heat-text') : correct === 'less' ? tl(l, 'answer-ice-latent-heat-text-2') : tl(l, 'answer-ice-latent-heat-text-3') }),
      ),
    };
  },
  'specific-heat-metal': ({ steps }) => {
    const s = steps[0]!;
    const block = blockOf(s);
    const mw = (s.params.liters / 1000) * WATER;
    const t1 = s.params.startTemp;
    const th = temp(s.result.final) - K0;
    const mb = block?.mass ?? 0.1;
    const tb = block ? block.temperature - K0 : 100;
    const cup = -cupHeatGiven(s);
    const naive = (CW * mw * (th - t1)) / (mb * (tb - th));
    const full = (CW * mw * (th - t1) + cup) / (mb * (tb - th));
    const table = block ? (COMPONENTS[block.substance as keyof typeof COMPONENTS]?.phases.solid?.specificHeat?.value ?? 0) : 0;
    const correct = Math.abs(naive - table) / table < 0.05 ? 'table' : naive < table ? 'less' : 'more';
    const J = (x: number, l: Locale) => `${sig(x, 3, l)} ${tl(l, 'answer-specific-heat-metal-j')}`;
    return {
      correct,
      why: msg('answer-specific-heat-metal-why'),
      say: both((l) => `c ≈ ${J(naive, l)}!`),
      text: both((l) =>
        tl(l, 'answer-specific-heat-metal-text', { t1: sig(t1, 3, l), th: sig(th, 3, l), CW: sig((CW * mw * (th - t1)) / 1000, 3, l), tb: sig(tb, 3, l), naive: J(naive, l), table: J(table, l), cup: sig(cup / 1000, 2, l), full: J(full, l), value: correct === 'table' ? tl(l, 'answer-ice-latent-heat-text') : correct === 'less' ? tl(l, 'answer-ice-latent-heat-text-2') : tl(l, 'answer-ice-latent-heat-text-3') }),
      ),
    };
  },
  'which-metal': ({ steps, simulation }) => {
    const s = steps[0]!;
    const block = blockOf(s);
    const real = temp(s.result.final);
    const other = block ? settleWith(s.params, { ...block, substance: block.substance === 'copper' ? 'aluminium' : 'copper' }, simulation) : real;
    const [al, cu] = block?.substance === 'copper' ? [other, real] : [real, other];
    const cAl = COMPONENTS.aluminium.phases.solid!.specificHeat!.value;
    const cCu = COMPONENTS.copper.phases.solid!.specificHeat!.value;
    return {
      why: msg('answer-which-metal-why'),
      say: both((l) => ((al > cu ? tl(l, 'answer-which-metal-say') : tl(l, 'answer-which-metal-say-2')))),
      text: both((l) =>
        tl(l, 'answer-which-metal-text', { al: C(al, l), cu: C(cu, l), cAl: sig(cAl, 3, l), cCu: sig(cCu, 3, l), cAl2: ratio(cAl, cCu, l) }),
      ),
      correct: al > cu + 0.3 ? 'al' : cu > al + 0.3 ? 'cu' : 'same',
    };
  },
  'weigh-the-water': ({ steps }) => {
    // What the kitchen scales show at the start, after freezing and after boiling.
    const [freeze, boil] = [steps[0]!, steps[1] ?? steps[0]!];
    const at = (st: SystemState) => weigh(st, 'kitchen-scale');
    const [a, b, c] = [at(freeze.result.initial), at(freeze.result.final), at(boil.result.final)];
    const g = (kg: number | null, l: Locale) => formatReading('kitchen-scale', kg, l);
    const dFreeze = (a.reading ?? 0) - (b.reading ?? 0);
    const dBoil = (b.reading ?? 0) - (c.reading ?? 0);
    // Without the water that evaporated while it cooled, did freezing change the mass?
    const toAir = (st: SystemState) => (sampleOf(st).state.evaporated ?? 0) + (sampleOf(st).state.boiledOff ?? 0);
    const change = b.exact.total - a.exact.total + (toAir(freeze.result.final) - toAir(freeze.result.initial));
    return {
      correct: change > 1e-6 ? 'heavier' : change < -1e-6 ? 'lighter' : 'same',
      why: msg('answer-weigh-the-water-why'),
      say: msg('answer-weigh-the-water-say'),
      text: both((l) =>
        tl(l, 'answer-weigh-the-water-text-2', { reading: g(a.reading, l), reading2: g(b.reading, l), reading3: g(c.reading, l), dBoil: g(dBoil, l), dFreeze: dFreeze > 0 ? tl(l, 'answer-weigh-the-water-text', { dFreeze: g(dFreeze, l) }) : '' }),
      ),
    };
  },
  'boil-a-litre': ({ steps }) => {
    const s = steps[0]!;
    const t = reachedAt(s);
    const paper = paperTime(s.params);
    return {
      ...(paper !== undefined ? { correct: t > paper * 1.05 ? 'longer' : t < paper * 0.95 ? 'shorter' : 'paper' } : {}),
      why: msg('answer-boil-a-litre-why'),
      say: both((l) => tl(l, 'answer-boil-a-litre-say', { t: D(t, l) })),
      text: both((l) =>
        tl(l, 'answer-boil-a-litre-text-2', { t: D(t, l), paper: paper ? tl(l, 'answer-boil-a-litre-text', { paper: D(paper, l), t: String(Math.round((t / paper - 1) * 100)) }) : '' }),
      ),
    };
  },
  'lid-or-not': ({ steps, simulation }) => {
    // Both runs were made: compare them; otherwise the other one is run in the mind.
    const lidRun = steps.find((x) => x.params.lid);
    const openRun = steps.find((x) => !x.params.lid);
    const s = steps[0]!;
    const withLid = lidRun ? reachedAt(lidRun) : timeToGoal({ ...s.params, lid: true }, simulation);
    const without = openRun ? reachedAt(openRun) : timeToGoal({ ...s.params, lid: false }, simulation);
    return {
      correct: withLid < without * 0.97 ? 'lid' : without < withLid * 0.97 ? 'no-lid' : 'equal',
      why: msg('answer-lid-or-not-why'),
      say: msg('answer-lid-or-not-say'),
      text: both((l) =>
        tl(l, 'answer-lid-or-not-text-3', { withLid: D(withLid, l), without: D(without, l), value: D(Math.max(0, without - withLid), l), value2: s.params.lid ? tl(l, 'answer-lid-or-not-text') : tl(l, 'answer-lid-or-not-text-2') }),
      ),
    };
  },
  'melt-ice': ({ steps }) => {
    const s = steps[0]!;
    const p = plateau(s);
    return {
      ...(p > 60 ? { correct: 'stays' } : {}),
      why: msg('answer-melt-ice-why'),
      say: msg('answer-melt-ice-say'),
      text: both((l) =>
        tl(l, 'answer-melt-ice-text', { p: D(p, l), LF_KJ: sig(LF_KJ, 3, l) }),
      ),
    };
  },
  'melt-tin': ({ steps }) => {
    const s = steps[0]!;
    const p = plateau(s);
    const tm = COMPONENTS.tin.melting!.point.value;
    const lf = COMPONENTS.tin.melting!.latentHeat!.value / 1000;
    return {
      ...(p > 30 ? { correct: 'stays' } : {}),
      why: msg('answer-melt-tin-why'),
      say: msg('answer-melt-tin-say'),
      text: both((l) =>
        tl(l, 'answer-melt-tin-text', { p: D(p, l), tm: sig(tm, 4, l), lf: sig(lf, 3, l) }),
      ),
    };
  },
  'stearic-cooling': ({ steps }) => {
    const s = steps[steps.length - 1]!;
    const p = plateau(s);
    const tm = COMPONENTS['stearic-acid'].melting!.point.value;
    return {
      ...(p > 30 ? { correct: 'stays' } : {}),
      why: msg('answer-stearic-cooling-why'),
      say: msg('answer-stearic-cooling-say'),
      text: both((l) =>
        tl(l, 'answer-stearic-cooling-text', { p: D(p, l), tm: sig(tm, 3, l) }),
      ),
    };
  },
  'specific-heat-water': ({ steps }) => {
    const s = steps[0]!;
    const t = reachedAt(s);
    const P = s.params.heater?.rating ?? 500;
    const m = bodyMassOf(s.result.initial);
    const dT = temp(s.result.final) - temp(s.result.initial);
    const c = (P * t) / (m * dT);
    const table = CW;
    const extra = Math.round((c / table - 1) * 100);
    return {
      correct: Math.abs(c - table) / table < 0.01 ? 'table' : c > table ? 'more' : 'less',
      why: msg('answer-specific-heat-water-why'),
      say: both((l) => tl(l, 'answer-specific-heat-water-say', { c: sig(c, 3, l) })),
      text: both((l) =>
        tl(l, 'answer-specific-heat-water-text', { t: D(t, l), P: sig(P * t / 1000, 3, l), m: sig(m * 1000, 3, l), dT: sig(dT, 3, l), c: sig(c, 3, l), extra: String(extra), table: sig(table, 4, l) }),
      ),
    };
  },
  'heater-efficiency': ({ steps }) => {
    const s = steps[0]!;
    const t = reachedAt(s);
    const P = s.params.heater?.rating ?? 500;
    const m = bodyMassOf(s.result.initial);
    const dT = temp(s.result.final) - temp(s.result.initial);
    const Q = CW * m * dT;
    const eta = Q / (P * t);
    const pct = (x: number, l: Locale) => `${sig(x * 100, 2, l)} %`;
    return {
      correct: eta > 0.97 ? 'all' : eta >= 0.5 ? 'most' : 'half',
      why: msg('answer-heater-efficiency-why'),
      say: both((l) => tl(l, 'answer-heater-efficiency-say', { eta: pct(eta, l) })),
      text: both((l) =>
        tl(l, 'answer-heater-efficiency-text', { t: D(t, l), P: sig((P * t) / 1000, 3, l), m: sig(m * 1000, 3, l), dT: sig(dT, 3, l), Q: sig(Q / 1000, 3, l), eta: pct(eta, l) }),
      ),
    };
  },
  'salt-in-pot': ({ steps }) => {
    const first = steps[0]!;
    const furnace = steps.find((x) => x.params.cooler);
    const tm = COMPONENTS['sodium-chloride'].melting!.point.value;
    const correct = first.status.kind === 'vessel-fails' ? 'pot-burns' : first.status.kind === 'stalls' ? 'too-cold' : first.status.kind === 'reached' ? 'melts' : undefined;
    const top = first.status.kind === 'stalls' ? first.status.limit : temp(first.result.final);
    return {
      ...(correct ? { correct } : {}),
      why: msg('answer-salt-in-pot-why'),
      say: msg('answer-salt-in-pot-say'),
      text: both((l) =>
        tl(l, 'answer-salt-in-pot-text-2', { top: C(top, l), tm: sig(tm, 4, l), furnace: furnace ? tl(l, 'answer-salt-in-pot-text', { furnace: D(reachedAt(furnace), l) }) : '' }),
      ),
    };
  },
  'freeze-water': ({ steps }) => {
    const s = steps[0]!;
    const total = reachedAt(s);
    const ice = firstIce(s);
    const cool = ice?.at ?? total;
    const freeze = Math.max(0, total - cool);
    const degrees = Math.round((LF_KJ * 1000) / CW);
    return {
      correct: freeze > cool * 1.1 ? 'freezing' : cool > freeze * 1.1 ? 'cooling' : 'equal',
      why: msg('answer-freeze-water-why'),
      say: both((l) => ((freeze > cool ? tl(l, 'answer-freeze-water-say') : tl(l, 'answer-freeze-water-say-2')))),
      text: both((l) =>
        tl(l, 'answer-freeze-water-text', { cool: D(cool, l), freeze: D(freeze, l), LF_KJ: sig(LF_KJ, 3, l), degrees: String(degrees) }),
      ),
    };
  },
  'road-salt': ({ steps }) => {
    const ice = steps.map(firstIce).find((x) => x !== undefined);
    const last = steps[steps.length - 1]!;
    const solid = sampleOf(last.result.final).state.solidFraction ?? 0;
    const firstSolid = sampleOf(steps[0]!.result.final).state.solidFraction ?? 0;
    const te = NACL_SOLUTE.eutectic.t;
    const sp = steps[0]!.params.cooler?.setpoint ?? 0;
    return {
      correct: firstSolid >= 0.999 ? 'yes' : firstSolid > 0.01 ? 'partly' : 'no',
      why: msg('answer-road-salt-why'),
      say: msg('answer-road-salt-say'),
      text: both((l) => {
        const start = ice ? C(ice.T, l) : tl(l, 'answer-text-start');
        const tE = `${sig(te, 3, l).replace('-', '−')} °C`;
        const head = tl(l, 'answer-text-head', { start, sp: sig(sp, 3, l).replace('-', '−'), firstSolid: String(Math.round(firstSolid * 100)), tE });
        const tail = tl(l, 'answer-text-tail');
        const more =
          steps.length > 1 && solid >= 1
            ? tl(l, 'answer-text-more')
            : '';
        return head + tail + more;
      }),
    };
  },
  'alcohol-vs-water': ({ steps, simulation }) => {
    const s = steps[0]!;
    const t = reachedAt(s);
    const tw = timeToGoal({ ...s.params, substance: 'water' }, simulation);
    const less = Math.round((1 - COMPONENTS.ethanol.phases.liquid!.specificHeat!.value / CW) * 100);
    const tb = COMPONENTS.ethanol.boiling!.point.value;
    return {
      correct: t < tw * 0.95 ? 'alcohol' : tw < t * 0.95 ? 'water' : 'equal',
      why: msg('answer-alcohol-vs-water-why'),
      say: msg('answer-alcohol-vs-water-say'),
      text: both((l) =>
        tl(l, 'answer-alcohol-vs-water-text', { t: D(t, l), tb: sig(tb, 3, l), tw: D(tw, l), tw2: ratio(tw, t, l), less: String(less) }),
      ),
    };
  },
  'sea-salt': ({ steps }) => {
    const mix = sampleOf(steps[steps.length - 1]!.result.final).state.mixture;
    const salt = mix?.salt ?? 0;
    const crystals = mix?.crystals ?? 0;
    return {
      correct: salt > 0 && crystals / salt > 0.95 ? 'all' : crystals > 0 ? 'some' : 'none',
      why: msg('answer-sea-salt-why'),
      say: msg('answer-sea-salt-say'),
      text: both((l) =>
        tl(l, 'answer-sea-salt-text', { salt: Q(salt, 'kg', l), crystals: Q(crystals, 'kg', l) }),
      ),
    };
  },
  'does-water-conduct': ({ steps }) => {
    const before = current(steps[0]!).amps;
    const after = current(steps[steps.length - 1]!).amps;
    return {
      correct: before >= 0.01 ? 'well' : before > 0 ? 'barely' : 'never',
      why: msg('answer-does-water-conduct-why'),
      say: msg('answer-does-water-conduct-say'),
      text: both((l) =>
        tl(l, 'answer-does-water-conduct-text-2', { before: A(before, l), after: A(after, l), after2: before > 1e-6 ? tl(l, 'answer-does-water-conduct-text', { after: ratio(after, before, l) }) : '' }),
      ),
    };
  },
  'joule-heating': ({ steps }) => {
    const s = steps[0]!;
    const { amps, time } = current(s);
    const dT = temp(s.result.final) - temp(s.result.initial);
    const heat = (e: SystemState) => (e.entities['supply.heat' as never] as unknown as { state: { energyDelivered: number } } | undefined)?.state.energyDelivered ?? 0;
    const q = heat(s.result.final) - heat(s.result.initial);
    return {
      correct: temp(s.result.final) >= 373.15 - 0.5 ? 'boils' : dT < 15 ? 'few' : 'tens',
      why: msg('answer-joule-heating-why'),
      say: both((l) => tl(l, 'answer-joule-heating-say', { dT: sig(dT, 2, l) })),
      text: both((l) =>
        tl(l, 'answer-joule-heating-text', { time: D(time, l), amps: A(amps, l), dT: sig(dT, 2, l), q: Q(q, 'J', l) }),
      ),
    };
  },
  'copper-sulfate-electrolysis': ({ steps }) => {
    const s = steps[steps.length - 1]!;
    const sup = (st: SystemState) => Object.values(st.entities).find(isSupply);
    const made = (k: string) => (sup(s.result.final)?.state.made?.[k] ?? 0) - (sup(s.result.initial)?.state.made?.[k] ?? 0);
    const cu = made('copper') * 0.063546 * 1000;
    const o2 = (made('oxygen') * GAS_CONSTANT * temp(s.result.initial)) / 101_325;
    return {
      ...(cu > 0 ? { correct: 'copper' } : made('hydrogen') > 0 ? { correct: 'hydrogen' } : {}),
      why: msg('answer-copper-sulfate-electrolysis-why'),
      say: msg('answer-copper-sulfate-electrolysis-say'),
      text: both((l) =>
        tl(l, 'answer-copper-sulfate-electrolysis-text', { cu: sig(cu, 2, l), o2: sig(o2 * 1e6, 2, l) }),
      ),
    };
  },
  electrolysis: ({ steps }) => {
    const s = steps[0]!;
    const { charge, time } = current(s);
    // Hydrogen the cell made (Faraday, counted step by step by the electrical solver).
    const sup = (st: SystemState) => Object.values(st.entities).find(isSupply);
    const moles = (sup(s.result.final)?.state.made?.['hydrogen'] ?? 0) - (sup(s.result.initial)?.state.made?.['hydrogen'] ?? 0);
    const h2 = (moles * GAS_CONSTANT * temp(s.result.initial)) / 101_325;
    return {
      correct: h2 < 1e-5 ? 'few' : h2 < 1e-4 ? 'tens' : 'hundreds',
      why: msg('answer-electrolysis-why'),
      say: both((l) => tl(l, 'answer-electrolysis-say', { h2: sig(h2 * 1e6, 2, l) })),
      text: both((l) =>
        tl(l, 'answer-electrolysis-text', { time: D(time, l), charge: Q(charge, 'C', l), h2: Q(h2 * 1e6, 'mL', l) }),
      ),
    };
  },
  'oil-does-not-boil': ({ steps }) => {
    const s = steps[steps.length - 1]!;
    return {
      correct: s.status.kind === 'decomposes' ? 'smokes' : 'boils',
      why: msg('answer-oil-does-not-boil-why'),
      say: msg('answer-oil-does-not-boil-say'),
      text: both((l) =>
        tl(l, 'answer-oil-does-not-boil-text', { final: C(temp(s.result.final), l) }),
      ),
    };
  },
  'alcohol-in-freezer': ({ steps }) => {
    const s = steps[steps.length - 1]!;
    const tf = COMPONENTS.ethanol.melting!.point.value;
    return {
      correct: (sampleOf(s.result.final).state.solidFraction ?? 0) > 0 ? 'yes' : 'no',
      why: msg('answer-alcohol-in-freezer-why'),
      say: msg('answer-alcohol-in-freezer-say'),
      text: both((l) =>
        tl(l, 'answer-alcohol-in-freezer-text', { final: C(temp(s.result.final), l), tf: sig(tf, 3, l).replace('-', '−') }),
      ),
    };
  },
  'grand-chain': ({ steps }) => {
    const currents = steps.filter((s) => s.params.supply);
    const a = currents[0];
    const b = currents[currents.length - 1];
    if (!a || !b || a === b) return { say: both(() => ''), text: both(() => '') };
    const i1 = current(a).amps, i2 = current(b).amps;
    return {
      correct: i2 > i1 * 1.05 ? 'more' : i2 < i1 * 0.95 ? 'less' : 'same',
      why: msg('answer-grand-chain-why'),
      say: msg('answer-grand-chain-say'),
      text: both((l) =>
        tl(l, 'answer-grand-chain-text', { initial: C(temp(a.result.initial), l), i1: A(i1, l), initial2: C(temp(b.result.initial), l), i2: A(i2, l), i22: String(Math.round((i2 / Math.max(i1, 1e-12) - 1) * 100)) }),
      ),
    };
  },
};
/** The answers by preset id: these, and the experiment modules' own. */
/** The answers by preset id: an experiment module's join as it loads. */
export const PRESET_ANSWERS: Readonly<Record<string, (run: PresetRun) => PresetAnswer>> = { ...LOCAL_ANSWERS };
onExperiment((m) => Object.assign(PRESET_ANSWERS, m.answers));

