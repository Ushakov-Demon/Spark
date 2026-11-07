import { defineExperiment } from '../types.js';
import { answer_mandarin_float } from './answer.js';
import { mandarinCommand } from './bench.js';
import { card, preset_mandarin_float } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const mandarinFloat = defineExperiment({ ...card, commands: [mandarinCommand], text, shown, say, busy, board, answers: { [preset_mandarin_float.id]: answer_mandarin_float } });
