import { defineExperiment } from '../types.js';
import { mapCommand } from './bench.js';
import { answer_map_scale } from './answer.js';
import { card, preset_map_scale } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const mapScale = defineExperiment({ ...card, commands: [mapCommand], text, shown, say, busy, board, answers: { [preset_map_scale.id]: answer_map_scale } });
