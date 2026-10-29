import { defineExperiment } from '../types.js';
import { cartsCommand } from './bench.js';
import { answer_carts_mass, preset_carts_mass } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const cartsMass = defineExperiment({ kind: 'carts', commands: [cartsCommand], setup, text, shown, say, busy, board, presets: [preset_carts_mass], answers: { [preset_carts_mass.id]: answer_carts_mass } });
