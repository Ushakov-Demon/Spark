import { defineExperiment } from '../types.js';
import { strobeCommand } from './bench.js';
import { answer_strobe_photo } from './answer.js';
import { card, preset_strobe_photo } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const strobePhoto = defineExperiment({ ...card, commands: [strobeCommand], text, shown, say, busy, board, answers: { [preset_strobe_photo.id]: answer_strobe_photo } });
