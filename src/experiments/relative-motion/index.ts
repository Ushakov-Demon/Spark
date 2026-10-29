import { defineExperiment } from '../types.js';
import { carryCommand } from './bench.js';
import { answer_relative_motion, preset_relative_motion } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const relativeMotion = defineExperiment({ kind: 'carry', commands: [carryCommand], setup, text, shown, say, busy, board, presets: [preset_relative_motion], answers: { [preset_relative_motion.id]: answer_relative_motion } });
