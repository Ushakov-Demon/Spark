import { defineExperiment } from '../types.js';
import { liftCommand } from './bench.js';
import { answer_weight_in_lift, preset_weight_in_lift } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const weightInLift = defineExperiment({ kind: 'lift', commands: [liftCommand], setup, text, shown, say, busy, board, presets: [preset_weight_in_lift], answers: { [preset_weight_in_lift.id]: answer_weight_in_lift } });
