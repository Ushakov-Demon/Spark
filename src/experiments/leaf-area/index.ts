import { defineExperiment } from '../types.js';
import { areaCommand } from './bench.js';
import { answer_leaf_area, preset_leaf_area } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const leafArea = defineExperiment({ kind: 'area', commands: [areaCommand], setup, text, shown, say, busy, board, presets: [preset_leaf_area], answers: { [preset_leaf_area.id]: answer_leaf_area } });
