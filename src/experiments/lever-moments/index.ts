import { defineExperiment } from '../types.js';
import { leverCommand } from './bench.js';
import { answer_lever_moments } from './answer.js';
import { card, preset_lever_moments } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const leverMoments = defineExperiment({ ...card, commands: [leverCommand], text, shown, say, busy, board, answers: { [preset_lever_moments.id]: answer_lever_moments } });
