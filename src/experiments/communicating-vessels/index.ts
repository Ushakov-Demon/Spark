import { defineExperiment } from '../types.js';
import { utubeCommand } from './bench.js';
import { answer_communicating_vessels, preset_communicating_vessels } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const communicatingVessels = defineExperiment({ kind: 'utube', commands: [utubeCommand], setup, text, shown, say, busy, board, presets: [preset_communicating_vessels], answers: { [preset_communicating_vessels.id]: answer_communicating_vessels } });
