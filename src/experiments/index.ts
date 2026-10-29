import { calendars } from './calendars/index.js';
import type { CommandOf, ExperimentModule } from './types.js';

/**
 * The experiments written as modules (src/experiments/<name>), one line each. The bench, the presets, the answers and
 * the board take them from here; the older experiments are still spread over src/scenarios and join one by one.
 */
export const EXPERIMENTS = [calendars] as const;

export type ExperimentKind = (typeof EXPERIMENTS)[number]['kind'];
export type ExperimentCommand = CommandOf<(typeof EXPERIMENTS)[number]>;

const BY_TYPE = new Map<string, ExperimentModule<never>>(EXPERIMENTS.flatMap((m) => m.commands.map((c) => [c.type, m as unknown as ExperimentModule<never>] as const)));
/** The module a command belongs to. */
export const experimentOf = (type: string): ExperimentModule<never> | undefined => BY_TYPE.get(type);
