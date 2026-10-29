import { defineExperiment } from '../types.js';
import { touchCommand } from './bench.js';
import { answer_contact_forces, preset_contact_forces } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const contactForces = defineExperiment({ kind: 'touch', commands: [touchCommand], setup, text, shown, say, busy, board, presets: [preset_contact_forces], answers: { [preset_contact_forces.id]: answer_contact_forces } });
