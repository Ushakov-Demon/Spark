import { defineExperiment } from '../types.js';
import { graviCommand } from './bench.js';
import { answer, preset } from './preset.js';
import { board, busy, setup, shown, text } from './words.js';

export const rootsGravity = defineExperiment({ kind: 'gravi', commands: [graviCommand], setup, text, shown, busy, board, presets: [preset], answers: { [preset.id]: answer } });
