import { defineExperiment } from '../types.js';
import { dynoCommand } from './bench.js';
import { answer_dyno_diy, preset_dyno_diy } from './preset.js';
import { board, busy, setup, shown, text } from './words.js';

export const dynoDiy = defineExperiment({ kind: 'dyno', commands: [dynoCommand], setup, text, shown, busy, board, presets: [preset_dyno_diy], answers: { [preset_dyno_diy.id]: answer_dyno_diy } });
