import { defineExperiment } from '../types.js';
import { planetsCommand } from './bench.js';
import { answer_solar_system_model } from './answer.js';
import { card, preset_solar_system_model } from './preset.js';
import { board, busy, shown, text } from './words.js';

export const solarSystem = defineExperiment({ ...card, commands: [planetsCommand], text, shown, busy, board, answers: { [preset_solar_system_model.id]: answer_solar_system_model } });
