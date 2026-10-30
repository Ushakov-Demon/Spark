import { defineExperiment } from '../types.js';
import { MOTION_COMMANDS } from './bench.js';
import { answer_average_speed, answer_pendulum, answer_rotation_period, preset_average_speed, preset_pendulum, preset_rotation_period } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const motionLabWorks = defineExperiment({ kind: 'motion', commands: MOTION_COMMANDS, setup, text, shown, say, busy, board, presets: [preset_average_speed, preset_rotation_period, preset_pendulum], answers: { [preset_average_speed.id]: answer_average_speed, [preset_rotation_period.id]: answer_rotation_period, [preset_pendulum.id]: answer_pendulum } });
