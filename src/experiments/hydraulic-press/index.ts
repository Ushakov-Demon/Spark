import { defineExperiment } from '../types.js';
import { pressCommand } from './bench.js';
import { pneumaticCommand } from './pneumatic.js';
import { answer_hydraulic_press } from './answer.js';
import { card, preset_hydraulic_press } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const hydraulicPress = defineExperiment({ ...card, commands: [pressCommand, pneumaticCommand], text, shown, say, busy, board, answers: { [preset_hydraulic_press.id]: answer_hydraulic_press } });
