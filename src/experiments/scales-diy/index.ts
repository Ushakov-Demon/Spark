import { defineExperiment } from '../types.js';
import { scalesCommand } from './bench.js';
import { answer_scales_diy, preset_scales_diy } from './preset.js';
import { board, busy, setup, shown, text } from './words.js';

export const scalesDiy = defineExperiment({ kind: 'scales', commands: [scalesCommand], setup, text, shown, busy, board, presets: [preset_scales_diy], answers: { [preset_scales_diy.id]: answer_scales_diy } });
