import { defineExperiment } from '../types.js';
import { dragCommand } from './bench.js';
import { answer_drag_form, preset_drag_form } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const dragForm = defineExperiment({ kind: 'drag', commands: [dragCommand], setup, text, shown, say, busy, board, presets: [preset_drag_form], answers: { [preset_drag_form.id]: answer_drag_form } });
