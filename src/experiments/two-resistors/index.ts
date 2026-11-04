import { defineExperiment } from '../types.js';
import { pairCommand } from '../resistor-circuit/bench.js';
import { answer_series_circuit, answer_parallel_circuit } from './answer.js';
import { card, preset_parallel_circuit, preset_series_circuit } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const twoResistors = defineExperiment({ ...card, commands: [pairCommand], text, shown, say, busy, board, answers: { [preset_series_circuit.id]: answer_series_circuit, [preset_parallel_circuit.id]: answer_parallel_circuit } });
