import { defineExperiment } from '../types.js';
import { dragCommand } from './bench.js';
import { answer_drag_form } from './answer.js';
import { card, preset_drag_form } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const dragForm = defineExperiment({ ...card, commands: [dragCommand], text, shown, say, busy, board, answers: { [preset_drag_form.id]: answer_drag_form } });
