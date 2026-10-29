import { defineExperiment } from '../types.js';
import { snailCommand } from './bench.js';
import { answer_snail_speed, preset_snail_speed } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const snailSpeed = defineExperiment({ kind: 'snail', commands: [snailCommand], setup, text, shown, say, busy, board, presets: [preset_snail_speed], answers: { [preset_snail_speed.id]: answer_snail_speed } });
