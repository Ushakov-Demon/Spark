import { defineExperiment } from '../types.js';
import { stairsCommand } from './bench.js';
import { answer_stairs_power } from './answer.js';
import { card, preset_stairs_power } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const stairsPower = defineExperiment({ ...card, commands: [stairsCommand], text, shown, say, busy, board, answers: { [preset_stairs_power.id]: answer_stairs_power } });
