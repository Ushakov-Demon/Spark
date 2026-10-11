import type { CommandHandler } from '../../core/commands.js';
import type { AnyEntity } from '../../core/entity.js';
import { entityId } from '../../core/ids.js';
import { err, ok } from '../../core/result.js';
import { withEntities, type SystemState } from '../../core/state.js';
import { kilograms, type Kelvin, type Kilograms, type Watts } from '../../core/units.js';
import { isBurner, isHeater, isThermalBody, type Burner, type Heater, type ThermalBody } from './entities.js';
import { equilibriumTemperature } from './formulas.js';
import { ENERGY_REFERENCE_TEMPERATURE } from './solver.js';

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

export type ThermalCommand = SetHeaterCommand | PourCommand | SetTemperatureCommand;

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

export const THERMAL_COMMANDS = [setHeater, pour, setTemperature] as const;
