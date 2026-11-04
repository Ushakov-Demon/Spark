import type { CommandHandler } from '../core/commands.js';
import type { LocalizedText } from '../knowledge/i18n.js';
import { ELECTRODE_COMMANDS, ELECTRODE_TEXT, type CathodeCommand } from './electrode-bench.js';
import { COIL_COMMANDS, COIL_TEXT, type OhmCommand } from './coil-bench.js';
import type { ExperimentCommand, ExperimentKind } from '../experiments/index.js';
import { CARDS } from '../experiments/cards.js';
import { onExperiment } from '../experiments/registry.js';

/**
 * The mechanics bench of grade 7, beside the vessel: a spring on a stand with slotted weights and a ruler
 * (Hooke's law), a wooden block pulled along a wooden board by a dynamometer (sliding friction), and the
 * same block measured with a ruler (its faces — the pressure it puts on its support). Everything the
 * instruments show is rounded to their divisions, as on the real ones.
 */

export { BENCH_SPRING_K, SPRING_SET, BENCH_SPRING_L0, BENCH_WEIGHT, WOOD_ON_WOOD, PAPER_ON_WOOD, BENCH_BLOCK, blockMass } from './bench-kit.js';

export type BenchCommand = CathodeCommand | OhmCommand | ExperimentCommand;







/** The bench's own commands; an experiment module's join the lab's commands as it loads (lab-knowledge.ts). */
export const BENCH_COMMANDS = [...ELECTRODE_COMMANDS, ...COIL_COMMANDS] as unknown as readonly CommandHandler<never>[];

/** What a bench step asks to do and what its button says (an experiment module's steps — once it is loaded). */
export const BENCH_TEXT = { ...ELECTRODE_TEXT, ...COIL_TEXT } as unknown as Record<BenchCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }>;
onExperiment((m) => {
  for (const h of m.commands) (BENCH_TEXT as Record<string, unknown>)[h.type] = m.text;
});

/** What stands on the table for each bench (instead of the vessel), for the line under the experiment's title. */
export const BENCH_SETUP = Object.fromEntries(CARDS.map((c) => [c.kind, c.setup])) as Record<ExperimentKind, LocalizedText>;
