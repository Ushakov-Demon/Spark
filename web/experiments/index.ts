import { calendarScene } from './calendars/scene.js';
import type { ExperimentScene } from './types.js';

/** The pictures of the experiment modules, by kind (one line each, beside src/experiments/index.ts). */
const SCENES: readonly ExperimentScene<never>[] = [calendarScene as unknown as ExperimentScene<never>];

const BY_KIND = new Map(SCENES.map((s) => [s.kind, s] as const));
export const sceneOf = (kind: string): ExperimentScene<unknown> | undefined => BY_KIND.get(kind) as ExperimentScene<unknown> | undefined;
