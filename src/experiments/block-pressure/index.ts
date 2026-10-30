import { defineExperiment } from '../types.js';
import { edgeCommand } from './bench.js';
import { answer_block_pressure, preset_block_pressure } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const blockPressure = defineExperiment({ kind: 'pressure', commands: [edgeCommand], setup, text, shown, say, busy, board, presets: [preset_block_pressure], answers: { [preset_block_pressure.id]: answer_block_pressure } });
