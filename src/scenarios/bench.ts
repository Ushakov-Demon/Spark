import type { CommandHandler } from '../core/commands.js';
import type { LocalizedText } from '../knowledge/i18n.js';
import { MOTION_COMMANDS, MOTION_SETUP, MOTION_TEXT, type MotionCommand } from './motion-bench.js';
import { ELECTRODE_COMMANDS, ELECTRODE_TEXT, type CathodeCommand } from './electrode-bench.js';
import { COIL_COMMANDS, COIL_TEXT, type OhmCommand } from './coil-bench.js';
import { EXPERIMENTS, type ExperimentCommand, type ExperimentKind } from '../experiments/index.js';

/**
 * The mechanics bench of grade 7, beside the vessel: a spring on a stand with slotted weights and a ruler
 * (Hooke's law), a wooden block pulled along a wooden board by a dynamometer (sliding friction), and the
 * same block measured with a ruler (its faces — the pressure it puts on its support). Everything the
 * instruments show is rounded to their divisions, as on the real ones.
 */

export { BENCH_SPRING_K, SPRING_SET, BENCH_SPRING_L0, BENCH_WEIGHT, WOOD_ON_WOOD, PAPER_ON_WOOD, BENCH_BLOCK, blockMass } from './bench-kit.js';

export type BenchCommand = MotionCommand | CathodeCommand | OhmCommand | ExperimentCommand;







export const BENCH_COMMANDS = [...MOTION_COMMANDS, ...ELECTRODE_COMMANDS, ...COIL_COMMANDS, ...EXPERIMENTS.flatMap((m) => m.commands as readonly CommandHandler<never>[])] as const;

/** What a bench step asks to do and what its button says. */
export const BENCH_TEXT: Record<BenchCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }> = {
  ...(MOTION_TEXT as Record<MotionCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }>),
  ...ELECTRODE_TEXT,
  ...COIL_TEXT,
  // The experiment modules: their steps' words, by command type.
  // The experiment modules: their steps' words, by command type.
  ...(Object.fromEntries(EXPERIMENTS.flatMap((m) => m.commands.map((h) => [h.type, m.text]))) as Record<ExperimentCommand['type'], (c: BenchCommand) => { say: LocalizedText; button: LocalizedText; plan: LocalizedText }>),
};

/** What stands on the table for each bench (instead of the vessel), for the line under the experiment's title. */
type OldBenchKind = 'incline' | 'circle' | 'pendulum';
const OLD_SETUP: Record<OldBenchKind, LocalizedText> = {
  ...MOTION_SETUP,
};
export const BENCH_SETUP = { ...OLD_SETUP, ...Object.fromEntries(EXPERIMENTS.map((m) => [m.kind, m.setup])) } as Record<OldBenchKind | ExperimentKind, LocalizedText>;
