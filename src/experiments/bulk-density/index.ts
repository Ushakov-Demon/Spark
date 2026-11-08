import { defineExperiment } from '../types.js';
import { answer_bulk_density } from './answer.js';
import { bulkCommand } from './bench.js';
import { card, preset_bulk_density } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const bulkDensity = defineExperiment({ ...card, commands: [bulkCommand], text, shown, say, busy, board, answers: { [preset_bulk_density.id]: answer_bulk_density } });
