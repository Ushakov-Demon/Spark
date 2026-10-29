import { calendarScene } from './calendars/scene.js';
import { rootsGravityScene } from './roots-gravity/scene.js';
import { dynoDiyScene } from './dyno-diy/scene.js';
import { rubberMotorScene } from './rubber-motor/scene.js';
import { scalesDiyScene } from './scales-diy/scene.js';
import { solarSystemScene } from './solar-system-model/scene.js';
import type { ExperimentScene } from './types.js';

/** The pictures of the experiment modules, by kind (one line each, beside src/experiments/index.ts). */
const SCENES = [calendarScene, rootsGravityScene, scalesDiyScene, dynoDiyScene, rubberMotorScene, solarSystemScene] as unknown as readonly ExperimentScene<never>[];

const BY_KIND = new Map(SCENES.map((s) => [s.kind, s] as const));
export const sceneOf = (kind: string): ExperimentScene<unknown> | undefined => BY_KIND.get(kind) as ExperimentScene<unknown> | undefined;
