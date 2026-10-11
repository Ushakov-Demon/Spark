import type { AnyEntity, Device, PortSpec, Transform } from '../../core/entity.js';
import { entityId } from '../../core/ids.js';
import { ORIGIN, type Vec2 } from '../../core/math/vec2.js';
import { joules, type Joules, type Kelvin, type Kilograms, type SpecificHeat, type Watts } from '../../core/units.js';

/**
 * Lumped-capacitance model: every thermal object is a single node with one
 * uniform temperature (good when objects are small or well-mixed — a cup of
 * water, a metal block). Spatial temperature fields are a later upgrade.
 */
export type ThermalPortName = 'surface';
const SURFACE: readonly PortSpec<ThermalPortName>[] = [{ name: 'surface', domain: 'thermal' }];

// ---------- Body: block of matter (water, copper cube, brick) ----------
export interface ThermalBodyParams {
  readonly mass: Kilograms;
  readonly specificHeat: SpecificHeat;
  /** Key in MATERIALS the values came from — lets explanations cite the data source. */
  readonly material?: string;
}
export interface ThermalBodyState {
  readonly temperature: Kelvin;
}
export type ThermalBody = Device<'thermal.body', ThermalBodyParams, ThermalBodyState, ThermalPortName>;

// ---------- Heater: body with an internal heat source (immersion heater, stove) ----------
export interface HeaterParams extends ThermalBodyParams {
  readonly power: Watts;
  /** Student-controlled switch. Will move to `state` once thermostats can toggle it. */
  readonly on: boolean;
}
export interface HeaterState extends ThermalBodyState {
  /** Total electrical energy converted to heat so far — shown in the UI, used in energy checks. */
  readonly energyDelivered: Joules;
}
export type Heater = Device<'thermal.heater', HeaterParams, HeaterState, ThermalPortName>;

// ---------- Reservoir: infinite heat capacity at fixed temperature (room air, ice bath) ----------
export interface ReservoirParams {
  readonly temperature: Kelvin;
}
export interface ReservoirState {
  /** Net heat that flowed INTO the reservoir so far (negative = it gave heat away). */
  readonly heatAbsorbed: Joules;
}
export type Reservoir = Device<'thermal.reservoir', ReservoirParams, ReservoirState, ThermalPortName>;

export type ThermalEntity = ThermalBody | Heater | Reservoir;

// ---------- Type guards ----------
export const isThermalBody = (e: AnyEntity): e is ThermalBody => e.kind === 'thermal.body';
export const isHeater = (e: AnyEntity): e is Heater => e.kind === 'thermal.heater';
export const isReservoir = (e: AnyEntity): e is Reservoir => e.kind === 'thermal.reservoir';
export const isThermalEntity = (e: AnyEntity): e is ThermalEntity =>
  isThermalBody(e) || isHeater(e) || isReservoir(e);

// ---------- Factories (validate physical sanity at creation) ----------
interface Common {
  readonly id: string;
  readonly label?: string;
  readonly position?: Vec2;
}
const transform = (position: Vec2 = ORIGIN): Transform => ({ position, rotation: 0 });
const withLabel = (label: string | undefined): { label?: string } => (label === undefined ? {} : { label });

function assertPositive(name: string, v: number): void {
  if (!(v > 0) || !Number.isFinite(v)) throw new RangeError(`${name} must be a positive finite number, got ${v}`);
}
function assertTemperature(t: Kelvin): void {
  if (!(t >= 0) || !Number.isFinite(t)) throw new RangeError(`Temperature must be ≥ 0 K, got ${t}`);
}

export function thermalBody(
  o: Common & ThermalBodyParams & { readonly temperature: Kelvin },
): ThermalBody {
  assertPositive('mass', o.mass);
  assertPositive('specificHeat', o.specificHeat);
  assertTemperature(o.temperature);
  return {
    id: entityId(o.id),
    kind: 'thermal.body',
    ...withLabel(o.label),
    transform: transform(o.position),
    ports: SURFACE,
    params: { mass: o.mass, specificHeat: o.specificHeat, ...(o.material === undefined ? {} : { material: o.material }) },
    state: { temperature: o.temperature },
  };
}

export function heater(
  o: Common & ThermalBodyParams & { readonly power: Watts; readonly on?: boolean; readonly temperature: Kelvin },
): Heater {
  assertPositive('mass', o.mass);
  assertPositive('specificHeat', o.specificHeat);
  assertTemperature(o.temperature);
  if (!(o.power >= 0)) throw new RangeError(`power must be ≥ 0, got ${o.power}`);
  return {
    id: entityId(o.id),
    kind: 'thermal.heater',
    ...withLabel(o.label),
    transform: transform(o.position),
    ports: SURFACE,
    params: {
      mass: o.mass,
      specificHeat: o.specificHeat,
      ...(o.material === undefined ? {} : { material: o.material }),
      power: o.power,
      on: o.on ?? true,
    },
    state: { temperature: o.temperature, energyDelivered: joules(0) },
  };
}

export function reservoir(o: Common & { readonly temperature: Kelvin }): Reservoir {
  assertTemperature(o.temperature);
  return {
    id: entityId(o.id),
    kind: 'thermal.reservoir',
    ...withLabel(o.label),
    transform: transform(o.position),
    ports: SURFACE,
    params: { temperature: o.temperature },
    state: { heatAbsorbed: joules(0) },
  };
}

/** Current temperature of any thermal entity. */
export const temperatureOf = (e: ThermalEntity): Kelvin =>
  isReservoir(e) ? e.params.temperature : e.state.temperature;
