import { defineExperiment } from '../types.js';
import { utubeCommand } from './bench.js';
import { answer_communicating_vessels } from './answer.js';
import { card, preset_communicating_vessels } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const communicatingVessels = defineExperiment({ ...card, commands: [utubeCommand], text, shown, say, busy, board, answers: { [preset_communicating_vessels.id]: answer_communicating_vessels } });
