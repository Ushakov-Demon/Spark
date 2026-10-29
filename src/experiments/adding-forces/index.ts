import { defineExperiment } from '../types.js';
import { forcesCommand } from './bench.js';
import { answer_adding_forces, preset_adding_forces } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const addingForces = defineExperiment({ kind: 'forces', commands: [forcesCommand], setup, text, shown, say, busy, board, presets: [preset_adding_forces], answers: { [preset_adding_forces.id]: answer_adding_forces } });
