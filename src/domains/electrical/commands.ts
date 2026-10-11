import type { CommandHandler } from '../../core/commands.js';
import { entityId } from '../../core/ids.js';
import { err, ok } from '../../core/result.js';
import { withEntities } from '../../core/state.js';
import { isSupply } from './entities.js';

/** Turn a power supply on/off or change its voltage (the knob of a lab supply). */
export interface SetSupplyCommand {
  readonly type: 'electrical.supply.set';
  readonly entity: string;
  readonly on?: boolean;
  readonly voltage?: number;
}

export type ElectricalCommand = SetSupplyCommand;

export const setSupply: CommandHandler<SetSupplyCommand> = {
  type: 'electrical.supply.set',
  apply(state, c) {
    const e = state.entities[entityId(c.entity)];
    if (!e || !isSupply(e)) return err({ uk: `«${c.entity}» — не джерело струму`, en: `"${c.entity}" is not a power supply` });
    if (c.voltage !== undefined && !(c.voltage >= 0 && Number.isFinite(c.voltage))) return err({ uk: 'Напруга має бути ≥ 0', en: 'Voltage must be ≥ 0' });
    const params = { ...e.params, ...(c.on === undefined ? {} : { on: c.on }), ...(c.voltage === undefined ? {} : { voltage: c.voltage }) };
    return ok({ state: withEntities(state, [{ ...e, params }]), kind: 'control', externalEnergy: 0, trace: [] });
  },
};

export const ELECTRICAL_COMMANDS = [setSupply] as const;
