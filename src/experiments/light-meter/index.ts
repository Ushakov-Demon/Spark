import { defineExperiment } from '../types.js';
import { luxmeterCommand } from './bench.js';
import { answer_light_meter, preset_light_meter } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const lightMeter = defineExperiment({ kind: 'luxmeter', commands: [luxmeterCommand], setup, text, shown, say, busy, board, presets: [preset_light_meter], answers: { [preset_light_meter.id]: answer_light_meter } });
