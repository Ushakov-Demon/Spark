import { defineExperiment } from '../types.js';
import { slopeCommand } from '../lever-moments/bench.js';
import { answer_slope_efficiency, preset_slope_efficiency } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const slopeEfficiency = defineExperiment({ kind: 'slope', commands: [slopeCommand], setup, text, shown, say, busy, board, presets: [preset_slope_efficiency], answers: { [preset_slope_efficiency.id]: answer_slope_efficiency } });
