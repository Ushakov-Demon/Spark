import { defineExperiment } from '../types.js';
import { thermometerCommand } from './bench.js';
import { answer_read_thermometer } from './answer.js';
import { card, preset_read_thermometer } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const readThermometer = defineExperiment({ ...card, commands: [thermometerCommand], text, shown, say, busy, board, answers: { [preset_read_thermometer.id]: answer_read_thermometer } });
