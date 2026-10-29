import { defineExperiment } from '../types.js';
import { circuitCommand } from './bench.js';
import { answer_conductor_resistance, preset_conductor_resistance, answer_consumer_power, preset_consumer_power } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const resistorCircuit = defineExperiment({ kind: 'circuit', commands: [circuitCommand], setup, text, shown, say, busy, board, presets: [preset_conductor_resistance, preset_consumer_power], answers: { [preset_conductor_resistance.id]: answer_conductor_resistance, [preset_consumer_power.id]: answer_consumer_power } });
