import { defineExperiment } from '../types.js';
import { bounceCommand } from './bench.js';
import { answer_ball_bounce, preset_ball_bounce } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const ballBounce = defineExperiment({ kind: 'bounce', commands: [bounceCommand], setup, text, shown, say, busy, board, presets: [preset_ball_bounce], answers: { [preset_ball_bounce.id]: answer_ball_bounce } });
