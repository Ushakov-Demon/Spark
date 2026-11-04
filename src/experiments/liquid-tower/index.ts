import { defineExperiment } from '../types.js';
import { towerCommand } from './bench.js';
import { answer_liquid_tower } from './answer.js';
import { card, preset_liquid_tower } from './preset.js';
import { board, busy, say, shown, text } from './words.js';

export const liquidTower = defineExperiment({ ...card, commands: [towerCommand], text, shown, say, busy, board, answers: { [preset_liquid_tower.id]: answer_liquid_tower } });
