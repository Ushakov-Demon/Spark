import type { CommandRegistry } from '../core/commands.js';
import type { AnyConnection, AnyEntity } from '../core/entity.js';
import { createExperimentSession, type ExperimentLogEntry, type ExperimentResult } from '../core/experiment.js';
import type { Simulation } from '../core/simulation.js';
import type { SystemState } from '../core/state.js';
import { celsius, kilograms, type Seconds } from '../core/units.js';
import { bodyMass, isBurner, isHeater, isThermalBody } from '../domains/thermal/entities.js';
import type { ThermalCommand } from '../domains/thermal/commands.js';
import type { LocalizedText } from '../knowledge/i18n.js';
import type { SubstanceId } from '../substances/catalog.js';
import { LAB_ROOM_ID, labGoalReached, labSetup, labStatus, sampleOf, SAMPLE_ID, type LabAction, type LabParams, type LabStatus } from './thermal-lab.js';

/**
 * A protocol: one sample, several steps. "Heat the water to a boil → add salt →
 * cool it in the fridge → freeze it." Between operations the vessel moves to
 * another device; the matter in it (temperature, composition, ice, what was
 * added) carries over. Each step runs as its own experiment, so every step gets
 * its own headline, energy split and debrief.
 */
export type ProtocolStep = OperationStep | AddStep;

export interface OperationStep {
  readonly kind: 'operation';
  readonly action: LabAction;
  /** °C, for operations with a target (heat to…, cool to…). */
  readonly target?: number;
  readonly heater?: LabParams['heater'];
  readonly cooler?: LabParams['cooler'];
}

/** Put a portion of a substance into the vessel (salt into water, an ice cube into tea). */
export interface AddStep {
  readonly kind: 'add';
  readonly substance: SubstanceId;
  readonly mass: number; // kg
  readonly temperature: number; // °C
  readonly frozen?: boolean;
}

/** The lab parameters of one operation step: the same vessel and sample, this step's action and device. */
export function stepParams(base: LabParams, step: OperationStep): LabParams {
  const { heater: _h, cooler: _c, target: _t, ...rest } = base;
  void _h;
  void _c;
  void _t;
  return {
    ...rest,
    action: step.action,
    ...(step.target === undefined ? {} : { target: step.target }),
    ...(step.heater ? { heater: step.heater } : {}),
    ...(step.cooler ? { cooler: step.cooler } : {}),
  };
}

/** A heater (or flame) of the same model in both setups. */
const sameHeater = (a: AnyEntity, b: AnyEntity): boolean =>
  (isHeater(a) && isHeater(b)) || (isBurner(a) && isBurner(b)) ? (a.params as { device?: string }).device === (b.params as { device?: string }).device : false;

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
    entities[e.id] = old && sameHeater(old, e) ? ({ ...e, state: old.state } as AnyEntity) : e;
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
  readonly result: ExperimentResult<ThermalCommand>;
  readonly status?: LabStatus;
  /** For add steps: what the command said. */
  readonly entry?: ExperimentLogEntry<ThermalCommand>;
  readonly warnings: readonly LocalizedText[];
}

export interface ProtocolInput {
  /** The experiment: vessel, sample, room — and the first operation's settings. */
  readonly base: LabParams;
  readonly steps: readonly ProtocolStep[];
  readonly simulation: Simulation;
  readonly commands: CommandRegistry<ThermalCommand>;
  readonly sampleEvery: Seconds;
  /** Longest a single step may run, s (default 24 h). */
  readonly maxStepSeconds?: number;
}

/** Runs the steps one after another on the same sample (scripted; the page runs them live). */
export function runProtocol(input: ProtocolInput): StepOutcome[] {
  const out: StepOutcome[] = [];
  let state: SystemState | undefined;
  for (const step of input.steps) {
    if (step.kind === 'add') {
      if (!state) state = labSetup(input.base).state;
      const session = createExperimentSession<ThermalCommand>({ initial: state, simulation: input.simulation, commands: input.commands, sampleEvery: input.sampleEvery });
      const entry = session.apply({ type: 'thermal.add', into: SAMPLE_ID, substance: step.substance, mass: kilograms(step.mass), temperature: celsius(step.temperature), ...(step.frozen ? { frozen: true } : {}) });
      const result = session.result();
      out.push({ step, result, entry, warnings: [] });
      state = result.final;
      continue;
    }
    const p = stepParams(input.base, step);
    const placed = state ? configureStep(state, p) : labSetup(p);
    const session = createExperimentSession<ThermalCommand>({ initial: placed.state, simulation: input.simulation, commands: input.commands, sampleEvery: input.sampleEvery });
    runStep(session, p, input.maxStepSeconds ?? 24 * 3600);
    const result = session.result(labGoalReached(p, session.state));
    out.push({ step, params: p, result, status: labStatus(p, result, input.simulation, placed.warnings), warnings: placed.warnings });
    state = result.final;
  }
  return out;
}

/** Advance until the goal, a steady state (no change for 30 min) or the time limit. */
function runStep(session: ReturnType<typeof createExperimentSession<ThermalCommand>>, p: LabParams, maxSeconds: number): void {
  const start = session.state.time;
  const progress = () => {
    const b = sampleOf(session.state);
    return { T: b.state.temperature, s: b.state.solidFraction ?? 0, m: bodyMass(b) };
  };
  let checkpoint = progress();
  while (session.state.time - start < maxSeconds) {
    if (session.advance(1800, (s) => labGoalReached(p, s))) return;
    const now = progress();
    if (Math.abs(now.T - checkpoint.T) < 0.05 && Math.abs(now.s - checkpoint.s) < 0.001 && Math.abs(now.m - checkpoint.m) < 1e-5) return;
    checkpoint = now;
  }
}
