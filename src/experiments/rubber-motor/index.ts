import { defineExperiment } from '../types.js';
import { rubberCommand } from './bench.js';
import { answer_rubber_motor, preset_rubber_motor } from './preset.js';
import { board, busy, setup, shown, text } from './words.js';

export const rubberMotor = defineExperiment({ kind: 'rubber', commands: [rubberCommand], setup, text, shown, busy, board, presets: [preset_rubber_motor], answers: { [preset_rubber_motor.id]: answer_rubber_motor } });
