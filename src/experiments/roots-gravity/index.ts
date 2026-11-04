import { defineExperiment } from '../types.js';
import { graviCommand } from './bench.js';
import { answer } from './answer.js';
import { card, preset } from './preset.js';
import { board, busy, shown, text } from './words.js';

export const rootsGravity = defineExperiment({ ...card, commands: [graviCommand], text, shown, busy, board, answers: { [preset.id]: answer } });
