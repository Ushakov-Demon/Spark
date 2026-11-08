import { defineExperiment } from '../types.js';
import { answer_paper_cups } from './answer.js';
import { cupsCommand } from './bench.js';
import { card, preset_paper_cups } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const paperCups = defineExperiment({ ...card, commands: [cupsCommand], text, shown, say, busy, board, answers: { [preset_paper_cups.id]: answer_paper_cups } });
