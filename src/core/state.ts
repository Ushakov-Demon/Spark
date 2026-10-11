import type { AnyConnection, AnyEntity } from './entity.js';
import type { EntityId } from './ids.js';
import { kelvin, seconds, type Kelvin, type Seconds } from './units.js';

/** Global conditions of the experiment. */
export interface Environment {
  readonly gravity: number; // m/s², kept as a plain number until mechanics lands
  readonly ambientTemperature: Kelvin;
}

export const DEFAULT_ENVIRONMENT: Environment = {
  gravity: 9.81,
  ambientTemperature: kelvin(293.15),
};

/**
 * Immutable snapshot of the whole world at time `time`.
 *
 * Plain JSON-serializable data (Records, arrays, numbers) on purpose:
 * snapshots can be saved, diffed, sent to a Web Worker, replayed, and shared
 * as a "lab file" without any custom (de)serialization.
 */
export interface SystemState {
  readonly time: Seconds;
  readonly step: number;
  readonly environment: Environment;
  readonly entities: Readonly<Record<EntityId, AnyEntity>>;
  readonly connections: readonly AnyConnection[];
}

export interface CreateStateInput {
  readonly entities: readonly AnyEntity[];
  readonly connections?: readonly AnyConnection[];
  readonly environment?: Partial<Environment>;
}

export function createState(input: CreateStateInput): SystemState {
  const entities: Record<EntityId, AnyEntity> = {};
  for (const e of input.entities) {
    if (e.id in entities) throw new Error(`Duplicate entity id "${e.id}"`);
    entities[e.id] = e;
  }
  return {
    time: seconds(0),
    step: 0,
    environment: { ...DEFAULT_ENVIRONMENT, ...input.environment },
    entities,
    connections: input.connections ?? [],
  };
}

export const listEntities = (s: SystemState): AnyEntity[] => Object.values(s.entities);

export const getEntity = (s: SystemState, id: EntityId): AnyEntity | undefined => s.entities[id];

/**
 * Returns a new state with some entities replaced. Untouched entities keep
 * reference identity, so a UI can cheaply detect what changed.
 */
export function withEntities(s: SystemState, updated: readonly AnyEntity[]): SystemState {
  if (updated.length === 0) return s;
  const entities: Record<EntityId, AnyEntity> = { ...s.entities };
  for (const e of updated) entities[e.id] = e;
  return { ...s, entities };
}
