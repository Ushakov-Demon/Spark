import { defineExperiment } from '../types.js';
import { gearCommand } from './bench.js';
import { answer_gear_train, preset_gear_train } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const gearTrainExperiment = defineExperiment({ kind: 'gears', commands: [gearCommand], setup, text, shown, say, busy, board, presets: [preset_gear_train], answers: { [preset_gear_train.id]: answer_gear_train } });
