import { defineExperiment } from '../types.js';
import { sinkCommand } from './bench.js';
import { answer_bubble_speed, answer_ball_in_liquids } from './answer.js';
import { card, preset_ball_in_liquids, preset_bubble_speed } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const bodiesInLiquids = defineExperiment({ ...card, commands: [sinkCommand], text, shown, say, busy, board, answers: { [preset_bubble_speed.id]: answer_bubble_speed, [preset_ball_in_liquids.id]: answer_ball_in_liquids } });
