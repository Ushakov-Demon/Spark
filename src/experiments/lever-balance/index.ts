import { defineExperiment } from '../types.js';
import { balanceCommand } from './bench.js';
import { answer_lever_balance, answer_liquid_density } from './answer.js';
import { card, preset_lever_balance, preset_liquid_density } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const leverBalance = defineExperiment({ ...card, commands: [balanceCommand], text, shown, say, busy, board, answers: { [preset_lever_balance.id]: answer_lever_balance, [preset_liquid_density.id]: answer_liquid_density } });
