import { defineExperiment } from '../types.js';
import { inductCommand } from './bench.js';
import { answer_electromagnetic_induction } from './answer.js';
import { card, preset_electromagnetic_induction } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const electromagneticInduction = defineExperiment({ ...card, commands: [inductCommand], text, shown, say, busy, board, answers: { [preset_electromagnetic_induction.id]: answer_electromagnetic_induction } });
