import { defineExperiment } from '../types.js';
import { energyCommand } from './bench.js';
import { answer_rolling_energy } from './answer.js';
import { card, preset_rolling_energy } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const rollingEnergy = defineExperiment({ ...card, commands: [energyCommand], text, shown, say, busy, board, answers: { [preset_rolling_energy.id]: answer_rolling_energy } });
