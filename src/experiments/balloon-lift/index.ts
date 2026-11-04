import { defineExperiment } from '../types.js';
import { liftCommand } from './bench.js';
import { answer_balloon_lift } from './answer.js';
import { card, preset_balloon_lift } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const balloonLift = defineExperiment({ ...card, commands: [liftCommand], text, shown, say, busy, board, answers: { [preset_balloon_lift.id]: answer_balloon_lift } });
