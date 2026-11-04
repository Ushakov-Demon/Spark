import { defineExperiment } from '../types.js';
import { carryCommand } from './bench.js';
import { answer_relative_motion } from './answer.js';
import { card, preset_relative_motion } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const relativeMotion = defineExperiment({ ...card, commands: [carryCommand], text, shown, say, busy, board, answers: { [preset_relative_motion.id]: answer_relative_motion } });
