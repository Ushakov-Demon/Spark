import type { ExperimentModule } from './types.js';

/**
 * The experiment modules the lab has loaded. The tests and the scripts load them all (src/experiments/index.ts); the
 * page loads a module when its experiment opens (web/experiments/index.ts) — its card (cards.ts) it has from the start.
 * What keeps something of every module (the commands, the steps' words, the answers) hears of each as it comes
 * (`onExperiment`).
 */
const byKind = new Map<string, ExperimentModule<never>>();
const byType = new Map<string, ExperimentModule<never>>();
const listeners: ((m: ExperimentModule<never>) => void)[] = [];

export function registerExperiment(m: ExperimentModule<never>): void {
  if (byKind.get(m.kind) === m) return;
  if (byKind.has(m.kind)) throw new Error(`Duplicate experiment kind "${m.kind}"`);
  for (const h of m.commands) if (byType.has(h.type)) throw new Error(`Duplicate command handler "${h.type}"`);
  byKind.set(m.kind, m);
  for (const h of m.commands) byType.set(h.type, m);
  for (const f of listeners) f(m);
}

/** Calls `f` for every module loaded so far and for each one loaded later. */
export function onExperiment(f: (m: ExperimentModule<never>) => void): void {
  listeners.push(f);
  for (const m of byKind.values()) f(m);
}

/** The module a command belongs to (once loaded). */
export const experimentOf = (type: string): ExperimentModule<never> | undefined => byType.get(type);
/** Is the module of this bench loaded? */
export const experimentLoaded = (kind: string): boolean => byKind.has(kind);
