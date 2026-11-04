import { defineExperiment } from '../types.js';
import { edgeCommand } from './bench.js';
import { answer_block_pressure } from './answer.js';
import { card, preset_block_pressure } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const blockPressure = defineExperiment({ ...card, commands: [edgeCommand], text, shown, say, busy, board, answers: { [preset_block_pressure.id]: answer_block_pressure } });
