import { defineExperiment } from '../types.js';
import { gnomonCommand } from './bench.js';
import { answer_solar_noon } from './answer.js';
import { card, preset_solar_noon } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const solarNoon = defineExperiment({ ...card, commands: [gnomonCommand], text, shown, say, busy, board, answers: { [preset_solar_noon.id]: answer_solar_noon } });
