import { defineExperiment } from '../types.js';
import { atmCommand } from './bench.js';
import { answer_atmospheric_pressure, preset_atmospheric_pressure } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const atmosphericPressure = defineExperiment({ kind: 'atm', commands: [atmCommand], setup, text, shown, say, busy, board, presets: [preset_atmospheric_pressure], answers: { [preset_atmospheric_pressure.id]: answer_atmospheric_pressure } });
