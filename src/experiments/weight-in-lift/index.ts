import { defineExperiment } from '../types.js';
import { liftCommand } from './bench.js';
import { answer_weight_in_lift } from './answer.js';
import { card, preset_weight_in_lift } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const weightInLift = defineExperiment({ ...card, commands: [liftCommand], text, shown, say, busy, board, answers: { [preset_weight_in_lift.id]: answer_weight_in_lift } });
