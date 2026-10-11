import type { Command } from '../core/commands.js';
import type { ExperimentLogEntry, ExperimentResult } from '../core/experiment.js';
import type { SystemState } from '../core/state.js';
import { ELECTRICAL_FORMULAS, ELECTRICAL_LAWS, type ElectricalCommand } from '../domains/electrical/index.js';
import { THERMAL_KNOWLEDGE, type ThermalCommand } from '../domains/thermal/index.js';
import type { DomainKnowledge } from '../explain/domain.js';
import { formatQuantity, type ExplainContext } from '../explain/format.js';

/** Everything the lab can do to an experiment. */
export type LabCommand = ThermalCommand | ElectricalCommand;

const isElectrical = (c: Command): c is ElectricalCommand => c.type.startsWith('electrical.');

/**
 * Knowledge for the lab's reports: thermal and electrical formulas and laws
 * together, so "what took part in the calculation" lists Ohm, Joule–Lenz and
 * Faraday next to the heat formulas when a current was passed.
 */
export const LAB_KNOWLEDGE: DomainKnowledge<LabCommand> = {
  formulas: [...THERMAL_KNOWLEDGE.formulas, ...ELECTRICAL_FORMULAS],
  laws: [...THERMAL_KNOWLEDGE.laws, ...ELECTRICAL_LAWS],
  timeline: (result, ctx) => THERMAL_KNOWLEDGE.timeline(result as ExperimentResult<ThermalCommand>, ctx),
  describeCommand(entry: ExperimentLogEntry<LabCommand>, ctx: ExplainContext, state: SystemState) {
    const c = entry.command;
    if (!isElectrical(c)) return THERMAL_KNOWLEDGE.describeCommand(entry as ExperimentLogEntry<ThermalCommand>, ctx, state);
    const uk = ctx.locale === 'uk';
    if (c.on === false) return uk ? 'Джерело струму вимкнули' : 'The power source was switched off';
    if (c.voltage !== undefined) {
      const v = formatQuantity(c.voltage, 'V', { locale: ctx.locale, level: ctx.level });
      return uk ? `Напругу на електродах змінили на ${v}` : `The electrode voltage was set to ${v}`;
    }
    return uk ? 'Джерело струму увімкнули' : 'The power source was switched on';
  },
  energyBalance: (result, ctx) => THERMAL_KNOWLEDGE.energyBalance(result as ExperimentResult<ThermalCommand>, ctx),
  dataUsed: (state) => THERMAL_KNOWLEDGE.dataUsed(state),
};
