import { defineExperiment } from '../types.js';
import { diverCommand } from './bench.js';
import { answer_cartesian_diver, preset_cartesian_diver } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const cartesianDiver = defineExperiment({ kind: 'diver', commands: [diverCommand], setup, text, shown, say, busy, board, presets: [preset_cartesian_diver], answers: { [preset_cartesian_diver.id]: answer_cartesian_diver } });
