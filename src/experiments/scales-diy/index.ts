import { defineExperiment } from '../types.js';
import { scalesCommand } from './bench.js';
import { answer_scales_diy } from './answer.js';
import { card, preset_scales_diy } from './preset.js';
import { board, busy, shown, text } from './words.js';

export const scalesDiy = defineExperiment({ ...card, commands: [scalesCommand], text, shown, busy, board, answers: { [preset_scales_diy.id]: answer_scales_diy } });
