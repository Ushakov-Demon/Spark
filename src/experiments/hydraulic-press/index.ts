import { defineExperiment } from '../types.js';
import { pressCommand } from './bench.js';
import { answer_hydraulic_press, preset_hydraulic_press } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const hydraulicPress = defineExperiment({ kind: 'press', commands: [pressCommand], setup, text, shown, say, busy, board, presets: [preset_hydraulic_press], answers: { [preset_hydraulic_press.id]: answer_hydraulic_press } });
