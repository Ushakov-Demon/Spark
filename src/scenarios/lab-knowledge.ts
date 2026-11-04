import type { Command, CommandHandler } from '../core/commands.js';
import type { ExperimentLogEntry, ExperimentResult } from '../core/experiment.js';
import type { SystemState } from '../core/state.js';
import { ELECTRICAL_FORMULAS, ELECTRICAL_LAWS, type ElectricalCommand } from '../domains/electrical/index.js';
import { THERMAL_KNOWLEDGE, type ThermalCommand } from '../domains/thermal/index.js';
import { MECHANICS_FORMULAS, MECHANICS_LAWS } from '../domains/mechanics/index.js';
import { OPTICS_FORMULAS, OPTICS_LAWS } from '../domains/optics/index.js';
import type { DomainKnowledge } from '../explain/domain.js';
import { formatQuantity, type ExplainContext } from '../explain/format.js';

import { ELECTRICAL_COMMANDS } from '../domains/electrical/commands.js';
import { THERMAL_COMMANDS } from '../domains/thermal/commands.js';
import { SCALES } from '../equipment/scales.js';
import { GLOSSARY, lawTerms, type Term } from '../knowledge/glossary.js';
import { tr, type Locale } from '../knowledge/i18n.js';
import { localized, t } from '../knowledge/messages.js';
import { formatReading, WEIGH_COMMANDS, weighingsOf, type WeighCommand } from './weighing.js';
import { formatMeasured, MEASURING_COMMANDS, readingsOf, type HangCommand, type LevelCommand } from './measuring.js';
import { VESSELS, type VesselId } from '../equipment/vessels.js';
import { BENCH_COMMANDS, type BenchCommand } from './bench.js';
import { SUBSTANCES, type SubstanceId } from '../substances/catalog.js';
import { onExperiment } from '../experiments/registry.js';

/** Everything the lab can do to an experiment: heat, pass a current, weigh. */
export type LabCommand = ThermalCommand | ElectricalCommand | WeighCommand | LevelCommand | HangCommand | BenchCommand;

/** The handlers of all lab commands, for a command registry: an experiment module's join as it loads (a registry finds them then). */
export const LAB_COMMANDS: CommandHandler<never>[] = [...THERMAL_COMMANDS, ...ELECTRICAL_COMMANDS, ...WEIGH_COMMANDS, ...MEASURING_COMMANDS, ...BENCH_COMMANDS] as CommandHandler<never>[];
onExperiment((m) => LAB_COMMANDS.push(...(m.commands as readonly CommandHandler<never>[])));

const isElectrical = (c: Command): c is ElectricalCommand => c.type.startsWith('electrical.');

/**
 * Knowledge for the lab's reports: thermal and electrical formulas and laws
 * together, so "what took part in the calculation" lists Ohm, Joule–Lenz and
 * Faraday next to the heat formulas when a current was passed.
 */
export const LAB_KNOWLEDGE: DomainKnowledge<LabCommand> = {
  formulas: [...THERMAL_KNOWLEDGE.formulas, ...ELECTRICAL_FORMULAS, ...MECHANICS_FORMULAS, ...OPTICS_FORMULAS],
  laws: [...THERMAL_KNOWLEDGE.laws, ...ELECTRICAL_LAWS, ...MECHANICS_LAWS, ...OPTICS_LAWS],
  timeline: (result, ctx) => THERMAL_KNOWLEDGE.timeline(result as ExperimentResult<ThermalCommand>, ctx),
  describeCommand(entry: ExperimentLogEntry<LabCommand>, ctx: ExplainContext, state: SystemState) {
    const c = entry.command;
    if (c.type === 'lab.read-level' || c.type === 'lab.hang') {
      const r = readingsOf([entry])[0]?.record;
      if (c.type === 'lab.read-level') {
        const shown = formatMeasured('volume', r?.value ?? null, r?.inputs?.['division'] ?? 1e-6, ctx.locale);
        return t(ctx.locale, 'lab-knowledge-describe-command', { name: tr(VESSELS[c.vessel as VesselId].name, ctx.locale).toLowerCase(), shown });
      }
      const shown = formatMeasured('force', r?.value ?? null, 0.1, ctx.locale);
      const what = tr(SUBSTANCES[c.substance as SubstanceId]?.name ?? localized((l: Locale) => c.substance), ctx.locale);
      return t(ctx.locale, 'lab-knowledge-describe-command-4', { what, shown, value: c.into === 'air' ? t(ctx.locale, 'lab-knowledge-describe-command-2') : t(ctx.locale, 'lab-knowledge-describe-command-3') });
    }
    if (c.type === 'lab.weigh') {
      const w = weighingsOf([entry])[0];
      const shown = formatReading(c.scale, w?.reading ?? null, ctx.locale);
      return t(ctx.locale, 'lab-knowledge-describe-command-5', { name: tr(SCALES[c.scale].name, ctx.locale), shown });
    }
    if (!isElectrical(c)) return THERMAL_KNOWLEDGE.describeCommand(entry as ExperimentLogEntry<ThermalCommand>, ctx, state);
    if (c.on === false) return t(ctx.locale, 'lab-knowledge-describe-command-6');
    if (c.voltage !== undefined) {
      const v = formatQuantity(c.voltage, 'V', { locale: ctx.locale, level: ctx.level });
      return t(ctx.locale, 'lab-knowledge-describe-command-7', { v });
    }
    return t(ctx.locale, 'lab-knowledge-describe-command-8');
  },
  energyBalance: (result, ctx) => THERMAL_KNOWLEDGE.energyBalance(result as ExperimentResult<ThermalCommand>, ctx),
  dataUsed: (state) => THERMAL_KNOWLEDGE.dataUsed(state),
};

/** The lab's whole glossary: the written terms and every law of its knowledge (a new law appears by itself). */
export const LAB_GLOSSARY: readonly Term[] = [...GLOSSARY, ...lawTerms(LAB_KNOWLEDGE.laws)];
