import { defineExperiment } from '../types.js';
import { cannonCommand } from './bench.js';
import { answer_newton_cannon } from './answer.js';
import { card, preset_newton_cannon } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const newtonCannon = defineExperiment({ ...card, commands: [cannonCommand], text, shown, say, busy, board, answers: { [preset_newton_cannon.id]: answer_newton_cannon } });
