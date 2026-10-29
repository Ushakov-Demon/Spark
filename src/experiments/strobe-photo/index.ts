import { defineExperiment } from '../types.js';
import { strobeCommand } from './bench.js';
import { answer_strobe_photo, preset_strobe_photo } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const strobePhoto = defineExperiment({ kind: 'strobe', commands: [strobeCommand], setup, text, shown, say, busy, board, presets: [preset_strobe_photo], answers: { [preset_strobe_photo.id]: answer_strobe_photo } });
