import type { Command } from '../core/commands.js';
import type { ExperimentResult } from '../core/experiment.js';
import { entityId } from '../core/ids.js';
import { createSimulation, type Simulation } from '../core/simulation.js';
import { createState, type SystemState } from '../core/state.js';
import { celsius, seconds, ZERO_CELSIUS_IN_KELVIN } from '../core/units.js';
import { coolerSurroundings, placeCooler, placeHeater, placeVessel } from '../domains/thermal/assembly.js';
import { energySplit } from '../domains/thermal/energy.js';
import { SURFACES, type MaterialName } from '../domains/thermal/materials.js';
import { bodyMass, isBurner, isHeater, isThermalBody, reservoir, thermostat, type ThermalBody } from '../domains/thermal/entities.js';
import type { Block } from '../explain/blocks.js';
import { formatDuration, formatQuantity, sig, type ExplainContext } from '../explain/format.js';
import { COOLERS, type CoolerId } from '../equipment/coolers.js';
import { HEATERS, type HeaterId } from '../equipment/heaters.js';
import { VESSELS, type VesselId } from '../equipment/vessels.js';
import { electrodesOf, SUPPLIES, type ElectrodeMaterial, type SupplyId } from '../equipment/supplies.js';
import { placeSupply } from '../domains/electrical/assembly.js';
import { tr, type Locale, type LocalizedText } from '../knowledge/i18n.js';
import { msg, t as tl } from '../knowledge/messages.js';
import { SUBSTANCES, type SubstanceId } from '../substances/catalog.js';
import { COMPONENTS, type ComponentId } from '../components/index.js';
import { solubilityAt } from '../domains/thermal/mixture.js';
import { OPERATION_IDS, OPERATIONS, type Gender, type Operation, type OperationContext, type OperationId } from './operations/index.js';

/**
 * The thermal lab: put a substance into a vessel and heat it, cool it, boil,
 * freeze or melt it. Presets set the stop condition; the experimenter chooses
 * everything else.
 */
export type LabAction = OperationId;
export const LAB_ACTIONS: readonly LabAction[] = OPERATION_IDS;

/** Heating actions use a heater; cooling actions a cooler; melting either (or just the room). */
export const actionUses = (a: LabAction): Operation['uses'] => OPERATIONS[a].uses;

export interface LabParams {
  readonly action: LabAction;
  /** Target temperature, °C (heat-to, cool-to). */
  readonly target?: number;
  readonly substance: SubstanceId;
  /** Amount, litres of liquid. */
  readonly liters: number;
  readonly startTemp: number; // °C
  readonly vessel: VesselId;
  readonly size: number;
  readonly material: string;
  readonly vesselMass?: number;
  readonly lid: boolean;
  /** Heating source (heat-to, boil; optional for melt). */
  readonly heater?: { readonly id: HeaterId; readonly rating: number; readonly knob: number };
  /** Cold surroundings (cool-to, freeze; none = the room air). */
  readonly cooler?: { readonly id: CoolerId; readonly setpoint: number };
  /** Power supply with electrodes in the liquid (pass a current); knob 0…1 sets a lab supply's voltage. */
  readonly supply?: { readonly id: SupplyId; readonly knob: number; readonly electrodes?: ElectrodeMaterial };
  /** How long the operation runs, minutes (for timed operations). */
  readonly duration?: number;
  readonly roomTemp: number; // °C
  /** Relative humidity of the room air, 0…1 (default 0.5). */
  readonly humidity?: number;
}

export const SAMPLE_ID = 'sample';
export const LAB_VESSEL_ID = 'vessel';
export const LAB_HEATER_ID = 'heater';
export const LAB_ROOM_ID = 'room';
export const LAB_COOLER_ID = 'cooler';
export const LAB_SUPPLY_ID = 'supply';
const THERMOSTAT_ID = 'thermostat';

export interface LabSetup {
  readonly state: SystemState;
  readonly warnings: readonly LocalizedText[];
}

export function labSetup(p: LabParams): LabSetup {
  const substance = SUBSTANCES[p.substance];
  const vesselItem = VESSELS[p.vessel];
  const cooler = p.cooler ? COOLERS[p.cooler.id] : undefined;
  const room = celsius(p.roomTemp);
  const coolerPiece = cooler ? placeCooler({ item: cooler, id: LAB_COOLER_ID, setpoint: p.cooler!.setpoint }) : undefined;
  const surroundings = cooler ? coolerSurroundings(cooler, LAB_COOLER_ID) : undefined;
  const vessel = placeVessel({
    item: vesselItem,
    id: LAB_VESSEL_ID,
    liquidId: SAMPLE_ID,
    size: p.size,
    material: p.material,
    ...(p.vesselMass === undefined ? {} : { mass: p.vesselMass }),
    lid: p.lid,
    substance,
    liters: p.liters,
    startTemp: p.startTemp,
    roomId: LAB_ROOM_ID,
    roomTemp: p.roomTemp,
    ...(surroundings ? { outside: surroundings, surfaceTo: cooler!.spec.method === 'air' ? LAB_COOLER_ID : LAB_ROOM_ID } : {}),
  });
  const supplyPiece = p.supply
    ? placeSupply({ item: SUPPLIES[p.supply.id], id: LAB_SUPPLY_ID, knob: p.supply.knob, bodyId: SAMPLE_ID, electrodes: electrodesOf(p.supply.electrodes) })
    : undefined;
  const heater = p.heater
    ? placeHeater({
        item: HEATERS[p.heater.id],
        id: LAB_HEATER_ID,
        rating: p.heater.rating,
        knob: p.heater.knob,
        vessel: { item: vesselItem, id: LAB_VESSEL_ID, liquidId: SAMPLE_ID, material: p.material, size: p.size, liters: p.liters },
        roomId: LAB_ROOM_ID,
        roomTemp: p.roomTemp,
        liquidTemp: p.startTemp,
      })
    : undefined;
  const cutoff = p.heater ? HEATERS[p.heater.id].spec.vesselCutoff : undefined;
  const extra = [
    ...(OPERATIONS[p.action].thermostat && p.heater && p.target !== undefined
      ? [thermostat({ id: THERMOSTAT_ID, label: msg('thermal-lab-extra-label'), sensor: SAMPLE_ID, actuator: LAB_HEATER_ID, target: celsius(p.target), hysteresis: 1 })]
      : []),
    // An induction hob guards itself: it cuts the power while the pan is too hot (a pan heated empty).
    ...(cutoff ? [thermostat({ id: `${THERMOSTAT_ID}.overheat`, label: msg('thermal-lab-extra-label-2'), sensor: LAB_VESSEL_ID, actuator: LAB_HEATER_ID, target: celsius(cutoff.value), hysteresis: 10 })] : []),
  ];
  const state = createState({
    entities: [
      ...vessel.entities,
      ...(heater?.entities ?? []),
      ...(coolerPiece?.entities ?? []),
      ...(supplyPiece?.entities ?? []),
      reservoir({ id: LAB_ROOM_ID, label: msg('thermal-lab-entities-label'), temperature: room, humidity: p.humidity ?? 0.5 }),
      ...extra,
    ],
    connections: [...vessel.connections, ...(heater?.connections ?? []), ...(supplyPiece?.connections ?? [])],
    environment: { ambientTemperature: room },
  });
  // An immersion heater works only in a liquid: in dry salt or in the air it overheats and burns out.
  const dryImmersion = p.heater && HEATERS[p.heater.id].spec.method === 'immersion' && substance.category.startsWith('solid.')
    ? [msg('thermal-lab-setup-dry-immersion')]
    : [];
  if (dryImmersion.length) return { state: setHeaterOff(state), warnings: [...dryImmersion, ...vessel.warnings] };
  return { state, warnings: [...vessel.warnings, ...(heater?.warnings ?? [])] };
}

/** The heater stays where it is, switched off (it must not be used this way). */
function setHeaterOff(s: SystemState): SystemState {
  const h = s.entities[entityId(LAB_HEATER_ID)];
  return h && (isHeater(h) || isBurner(h)) ? { ...s, entities: { ...s.entities, [h.id]: { ...h, params: { ...h.params, on: false } } } } : s;
}

// ---------------------------------------------------------------- outcome

export const sampleOf = (s: SystemState): ThermalBody => {
  const e = s.entities[entityId(SAMPLE_ID)];
  if (!e || !isThermalBody(e)) throw new Error('no sample');
  return e;
};

const K = (c: number) => c + ZERO_CELSIUS_IN_KELVIN;

/**
 * Is the run over? Its goal is reached — or the vessel would not survive any more (an aluminium
 * pot heated dry melts through before the salt in it gets hot). Used as the `until` stop condition.
 */
export function labGoalReached(p: LabParams, s: SystemState): boolean {
  return OPERATIONS[p.action].reached(sampleOf(s), p, SUBSTANCES[p.substance], s) || vesselFails(p, s) !== undefined;
}

/** The vessel is at (or past) the hottest it stands: what happens to it, and at what temperature, °C. */
export function vesselFails(p: LabParams, s: SystemState): { readonly limit: number; readonly what: LocalizedText } | undefined {
  const limit = SURFACES[p.material as MaterialName]?.limit;
  const v = s.entities[entityId(LAB_VESSEL_ID)];
  if (!limit || !v || !isThermalBody(v)) return undefined;
  return v.state.temperature >= K(limit.temperature.value) ? { limit: limit.temperature.value, what: limit.what } : undefined;
}

export type LabStatus =
  | { readonly kind: 'reached'; readonly at: number }
  | { readonly kind: 'will-reach'; readonly after: number }
  | { readonly kind: 'stalls'; readonly limit: number } // never: steady state at `limit` K
  | { readonly kind: 'impossible'; readonly reason: LocalizedText }
  | { readonly kind: 'decomposes'; readonly at: number } // oil reached its smoke point instead of boiling
  | { readonly kind: 'no-heat'; readonly reason: LocalizedText }
  /** The vessel reaches the hottest it stands first (`at` s from the start; `ahead` — foreseen, not yet happened). */
  | { readonly kind: 'vessel-fails'; readonly at: number; readonly limit: number; readonly what: LocalizedText; readonly ahead?: boolean }
  | { readonly kind: 'off' };

/** What surrounds the vessel: the cooler or the room. */
export function operationContext(p: LabParams): OperationContext {
  const cold = p.cooler ? COOLERS[p.cooler.id] : undefined;
  return {
    p,
    sub: SUBSTANCES[p.substance],
    surroundingTemp: cold ? p.cooler!.setpoint : p.roomTemp,
    where: (l) => (cold ? tr(cold.phrase, l) : tl(l, 'thermal-lab-operation-context-where')),
  };
}

/** Reasons the goal can never be reached — known before running anything. */
export function labImpossibility(p: LabParams): LocalizedText | undefined {
  return OPERATIONS[p.action].impossible?.(operationContext(p));
}

const sourcePower = (s: SystemState): number => {
  const e = s.entities[entityId(LAB_HEATER_ID)];
  return e && (isHeater(e) || isBurner(e)) && e.params.on ? e.params.power : 0;
};

/** What "getting closer to the goal" is measured by: temperature, how much is solid, mass. */
export interface LabProgress {
  readonly T: number;
  readonly s: number;
  readonly m: number;
}
export const labProgress = (state: SystemState): LabProgress => {
  const b = sampleOf(state);
  return { T: b.state.temperature, s: b.state.solidFraction ?? 0, m: bodyMass(b) };
};
/**
 * Nothing changed between two checkpoints (half an hour apart): the outcome will not change.
 * Slow evaporation alone is not progress — unless the goal is to boil the substance dry.
 */
export const noProgress = (p: LabParams, a: LabProgress, b: LabProgress): boolean =>
  // A timed operation progresses with time itself.
  !OPERATIONS[p.action].duration &&
  Math.abs(b.T - a.T) < 0.05 && Math.abs(b.s - a.s) < 0.001 && (!OPERATIONS[p.action].massIsProgress || Math.abs(b.m - a.m) < 1e-5);

/** Continues the experiment "in the mind" to tell "later" from "never" (stops on reaching the goal or a steady state). */
export function forecastLab(p: LabParams, simulation: Simulation, from: SystemState): LabStatus {
  const sim = createSimulation({ solvers: simulation.solvers, fixedDt: seconds(2) });
  const sub = SUBSTANCES[p.substance];
  let s = from;
  let checkpoint = { t: s.time, ...labProgress(s) };
  const limit = s.time + 24 * 3600;
  while (s.time < limit) {
    s = sim.tick(s, sim.fixedDt);
    const fails = vesselFails(p, s);
    if (fails) return { kind: 'vessel-fails', at: s.time - from.time, ...fails, ahead: true };
    if (labGoalReached(p, s)) {
      if (OPERATIONS[p.action].endsInstead?.(sub) === 'decomposes') return { kind: 'decomposes', at: s.time };
      return { kind: 'will-reach', after: s.time - from.time };
    }
    if (s.time - checkpoint.t >= 1800) {
      const now = labProgress(s);
      if (noProgress(p, checkpoint, now)) return { kind: 'stalls', limit: now.T };
      checkpoint = { t: s.time, ...now };
    }
  }
  return { kind: 'stalls', limit: sampleOf(s).state.temperature };
}

export function labStatus<C extends Command>(p: LabParams, result: ExperimentResult<C>, simulation: Simulation, warnings: readonly LocalizedText[]): LabStatus {
  const sub = SUBSTANCES[p.substance];
  const fails = vesselFails(p, result.final);
  if (fails) return { kind: 'vessel-fails', at: result.final.time - result.initial.time, ...fails };
  if (labGoalReached(p, result.final)) {
    // Times are counted from the start of this run (a protocol step starts later than 0).
    const at = result.final.time - result.initial.time;
    if (OPERATIONS[p.action].endsInstead?.(sub) === 'decomposes') return { kind: 'decomposes', at };
    return { kind: 'reached', at };
  }
  const impossible = labImpossibility(p);
  if (impossible) return { kind: 'impossible', reason: impossible };
  if (warnings.length) return { kind: 'no-heat', reason: warnings[0]! };
  if (p.heater && OPERATIONS[p.action].uses === 'heater' && sourcePower(result.final) === 0) return { kind: 'off' };
  return forecastLab(p, simulation, result.final);
}

// ---------------------------------------------------------------- headline

/** For "did not boil but heated up to 232 °C". */

/** "Distilled water (2 L) in a steel pot on a kitchen gas hob" — the subject of the headline. */
function subject(p: LabParams, locale: Locale, now?: SystemState): { text: string; gender: Gender; name: string } {
  const sub = SUBSTANCES[p.substance];
  // Salt was added during the experiment: it is a solution now.
  // (Dry salt with water poured on it is salt water too.)
  const salted = now !== undefined && (!sub.mixture || sub.category.startsWith('solid.')) && sampleOf(now).state.mixture !== undefined;
  const vessel = VESSELS[p.vessel];
  const amount = salted && sub.category.startsWith('solid.')
    ? `${sig(bodyMass(sampleOf(now!)) * 1000, 3, locale)} ${tl(locale, 'unit-sym-g')}` // the salt and the water poured on it
    : sub.melt || sub.category.startsWith('solid.')
    ? `${sig(p.liters * sub.liquid.density.value, 3, locale)} ${tl(locale, 'unit-sym-g')}`
    : p.liters < 1 ? `${Math.round(p.liters * 1000)} ${tl(locale, 'unit-sym-mL')}` : `${sig(p.liters, 3, locale)} ${tl(locale, 'unit-sym-L')}`;
  // Something dissolved in it during the experiment: salt water stays "вода з сіллю"; otherwise the solution's own name.
  const onlySalt = salted && sampleOf(now!).state.mixture!.solutes.every((x) => x.component === 'sodium-chloride');
  const label = salted ? sampleOf(now!).label : undefined;
  let name = salted ? (onlySalt ? (tl(locale, 'thermal-lab-subject-name')) : label ? tr(label, locale) : tl(locale, 'thermal-lab-subject-name-2')) : tr(sub.name, locale);
  let gender: Gender = salted ? (onlySalt ? 'f' : 'm') : sub.gender;
  // Melting ice names the ice ("Лід"); a metal or salt is a solid anyway — its own name.
  if (OPERATIONS[p.action].subjectIsSolid && !sub.melt) {
    if (sub.solidName) {
      name = tr(sub.solidName, locale);
      gender = 'm';
    } else name = tl(locale, 'thermal-lab-frozen', { gender: sub.gender, name: name.toLowerCase() });
  }
  const where = tr(vessel.phraseIn[p.material] ?? vessel.name, locale) + (p.lid ? (tl(locale, 'thermal-lab-subject-where')) : '');
  const by = p.supply ? ` ${tr(SUPPLIES[p.supply.id].phrase, locale)}` : p.heater ? ` ${tr(HEATERS[p.heater.id].phrase, locale)}` : p.cooler ? ` ${tr(COOLERS[p.cooler.id].phrase, locale)}` : tl(locale, 'thermal-lab-subject-by');
  return { text: `${name} (${amount}) ${where}${by}`, gender, name };
}

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** Real-life dangers of this combination (shown with the headline, never blocks the experiment). */
export function labCautions(p: LabParams): LocalizedText[] {
  const sub = SUBSTANCES[p.substance];
  const out: LocalizedText[] = [];
  if (p.supply) {
    out.push(msg('thermal-lab-cautions'));
  }
  if (sub.flammable && p.heater && HEATERS[p.heater.id].spec.method === 'flame') {
    out.push(msg('thermal-lab-caution-flame', { name: (l: Locale) => lowerFirst(tr(sub.name, l)), lower: (l: Locale) => tr(sub.name, l).toLowerCase() }));
  }
  return out;
}

/**
 * What happened to the crystals of a solution during a step, said plainly: the ones on the bottom dissolved,
 * crystals came out — or did not, though the solution is now beyond saturation (supersaturated). `states` are
 * the step's states in time order; the first one with the solution in it is the start (a substance poured in
 * at the very start of the step). Null — nothing to say (no solution, nothing changed, or it froze).
 */
export function crystalNote(states: readonly SystemState[], locale: Locale): { short: string; long: string } | null {
  const withMix = states.filter((x) => sampleOf(x).state.mixture);
  if (withMix.length < 2) return null;
  const b0 = sampleOf(withMix[0]!);
  const b1 = sampleOf(withMix[withMix.length - 1]!);
  const m0 = b0.state.mixture!;
  const m1 = b1.state.mixture!;
  if (m1.ice > 1e-9 || m0.ice > 1e-9) return null;
  // The main solute: the one there is most of.
  const s1 = [...m1.solutes].sort((a, b) => b.mass - a.mass)[0];
  if (!s1) return null;
  const c0 = m0.solutes.find((x) => x.component === s1.component)?.crystals ?? 0;
  const c1 = s1.crystals;
  const c = COMPONENTS[s1.component as ComponentId];
  const what = c ? tr(c.genitive ?? c.name, locale).toLowerCase() : s1.component;
  const T1 = b1.state.temperature - ZERO_CELSIUS_IN_KELVIN;
  const water = m1.water - m1.ice;
  const sol = solubilityAt(s1.component, T1);
  const g = (kg: number) => `${sig(kg * 1000, 3, locale)} ${tl(locale, 'unit-sym-g')}`;
  const T = (t: number) => `${sig(t, 3, locale)} °C`;
  const small = Math.max(1e-5, 0.02 * s1.mass);
  if (c0 > small && c1 <= 1e-6) {
    return {
      short: tl(locale, 'thermal-lab-crystal-note-short'),
      long: tl(locale, 'thermal-lab-crystal-note-long', { what, c0: g(c0), T1: T(T1), sol: sig(sol, 3, locale) }),
    };
  }
  if (c0 > c1 + small) {
    return {
      short: tl(locale, 'thermal-lab-crystal-note-short-2'),
      long: tl(locale, 'thermal-lab-crystal-note-long-2', { what, c0: g(c0), c1: g(c1) }),
    };
  }
  if (c1 > c0 + small) {
    return {
      short: tl(locale, 'thermal-lab-crystal-note-short-3'),
      long: tl(locale, 'thermal-lab-crystal-note-long-5', { what, c1: g(c1), T1: T(T1), sol: sig(sol, 3, locale), c0: c0 > 1e-6 ? tl(locale, 'thermal-lab-crystal-note-long-3', { c0: g(c0) }) : tl(locale, 'thermal-lab-crystal-note-long-4') }),
    };
  }
  // No crystals, though the water now holds more than its solubility allows: supersaturated.
  const limit = (sol / 100) * water;
  if (c1 <= 1e-6 && Number.isFinite(limit) && s1.mass > limit * 1.01) {
    return {
      short: tl(locale, 'thermal-lab-crystal-note-short-4'),
      long: tl(locale, 'thermal-lab-crystal-note-long-6', { T1: T(T1), limit: g(limit), what, mass: g(s1.mass), mass2: sig(s1.mass / limit, 2, locale) }),
    };
  }
  return null;
}

/**
 * The Professor's word at the end of a step: what came of it, in one or two short sentences — "Розчин
 * мідного купоросу охолов до 20 °C за 45 хв. Випали кристали!" Every step, every experiment: the operation's
 * own verb, the contents by name, the time; a short note of the operation (the common temperature) and of the
 * crystals, if there is one. Null — the step did not reach its goal (other lines explain that).
 */
export function stepOutcome<C extends Command>(p: LabParams, result: ExperimentResult<C>, status: LabStatus, locale: Locale): string | null {
  if (status.kind !== 'reached') return null;
  const sub = SUBSTANCES[p.substance];
  const { gender, name } = subject(p, locale, result.final);
  const op0 = OPERATIONS[p.action];
  const op = sub.melt && op0.verbsMolten ? { ...op0, verbs: op0.verbsMolten } : op0;
  const target = p.target !== undefined && op.target ? ` ${formatQuantity(K(p.target), 'K', { locale, level: 'school' })}` : '';
  const word = op.durationWord ? tr(op.durationWord, locale) : tl(locale, 'thermal-lab-step-outcome-word');
  const parts = [`${name} ${tl(locale, op.verbs.past, { gender })}${target} ${word ? `${word} ` : ''}${formatDuration(status.at, locale)}.`];
  const note = op.reachedNotes?.({ sample: sampleOf(result.final), state: result.final, initial: result.initial, locale })?.[0];
  // Its first sentence: the main thing the operation has to say (the common temperature, the mean current).
  const first = note?.split(/(?<=[.!?])\s+/)[0];
  if (first && first.length <= 160) parts.push(first);
  const crystals = crystalNote([result.initial, ...result.samples, result.final], locale);
  if (crystals) parts.push(crystals.short);
  return parts.join(' ');
}

export function labSummary<C extends Command>(p: LabParams, result: ExperimentResult<C>, status: LabStatus, ctx: ExplainContext): Block[] {
  const blocks = labHeadline(p, result, status, ctx);
  const cautions = labCautions(p).map((c) => tr(c, ctx.locale));
  return cautions.length ? [...blocks, { kind: 'note', tone: 'warning', text: cautions.join(' ') }] : blocks;
}

function labHeadline<C extends Command>(p: LabParams, result: ExperimentResult<C>, status: LabStatus, ctx: ExplainContext): Block[] {
  const { locale } = ctx;
  const sub = SUBSTANCES[p.substance];
  const { text: subj, gender, name: subjName } = subject(p, locale, result.final);
  const T = (k: number) => formatQuantity(k, 'K', { locale, level: 'school' });
  const op0 = OPERATIONS[p.action];
  const op = sub.melt && op0.verbsMolten ? { ...op0, verbs: op0.verbsMolten } : op0;
  const target = p.target !== undefined && op.target ? ` ${T(K(p.target))}` : '';
  const past = `${tl(locale, op.verbs.past, { gender })}${target}`;
  const future = `${tr(op.verbs.future, locale)}${target}`;
  const notFuture = `${tr(op.verbs.negative ?? op.verbs.future, locale)}${target}`;
  const b0 = sampleOf(result.initial);
  const b1 = sampleOf(result.final);

  const energyLine = (): string | null => {
    const split = energySplit(result.initial, result.final);
    if (split.produced > 0) {
      // Into the contents = what they store now + what their boiling vapour carried away.
      const toSample = split.shares.filter((s) => s.entity === SAMPLE_ID && (s.role === 'body' || s.role === 'vapour')).reduce((sum, s) => sum + s.energy, 0);
      const pct = Math.round((100 * toSample) / split.produced);
      return tl(locale, 'thermal-lab-headline-energy-line', { produced: formatQuantity(split.produced, 'J', { locale, level: 'school' }), pct: String(pct) });
    }
    const lost = -(split.shares.find((s) => s.entity === SAMPLE_ID)?.energy ?? 0);
    if (lost > 0) {
      const note = sub.melt ? (op.heatGivenNoteMolten ?? op.heatGivenNote) : op.heatGivenNote;
      return tl(locale, 'thermal-lab-gave-heat', { name: lowerFirst(subjName), gender, heat: formatQuantity(lost, 'J', { locale, level: 'school' }), note: note ? tr(note, locale) : '' });
    }
    return null;
  };

  switch (status.kind) {
    case 'reached': {
      const word = op.durationWord ? tr(op.durationWord, locale) : tl(locale, 'thermal-lab-step-outcome-word');
      const lines = [`${subj} ${past} ${word ? `${word} ` : ''}${formatDuration(status.at, locale)}.`];
      lines.push(...(op.reachedNotes?.({ sample: b1, state: result.final, initial: result.initial, locale }) ?? []));
      const crystals = crystalNote([result.initial, ...result.samples, result.final], locale);
      if (crystals) lines.push(crystals.long);
      // A current's heat is told by the operation itself; "the heater released…" is for heaters.
      const e = op.uses === 'supply' ? null : energyLine();
      if (e) lines.push(e);
      return [{ kind: 'summary', tone: 'success', lines }];
    }
    case 'will-reach':
      return [
        {
          kind: 'summary',
          tone: 'neutral',
          lines: [
            tl(locale, 'thermal-lab-stopped', { after: formatDuration(result.final.time - result.initial.time, locale), from: T(b0.state.temperature), to: T(b1.state.temperature), solid: b1.state.solidFraction !== undefined && b1.state.solidFraction > 0 && b1.state.solidFraction < 1 ? Math.round(b1.state.solidFraction * 100) : 'none' }),
            tl(locale, 'thermal-lab-would-reach', { subj: lowerFirst(subj), future, after: formatDuration(status.after, locale) }),
          ],
        },
      ];
    case 'stalls': {
      const heating = op.direction === 'heating';
      // An induction hob that keeps cutting out: the pan (heated nearly empty) is too hot for its sensor.
      const cut = p.heater ? HEATERS[p.heater.id].spec.vesselCutoff : undefined;
      const wall = result.final.entities[entityId(LAB_VESSEL_ID)];
      const guarded = cut && wall && isThermalBody(wall) && wall.state.temperature >= K(cut.value) - 15;
      return [
        {
          kind: 'summary',
          tone: 'failure',
          lines: [
            tl(locale, 'thermal-lab-headline-lines-3', { subj, notFuture, limit: T(status.limit), value: heating ? tl(locale, 'thermal-lab-headline-lines') : tl(locale, 'thermal-lab-headline-lines-2') }),
            heating
              ? tl(locale, 'thermal-lab-headline-lines-5', { value: status.limit > K(400) ? tl(locale, 'thermal-lab-headline-lines-4') : '' })
              : tl(locale, 'thermal-lab-headline-lines-6'),
            ...(guarded
              ? [tl(locale, 'thermal-lab-cut-out', { heater: tr(HEATERS[p.heater!.id].name, locale), lower: tr(HEATERS[p.heater!.id].name, locale).toLowerCase(), cut: T(K(cut!.value)) })]
              : []),
          ],
        },
      ];
    }
    case 'impossible': {
      const first = op.impossibleHeadline?.(b1, subj, locale) ?? (tl(locale, 'thermal-lab-headline-first', { subj, notFuture }));
      return [{ kind: 'summary', tone: 'failure', lines: [first, tr(status.reason, locale)] }];
    }
    case 'decomposes': {
      const smoke = sub.decomposes!.value;
      return [
        {
          kind: 'summary',
          tone: 'failure',
          lines: [
            tl(locale, 'thermal-lab-smokes', { subj, past: tl(locale, op.verbs.past, { gender }), future: tr(op.verbs.future, locale), gender, at: formatDuration(status.at, locale), smoke: T(K(smoke)) }),
            tl(locale, 'thermal-lab-smokes-why', { name: lowerFirst(tr(sub.name, locale)) }),
          ],
        },
      ];
    }
    case 'no-heat':
      return [{ kind: 'summary', tone: 'failure', lines: [tl(locale, 'thermal-lab-headline-lines-7', { subj, reason: tr(status.reason, locale) })] }];
    case 'off':
      return [{ kind: 'summary', tone: 'neutral', lines: [tl(locale, 'thermal-lab-headline-lines-8', { temperature: T(b1.state.temperature) })] }];
    case 'vessel-fails': {
      const vessel = lowerFirst(tr(VESSELS[p.vessel].name, locale));
      const what = tr(status.what, locale);
      const name = lowerFirst(tr(sub.name, locale));
      return [
        {
          kind: 'summary',
          tone: 'failure',
          lines: [
            tl(locale, status.ahead ? 'thermal-lab-vessel-will-fail' : 'thermal-lab-vessel-failed', { vessel, at: formatDuration(status.at, locale), limit: T(K(status.limit)), what, subj, notFuture, gender, reached: T(b1.state.temperature) }),
            p.cooler && COOLERS[p.cooler.id].spec.hot
              ? tl(locale, 'thermal-lab-headline-lines-9')
              : tl(locale, 'thermal-lab-headline-lines-10', { name }),
          ],
        },
      ];
    }
  }
}

/** "Distilled water (1 L) in a steel pot on an electric hob" — what is on the table right now. */
export const labSubject = (p: LabParams, locale: Locale, now?: SystemState): string => subject(p, locale, now).text;
