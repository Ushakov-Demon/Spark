import { defineExperiment } from '../types.js';
import { diverCommand } from './bench.js';
import { answer_cartesian_diver } from './answer.js';
import { card, preset_cartesian_diver } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const cartesianDiver = defineExperiment({ ...card, commands: [diverCommand], text, shown, say, busy, board, answers: { [preset_cartesian_diver.id]: answer_cartesian_diver } });
