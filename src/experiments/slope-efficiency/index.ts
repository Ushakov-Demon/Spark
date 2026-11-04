import { defineExperiment } from '../types.js';
import { slopeCommand } from '../lever-moments/bench.js';
import { answer_slope_efficiency } from './answer.js';
import { card, preset_slope_efficiency } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const slopeEfficiency = defineExperiment({ ...card, commands: [slopeCommand], text, shown, say, busy, board, answers: { [preset_slope_efficiency.id]: answer_slope_efficiency } });
