import { defineExperiment } from '../types.js';
import { coinCommand } from './bench.js';
import { answer_coin_inertia, preset_coin_inertia } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const coinInertia = defineExperiment({ kind: 'coin', commands: [coinCommand], setup, text, shown, say, busy, board, presets: [preset_coin_inertia], answers: { [preset_coin_inertia.id]: answer_coin_inertia } });
