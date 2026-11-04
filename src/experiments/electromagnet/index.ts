import { defineExperiment } from '../types.js';
import { magnetCommand } from './bench.js';
import { answer_electromagnet } from './answer.js';
import { card, preset_electromagnet } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const electromagnet = defineExperiment({ ...card, commands: [magnetCommand], text, shown, say, busy, board, answers: { [preset_electromagnet.id]: answer_electromagnet } });
