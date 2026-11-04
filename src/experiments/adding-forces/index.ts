import { defineExperiment } from '../types.js';
import { forcesCommand } from './bench.js';
import { answer_adding_forces } from './answer.js';
import { card, preset_adding_forces } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const addingForces = defineExperiment({ ...card, commands: [forcesCommand], text, shown, say, busy, board, answers: { [preset_adding_forces.id]: answer_adding_forces } });
