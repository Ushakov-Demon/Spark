import { err, type Result } from './result.js';
import type { SystemState } from './state.js';
import type { TraceRecord } from './trace.js';
import type { LocalizedText } from '../knowledge/i18n.js';

/**
 * Everything that changes the world other than physics itself goes through a
 * command: the student flips a switch, pours water, sets a temperature.
 * Commands are plain data → they can be logged, replayed, undone, shared.
 */
export interface Command<T extends string = string> {
  readonly type: T;
}

/**
 * - control:      operating the setup (switch, power knob) — physics stays honest by itself;
 * - matter:       adding/removing substance — brings its own energy, accounted in `externalEnergy`;
 * - intervention: "god mode" edit of state (set temperature) — energy appears from outside,
 *                 recorded so the energy balance still closes.
 */
export type CommandKind = 'control' | 'matter' | 'intervention';

export interface CommandEffect {
  readonly state: SystemState;
  readonly kind: CommandKind;
  /** Energy brought into the world from outside the simulation, J (negative = removed). */
  readonly externalEnergy: number;
  /** Formulas the command itself applied (e.g. heat balance when mixing). */
  readonly trace: readonly TraceRecord[];
}

export interface CommandHandler<C extends Command = Command> {
  readonly type: C['type'];
  apply(state: SystemState, command: C): Result<CommandEffect, LocalizedText>;
}

export interface CommandRegistry<C extends Command = Command> {
  /** Errors are shown to students, so they are localized. */
  apply(state: SystemState, command: C): Result<CommandEffect, LocalizedText>;
}

export function createCommandRegistry<C extends Command>(
  handlers: readonly { [T in C['type']]: CommandHandler<Extract<C, { type: T }>> }[C['type']][],
): CommandRegistry<C> {
  const byType = new Map<string, CommandHandler<C>>();
  for (const h of handlers) {
    if (byType.has(h.type)) throw new Error(`Duplicate command handler "${h.type}"`);
    byType.set(h.type, h as unknown as CommandHandler<C>);
  }
  return {
    apply(state, command) {
      const h = byType.get(command.type);
      return h
        ? h.apply(state, command)
        : err({ uk: `Невідома команда «${command.type}»`, en: `Unknown command "${command.type}"` });
    },
  };
}
