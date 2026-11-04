import { defineExperiment } from '../types.js';
import { MOTION_COMMANDS } from './bench.js';
import { answer_average_speed, answer_pendulum, answer_rotation_period } from './answer.js';
import { card, preset_average_speed, preset_pendulum, preset_rotation_period } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const motionLabWorks = defineExperiment({ ...card, commands: MOTION_COMMANDS, text, shown, say, busy, board, answers: { [preset_average_speed.id]: answer_average_speed, [preset_rotation_period.id]: answer_rotation_period, [preset_pendulum.id]: answer_pendulum } });
