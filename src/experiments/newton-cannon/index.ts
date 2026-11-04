import { defineExperiment } from '../types.js';
import { cannonCommand } from './bench.js';
import { answer_newton_cannon, preset_newton_cannon } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const newtonCannon = defineExperiment({ kind: 'cannon', commands: [cannonCommand], setup, text, shown, say, busy, board, presets: [preset_newton_cannon], answers: { [preset_newton_cannon.id]: answer_newton_cannon } });
