import { defineExperiment } from '../types.js';
import { pulleyCommand } from './bench.js';
import { answer_pulley, preset_pulley } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const pulleyExperiment = defineExperiment({ kind: 'pulley', commands: [pulleyCommand], setup, text, shown, say, busy, board, presets: [preset_pulley], answers: { [preset_pulley.id]: answer_pulley } });
