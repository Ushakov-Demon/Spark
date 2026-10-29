import { defineExperiment } from '../types.js';
import { vesselCommand } from './bench.js';
import { answer_hydrostatic_paradox, preset_hydrostatic_paradox } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const hydrostaticParadox = defineExperiment({ kind: 'vessels', commands: [vesselCommand], setup, text, shown, say, busy, board, presets: [preset_hydrostatic_paradox], answers: { [preset_hydrostatic_paradox.id]: answer_hydrostatic_paradox } });
