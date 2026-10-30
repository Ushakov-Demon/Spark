import { defineExperiment } from '../types.js';
import { liftCommand } from './bench.js';
import { answer_balloon_lift, preset_balloon_lift } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const balloonLift = defineExperiment({ kind: 'balloon', commands: [liftCommand], setup, text, shown, say, busy, board, presets: [preset_balloon_lift], answers: { [preset_balloon_lift.id]: answer_balloon_lift } });
