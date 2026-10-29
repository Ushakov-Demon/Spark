import { defineExperiment } from '../types.js';
import { pairCommand } from '../resistor-circuit/bench.js';
import { answer_series_circuit, preset_series_circuit, answer_parallel_circuit, preset_parallel_circuit } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const twoResistors = defineExperiment({ kind: 'pair', commands: [pairCommand], setup, text, shown, say, busy, board, presets: [preset_series_circuit, preset_parallel_circuit], answers: { [preset_series_circuit.id]: answer_series_circuit, [preset_parallel_circuit.id]: answer_parallel_circuit } });
