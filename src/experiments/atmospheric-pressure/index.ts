import { defineExperiment } from '../types.js';
import { atmCommand } from './bench.js';
import { answer_atmospheric_pressure } from './answer.js';
import { card, preset_atmospheric_pressure } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const atmosphericPressure = defineExperiment({ ...card, commands: [atmCommand], text, shown, say, busy, board, answers: { [preset_atmospheric_pressure.id]: answer_atmospheric_pressure } });
