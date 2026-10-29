import { defineExperiment } from '../types.js';
import { depthCommand } from './bench.js';
import { answer_depth_pressure, preset_depth_pressure } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const depthPressure = defineExperiment({ kind: 'depth', commands: [depthCommand], setup, text, shown, say, busy, board, presets: [preset_depth_pressure], answers: { [preset_depth_pressure.id]: answer_depth_pressure } });
