import { defineExperiment } from '../types.js';
import { luxmeterCommand } from './bench.js';
import { answer_light_meter } from './answer.js';
import { card, preset_light_meter } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const lightMeter = defineExperiment({ ...card, commands: [luxmeterCommand], text, shown, say, busy, board, answers: { [preset_light_meter.id]: answer_light_meter } });
