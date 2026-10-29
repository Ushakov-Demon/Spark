import { defineExperiment } from '../types.js';
import { calendarCommand } from './bench.js';
import { answer, preset } from './preset.js';
import { board, busy, setup, shown, text } from './words.js';

export const calendars = defineExperiment({ kind: 'calendar', commands: [calendarCommand], setup, text, shown, busy, board, presets: [preset], answers: { [preset.id]: answer } });
