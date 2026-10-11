import type { CommandHandler } from '../../core/commands.js';
import type { AnyEntity } from '../../core/entity.js';
import { entityId } from '../../core/ids.js';
import { err, ok } from '../../core/result.js';
import { withEntities, type SystemState } from '../../core/state.js';
import { kelvin, kilograms, type Kelvin, type Kilograms, type Watts } from '../../core/units.js';
import { isBurner, isHeater, isThermalBody, type Burner, type Heater, type ThermalBody } from './entities.js';
import { equilibriumTemperature } from './formulas.js';
import { ENERGY_REFERENCE_TEMPERATURE } from './solver.js';
import { bodyEnergy, bodyMass, mixtureBody, thermalBody } from './entities.js';
import { decodeMixture, equilibriumAt, mixtureEnthalpy } from './mixture.js';
import { convectionLink } from './links.js';
import { CONVECTION } from './materials.js';
import { decodeEnthalpy, specificEnthalpy } from './phase.js';
import { substanceThermal } from './substance.js';
import { SUBSTANCES, type SubstanceId } from '../../substances/catalog.js';
import type { SubstanceItem } from '../../substances/types.js';
import { COMPONENTS, type ComponentId } from '../../components/index.js';
import { specificHeat, squareMeters } from '../../core/units.js';
import type { AnyConnection } from '../../core/entity.js';

/** Turn a heater on/off or change its power. */
export interface SetHeaterCommand {
  readonly type: 'thermal.heater.set';
  readonly entity: string;
  readonly on?: boolean;
  readonly power?: Watts;
}

/** Pour more of the same substance (e.g. cold water into the kettle). */
export interface PourCommand {
  readonly type: 'thermal.pour';
  readonly into: string;
  readonly mass: Kilograms;
  readonly temperature: Kelvin;
}

/** Sandbox "god mode": set a body's temperature directly. Energy comes from outside and is logged. */
export interface SetTemperatureCommand {
  readonly type: 'thermal.temperature.set';
  readonly entity: string;
  readonly temperature: Kelvin;
}

/**
 * Add a portion of a catalog substance into a vessel's contents during the experiment:
 * hot water into water (mixing), an ice cube into tea (a separate melting body),
 * oil onto water (a separate layer).
 */
export interface AddCommand {
  readonly type: 'thermal.add';
  /** The liquid already in the vessel (a body made of a catalog substance). */
  readonly into: string;
  readonly substance: string;
  readonly mass: Kilograms;
  readonly temperature: Kelvin;
  /** Add it frozen (an ice cube); needs freezing data and a temperature below the melting point. */
  readonly frozen?: boolean;
}

export type ThermalCommand = SetHeaterCommand | PourCommand | SetTemperatureCommand | AddCommand;

const find = <T extends AnyEntity>(s: SystemState, id: string, guard: (e: AnyEntity) => e is T): T | undefined => {
  const e = s.entities[entityId(id)];
  return e && guard(e) ? e : undefined;
};
const isBodyOrHeater = (e: AnyEntity): e is ThermalBody | Heater => isThermalBody(e) || isHeater(e);
const isPowerSource = (e: AnyEntity): e is Heater | Burner => isHeater(e) || isBurner(e);

export const setHeater: CommandHandler<SetHeaterCommand> = {
  type: 'thermal.heater.set',
  apply(state, c) {
    const h = find(state, c.entity, isPowerSource);
    if (!h) return err({ uk: `«${c.entity}» — не нагрівач`, en: `"${c.entity}" is not a heater` });
    if (c.power !== undefined && !(c.power >= 0 && Number.isFinite(c.power))) return err({ uk: 'Потужність має бути ≥ 0', en: 'Power must be ≥ 0' });
    const params = { ...h.params, ...(c.on === undefined ? {} : { on: c.on }), ...(c.power === undefined ? {} : { power: c.power }) };
    return ok({ state: withEntities(state, [{ ...h, params } as Heater | Burner]), kind: 'control', externalEnergy: 0, trace: [] });
  },
};

export const pour: CommandHandler<PourCommand> = {
  type: 'thermal.pour',
  apply(state, c) {
    const b = find(state, c.into, isThermalBody);
    if (!b) return err({ uk: `У «${c.into}» не можна долити речовину`, en: `Cannot pour into "${c.into}"` });
    if (!(c.mass > 0 && Number.isFinite(c.mass))) return err({ uk: 'Маса має бути > 0', en: 'Mass must be > 0' });
    if (!(c.temperature >= 0 && Number.isFinite(c.temperature))) return err({ uk: 'Температура має бути ≥ 0 K', en: 'Temperature must be ≥ 0 K' });

    const { specificHeat } = b.params;
    const parts = [
      { mass: b.params.mass, specificHeat, temperature: b.state.temperature },
      { mass: c.mass, specificHeat, temperature: c.temperature },
    ] as const;
    const theta = equilibriumTemperature(parts);
    const next: ThermalBody = {
      ...b,
      params: { ...b.params, mass: kilograms(b.params.mass + c.mass) },
      state: { temperature: theta },
    };
    return ok({
      state: withEntities(state, [next]),
      kind: 'matter',
      // The poured portion brings its own internal energy, measured from the same reference as thermalEnergy().
      externalEnergy: c.mass * specificHeat * (c.temperature - ENERGY_REFERENCE_TEMPERATURE),
      trace: [{ kind: 'formula', formula: 'thermal.equilibrium-temperature', entities: [b.id], args: [parts], output: theta }],
    });
  },
};

export const setTemperature: CommandHandler<SetTemperatureCommand> = {
  type: 'thermal.temperature.set',
  apply(state, c) {
    const e = find(state, c.entity, isBodyOrHeater);
    if (!e) return err({ uk: `«${c.entity}» не має власної температури`, en: `"${c.entity}" has no temperature of its own` });
    if (!(c.temperature >= 0 && Number.isFinite(c.temperature))) return err({ uk: 'Температура має бути ≥ 0 K', en: 'Temperature must be ≥ 0 K' });
    const dT = c.temperature - e.state.temperature;
    const q = e.params.mass * e.params.specificHeat * dT;
    const next = { ...e, state: { ...e.state, temperature: c.temperature } } as ThermalBody | Heater;
    return ok({
      state: withEntities(state, [next]),
      kind: 'intervention',
      externalEnergy: q,
      trace: [
        { kind: 'formula', formula: 'thermal.heat-for-temperature-change', entities: [e.id], args: [e.params.mass, e.params.specificHeat, dT], output: q },
      ],
    });
  },
};

/** Mixes with water in any proportion — asked from the component model (a recipe is water-based). */
const mixesWithWater = (s: SubstanceItem): boolean =>
  s.recipe !== undefined || (s.component !== undefined && COMPONENTS[s.component as ComponentId]?.inWater?.solubility === 'miscible');

export const add: CommandHandler<AddCommand> = {
  type: 'thermal.add',
  apply(state, c) {
    const target = find(state, c.into, isThermalBody);
    const targetSub = target && 'substance' in target.params && target.params.substance ? SUBSTANCES[target.params.substance as SubstanceId] : undefined;
    const sub = SUBSTANCES[c.substance as SubstanceId];
    if (!target || !targetSub) return err({ uk: `У «${c.into}» не можна нічого додати`, en: `Cannot add anything to "${c.into}"` });
    if (!sub) return err({ uk: `Невідома речовина «${c.substance}»`, en: `Unknown substance "${c.substance}"` });
    if (!(c.mass > 0 && Number.isFinite(c.mass))) return err({ uk: 'Маса має бути > 0', en: 'Mass must be > 0' });
    const th = substanceThermal(sub);
    const tm = th.phase?.meltingPoint;
    if (c.frozen && (tm === undefined || !(c.temperature < tm))) {
      return err({
        uk: tm === undefined ? `Для «${sub.name.uk}» немає даних про твердий стан` : `Тверда речовина має бути холоднішою за ${Math.round(tm - ENERGY_REFERENCE_TEMPERATURE)} °C`,
        en: tm === undefined ? `No solid-state data for ${sub.name.en}` : `A frozen portion must be colder than ${Math.round(tm - ENERGY_REFERENCE_TEMPERATURE)} °C`,
      });
    }
    // Water, salt and salt solutions all merge into one water + salt body: the composition
    // changes, and everything else (freezing, boiling, crystals) follows from it.
    const isWater = (s: SubstanceItem) => s.id === 'water' || s.mixture !== undefined;
    const targetMix = 'mixture' in target.state ? target.state.mixture : undefined;
    if (!c.frozen && isWater(sub) && (targetMix || targetSub.id === 'water') && (targetMix || sub.mixture)) {
      const w = sub.mixture?.saltFraction ?? 0;
      const added = equilibriumAt(c.mass * (1 - w), c.mass * w, c.temperature);
      const externalMix = mixtureEnthalpy(added, c.temperature);
      const water = (targetMix ? targetMix.water : bodyMass(target)) + added.water;
      const salt = (targetMix ? targetMix.salt : 0) + added.salt;
      const energy = bodyEnergy(target) + externalMix;
      const d = decodeMixture(energy, water, salt);
      const base = mixtureBody({
        id: target.id,
        label: targetMix ? (target.label ?? targetSub.name) : { uk: 'Розчин солі', en: 'Salt solution' },
        water,
        salt,
        temperature: kelvin(d.temperature),
        substance: targetSub.id,
        ...(target.params.evaporation ? { evaporation: target.params.evaporation } : {}),
      });
      const { boiledOff, evaporated, vaporEnergy } = target.state;
      const next: ThermalBody = {
        ...base,
        transform: target.transform,
        state: {
          temperature: kelvin(d.temperature),
          mixture: d.amounts,
          solidFraction: water > 0 ? d.amounts.ice / water : 0,
          ...(boiledOff === undefined ? {} : { boiledOff }),
          ...(evaporated === undefined ? {} : { evaporated }),
          ...(vaporEnergy === undefined ? {} : { vaporEnergy }),
        },
      };
      return ok({ state: withEntities(state, [next]), kind: 'matter', externalEnergy: externalMix, trace: [] });
    }

    const solid = c.frozen ? 1 : 0;
    const hAdded = specificEnthalpy(c.temperature, solid, th.specificHeat, th.phase);
    const external = c.mass * hAdded;

    // Same substance, both liquid: it simply mixes in (heat balance with phases).
    if (sub.id === targetSub.id && !c.frozen && (target.state.solidFraction ?? 0) === 0) {
      const m0 = bodyMass(target);
      const energy = bodyEnergy(target) + external;
      const m1 = m0 + c.mass;
      const d = decodeEnthalpy(energy / m1, target.params.specificHeat, target.params.phase);
      const next: ThermalBody = {
        ...target,
        params: { ...target.params, mass: kilograms(target.params.mass + c.mass) },
        state: { ...target.state, temperature: kelvin(d.temperature), ...(target.params.phase ? { solidFraction: d.solidFraction } : {}) },
      };
      const parts = [
        { mass: kilograms(m0), specificHeat: target.params.specificHeat, temperature: target.state.temperature },
        { mass: c.mass, specificHeat: target.params.specificHeat, temperature: c.temperature },
      ] as const;
      return ok({
        state: withEntities(state, [next]),
        kind: 'matter',
        externalEnergy: external,
        trace: d.solidFraction === 0 && d.excess === 0 ? [{ kind: 'formula', formula: 'thermal.equilibrium-temperature', entities: [target.id], args: [parts], output: equilibriumTemperature(parts) }] : [],
      });
    }

    // Different liquids that would form a solution: properties of mixtures are not modelled.
    if (!c.frozen && mixesWithWater(sub) && mixesWithWater(targetSub)) {
      return err({
        uk: `«${sub.name.uk}» змішується з «${targetSub.name.uk}» в один розчин зі своїми властивостями — даних про такі суміші в нас поки немає.`,
        en: `${sub.name.en} mixes with ${targetSub.name.en} into one solution with its own properties — we have no data on such mixtures yet.`,
      });
    }

    // Otherwise a separate body in the liquid: a frozen piece, or an immiscible layer (oil on water).
    const n = Object.keys(state.entities).filter((id) => id.startsWith(`${c.into}+`)).length + 1;
    const id = `${c.into}+${n}`;
    const density = c.frozen ? (sub.freezing?.solidDensity?.value ?? th.density) : th.density;
    const volume = c.mass / density;
    // A frozen piece: a cube of that volume, all sides wetted. A liquid layer: it spreads over the surface.
    const surface = Object.values(state.connections).find(
      (x) => x.a.entity === target.id && (x.params as { origin?: { surface?: boolean; area?: number } }).origin?.surface,
    ) as AnyConnection | undefined;
    const layerArea = (surface?.params as { origin?: { area?: number } } | undefined)?.origin?.area;
    const area = c.frozen || layerArea === undefined ? 6 * Math.cbrt(volume) ** 2 : layerArea;
    const body = thermalBody({
      id,
      label: c.frozen && sub.solidName ? { uk: `${sub.solidName.uk} (додано)`, en: `${sub.solidName.en} (added)` } : { uk: `${sub.name.uk} (додано)`, en: `${sub.name.en} (added)` },
      mass: c.mass,
      specificHeat: specificHeat(th.specificHeat),
      substance: sub.id,
      ...(th.phase ? { phase: th.phase } : {}),
      temperature: c.temperature,
      ...(th.phase?.meltingPoint !== undefined ? { solidFraction: solid } : {}),
    });
    const link = convectionLink({ id: `${id}<->${target.id}`, a: id, b: target.id, coefficient: CONVECTION.stillWater.value, area: squareMeters(area), dataRef: 'stillWater' });
    return ok({
      state: { ...withEntities(state, [body]), connections: [...state.connections, link] },
      kind: 'matter',
      externalEnergy: external,
      trace: [],
    });
  },
};

export const THERMAL_COMMANDS = [setHeater, pour, setTemperature, add] as const;

