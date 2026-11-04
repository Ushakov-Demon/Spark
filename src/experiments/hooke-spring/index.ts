import { defineExperiment } from '../types.js';
import { stretchCommand } from './bench.js';
import { answer_hooke_spring } from './answer.js';
import { card, preset_hooke_spring } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const hookeSpring = defineExperiment({ ...card, commands: [stretchCommand], text, shown, say, busy, board, answers: { [preset_hooke_spring.id]: answer_hooke_spring } });
