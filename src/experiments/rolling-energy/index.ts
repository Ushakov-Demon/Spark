import { defineExperiment } from '../types.js';
import { energyCommand } from './bench.js';
import { answer_rolling_energy, preset_rolling_energy } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const rollingEnergy = defineExperiment({ kind: 'energy', commands: [energyCommand], setup, text, shown, say, busy, board, presets: [preset_rolling_energy], answers: { [preset_rolling_energy.id]: answer_rolling_energy } });
