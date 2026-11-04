import { defineExperiment } from '../types.js';
import { touchCommand } from './bench.js';
import { answer_contact_forces } from './answer.js';
import { card, preset_contact_forces } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const contactForces = defineExperiment({ ...card, commands: [touchCommand], text, shown, say, busy, board, answers: { [preset_contact_forces.id]: answer_contact_forces } });
