import { defineExperiment } from '../types.js';
import { gnomonCommand } from './bench.js';
import { answer_solar_noon, preset_solar_noon } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const solarNoon = defineExperiment({ kind: 'gnomon', commands: [gnomonCommand], setup, text, shown, say, busy, board, presets: [preset_solar_noon], answers: { [preset_solar_noon.id]: answer_solar_noon } });
