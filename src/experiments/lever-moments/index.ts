import { defineExperiment } from '../types.js';
import { leverCommand } from './bench.js';
import { answer_lever_moments, preset_lever_moments } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const leverMoments = defineExperiment({ kind: 'lever', commands: [leverCommand], setup, text, shown, say, busy, board, presets: [preset_lever_moments], answers: { [preset_lever_moments.id]: answer_lever_moments } });
