import { defineExperiment } from '../types.js';
import { rowsCommand } from './bench.js';
import { answer_small_bodies } from './answer.js';
import { card, preset_small_bodies } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const smallBodies = defineExperiment({ ...card, commands: [rowsCommand], text, shown, say, busy, board, answers: { [preset_small_bodies.id]: answer_small_bodies } });
