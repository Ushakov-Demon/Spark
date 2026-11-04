import { defineExperiment } from '../types.js';
import { bounceCommand } from './bench.js';
import { answer_ball_bounce } from './answer.js';
import { card, preset_ball_bounce } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const ballBounce = defineExperiment({ ...card, commands: [bounceCommand], text, shown, say, busy, board, answers: { [preset_ball_bounce.id]: answer_ball_bounce } });
