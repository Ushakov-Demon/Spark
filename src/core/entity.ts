import type { ConnectionId, EntityId } from './ids.js';
import type { Vec2 } from './math/vec2.js';
import type { Kilograms } from './units.js';

/**
 * Physical domain a port / connection belongs to. A port can only be wired to
 * a port of the same domain (you can't plug a thermal contact into a socket).
 * New sciences (chemistry, optics) extend this union.
 */
export type Domain = 'thermal' | 'electrical' | 'mechanical';

/**
 * Where the object sits in the scene. Purely for layout/UI and for future
 * spatial physics (mechanics); thermal and circuit solvers ignore it.
 */
export interface Transform {
  readonly position: Vec2;
  readonly rotation: number; // radians
}

/**
 * Base object of the world.
 *
 * - `kind`   — discriminator, namespaced by domain: "thermal.body", "electrical.resistor".
 * - `params` — what the student configures (mass, resistance, power). Solvers never change it.
 * - `state`  — what physics evolves over time (temperature, velocity, charge).
 *
 * Splitting params/state keeps "the setup" and "the evolving world" apart:
 * resetting an experiment = keep params, reset state.
 */
export interface Entity<K extends string = string, P = unknown, S = unknown> {
  readonly id: EntityId;
  readonly kind: K;
  readonly label?: string;
  readonly transform: Transform;
  readonly params: Readonly<P>;
  readonly state: Readonly<S>;
}

/** An entity that has mass (a block, a pot of water, a cart). */
export interface MassParams {
  readonly mass: Kilograms;
}
export type Body<K extends string = string, P extends MassParams = MassParams, S = unknown> = Entity<K, P, S>;

/** A named connection point on a device. */
export interface PortSpec<N extends string = string> {
  readonly name: N;
  readonly domain: Domain;
}

/**
 * A device is an entity with ports: a resistor (2 electrical ports), a heater
 * (1 thermal port), a battery, a spring (2 mechanical ports)…
 */
export interface Device<K extends string = string, P = unknown, S = unknown, N extends string = string>
  extends Entity<K, P, S> {
  readonly ports: readonly PortSpec<N>[];
}

export interface PortRef {
  readonly entity: EntityId;
  readonly port: string;
}

/**
 * Edge of the world graph: a wire, a thermal contact, a rope.
 * Like entities, it has a domain-specific `kind` and `params`.
 */
export interface Connection<D extends Domain = Domain, K extends string = string, P = unknown> {
  readonly id: ConnectionId;
  readonly domain: D;
  readonly kind: K;
  readonly a: PortRef;
  readonly b: PortRef;
  readonly params: Readonly<P>;
}

export type AnyEntity = Entity<string, unknown, unknown>;
export type AnyDevice = Device<string, unknown, unknown>;
export type AnyConnection = Connection<Domain, string, unknown>;

export const isDevice = (e: AnyEntity): e is AnyDevice =>
  Array.isArray((e as Partial<AnyDevice>).ports);
