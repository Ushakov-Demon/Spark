import { defineExperiment } from '../types.js';
import { balanceCommand } from './bench.js';
import { answer_lever_balance, preset_lever_balance, answer_liquid_density, preset_liquid_density } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const leverBalance = defineExperiment({ kind: 'balance', commands: [balanceCommand], setup, text, shown, say, busy, board, presets: [preset_lever_balance, preset_liquid_density], answers: { [preset_lever_balance.id]: answer_lever_balance, [preset_liquid_density.id]: answer_liquid_density } });
