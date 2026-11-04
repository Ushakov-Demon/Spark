import { defineExperiment } from '../types.js';
import { boxCommand } from './bench.js';
import { answer_diode_black_box } from './answer.js';
import { card, preset_diode_black_box } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const diodeBlackBox = defineExperiment({ ...card, commands: [boxCommand], text, shown, say, busy, board, answers: { [preset_diode_black_box.id]: answer_diode_black_box } });
