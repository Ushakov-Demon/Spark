import { defineExperiment } from '../types.js';
import { gearCommand } from './bench.js';
import { answer_gear_train } from './answer.js';
import { card, preset_gear_train } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const gearTrainExperiment = defineExperiment({ ...card, commands: [gearCommand], text, shown, say, busy, board, answers: { [preset_gear_train.id]: answer_gear_train } });
