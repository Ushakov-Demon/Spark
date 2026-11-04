import { defineExperiment } from '../types.js';
import { dynoCommand } from './bench.js';
import { answer_dyno_diy } from './answer.js';
import { card, preset_dyno_diy } from './preset.js';
import { board, busy, shown, text } from './words.js';

export const dynoDiy = defineExperiment({ ...card, commands: [dynoCommand], text, shown, busy, board, answers: { [preset_dyno_diy.id]: answer_dyno_diy } });
