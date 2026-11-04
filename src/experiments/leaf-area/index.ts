import { defineExperiment } from '../types.js';
import { areaCommand } from './bench.js';
import { answer_leaf_area } from './answer.js';
import { card, preset_leaf_area } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const leafArea = defineExperiment({ ...card, commands: [areaCommand], text, shown, say, busy, board, answers: { [preset_leaf_area.id]: answer_leaf_area } });
