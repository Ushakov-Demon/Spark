import { defineExperiment } from '../types.js';
import { windCommand } from './bench.js';
import { answer_wind_speed, preset_wind_speed } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const windSpeed = defineExperiment({ kind: 'wind', commands: [windCommand], setup, text, shown, say, busy, board, presets: [preset_wind_speed], answers: { [preset_wind_speed.id]: answer_wind_speed } });
