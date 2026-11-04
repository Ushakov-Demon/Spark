import { defineExperiment } from '../types.js';
import { thermometerCommand } from './bench.js';
import { answer_read_thermometer, preset_read_thermometer } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const readThermometer = defineExperiment({ kind: 'thermometer', commands: [thermometerCommand], setup, text, shown, say, busy, board, presets: [preset_read_thermometer], answers: { [preset_read_thermometer.id]: answer_read_thermometer } });
