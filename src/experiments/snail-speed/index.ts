import { defineExperiment } from '../types.js';
import { snailCommand } from './bench.js';
import { answer_snail_speed } from './answer.js';
import { card, preset_snail_speed } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const snailSpeed = defineExperiment({ ...card, commands: [snailCommand], text, shown, say, busy, board, answers: { [preset_snail_speed.id]: answer_snail_speed } });
