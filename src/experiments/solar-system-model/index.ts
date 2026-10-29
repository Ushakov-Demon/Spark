import { defineExperiment } from '../types.js';
import { planetsCommand } from './bench.js';
import { answer_solar_system_model, preset_solar_system_model } from './preset.js';
import { board, busy, setup, shown, text } from './words.js';

export const solarSystem = defineExperiment({ kind: 'planets', commands: [planetsCommand], setup, text, shown, busy, board, presets: [preset_solar_system_model], answers: { [preset_solar_system_model.id]: answer_solar_system_model } });
