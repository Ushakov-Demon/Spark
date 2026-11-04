import { defineExperiment } from '../types.js';
import { windCommand } from './bench.js';
import { answer_wind_speed } from './answer.js';
import { card, preset_wind_speed } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const windSpeed = defineExperiment({ ...card, commands: [windCommand], text, shown, say, busy, board, answers: { [preset_wind_speed.id]: answer_wind_speed } });
