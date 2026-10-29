import { defineExperiment } from '../types.js';
import { winchCommand } from './bench.js';
import { answer_windlass, preset_windlass } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const windlass = defineExperiment({ kind: 'winch', commands: [winchCommand], setup, text, shown, say, busy, board, presets: [preset_windlass], answers: { [preset_windlass.id]: answer_windlass } });
