import { defineExperiment } from '../types.js';
import { MG_COMMANDS } from './bench.js';
import { answer_mass_gravity } from './answer.js';
import { card, preset_mass_gravity } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const massGravity = defineExperiment({ ...card, commands: MG_COMMANDS, text, shown, say, busy, board, answers: { [preset_mass_gravity.id]: answer_mass_gravity } });
