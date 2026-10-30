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
import { windlass } from './windlass/index.js';
import { smallBodies } from './small-bodies/index.js';
import { ballBounce } from './ball-bounce/index.js';
import { weightInLift } from './weight-in-lift/index.js';
import { addingForces } from './adding-forces/index.js';
import { bodiesInLiquids } from './bodies-in-liquids/index.js';
import { relativeMotion } from './relative-motion/index.js';
import { depthPressure } from './depth-pressure/index.js';
import { communicatingVessels } from './communicating-vessels/index.js';
import { hydrostaticParadox } from './hydrostatic-paradox/index.js';
import { hydraulicPress } from './hydraulic-press/index.js';
import { atmosphericPressure } from './atmospheric-pressure/index.js';
import { diodeBlackBox } from './diode-black-box/index.js';
import { electromagnet } from './electromagnet/index.js';
import { electromagneticInduction } from './electromagnetic-induction/index.js';
import { leverMoments } from './lever-moments/index.js';
import { slopeEfficiency } from './slope-efficiency/index.js';
import { resistorCircuit } from './resistor-circuit/index.js';
import { twoResistors } from './two-resistors/index.js';
import { hookeSpring } from './hooke-spring/index.js';
import { slidingFriction } from './sliding-friction/index.js';
import { blockPressure } from './block-pressure/index.js';
import { leverBalance } from './lever-balance/index.js';
import { motionLabWorks } from './motion-lab-works/index.js';
import { cartesianDiver } from './cartesian-diver/index.js';
import { fountainModel } from './fountain-model/index.js';
import { stairsPower } from './stairs-power/index.js';
import { rollingEnergy } from './rolling-energy/index.js';
import { gearTrainExperiment } from './gear-train/index.js';
import { pulleyExperiment } from './pulley/index.js';
import type { CommandOf, ExperimentModule } from './types.js';

/**
 * The experiments written as modules (src/experiments/<name>), one line each. The bench, the presets, the answers and
 * the board take them from here. Every experiment of the bench is one.
 */
export const EXPERIMENTS = [calendars, rootsGravity, scalesDiy, dynoDiy, rubberMotor, solarSystem, airColumn, solarNoon, liquidTower, dragForm, cartsMass, contactForces, coinInertia, snailSpeed, strobePhoto, windSpeed, windlass, smallBodies, ballBounce, weightInLift, addingForces, bodiesInLiquids, relativeMotion, depthPressure, communicatingVessels, hydrostaticParadox, hydraulicPress, atmosphericPressure, diodeBlackBox, electromagnet, electromagneticInduction, leverMoments, slopeEfficiency, resistorCircuit, twoResistors, hookeSpring, slidingFriction, blockPressure, leverBalance, motionLabWorks, cartesianDiver, fountainModel, stairsPower, rollingEnergy, gearTrainExperiment, pulleyExperiment] as const;

export type ExperimentKind = (typeof EXPERIMENTS)[number]['kind'];
export type ExperimentCommand = CommandOf<(typeof EXPERIMENTS)[number]>;

const BY_TYPE = new Map<string, ExperimentModule<never>>(EXPERIMENTS.flatMap((m) => m.commands.map((c) => [c.type, m as unknown as ExperimentModule<never>] as const)));
/** The module a command belongs to. */
export const experimentOf = (type: string): ExperimentModule<never> | undefined => BY_TYPE.get(type);
