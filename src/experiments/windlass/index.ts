import { defineExperiment } from '../types.js';
import { winchCommand } from './bench.js';
import { answer_windlass } from './answer.js';
import { card, preset_windlass } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const windlass = defineExperiment({ ...card, commands: [winchCommand], text, shown, say, busy, board, answers: { [preset_windlass.id]: answer_windlass } });
