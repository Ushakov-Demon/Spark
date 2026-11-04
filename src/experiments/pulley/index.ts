import { defineExperiment } from '../types.js';
import { pulleyCommand } from './bench.js';
import { answer_pulley } from './answer.js';
import { card, preset_pulley } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const pulleyExperiment = defineExperiment({ ...card, commands: [pulleyCommand], text, shown, say, busy, board, answers: { [preset_pulley.id]: answer_pulley } });
