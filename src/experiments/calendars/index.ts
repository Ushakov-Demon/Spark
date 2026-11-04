import { defineExperiment } from '../types.js';
import { calendarCommand } from './bench.js';
import { answer } from './answer.js';
import { card, preset } from './preset.js';
import { board, busy, shown, text } from './words.js';

export const calendars = defineExperiment({ ...card, commands: [calendarCommand], text, shown, busy, board, answers: { [preset.id]: answer } });
