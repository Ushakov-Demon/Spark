import { defineExperiment } from '../types.js';
import { stairsCommand } from './bench.js';
import { answer_stairs_power, preset_stairs_power } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const stairsPower = defineExperiment({ kind: 'stairs', commands: [stairsCommand], setup, text, shown, say, busy, board, presets: [preset_stairs_power], answers: { [preset_stairs_power.id]: answer_stairs_power } });
