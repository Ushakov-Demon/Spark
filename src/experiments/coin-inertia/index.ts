import { defineExperiment } from '../types.js';
import { coinCommand } from './bench.js';
import { answer_coin_inertia } from './answer.js';
import { card, preset_coin_inertia } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const coinInertia = defineExperiment({ ...card, commands: [coinCommand], text, shown, say, busy, board, answers: { [preset_coin_inertia.id]: answer_coin_inertia } });
