import { defineExperiment } from '../types.js';
import { sinkCommand } from './bench.js';
import { answer_bubble_speed, preset_bubble_speed, answer_ball_in_liquids, preset_ball_in_liquids } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const bodiesInLiquids = defineExperiment({ kind: 'sink', commands: [sinkCommand], setup, text, shown, say, busy, board, presets: [preset_bubble_speed, preset_ball_in_liquids], answers: { [preset_bubble_speed.id]: answer_bubble_speed, [preset_ball_in_liquids.id]: answer_ball_in_liquids } });
