import { defineExperiment } from '../types.js';
import { rubberCommand } from './bench.js';
import { answer_rubber_motor } from './answer.js';
import { card, preset_rubber_motor } from './preset.js';
import { board, busy, shown, text } from './words.js';

export const rubberMotor = defineExperiment({ ...card, commands: [rubberCommand], text, shown, busy, board, answers: { [preset_rubber_motor.id]: answer_rubber_motor } });
