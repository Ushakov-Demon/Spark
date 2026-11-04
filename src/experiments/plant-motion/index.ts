import { defineExperiment } from '../types.js';
import { plantCommand } from './bench.js';
import { answer_plant_motion } from './answer.js';
import { card, preset_plant_motion } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const plantMotion = defineExperiment({ ...card, commands: [plantCommand], text, shown, say, busy, board, answers: { [preset_plant_motion.id]: answer_plant_motion } });
