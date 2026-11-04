import { defineExperiment } from '../types.js';
import { plantCommand } from './bench.js';
import { answer_plant_motion, preset_plant_motion } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const plantMotion = defineExperiment({ kind: 'plant', commands: [plantCommand], setup, text, shown, say, busy, board, presets: [preset_plant_motion], answers: { [preset_plant_motion.id]: answer_plant_motion } });
