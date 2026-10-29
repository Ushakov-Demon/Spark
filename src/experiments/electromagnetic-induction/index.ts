import { defineExperiment } from '../types.js';
import { inductCommand } from './bench.js';
import { answer_electromagnetic_induction, preset_electromagnetic_induction } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const electromagneticInduction = defineExperiment({ kind: 'induct', commands: [inductCommand], setup, text, shown, say, busy, board, presets: [preset_electromagnetic_induction], answers: { [preset_electromagnetic_induction.id]: answer_electromagnetic_induction } });
