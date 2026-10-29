import { defineExperiment } from '../types.js';
import { airCommand } from './bench.js';
import { answer_air_column, preset_air_column } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const airColumn = defineExperiment({ kind: 'air', commands: [airCommand], setup, text, shown, say, busy, board, presets: [preset_air_column], answers: { [preset_air_column.id]: answer_air_column } });
