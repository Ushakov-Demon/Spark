import { defineExperiment } from '../types.js';
import { rowsCommand } from './bench.js';
import { answer_small_bodies, preset_small_bodies } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const smallBodies = defineExperiment({ kind: 'rows', commands: [rowsCommand], setup, text, shown, say, busy, board, presets: [preset_small_bodies], answers: { [preset_small_bodies.id]: answer_small_bodies } });
