import { calendars } from './calendars/index.js';
import { rootsGravity } from './roots-gravity/index.js';
import { dynoDiy } from './dyno-diy/index.js';
import { rubberMotor } from './rubber-motor/index.js';
import { scalesDiy } from './scales-diy/index.js';
import { solarSystem } from './solar-system-model/index.js';
import { airColumn } from './air-column/index.js';
import { solarNoon } from './solar-noon/index.js';
import { liquidTower } from './liquid-tower/index.js';
import { dragForm } from './drag-form/index.js';
import { cartsMass } from './carts-mass/index.js';
import { contactForces } from './contact-forces/index.js';
import { coinInertia } from './coin-inertia/index.js';
import { snailSpeed } from './snail-speed/index.js';
import { strobePhoto } from './strobe-photo/index.js';
import { windSpeed } from './wind-speed/index.js';
import type { CommandOf, ExperimentModule } from './types.js';

/**
 * The experiments written as modules (src/experiments/<name>), one line each. The bench, the presets, the answers and
 * the board take them from here; the older experiments are still spread over src/scenarios and join one by one.
 */
export const EXPERIMENTS = [calendars, rootsGravity, scalesDiy, dynoDiy, rubberMotor, solarSystem, airColumn, solarNoon, liquidTower, dragForm, cartsMass, contactForces, coinInertia, snailSpeed, strobePhoto, windSpeed] as const;

export type ExperimentKind = (typeof EXPERIMENTS)[number]['kind'];
export type ExperimentCommand = CommandOf<(typeof EXPERIMENTS)[number]>;

const BY_TYPE = new Map<string, ExperimentModule<never>>(EXPERIMENTS.flatMap((m) => m.commands.map((c) => [c.type, m as unknown as ExperimentModule<never>] as const)));
/** The module a command belongs to. */
export const experimentOf = (type: string): ExperimentModule<never> | undefined => BY_TYPE.get(type);
