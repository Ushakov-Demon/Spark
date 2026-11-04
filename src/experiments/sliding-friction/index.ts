import { defineExperiment } from '../types.js';
import { pullCommand } from './bench.js';
import { answer_friction_factors, answer_friction_coefficient } from './answer.js';
import { card, preset_friction_coefficient, preset_friction_factors } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const slidingFriction = defineExperiment({ ...card, commands: [pullCommand], text, shown, say, busy, board, answers: { [preset_friction_factors.id]: answer_friction_factors, [preset_friction_coefficient.id]: answer_friction_coefficient } });
