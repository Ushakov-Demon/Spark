import { defineExperiment } from '../types.js';
import { cartsCommand } from './bench.js';
import { answer_carts_mass } from './answer.js';
import { card, preset_carts_mass } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const cartsMass = defineExperiment({ ...card, commands: [cartsCommand], text, shown, say, busy, board, answers: { [preset_carts_mass.id]: answer_carts_mass } });
