import { defineExperiment } from '../types.js';
import { stretchCommand } from './bench.js';
import { answer_hooke_spring, preset_hooke_spring } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const hookeSpring = defineExperiment({ kind: 'spring', commands: [stretchCommand], setup, text, shown, say, busy, board, presets: [preset_hooke_spring], answers: { [preset_hooke_spring.id]: answer_hooke_spring } });
