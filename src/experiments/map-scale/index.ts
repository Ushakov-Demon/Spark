import { defineExperiment } from '../types.js';
import { mapCommand } from './bench.js';
import { answer_map_scale, preset_map_scale } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const mapScale = defineExperiment({ kind: 'map', commands: [mapCommand], setup, text, shown, say, busy, board, presets: [preset_map_scale], answers: { [preset_map_scale.id]: answer_map_scale } });
