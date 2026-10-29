import { defineExperiment } from '../types.js';
import { boxCommand } from './bench.js';
import { answer_diode_black_box, preset_diode_black_box } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const diodeBlackBox = defineExperiment({ kind: 'box', commands: [boxCommand], setup, text, shown, say, busy, board, presets: [preset_diode_black_box], answers: { [preset_diode_black_box.id]: answer_diode_black_box } });
