import { defineExperiment } from '../types.js';
import { fountainCommand } from './bench.js';
import { answer_fountain_model, preset_fountain_model } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const fountainModel = defineExperiment({ kind: 'fountain', commands: [fountainCommand], setup, text, shown, say, busy, board, presets: [preset_fountain_model], answers: { [preset_fountain_model.id]: answer_fountain_model } });
