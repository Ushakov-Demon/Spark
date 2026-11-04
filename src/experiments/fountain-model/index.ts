import { defineExperiment } from '../types.js';
import { fountainCommand } from './bench.js';
import { answer_fountain_model } from './answer.js';
import { card, preset_fountain_model } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const fountainModel = defineExperiment({ ...card, commands: [fountainCommand], text, shown, say, busy, board, answers: { [preset_fountain_model.id]: answer_fountain_model } });
