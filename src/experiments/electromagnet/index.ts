import { defineExperiment } from '../types.js';
import { magnetCommand } from './bench.js';
import { answer_electromagnet, preset_electromagnet } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const electromagnet = defineExperiment({ kind: 'magnet', commands: [magnetCommand], setup, text, shown, say, busy, board, presets: [preset_electromagnet], answers: { [preset_electromagnet.id]: answer_electromagnet } });
