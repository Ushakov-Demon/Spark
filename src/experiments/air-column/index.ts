import { defineExperiment } from '../types.js';
import { airCommand } from './bench.js';
import { answer_air_column } from './answer.js';
import { card, preset_air_column } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const airColumn = defineExperiment({ ...card, commands: [airCommand], text, shown, say, busy, board, answers: { [preset_air_column.id]: answer_air_column } });
