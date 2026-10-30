import { defineExperiment } from '../types.js';
import { pullCommand } from './bench.js';
import { answer_friction_factors, preset_friction_factors, answer_friction_coefficient, preset_friction_coefficient } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const slidingFriction = defineExperiment({ kind: 'friction', commands: [pullCommand], setup, text, shown, say, busy, board, presets: [preset_friction_factors, preset_friction_coefficient], answers: { [preset_friction_factors.id]: answer_friction_factors, [preset_friction_coefficient.id]: answer_friction_coefficient } });
