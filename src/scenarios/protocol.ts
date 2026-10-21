import type { CommandRegistry } from '../core/commands.js';
import type { AnyConnection, AnyEntity } from '../core/entity.js';
import { createExperimentSession, type ExperimentLogEntry, type ExperimentResult } from '../core/experiment.js';
import type { Simulation } from '../core/simulation.js';
import type { SystemState } from '../core/state.js';
import { celsius, kilograms, type Seconds } from '../core/units.js';
import { isBurner, isHeater, isThermalBody } from '../domains/thermal/entities.js';
import { isSupply } from '../domains/electrical/entities.js';
import type { ScaleId } from '../equipment/scales.js';
import { canHeat } from '../equipment/compatibility.js';
import { HEATERS } from '../equipment/heaters.js';
import { VESSELS } from '../equipment/vessels.js';
import type { LabCommand } from './lab-knowledge.js';
import type { LocalizedText } from '../knowledge/i18n.js';
import type { SubstanceId } from '../substances/catalog.js';
import { LAB_ROOM_ID, labGoalReached, labProgress, noProgress, labSetup, labStatus, SAMPLE_ID, type LabAction, type LabParams, type LabStatus } from './thermal-lab.js';

/**
 * A protocol: one sample, several steps. "Heat the water to a boil → add salt →
 * cool it in the fridge → freeze it." Between operations the vessel moves to
 * another device; the matter in it (temperature, composition, ice, what was
 * added) carries over. Each step runs as its own experiment, so every step gets
 * its own headline, energy split and debrief.
 */
export type ProtocolStep = OperationStep | AddStep | WeighStep | LevelStep | HangStep | FreshStep;

export interface OperationStep {
  readonly kind: 'operation';
  readonly action: LabAction;
  /** °C, for operations with a target (heat to…, cool to…). */
  readonly target?: number;
  readonly heater?: LabParams['heater'];
  readonly cooler?: LabParams['cooler'];
  readonly supply?: LabParams['supply'];
  /** Minutes, for timed operations (pass a current). */
  readonly duration?: number;
  /** In a guided procedure: what the step is called ("wait for the ice to melt") and how fast it runs. */
  readonly label?: LocalizedText;
  readonly speed?: number;
}

/** Put a portion of a substance into the vessel (salt into water, an ice cube into tea). */
export interface AddStep {
  readonly kind: 'add';
  readonly substance: SubstanceId;
  readonly mass: number; // kg
  readonly temperature: number; // °C
  readonly frozen?: boolean;
  /** Its name in the protocol ("an unknown metal"), instead of the substance's. */
  readonly label?: LocalizedText;
}

/** Put the vessel on the scales and read them (changes nothing; the reading goes to the log). */
export interface WeighStep {
  readonly kind: 'weigh';
  readonly scale: ScaleId;
}

/**
 * Start again with the same setup — a fresh, cold vessel and fresh contents — changed as said
 * (without the lid): for a fair comparison of two runs side by side.
 */
export interface FreshStep {
  readonly kind: 'fresh';
  readonly lid?: boolean;
  /** What else changes for the new run (a crucible instead of the pot; a furnace — it replaces the heater). */
  readonly set?: Partial<Pick<LabParams, 'vessel' | 'size' | 'material' | 'liters' | 'heater' | 'cooler'>>;
  readonly label?: LocalizedText;
}

/** The setup for a fresh run: the same, changed as the step says (a furnace replaces the heater and back). */
export function freshParams(base: LabParams, step: FreshStep): LabParams {
  const next: LabParams = { ...base, ...(step.lid === undefined ? {} : { lid: step.lid }), ...(step.set ?? {}) };
  // The new vessel does not go on the old heater (a crucible is not put on a hob): it stands on the table till the next step.
  if (next.heater && !step.set?.heater && !canHeat(HEATERS[next.heater.id], VESSELS[next.vessel], next.material, next.size).ok) {
    const { heater: _h, ...rest } = next;
    void _h;
    return rest;
  }
  if (step.set?.cooler) {
    const { heater: _h, ...rest } = next;
    void _h;
    return rest;
  }
  if (step.set?.heater) {
    const { cooler: _c, ...rest } = next;
    void _c;
    return rest;
  }
  return next;
}

/** Read the level of the liquid by the vessel's marks. */
export interface LevelStep {
  readonly kind: 'level';
}

/** Hang a body on the dynamometer, in the air or lowered into the liquid. */
export interface HangStep {
  readonly kind: 'hang';
  readonly substance: SubstanceId;
  readonly mass: number; // kg
  readonly into: 'air' | 'liquid';
}

/** The lab command of a step that is not an operation: put something in, or measure. */
export function stepCommand(step: Exclude<ProtocolStep, OperationStep | FreshStep>, base: LabParams): LabCommand {
  switch (step.kind) {
    case 'weigh':
      return { type: 'lab.weigh', scale: step.scale };
    case 'level':
      return { type: 'lab.read-level', vessel: base.vessel, size: base.size };
    case 'hang':
      return { type: 'lab.hang', substance: step.substance, mass: step.mass, into: step.into };
    case 'add':
      return { type: 'thermal.add', into: SAMPLE_ID, substance: step.substance, mass: kilograms(step.mass), temperature: celsius(step.temperature), ...(step.frozen ? { frozen: true } : {}), ...(step.label ? { label: step.label } : {}) };
  }
}

/** The lab parameters of one operation step: the same vessel and sample, this step's action and device. */
export function stepParams(base: LabParams, step: OperationStep): LabParams {
  const { heater: _h, cooler: _c, target: _t, supply: _s, duration: _d, ...rest } = base;
  void _h;
  void _c;
  void _t;
  void _s;
  void _d;
  return {
    ...rest,
    action: step.action,
    ...(step.target === undefined ? {} : { target: step.target }),
    ...(step.heater ? { heater: step.heater } : {}),
    ...(step.cooler ? { cooler: step.cooler } : {}),
    ...(step.supply ? { supply: step.supply } : {}),
    ...(step.duration === undefined ? {} : { duration: step.duration }),
  };
}

/** The same device in both setups (a heater, a flame, a power supply): it keeps its state — a hot hob, a half-used battery. */
const sameHeater = (a: AnyEntity, b: AnyEntity): boolean =>
  (isHeater(a) && isHeater(b)) || (isBurner(a) && isBurner(b)) || (isSupply(a) && isSupply(b))
    ? (a.params as { device?: string }).device === (b.params as { device?: string }).device
    : false;

/** Bodies of matter (vessel, its contents, lid, added pieces) stay; devices and surroundings are the "place". */
const isMatter = (e: AnyEntity | undefined): boolean => e !== undefined && isThermalBody(e);

/**
 * Move the vessel to the place of step `p`: replace devices and the links to the
 * surroundings with those of a fresh setup, keep every body of matter as it is now.
 */
export function configureStep(state: SystemState, p: LabParams): { readonly state: SystemState; readonly warnings: readonly LocalizedText[] } {
  const fresh = labSetup(p);
  const entities: Record<string, AnyEntity> = {};
  // Matter stays as it is; so does the room (its air keeps the history of what it absorbed).
  for (const e of Object.values(state.entities)) if (isMatter(e) || e.id === LAB_ROOM_ID) entities[e.id] = e;
  // Devices and the place come from the new setup: heater, cooler at its new setpoint, thermostat.
  // The same heater keeps its state: the pot stays on the hot hob, the hob does not cool down.
  for (const e of Object.values(fresh.state.entities)) {
    if (isMatter(e) || e.id in entities) continue;
    const old = state.entities[e.id];
    // A power supply keeps its charge (a used battery stays used), but its timer counts this step.
    entities[e.id] = old && sameHeater(old, e) ? ({ ...e, state: isSupply(old) ? { ...old.state, time: 0 } : old.state } as AnyEntity) : e;
  }
  const keeps = (c: AnyConnection) => isMatter(state.entities[c.a.entity]) && isMatter(state.entities[c.b.entity]);
  const place = (c: AnyConnection) => !(isMatter(fresh.state.entities[c.a.entity]) && isMatter(fresh.state.entities[c.b.entity]));
  const connections = [...state.connections.filter(keeps), ...fresh.state.connections.filter(place)];
  return { state: { ...state, entities, connections }, warnings: fresh.warnings };
}

export interface StepOutcome {
  readonly step: ProtocolStep;
  /** For operation steps: the lab parameters it ran with. */
  readonly params?: LabParams;
  readonly result: ExperimentResult<LabCommand>;
  readonly status?: LabStatus;
  /** For add and weigh steps: what the command said (a weighing carries its reading). */
  readonly entry?: ExperimentLogEntry<LabCommand>;
  readonly warnings: readonly LocalizedText[];
}

export interface ProtocolInput {
  /** The experiment: vessel, sample, room — and the first operation's settings. */
  readonly base: LabParams;
  readonly steps: readonly ProtocolStep[];
  readonly simulation: Simulation;
  readonly commands: CommandRegistry<LabCommand>;
  readonly sampleEvery: Seconds;
  /** Longest a single step may run, s (default 24 h). */
  readonly maxStepSeconds?: number;
}

/** Runs the steps one after another on the same sample (scripted; the page runs them live). */
export function runProtocol(input: ProtocolInput): StepOutcome[] {
  const out: StepOutcome[] = [];
  let state: SystemState | undefined;
  let base = input.base;
  for (const step of input.steps) {
    if (step.kind === 'fresh') {
      // The same setup again, from the start (cold vessel, fresh contents), changed as the step says.
      base = freshParams(base, step);
      state = labSetup(base).state;
      const session = createExperimentSession<LabCommand>({ initial: state, simulation: input.simulation, commands: input.commands, sampleEvery: input.sampleEvery });
      out.push({ step, result: session.result(), warnings: [] });
      continue;
    }
    if (step.kind !== 'operation') {
      if (!state) state = labSetup(base).state;
      const session = createExperimentSession<LabCommand>({ initial: state, simulation: input.simulation, commands: input.commands, sampleEvery: input.sampleEvery });
      const entry = session.apply(stepCommand(step, base));
      const result = session.result();
      out.push({ step, result, entry, warnings: [] });
      state = result.final;
      continue;
    }
    const p = stepParams(base, step);
    const placed = state ? configureStep(state, p) : labSetup(p);
    const session = createExperimentSession<LabCommand>({ initial: placed.state, simulation: input.simulation, commands: input.commands, sampleEvery: input.sampleEvery });
    runStep(session, p, input.maxStepSeconds ?? 24 * 3600);
    const result = session.result(labGoalReached(p, session.state));
    out.push({ step, params: p, result, status: labStatus(p, result, input.simulation, placed.warnings), warnings: placed.warnings });
    state = result.final;
  }
  return out;
}

/** Advance until the goal, a steady state (no change for 30 min) or the time limit. */
function runStep(session: ReturnType<typeof createExperimentSession<LabCommand>>, p: LabParams, maxSeconds: number): void {
  const start = session.state.time;
  let checkpoint = labProgress(session.state);
  while (session.state.time - start < maxSeconds) {
    if (session.advance(1800, (s) => labGoalReached(p, s))) return;
    const now = labProgress(session.state);
    if (noProgress(p, checkpoint, now)) return;
    checkpoint = now;
  }
}
