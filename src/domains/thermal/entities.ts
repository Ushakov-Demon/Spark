import type { AnyEntity, Device, PortSpec, Transform } from '../../core/entity.js';
import { entityId } from '../../core/ids.js';
import { ORIGIN, type Vec2 } from '../../core/math/vec2.js';
import type { LocalizedText } from '../../knowledge/i18n.js';
import { specificEnthalpy, type PhaseParams } from './phase.js';
import type { EvaporationParams } from './evaporation.js';
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
  /** Initial mass. Boiling can reduce it — see state.boiledOff. */
  readonly mass: Kilograms;
  /** Specific heat of the liquid (or of the only phase, for bodies without phase data). */
  readonly specificHeat: SpecificHeat;
  /** Melting / boiling data — present for substances that can change phase in the experiment. */
  readonly phase?: PhaseParams;
  /** Key in the substance catalog, when the body is made of a catalog substance. */
  readonly substance?: string;
  /** Evaporation from its free surface (liquids). */
  readonly evaporation?: EvaporationParams;
  /** Key in MATERIALS the values came from — lets explanations cite the data source. */
  readonly material?: string;
}
export interface ThermalBodyState {
  readonly temperature: Kelvin;
  /** 0 — all liquid, 1 — all solid; between — melting/freezing in progress. */
  readonly solidFraction?: number;
  /** Mass that has boiled away (bubbles in the whole volume at the boiling point), kg. */
  readonly boiledOff?: number;
  /** Mass that has evaporated from the open surface below the boiling point, kg. */
  readonly evaporated?: number;
  /** Energy the vapour carried away, J (relative to the same 0 °C reference). */
  readonly vaporEnergy?: number;
}
export type ThermalBody = Device<'thermal.body', ThermalBodyParams, ThermalBodyState, ThermalPortName>;

// ---------- Heater: body with an internal heat source (immersion heater, stove) ----------
export interface HeaterParams extends ThermalBodyParams {
  readonly power: Watts;
  /** Student-controlled switch. Will move to `state` once thermostats can toggle it. */
  readonly on: boolean;
  /** Catalog id of the device (see devices.ts) — for explanations and data provenance. */
  readonly device?: string;
}
export interface HeaterState extends ThermalBodyState {
  /** Total electrical energy converted to heat so far — shown in the UI, used in energy checks. */
  readonly energyDelivered: Joules;
}
export type Heater = Device<'thermal.heater', HeaterParams, HeaterState, ThermalPortName>;

// ---------- Reservoir: infinite heat capacity at fixed temperature (room air, ice bath) ----------
export interface ReservoirParams {
  readonly temperature: Kelvin;
  /** Catalog id of a cooler this reservoir stands for (freezer air, ice bath…). */
  readonly device?: string;
  /** Relative humidity of air, 0…1 (water vapour already in it); absent — not air / dry. */
  readonly humidity?: number;
}
export interface ReservoirState {
  /** Net heat that flowed INTO the reservoir so far (negative = it gave heat away). */
  readonly heatAbsorbed: Joules;
}
export type Reservoir = Device<'thermal.reservoir', ReservoirParams, ReservoirState, ThermalPortName>;

// ---------- Burner: an open flame — no mass of its own, it hands its power out ----------
export interface BurnerParams {
  readonly power: Watts;
  readonly on: boolean;
  /** Catalog id of the device (see devices.ts) — for explanations and data provenance. */
  readonly device?: string;
}
export interface BurnerState {
  readonly energyDelivered: Joules;
}
/**
 * A flame. It has no heat capacity: every step it distributes `power` along its
 * supply links (e.g. 36 % into the pot, 64 % into the room). Shares must add up to 1.
 */
export type Burner = Device<'thermal.burner', BurnerParams, BurnerState, ThermalPortName>;

export type ThermalEntity = ThermalBody | Heater | Reservoir;

// ---------- Type guards ----------
export const isThermalBody = (e: AnyEntity): e is ThermalBody => e.kind === 'thermal.body';
export const isHeater = (e: AnyEntity): e is Heater => e.kind === 'thermal.heater';
export const isReservoir = (e: AnyEntity): e is Reservoir => e.kind === 'thermal.reservoir';
export const isBurner = (e: AnyEntity): e is Burner => e.kind === 'thermal.burner';
export const isThermalEntity = (e: AnyEntity): e is ThermalEntity =>
  isThermalBody(e) || isHeater(e) || isReservoir(e);

// ---------- Factories (validate physical sanity at creation) ----------
interface Common {
  readonly id: string;
  readonly label?: LocalizedText;
  readonly position?: Vec2;
}
const transform = (position: Vec2 = ORIGIN): Transform => ({ position, rotation: 0 });
const withLabel = (label: LocalizedText | undefined): { label?: LocalizedText } => (label === undefined ? {} : { label });

function assertPositive(name: string, v: number): void {
  if (!(v > 0) || !Number.isFinite(v)) throw new RangeError(`${name} must be a positive finite number, got ${v}`);
}
function assertTemperature(t: Kelvin): void {
  if (!(t >= 0) || !Number.isFinite(t)) throw new RangeError(`Temperature must be ≥ 0 K, got ${t}`);
}

export function thermalBody(
  o: Common & ThermalBodyParams & { readonly temperature: Kelvin; readonly solidFraction?: number },
): ThermalBody {
  assertPositive('mass', o.mass);
  assertPositive('specificHeat', o.specificHeat);
  assertTemperature(o.temperature);
  // Below the melting point a body with phase data is solid, above — liquid, unless stated.
  const mp = o.phase?.meltingPoint;
  const solid = o.phase && mp !== undefined ? (o.solidFraction ?? (o.temperature < mp ? 1 : 0)) : undefined;
  return {
    id: entityId(o.id),
    kind: 'thermal.body',
    ...withLabel(o.label),
    transform: transform(o.position),
    ports: SURFACE,
    params: {
      mass: o.mass,
      specificHeat: o.specificHeat,
      ...(o.material === undefined ? {} : { material: o.material }),
      ...(o.phase === undefined ? {} : { phase: o.phase }),
      ...(o.substance === undefined ? {} : { substance: o.substance }),
      ...(o.evaporation === undefined ? {} : { evaporation: o.evaporation }),
    },
    state: { temperature: o.temperature, ...(solid === undefined ? {} : { solidFraction: solid }) },
  };
}

/** Current mass of a body (what has not boiled away). */
export const bodyMass = (e: ThermalBody | Heater): number =>
  e.params.mass - (('boiledOff' in e.state ? e.state.boiledOff : 0) ?? 0) - (('evaporated' in e.state ? e.state.evaporated : 0) ?? 0);

/** Energy stored in a body, J, relative to liquid at 0 °C (latent heat included). */
export const bodyEnergy = (e: ThermalBody | Heater): number =>
  bodyMass(e) * specificEnthalpy(e.state.temperature, ('solidFraction' in e.state ? e.state.solidFraction : 0) ?? 0, e.params.specificHeat, 'phase' in e.params ? e.params.phase : undefined);

export function heater(
  o: Common & ThermalBodyParams & { readonly power: Watts; readonly on?: boolean; readonly device?: string; readonly temperature: Kelvin },
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
      ...(o.device === undefined ? {} : { device: o.device }),
    },
    state: { temperature: o.temperature, energyDelivered: joules(0) },
  };
}

export function reservoir(o: Common & { readonly temperature: Kelvin; readonly device?: string; readonly humidity?: number }): Reservoir {
  assertTemperature(o.temperature);
  return {
    id: entityId(o.id),
    kind: 'thermal.reservoir',
    ...withLabel(o.label),
    transform: transform(o.position),
    ports: SURFACE,
    params: { temperature: o.temperature, ...(o.device === undefined ? {} : { device: o.device }), ...(o.humidity === undefined ? {} : { humidity: o.humidity }) },
    state: { heatAbsorbed: joules(0) },
  };
}

export function burner(o: Common & { readonly power: Watts; readonly on?: boolean; readonly device?: string }): Burner {
  if (!(o.power >= 0)) throw new RangeError(`power must be ≥ 0, got ${o.power}`);
  return {
    id: entityId(o.id),
    kind: 'thermal.burner',
    ...withLabel(o.label),
    transform: transform(o.position),
    ports: SURFACE,
    params: { power: o.power, on: o.on ?? true, ...(o.device === undefined ? {} : { device: o.device }) },
    state: { energyDelivered: joules(0) },
  };
}

// ---------- Thermostat: switches a heater to hold a target temperature ----------
export interface ThermostatParams {
  /** Body whose temperature is measured. */
  readonly sensor: string;
  /** Heater or burner it switches. */
  readonly actuator: string;
  readonly target: Kelvin;
  /** Switching band below the target, K (a real thermostat clicks, it does not hold exactly). */
  readonly hysteresis: number;
}
export interface ThermostatState {
  /** Is it letting the heater work right now? */
  readonly heating: boolean;
  /** How many times it switched the heater on or off. */
  readonly switches: number;
}
export type Thermostat = Device<'thermal.thermostat', ThermostatParams, ThermostatState, ThermalPortName>;

export const isThermostat = (e: AnyEntity): e is Thermostat => e.kind === 'thermal.thermostat';

export function thermostat(o: Common & { readonly sensor: string; readonly actuator: string; readonly target: Kelvin; readonly hysteresis?: number }): Thermostat {
  assertTemperature(o.target);
  return {
    id: entityId(o.id),
    kind: 'thermal.thermostat',
    ...withLabel(o.label),
    transform: transform(o.position),
    ports: SURFACE,
    params: { sensor: o.sensor, actuator: o.actuator, target: o.target, hysteresis: o.hysteresis ?? 1 },
    state: { heating: true, switches: 0 },
  };
}

/** Current temperature of any thermal entity. */
export const temperatureOf = (e: ThermalEntity): Kelvin =>
  isReservoir(e) ? e.params.temperature : e.state.temperature;
