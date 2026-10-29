import { defineExperiment } from '../types.js';
import { towerCommand } from './bench.js';
import { answer_liquid_tower, preset_liquid_tower } from './preset.js';
import { board, busy, say, setup, shown, text } from './words.js';

export const liquidTower = defineExperiment({ kind: 'tower', commands: [towerCommand], setup, text, shown, say, busy, board, presets: [preset_liquid_tower], answers: { [preset_liquid_tower.id]: answer_liquid_tower } });
