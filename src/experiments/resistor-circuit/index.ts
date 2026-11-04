import { defineExperiment } from '../types.js';
import { circuitCommand } from './bench.js';
import { answer_conductor_resistance, answer_consumer_power } from './answer.js';
import { card, preset_conductor_resistance, preset_consumer_power } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const resistorCircuit = defineExperiment({ ...card, commands: [circuitCommand], text, shown, say, busy, board, answers: { [preset_conductor_resistance.id]: answer_conductor_resistance, [preset_consumer_power.id]: answer_consumer_power } });
