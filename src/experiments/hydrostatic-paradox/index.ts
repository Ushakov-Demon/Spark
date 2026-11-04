import { defineExperiment } from '../types.js';
import { vesselCommand } from './bench.js';
import { answer_hydrostatic_paradox } from './answer.js';
import { card, preset_hydrostatic_paradox } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const hydrostaticParadox = defineExperiment({ ...card, commands: [vesselCommand], text, shown, say, busy, board, answers: { [preset_hydrostatic_paradox.id]: answer_hydrostatic_paradox } });
