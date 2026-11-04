import { defineExperiment } from '../types.js';
import { depthCommand } from './bench.js';
import { answer_depth_pressure } from './answer.js';
import { card, preset_depth_pressure } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const depthPressure = defineExperiment({ ...card, commands: [depthCommand], text, shown, say, busy, board, answers: { [preset_depth_pressure.id]: answer_depth_pressure } });
